/**
 * Aggregates everything Admin might need to act on into one typed list, for the
 * "Needs attention" inbox. Every bucket reuses an existing loader/check -
 * this file only combines and normalizes them, it doesn't compute anything new.
 * Live/reactive, like the Dashboard bento - no persisted "acknowledged" state.
 */
import { differenceInCalendarDays } from 'date-fns';

import { createDataClient } from '@/lib/supabase/server';
import { loadLiveSessions, loadLiveFeedback, loadLiveOrders } from '@/lib/live-data';
import { loadSessionEvidence, loadSessionVolunteerPattern } from '@/actions/sessions';
import { computeRedFlags } from '@/lib/session-red-flags';
import { loadDataQualityAlerts } from '@/lib/data-quality';

export type AttentionItemKind =
  | 'session_review'
  | 'flagged_feedback'
  | 'order_issue'
  | 'failed_email'
  | 'suspicious_session'
  | 'data_quality';

export type AttentionItem = {
  id: string;
  kind: AttentionItemKind;
  label: string;
  detail: string | null;
  href: string;
  occurredAt: string | null;
};

/** Orders sitting in 'pending' longer than this look stuck, not just fresh. */
const STALE_PENDING_ORDER_DAYS = 3;

async function buildSessionReviewItems(): Promise<AttentionItem[]> {
  const { data: sessions } = await loadLiveSessions();
  return sessions
    .filter((s) => s.status === 'under_review')
    .map((s) => ({
      id: `session_review-${s.id}`,
      kind: 'session_review' as const,
      label: `${s.volunteer_name} - ${s.activity ?? 'Cleanup session'}`,
      detail: 'Awaiting review',
      href: `/sessions?period=all&open=${s.id}`,
      occurredAt: s.started_at,
    }));
}

async function buildFlaggedFeedbackItems(): Promise<AttentionItem[]> {
  const { data: feedback, useMock } = await loadLiveFeedback();
  if (useMock) return [];
  return feedback
    .filter((f) => f.flagged)
    .map((f) => ({
      id: `flagged_feedback-${f.id}`,
      kind: 'flagged_feedback' as const,
      label: `${f.volunteer} flagged feedback - ${f.activity}`,
      detail: f.comment,
      href: '/feedback',
      occurredAt: f.submittedAt,
    }));
}

async function buildOrderIssueItems(): Promise<AttentionItem[]> {
  const { data: orders, useMock } = await loadLiveOrders();
  if (useMock) return [];
  const now = new Date();
  return orders
    .filter((o) => {
      if (o.status === 'pending') {
        return differenceInCalendarDays(now, new Date(o.createdAt)) >= STALE_PENDING_ORDER_DAYS;
      }
      return o.status === 'paid' && !o.tracking;
    })
    .map((o) => ({
      id: `order_issue-${o.id}`,
      kind: 'order_issue' as const,
      label:
        o.status === 'pending'
          ? `Order ${o.id.slice(0, 8)} stuck in pending`
          : `Order ${o.id.slice(0, 8)} paid with no tracking`,
      detail: o.volunteer,
      href: `/orders/${o.id}`,
      occurredAt: o.createdAt,
    }));
}

async function buildFailedEmailItems(): Promise<AttentionItem[]> {
  const supabase = await createDataClient();
  const { data: rows, error } = await supabase
    .from('email_log')
    .select('id, user_id, template_type, to_email, sent_at')
    .eq('status', 'failed')
    .order('sent_at', { ascending: false });

  // email_log may not exist yet (migration not applied) - degrade to an empty bucket.
  if (error || !rows) return [];

  return rows.map((r) => ({
    id: `failed_email-${r.id}`,
    kind: 'failed_email' as const,
    label: `${r.template_type} email failed to ${r.to_email}`,
    detail: null,
    href: r.user_id ? `/volunteers/${r.user_id}` : '/volunteers',
    occurredAt: r.sent_at,
  }));
}

async function buildSuspiciousSessionItems(): Promise<AttentionItem[]> {
  const { data: sessions } = await loadLiveSessions();
  const underReview = sessions.filter((s) => s.status === 'under_review');

  const flagged = await Promise.all(
    underReview.map(async (s) => {
      const [evidence, volunteerPattern] = await Promise.all([
        loadSessionEvidence(s.id),
        loadSessionVolunteerPattern(s.user_id),
      ]);
      const redFlags = computeRedFlags({
        durationSeconds: s.duration_seconds,
        checkpointCount: evidence?.checkpointCount ?? 0,
        photoPins: evidence?.photoPins ?? [],
        plausibilitySignal: evidence?.plausibilitySignal ?? null,
        volunteerPattern,
      });
      if (redFlags.length === 0) return null;
      const item: AttentionItem = {
        id: `suspicious_session-${s.id}`,
        kind: 'suspicious_session',
        label: `${s.volunteer_name} - ${redFlags.length} flag${redFlags.length === 1 ? '' : 's'} to review`,
        detail: redFlags.map((f) => f.label).join('; '),
        href: `/sessions?period=all&open=${s.id}`,
        occurredAt: s.started_at,
      };
      return item;
    }),
  );

  return flagged.filter((item): item is AttentionItem => item != null);
}

async function buildDataQualityItems(): Promise<AttentionItem[]> {
  const alerts = await loadDataQualityAlerts();
  return alerts.map((a) => ({
    id: `data_quality-${a.key}`,
    kind: 'data_quality' as const,
    label: a.label,
    detail: null,
    href: a.table === 'shop_orders' ? `/orders/${a.targetId}` : `/sessions?period=all&open=${a.targetId}`,
    occurredAt: null,
  }));
}

/** Everything Admin might need to act on, newest-first (items with no timestamp sort last). */
export async function buildAttentionItems(): Promise<AttentionItem[]> {
  const buckets = await Promise.all([
    buildSessionReviewItems(),
    buildFlaggedFeedbackItems(),
    buildOrderIssueItems(),
    buildFailedEmailItems(),
    buildSuspiciousSessionItems(),
    buildDataQualityItems(),
  ]);

  return buckets.flat().sort((a, b) => {
    if (!a.occurredAt && !b.occurredAt) return 0;
    if (!a.occurredAt) return 1;
    if (!b.occurredAt) return -1;
    return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
  });
}
