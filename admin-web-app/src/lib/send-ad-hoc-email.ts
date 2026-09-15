/**
 * Shared Resend dispatch for Compose send-now, scheduled send-now, and the cron worker.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { writeAuditLog } from '@/lib/audit';
import { logEmailSend } from '@/lib/email-log';
import { getAttachmentSignedUrls, type AttachmentRef } from '@/lib/email-attachments';
import { getResendClient, getFromAddress } from '@/lib/resend';
import { sanitizeEmailHtml } from '@/lib/sanitize-html';
import { isValidEmail, normalizeEmailList } from '@/lib/email-address';

export { isValidEmail, normalizeEmailList } from '@/lib/email-address';

export type DispatchAdHocEmailParams = {
  toEmail: string;
  ccEmails?: string[];
  bccEmails?: string[];
  subject: string;
  bodyHtml: string;
  attachments?: AttachmentRef[];
  userId?: string | null;
  adminUserId: string;
  auditAction?: string;
};

export type DispatchAdHocEmailResult =
  | { ok: true; resendMessageId: string | null }
  | { ok: false; error: string; resendMessageId?: null };

export async function dispatchAdHocEmail(
  supabase: SupabaseClient,
  params: DispatchAdHocEmailParams,
): Promise<DispatchAdHocEmailResult> {
  const subject = params.subject.trim();
  const bodyHtml = sanitizeEmailHtml(params.bodyHtml.trim());
  if (!subject || !bodyHtml) {
    return { ok: false, error: 'Subject and body cannot be empty' };
  }
  if (!isValidEmail(params.toEmail)) {
    return { ok: false, error: 'A valid recipient is required' };
  }

  const ccEmails = normalizeEmailList(params.ccEmails);
  const bccEmails = normalizeEmailList(params.bccEmails);
  const resend = getResendClient();
  if (!resend) {
    return { ok: false, error: 'Email sending is not configured (RESEND_API_KEY unset)' };
  }

  const attachments = await getAttachmentSignedUrls(params.attachments ?? []);

  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to: params.toEmail,
    cc: ccEmails.length > 0 ? ccEmails : undefined,
    bcc: bccEmails.length > 0 ? bccEmails : undefined,
    subject,
    html: bodyHtml,
    attachments: attachments.length > 0 ? attachments : undefined,
  });

  await logEmailSend(supabase, {
    userId: params.userId,
    templateType: 'other',
    toEmail: params.toEmail,
    ccEmails,
    bccEmails,
    subject,
    status: error ? 'failed' : 'sent',
    resendMessageId: data?.id ?? null,
    adminUserId: params.adminUserId,
  });

  await writeAuditLog(supabase, {
    adminUserId: params.adminUserId,
    action: params.auditAction ?? 'sent email',
    targetTable: 'email',
    targetId: params.userId ?? undefined,
    afterValue: {
      to_email: params.toEmail,
      cc_count: ccEmails.length,
      bcc_count: bccEmails.length,
      subject,
      attachment_count: attachments.length,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, resendMessageId: data?.id ?? null };
}
