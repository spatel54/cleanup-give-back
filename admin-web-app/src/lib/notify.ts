/** Ported from `admin/lib/notify.ts` - volunteer email/push plus in-app inbox rows. */
import type { User } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/server';
import { getResendClient, getFromAddress } from './resend';
import { writeAuditLog } from './audit';
import { logEmailSend } from './email-log';
import { getTemplate } from './email-templates';
import { renderTemplate } from './email-template-render';
import { sendExpoPush } from './push';

type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>;

export type VolunteerNotificationType =
  | 'session_approved'
  | 'session_declined'
  | 'hours_adjusted'
  | 'status_updated'
  | 'order_update'
  | 'event'
  | 'hours_reminder';

type PreferenceKey = 'sessionReviews' | 'approvalStatus' | 'shopOrders';

interface NotifyVolunteerSessionDecisionParams {
  userId: string;
  sessionId: string;
  decision: 'approved' | 'declined';
  declineReason?: string;
  activity?: string | null;
  /** Session place (`description`) or activity fallback, shown in inbox copy. */
  location?: string | null;
  /** Admin who triggered the decision - logged against the "email sent" audit entry so it
   * shows up on the volunteer's risk timeline (`loadVolunteerTimeline` in `live-data.ts`). */
  adminUserId?: string;
}

export interface NotifyVolunteerHoursAdjustedParams {
  userId: string;
  sessionId: string;
  hours: number;
  location?: string | null;
  adminUserId?: string;
}

function isPreferencesRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/** Skip inbox+push only when the key is explicitly false. Missing prefs object = opted-in. */
export function isVolunteerInboxDeliveryEnabled(
  userMetadata: User['user_metadata'] | undefined,
  key: PreferenceKey,
): boolean {
  const prefs = userMetadata?.notification_preferences;
  if (!isPreferencesRecord(prefs)) {
    return true;
  }
  return prefs[key] !== false;
}

export async function insertVolunteerNotification(
  supabase: ServiceClient,
  params: {
    userId: string;
    type: VolunteerNotificationType;
    title: string;
    body: string;
    sessionId?: string | null;
    orderId?: string | null;
  },
): Promise<{ id: string; createdAt: string | null } | null> {
  try {
    const { data, error } = await supabase
      .from('volunteer_notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        session_id: params.sessionId ?? null,
        order_id: params.orderId ?? null,
      })
      .select('id, created_at')
      .single();
    if (error) {
      console.error('[notify] Failed to insert volunteer_notifications:', error);
      return null;
    }
    if (typeof data?.id !== 'string') {
      return null;
    }
    return {
      id: data.id,
      createdAt: typeof data.created_at === 'string' ? data.created_at : null,
    };
  } catch (err) {
    console.error('[notify] Failed to insert volunteer_notifications:', err);
    return null;
  }
}

function shortSessionPlaceName(location: string | null | undefined): string | null {
  const trimmed = location?.trim() ?? '';
  if (!trimmed) {
    return null;
  }
  const first = trimmed.split(',')[0]?.trim() ?? '';
  if (!first || first.toLowerCase() === 'unknown' || first === '-' || first === '-') {
    return null;
  }
  return first;
}

function formatSessionUpdateTitle(baseTitle: string, place: string | null): string {
  if (!place || baseTitle.includes(place)) {
    return baseTitle;
  }
  return `${baseTitle} · ${place}`;
}

function formatSessionUpdateBody(baseBody: string, place: string | null): string {
  if (!place) {
    return baseBody;
  }
  if (baseBody.toLowerCase().includes(place.toLowerCase())) {
    return baseBody;
  }
  if (/\bsession hours\b/i.test(baseBody)) {
    return baseBody.replace(/\bsession hours\b/i, (match) => `${match} at ${place}`);
  }
  if (/\bvolunteer session\b/i.test(baseBody)) {
    return baseBody.replace(/\bvolunteer session\b/i, (match) => `${match} at ${place}`);
  }
  if (/\bsession\b/i.test(baseBody)) {
    return baseBody.replace(/\bsession\b/i, (match) => `${match} at ${place}`);
  }
  return `${place}. ${baseBody}`;
}

function sessionDecisionCopy(
  decision: 'approved' | 'declined',
  declineReason?: string,
  location?: string | null,
): { type: VolunteerNotificationType; title: string; body: string } {
  const place = shortSessionPlaceName(location);
  if (decision === 'approved') {
    return {
      type: 'session_approved',
      title: formatSessionUpdateTitle('Session Approved!', place),
      body: formatSessionUpdateBody(
        'Your volunteer session has been approved.',
        place,
      ),
    };
  }
  const baseBody = declineReason
    ? `Your session was not approved. ${declineReason}`
    : 'Your session was not approved.';
  return {
    type: 'session_declined',
    title: formatSessionUpdateTitle('Session Update', place),
    body: formatSessionUpdateBody(baseBody, place),
  };
}

async function deliverVolunteerInboxAndPush({
  supabase,
  user,
  userId,
  type,
  title,
  body,
  sessionId,
  orderId,
  extraData,
}: {
  supabase: ServiceClient;
  user: User;
  userId: string;
  type: VolunteerNotificationType;
  title: string;
  body: string;
  sessionId?: string | null;
  orderId?: string | null;
  extraData?: Record<string, unknown>;
}): Promise<void> {
  const row = await insertVolunteerNotification(supabase, {
    userId,
    type,
    title,
    body,
    sessionId,
    orderId,
  });
  const pushToken = user.user_metadata?.push_token as string | undefined;
  if (!pushToken) {
    return;
  }
  try {
    await sendExpoPush(pushToken, {
      title,
      body,
      data: {
        notificationId: row?.id,
        createdAt: row?.createdAt ?? undefined,
        type,
        sessionId: sessionId ?? undefined,
        orderId: orderId ?? undefined,
        ...extraData,
      },
    });
    console.log(`[notify] Push notification sent to ${pushToken} for ${type}`);
  } catch (err) {
    console.error(`[notify] Failed to send push notification to ${pushToken}:`, err);
  }
}

async function sendDecisionEmail({
  supabase,
  user,
  userId,
  sessionId,
  decision,
  activity,
  declineReason,
  adminUserId,
}: NotifyVolunteerSessionDecisionParams & { supabase: ServiceClient; user: User }): Promise<void> {
  const email = user.email;
  if (!email) {
    return;
  }

  const template = await getTemplate(decision === 'approved' ? 'approved' : 'declined');
  const templateVars = { activity: activity ?? null, decline_reason: declineReason ?? null };
  const subject = renderTemplate(template.subject, templateVars);
  const emailBody = renderTemplate(template.bodyHtml, templateVars, { escapeHtml: true });

  try {
    const resend = getResendClient();
    if (resend) {
      const { data, error: sendError } = await resend.emails.send({
        from: getFromAddress(),
        to: email,
        subject,
        html: emailBody,
      });
      console.log(`[notify] Email sent to ${email} for session ${sessionId}`);
      await logEmailSend(supabase, {
        userId,
        sessionId,
        templateType: decision === 'approved' ? 'approved' : 'declined',
        toEmail: email,
        subject,
        status: sendError ? 'failed' : 'sent',
        resendMessageId: data?.id ?? null,
        adminUserId: adminUserId ?? null,
      });
      if (adminUserId) {
        await writeAuditLog(supabase, {
          adminUserId,
          action: 'email sent',
          targetTable: 'sessions',
          targetId: sessionId,
          afterValue: { decision, to: email },
        });
      }
    } else {
      console.log(`[notify] Resend not configured; skipping email to ${email}`);
    }
  } catch (err) {
    console.error(`[notify] Failed to send email to ${email}:`, err);
    await logEmailSend(supabase, {
      userId,
      sessionId,
      templateType: decision === 'approved' ? 'approved' : 'declined',
      toEmail: email,
      subject,
      status: 'failed',
      adminUserId: adminUserId ?? null,
    });
  }
}

export async function notifyVolunteerSessionDecision({
  userId,
  sessionId,
  decision,
  declineReason,
  activity,
  location,
  adminUserId,
}: NotifyVolunteerSessionDecisionParams): Promise<void> {
  const supabase = await createServiceClient();
  const { data, error: userError } = await supabase.auth.admin.getUserById(userId);

  if (userError || !data?.user) {
    console.error(`[notify] Failed to fetch user ${userId}:`, userError);
    return;
  }

  const user = data.user;
  await sendDecisionEmail({
    supabase,
    user,
    userId,
    sessionId,
    decision,
    activity,
    declineReason,
    adminUserId,
  });

  if (!isVolunteerInboxDeliveryEnabled(user.user_metadata, 'approvalStatus')) {
    return;
  }

  const copy = sessionDecisionCopy(decision, declineReason, location ?? activity);
  await deliverVolunteerInboxAndPush({
    supabase,
    user,
    userId,
    type: copy.type,
    title: copy.title,
    body: copy.body,
    sessionId,
  });
}

export async function notifyVolunteerHoursAdjusted({
  userId,
  sessionId,
  hours,
  location,
  adminUserId,
}: NotifyVolunteerHoursAdjustedParams): Promise<void> {
  void adminUserId;
  const supabase = await createServiceClient();
  const { data, error: userError } = await supabase.auth.admin.getUserById(userId);

  if (userError || !data?.user) {
    console.error(`[notify] Failed to fetch user ${userId}:`, userError);
    return;
  }

  const user = data.user;
  if (!isVolunteerInboxDeliveryEnabled(user.user_metadata, 'approvalStatus')) {
    return;
  }

  const hourLabel = hours === 1 ? '1 hour' : `${hours} hours`;
  const place = shortSessionPlaceName(location);
  await deliverVolunteerInboxAndPush({
    supabase,
    user,
    userId,
    type: 'hours_adjusted',
    title: formatSessionUpdateTitle('Hours updated', place),
    body: formatSessionUpdateBody(
      `Your session hours were updated to ${hourLabel}.`,
      place,
    ),
    sessionId,
  });
}

const ORDER_INBOX_COPY = {
  placed: {
    title: 'Order confirmed',
    body: 'Thanks for your order. Details are in Order History.',
  },
  shipped: {
    title: 'Order shipped',
    body: 'Your cleanup kit is on the way. Tracking is in Order History.',
  },
} as const;

export async function notifyVolunteerOrderUpdate({
  userId,
  orderId,
  variant,
}: {
  userId: string;
  orderId: string;
  variant: 'placed' | 'shipped';
}): Promise<void> {
  const supabase = await createServiceClient();
  const { data, error: userError } = await supabase.auth.admin.getUserById(userId);

  if (userError || !data?.user) {
    console.error(`[notify] Failed to fetch user ${userId}:`, userError);
    return;
  }

  const user = data.user;
  if (!isVolunteerInboxDeliveryEnabled(user.user_metadata, 'shopOrders')) {
    return;
  }

  const copy = ORDER_INBOX_COPY[variant];
  const { data: existing } = await supabase
    .from('volunteer_notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('order_id', orderId)
    .eq('type', 'order_update')
    .eq('title', copy.title)
    .limit(1)
    .maybeSingle();
  if (existing?.id) {
    return;
  }

  await deliverVolunteerInboxAndPush({
    supabase,
    user,
    userId,
    type: 'order_update',
    title: copy.title,
    body: copy.body,
    orderId,
  });
}
