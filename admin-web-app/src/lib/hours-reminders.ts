/**
 * Nudges court-ordered volunteers who haven't logged a session in 7-10 days,
 * via the `hours_reminder` email template. Runs daily off Vercel cron
 * (`/api/cron/send-hours-reminders`) - the 7-10 day window plus a "sent in the
 * last 7 days" dedup guard (via `email_log`) keeps this to roughly one nudge
 * per volunteer per idle stretch, not one every day they sit in the window.
 */
import { createServiceClient } from '@/lib/supabase/server';
import { getVolunteerDirectory, isMockAddress } from '@/lib/volunteers';
import { getTemplate } from '@/lib/email-templates';
import { renderTemplate } from '@/lib/email-template-render';
import { getResendClient, getFromAddress } from '@/lib/resend';
import { logEmailSend } from '@/lib/email-log';
import { sendExpoPush } from '@/lib/push';
import { buildHoursReminderEmailForSend } from '@/lib/hours-reminder-send';
import {
  insertVolunteerNotification,
  isVolunteerInboxDeliveryEnabled,
} from '@/lib/notify';

const MIN_IDLE_DAYS = 7;
const MAX_IDLE_DAYS = 10;
const DEDUP_WINDOW_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Rotated by userId so the same volunteer sees a consistent voice, and not
 * everyone gets the identical push copy on the same idle cadence. */
const HOURS_REMINDER_PUSH_VARIANTS: { title: string; body: string }[] = [
  { title: 'Ready for a session?', body: 'Takes just a minute to start. Pick up right where you left off.' },
  { title: 'Keep it going', body: "It's been a bit since your last cleanup. Log a quick session today." },
  { title: 'Your block could use you', body: 'Other volunteers logged sessions nearby this week. Want to join in?' },
  { title: 'Time to log a session', body: "Open the app and start tracking whenever you're free." },
  { title: 'Just a nudge, no rush', body: "Whenever you're ready, your next session is one tap away." },
];

function sessionHours(session: {
  duration_seconds?: number | null;
  adjusted_hours?: number | null;
}): number {
  if (session.adjusted_hours != null) return session.adjusted_hours;
  if (!session.duration_seconds) return 0;
  return session.duration_seconds / 3600;
}

function pickPushVariant(userId: string): { title: string; body: string } {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return HOURS_REMINDER_PUSH_VARIANTS[hash % HOURS_REMINDER_PUSH_VARIANTS.length];
}

async function deliverHoursReminderInboxAndPush(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  userId: string,
  pushToken: string | null,
): Promise<void> {
  const { data } = await supabase.auth.admin.getUserById(userId);
  const user = data?.user;
  if (user && !isVolunteerInboxDeliveryEnabled(user.user_metadata, 'sessionReviews')) {
    return;
  }

  const variant = pickPushVariant(userId);
  const row = await insertVolunteerNotification(supabase, {
    userId,
    type: 'hours_reminder',
    title: variant.title,
    body: variant.body,
  });

  if (!pushToken) {
    return;
  }
  await sendExpoPush(pushToken, {
    title: variant.title,
    body: variant.body,
    data: {
      notificationId: row?.id,
      createdAt: row?.createdAt ?? undefined,
      type: 'hours-reminder',
    },
  });
}

export type HoursReminderResult = {
  sent: number;
  failed: number;
  skippedNoEmail: number;
  skippedRecentlyReminded: number;
  eligible: number;
};

export async function sendHoursReminders(now = new Date()): Promise<HoursReminderResult> {
  const supabase = await createServiceClient();

  const { data: courtOrders } = await supabase.from('court_orders').select('user_id, hours_reset_at');
  const courtOrderedUserIds = (courtOrders ?? []).map((o) => o.user_id);
  const hoursResetAtByUser = new Map(
    (courtOrders ?? []).map((o) => [o.user_id as string, (o.hours_reset_at as string | null) ?? null]),
  );

  const result: HoursReminderResult = {
    sent: 0,
    failed: 0,
    skippedNoEmail: 0,
    skippedRecentlyReminded: 0,
    eligible: 0,
  };

  if (courtOrderedUserIds.length === 0) {
    return result;
  }

  const [{ data: sessions }, { data: recentReminders }, directory] = await Promise.all([
    supabase
      .from('sessions')
      .select('user_id, started_at, created_at, status, court_ordered, duration_seconds, adjusted_hours')
      .neq('status', 'active')
      .in('user_id', courtOrderedUserIds),
    supabase
      .from('email_log')
      .select('user_id, sent_at')
      .eq('template_type', 'hours_reminder')
      .gte('sent_at', new Date(now.getTime() - DEDUP_WINDOW_DAYS * MS_PER_DAY).toISOString()),
    getVolunteerDirectory(),
  ]);

  const lastSessionByUser = new Map<string, number>();
  const completedHoursByUser = new Map<string, number>();
  for (const s of sessions ?? []) {
    const at = s.started_at ?? s.created_at;
    if (at) {
      const ts = new Date(at).getTime();
      const prev = lastSessionByUser.get(s.user_id);
      if (prev == null || ts > prev) lastSessionByUser.set(s.user_id, ts);
    }

    if (s.status !== 'approved' || !s.court_ordered) continue;
    const resetAt = hoursResetAtByUser.get(s.user_id);
    if (resetAt && (s.started_at == null || s.started_at <= resetAt)) continue;
    completedHoursByUser.set(s.user_id, (completedHoursByUser.get(s.user_id) ?? 0) + sessionHours(s));
  }

  const recentlyRemindedUserIds = new Set((recentReminders ?? []).map((r) => r.user_id));

  const template = await getTemplate('hours_reminder');
  const resend = getResendClient();

  for (const userId of courtOrderedUserIds) {
    const lastSessionAt = lastSessionByUser.get(userId);
    // No session on record at all counts as idle too - treat as "always eligible"
    // once outside the dedup window, same as a stale last-session date would be.
    const idleDays = lastSessionAt != null ? (now.getTime() - lastSessionAt) / MS_PER_DAY : Infinity;
    if (idleDays < MIN_IDLE_DAYS || idleDays > MAX_IDLE_DAYS) continue;

    result.eligible += 1;

    if (recentlyRemindedUserIds.has(userId)) {
      result.skippedRecentlyReminded += 1;
      continue;
    }

    const entry = directory.get(userId);

    await deliverHoursReminderInboxAndPush(supabase, userId, entry?.pushToken ?? null);

    if (!entry?.email || isMockAddress(entry.email)) {
      result.skippedNoEmail += 1;
      continue;
    }
    if (!resend) {
      result.failed += 1;
      continue;
    }

    const templateVars = { volunteer_name: entry.name };
    const subject = renderTemplate(template.subject, templateVars);
    const { html, attachments } = buildHoursReminderEmailForSend({
      volunteerName: entry.name,
      currentHours: completedHoursByUser.get(userId) ?? 0,
    });
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: entry.email,
      subject,
      html,
      attachments,
    });

    await logEmailSend(supabase, {
      userId,
      templateType: 'hours_reminder',
      toEmail: entry.email,
      subject,
      status: error ? 'failed' : 'sent',
      resendMessageId: data?.id ?? null,
    });

    if (error) result.failed += 1;
    else result.sent += 1;
  }

  return result;
}
