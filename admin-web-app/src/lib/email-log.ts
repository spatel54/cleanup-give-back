/**
 * Records every outbound volunteer email into `email_log`, for the
 * "Communication" section on the volunteer profile and the "failed emails"
 * bucket in the attention inbox. Soft-fails like the rest of the email
 * infra - a logging failure (e.g. migration not yet applied) must never
 * break the actual send.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export type EmailTemplateType =
  | 'approved'
  | 'declined'
  | 'shipped'
  | 'event_registration'
  | 'hours_reminder'
  | 'order_placed'
  | 'other';

export type EmailLogStatus = 'sent' | 'failed';

export async function logEmailSend(
  supabase: SupabaseClient,
  params: {
    userId?: string | null;
    sessionId?: string | null;
    templateType: EmailTemplateType;
    toEmail: string;
    ccEmails?: string[] | null;
    bccEmails?: string[] | null;
    subject: string;
    status: EmailLogStatus;
    resendMessageId?: string | null;
    adminUserId?: string | null;
  },
): Promise<void> {
  try {
    await supabase.from('email_log').insert({
      user_id: params.userId ?? null,
      session_id: params.sessionId ?? null,
      template_type: params.templateType,
      to_email: params.toEmail,
      cc_emails: params.ccEmails?.length ? params.ccEmails : null,
      bcc_emails: params.bccEmails?.length ? params.bccEmails : null,
      subject: params.subject,
      status: params.status,
      resend_message_id: params.resendMessageId ?? null,
      admin_user_id: params.adminUserId ?? null,
    });
  } catch (err) {
    console.warn('[email-log] failed to record email send:', err);
  }
}
