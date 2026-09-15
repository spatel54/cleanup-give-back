/** Read helpers for the Scheduled tab on `/emails`. */
import { createServiceClient } from '@/lib/supabase/server';
import type { AttachmentRef } from '@/lib/email-attachments';

export type ScheduledEmailStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled';

export type ScheduledEmail = {
  id: string;
  adminUserId: string | null;
  userId: string | null;
  toEmail: string;
  ccEmails: string[];
  bccEmails: string[];
  subject: string;
  bodyHtml: string;
  attachments: AttachmentRef[];
  scheduledFor: string;
  status: ScheduledEmailStatus;
  resendMessageId: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  cancelledAt: string | null;
};

type Row = {
  id: string;
  admin_user_id: string | null;
  user_id: string | null;
  to_email: string;
  cc_emails: string[] | null;
  bcc_emails: string[] | null;
  subject: string;
  body_html: string;
  attachments: AttachmentRef[] | null;
  scheduled_for: string;
  status: ScheduledEmailStatus;
  resend_message_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  cancelled_at: string | null;
};

function mapRow(row: Row): ScheduledEmail {
  return {
    id: row.id,
    adminUserId: row.admin_user_id,
    userId: row.user_id,
    toEmail: row.to_email,
    ccEmails: row.cc_emails ?? [],
    bccEmails: row.bcc_emails ?? [],
    subject: row.subject,
    bodyHtml: row.body_html,
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    scheduledFor: row.scheduled_for,
    status: row.status,
    resendMessageId: row.resend_message_id,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sentAt: row.sent_at,
    cancelledAt: row.cancelled_at,
  };
}

/** Pending first, then recent terminal rows (sent/failed/cancelled/sending). */
export async function listScheduledEmails(limit = 80): Promise<ScheduledEmail[]> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from('scheduled_emails')
    .select(
      'id, admin_user_id, user_id, to_email, cc_emails, bcc_emails, subject, body_html, attachments, scheduled_for, status, resend_message_id, error_message, created_at, updated_at, sent_at, cancelled_at',
    )
    .order('scheduled_for', { ascending: true })
    .limit(limit);

  if (error) {
    console.warn('[scheduled-emails] list failed:', error.message);
    return [];
  }

  const rows = (data as Row[] | null) ?? [];
  const pending = rows.filter((r) => r.status === 'pending');
  const rest = rows
    .filter((r) => r.status !== 'pending')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  return [...pending, ...rest].map(mapRow);
}

export async function getScheduledEmail(id: string): Promise<ScheduledEmail | null> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from('scheduled_emails')
    .select(
      'id, admin_user_id, user_id, to_email, cc_emails, bcc_emails, subject, body_html, attachments, scheduled_for, status, resend_message_id, error_message, created_at, updated_at, sent_at, cancelled_at',
    )
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data as Row);
}
