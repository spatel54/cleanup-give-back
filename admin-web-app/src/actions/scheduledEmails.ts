'use server';

/** Schedule / edit / cancel / send-now for ad-hoc emails queued in `scheduled_emails`. */
import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';
import type { AttachmentRef } from '@/lib/email-attachments';
import { getVolunteerDirectory } from '@/lib/volunteers';
import {
  dispatchAdHocEmail,
  isValidEmail,
  normalizeEmailList,
} from '@/lib/send-ad-hoc-email';
import { sanitizeEmailHtml } from '@/lib/sanitize-html';
import { getScheduledEmail } from '@/lib/scheduled-emails';

async function getAdminUser() {
  if (process.env.BYPASS_AUTH === 'true') {
    return { id: 'bypass-admin', user_metadata: { role: 'admin' } };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  return user;
}

async function resolveRecipient(input: {
  recipientUserId?: string;
  toEmail?: string;
}): Promise<{ toEmail: string; userId: string | null }> {
  if (input.recipientUserId) {
    const directory = await getVolunteerDirectory();
    const entry = directory.get(input.recipientUserId);
    if (!entry?.email) {
      throw new Error('Selected volunteer has no email on file');
    }
    return { toEmail: entry.email, userId: input.recipientUserId };
  }
  const toEmail = input.toEmail?.trim() ?? '';
  if (!isValidEmail(toEmail)) {
    throw new Error('A valid recipient is required');
  }
  return { toEmail, userId: null };
}

export type ScheduleAdHocEmailInput = {
  recipientUserId?: string;
  toEmail?: string;
  ccEmails?: string[];
  bccEmails?: string[];
  subject: string;
  bodyHtml: string;
  attachments?: AttachmentRef[];
  /** ISO timestamptz - must be in the future. */
  scheduledFor: string;
};

export type ScheduleAdHocEmailResult = { ok: boolean; id?: string; error?: string };

export async function scheduleAdHocEmail(input: ScheduleAdHocEmailInput): Promise<ScheduleAdHocEmailResult> {
  const user = await getAdminUser();
  const subject = input.subject.trim();
  const bodyHtml = sanitizeEmailHtml(input.bodyHtml.trim());
  if (!subject || !bodyHtml) {
    throw new Error('Subject and body cannot be empty');
  }

  const scheduledFor = new Date(input.scheduledFor);
  if (Number.isNaN(scheduledFor.getTime()) || scheduledFor.getTime() <= Date.now()) {
    throw new Error('Scheduled time must be in the future');
  }

  const { toEmail, userId } = await resolveRecipient(input);
  const ccEmails = normalizeEmailList(input.ccEmails);
  const bccEmails = normalizeEmailList(input.bccEmails);
  const attachments = input.attachments ?? [];

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from('scheduled_emails')
    .insert({
      admin_user_id: user.id,
      user_id: userId,
      to_email: toEmail,
      cc_emails: ccEmails,
      bcc_emails: bccEmails,
      subject,
      body_html: bodyHtml,
      attachments,
      scheduled_for: scheduledFor.toISOString(),
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'Failed to schedule email' };
  }

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'scheduled email',
    targetTable: 'scheduled_emails',
    targetId: data.id,
    afterValue: {
      to_email: toEmail,
      subject,
      scheduled_for: scheduledFor.toISOString(),
      cc_count: ccEmails.length,
      bcc_count: bccEmails.length,
    },
  });

  revalidatePath('/emails');
  return { ok: true, id: data.id };
}

export type UpdateScheduledEmailInput = {
  id: string;
  recipientUserId?: string;
  toEmail?: string;
  ccEmails?: string[];
  bccEmails?: string[];
  subject: string;
  bodyHtml: string;
  attachments?: AttachmentRef[];
  scheduledFor: string;
};

export async function updateScheduledEmail(
  input: UpdateScheduledEmailInput,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getAdminUser();
  const subject = input.subject.trim();
  const bodyHtml = sanitizeEmailHtml(input.bodyHtml.trim());
  if (!subject || !bodyHtml) {
    throw new Error('Subject and body cannot be empty');
  }

  const scheduledFor = new Date(input.scheduledFor);
  if (Number.isNaN(scheduledFor.getTime()) || scheduledFor.getTime() <= Date.now()) {
    throw new Error('Scheduled time must be in the future');
  }

  const { toEmail, userId } = await resolveRecipient(input);
  const ccEmails = normalizeEmailList(input.ccEmails);
  const bccEmails = normalizeEmailList(input.bccEmails);
  const now = new Date().toISOString();

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from('scheduled_emails')
    .update({
      user_id: userId,
      to_email: toEmail,
      cc_emails: ccEmails,
      bcc_emails: bccEmails,
      subject,
      body_html: bodyHtml,
      attachments: input.attachments ?? [],
      scheduled_for: scheduledFor.toISOString(),
      updated_at: now,
    })
    .eq('id', input.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: false, error: 'This email is already sending or was sent' };
  }

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'updated scheduled email',
    targetTable: 'scheduled_emails',
    targetId: input.id,
    afterValue: {
      to_email: toEmail,
      subject,
      scheduled_for: scheduledFor.toISOString(),
    },
  });

  revalidatePath('/emails');
  return { ok: true };
}

export async function cancelScheduledEmail(id: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getAdminUser();
  const now = new Date().toISOString();
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from('scheduled_emails')
    .update({ status: 'cancelled', cancelled_at: now, updated_at: now })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'This email is already sending or was sent' };

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'cancelled scheduled email',
    targetTable: 'scheduled_emails',
    targetId: id,
  });

  revalidatePath('/emails');
  return { ok: true };
}

async function claimAndSend(id: string, adminUserId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServiceClient();
  const now = new Date().toISOString();

  const { data: claimed, error: claimError } = await supabase
    .from('scheduled_emails')
    .update({ status: 'sending', updated_at: now })
    .eq('id', id)
    .eq('status', 'pending')
    .select(
      'id, user_id, to_email, cc_emails, bcc_emails, subject, body_html, attachments, admin_user_id',
    )
    .maybeSingle();

  if (claimError) return { ok: false, error: claimError.message };
  if (!claimed) return { ok: false, error: 'This email is already sending or was sent' };

  const result = await dispatchAdHocEmail(supabase, {
    toEmail: claimed.to_email as string,
    ccEmails: (claimed.cc_emails as string[] | null) ?? [],
    bccEmails: (claimed.bcc_emails as string[] | null) ?? [],
    subject: claimed.subject as string,
    bodyHtml: claimed.body_html as string,
    attachments: (claimed.attachments as AttachmentRef[] | null) ?? [],
    userId: (claimed.user_id as string | null) ?? null,
    adminUserId: adminUserId || ((claimed.admin_user_id as string | null) ?? 'cron'),
    auditAction: 'sent scheduled email',
  });

  const sentAt = new Date().toISOString();
  if (!result.ok) {
    await supabase
      .from('scheduled_emails')
      .update({
        status: 'failed',
        error_message: result.error,
        updated_at: sentAt,
      })
      .eq('id', id);
    return { ok: false, error: result.error };
  }

  await supabase
    .from('scheduled_emails')
    .update({
      status: 'sent',
      resend_message_id: result.resendMessageId,
      sent_at: sentAt,
      error_message: null,
      updated_at: sentAt,
    })
    .eq('id', id);

  return { ok: true };
}

export async function sendScheduledEmailNow(id: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getAdminUser();
  const result = await claimAndSend(id, user.id);
  revalidatePath('/emails');
  return result;
}

/** Cron / internal: send all due pending emails. */
export async function processDueScheduledEmails(): Promise<{ processed: number; sent: number; failed: number }> {
  const supabase = await createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('scheduled_emails')
    .select('id, admin_user_id')
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })
    .limit(25);

  if (error || !data?.length) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  for (const row of data) {
    const result = await claimAndSend(row.id as string, (row.admin_user_id as string | null) ?? 'cron');
    if (result.ok) sent += 1;
    else failed += 1;
  }

  return { processed: data.length, sent, failed };
}

export async function loadScheduledEmailForEdit(id: string) {
  await getAdminUser();
  return getScheduledEmail(id);
}
