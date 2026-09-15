/**
 * Turns a raw `admin_audit_log` row (action string + before/after JSON snapshots) into
 * plain-language summaries for the Audit Log page - Admin reads this, not a developer,
 * so no raw JSON keys/values should reach the page by default.
 */
import { getSessionStatusConfig, formatDate, formatDateTime } from '@/lib/mock-data';

export type AuditLogRow = {
  id: string;
  action: string;
  target_table: string;
  target_id: string | null;
  admin_user_id: string;
  before_value: unknown;
  after_value: unknown;
  performed_at: string;
};

const ACTION_LABELS: Record<string, string> = {
  'approved session': 'Approved session',
  'bulk approved session': 'Approved session (bulk)',
  'declined session': 'Declined session',
  'adjusted hours': 'Adjusted hours',
  'saved admin notes': 'Updated notes',
  'marked letterhead generated': 'Generated letterhead',
  'created court order': 'Created court order',
  'updated court order': 'Updated court order',
  'volunteer deleted session': 'Volunteer deleted a session',
  'email sent': 'Emailed volunteer',
  'logged contact note': 'Logged contact note',
  'updated email template': 'Updated email template',
  'created email template': 'Created email template',
  'deleted email template': 'Deleted email template',
  'sent email': 'Sent email',
};

/** Title-cases anything not in the map above, so a new action type never shows raw. */
export function auditActionLabel(action: string): string {
  return (
    ACTION_LABELS[action] ??
    action.replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/** Known action values + their friendly labels, for the Audit Log page's filter dropdown. */
export const AUDIT_ACTION_OPTIONS: { value: string; label: string }[] = Object.entries(ACTION_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const ACTION_TONE: Record<string, 'positive' | 'negative' | 'neutral'> = {
  'approved session': 'positive',
  'bulk approved session': 'positive',
  'declined session': 'negative',
  'volunteer deleted session': 'negative',
};

export function auditActionTone(action: string): 'positive' | 'negative' | 'neutral' {
  return ACTION_TONE[action] ?? 'neutral';
}

const FIELD_LABELS: Record<string, string> = {
  status: 'Status',
  adjusted_hours: 'Adjusted hours',
  admin_notes: 'Notes',
  decline_reason: 'Decline reason',
  required_hours: 'Required hours',
  due_date: 'Due date',
  case_reference: 'Case reference',
  letterhead_generated_at: 'Letterhead',
  note: 'Note',
  subject: 'Subject',
  body_html: 'Body',
  name: 'Name',
  to_email: 'To',
};

/** Fields that only exist to identify the row, never worth showing as a "change." */
const SKIP_FIELDS = new Set(['id', 'user_id', 'template_type']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatFieldValue(field: string, value: unknown): string {
  if (value == null || value === '') return '-';
  if (field === 'status' && typeof value === 'string') return getSessionStatusConfig(value).label;
  if (field === 'due_date' && typeof value === 'string') return formatDate(value);
  if (field === 'letterhead_generated_at' && typeof value === 'string') return formatDateTime(value);
  if ((field === 'adjusted_hours' || field === 'required_hours') && typeof value === 'number') {
    return `${value}h`;
  }
  if (typeof value === 'string' && value.length > 80) return `${value.slice(0, 80)}…`;
  return String(value);
}

export type AuditValueTone = 'positive' | 'negative' | 'neutral';

export type AuditChangeLine = {
  label: string;
  from: string;
  to: string;
  /** Tone per side, driven by the actual value (e.g. "Declined" is negative on
   * either side of the diff) - never by column position. Undefined for fields
   * with no inherent good/bad reading (hours, notes, dates, ...). */
  fromTone?: AuditValueTone;
  toTone?: AuditValueTone;
};

/** Only `status` currently carries an inherent positive/negative reading -
 * reuses the same tone as the session status chip so "Declined" is never
 * colored the same as "Approved" regardless of which column it lands in. */
function fieldValueTone(field: string, value: unknown): AuditValueTone | undefined {
  if (field !== 'status' || typeof value !== 'string' || value === '') return undefined;
  if (value === 'approved') return 'positive';
  if (value === 'not_approved' || value === 'invalid') return 'negative';
  return 'neutral';
}

/** One line per field that actually changed between before/after - empty array if the
 * action didn't record a comparable diff (e.g. a plain create with no prior row). */
export function describeAuditChanges(before: unknown, after: unknown): AuditChangeLine[] {
  if (!isPlainObject(after)) return [];
  const beforeObj = isPlainObject(before) ? before : {};

  const lines: AuditChangeLine[] = [];
  for (const [key, value] of Object.entries(after)) {
    if (SKIP_FIELDS.has(key)) continue;
    const prev = beforeObj[key];
    if (prev === value) continue;
    lines.push({
      label: FIELD_LABELS[key] ?? key,
      from: formatFieldValue(key, prev),
      to: formatFieldValue(key, value),
      fromTone: fieldValueTone(key, prev),
      toTone: fieldValueTone(key, value),
    });
  }
  return lines;
}

export type AuditTarget = { label: string; shortId: string | null; href: string | null };

/** A friendly name for what was changed - pulls from the before-snapshot when it has one
 * (e.g. a session's `activity` name) rather than showing a raw table/uuid pair. */
export function auditTargetLabel(log: AuditLogRow): AuditTarget {
  const before = isPlainObject(log.before_value) ? log.before_value : {};
  const after = isPlainObject(log.after_value) ? log.after_value : {};
  const shortId = log.target_id ? log.target_id.slice(0, 8) : null;

  if (log.target_table === 'sessions') {
    const activity = before.activity ?? after.activity;
    return {
      label: typeof activity === 'string' && activity ? activity : 'Cleanup session',
      shortId,
      href: log.target_id ? `/sessions?period=all&open=${log.target_id}` : null,
    };
  }

  if (log.target_table === 'court_orders') {
    const caseRef = before.case_reference ?? after.case_reference;
    return {
      label: typeof caseRef === 'string' && caseRef ? `Court order · ${caseRef}` : 'Court order',
      shortId: null,
      href: log.target_id ? `/volunteers/${log.target_id}` : null,
    };
  }

  if (log.target_table === 'events') {
    return { label: 'Event', shortId, href: log.target_id ? `/events/${log.target_id}` : null };
  }

  if (log.target_table === 'shop_orders') {
    return { label: 'Shop order', shortId, href: log.target_id ? `/orders/${log.target_id}` : null };
  }

  if (log.target_table === 'volunteers') {
    return { label: 'Volunteer contact note', shortId, href: log.target_id ? `/volunteers/${log.target_id}` : null };
  }

  if (log.target_table === 'email_templates') {
    const name = before.name ?? after.name ?? before.template_type ?? after.template_type;
    return {
      label: typeof name === 'string' ? `Email template · ${name}` : 'Email template',
      shortId: null,
      href: '/emails?tab=templates',
    };
  }

  if (log.target_table === 'email') {
    const toEmail = after.to_email;
    return {
      label: typeof toEmail === 'string' ? `Email to ${toEmail}` : 'Email',
      shortId: null,
      href: log.target_id ? `/volunteers/${log.target_id}` : '/emails',
    };
  }

  return { label: log.target_table, shortId, href: null };
}
