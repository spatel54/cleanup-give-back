'use server';

/** Ad-hoc email send - Compose flow on `/emails`, straight from the admin dashboard. */
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getVolunteerDirectory, isMockAddress } from '@/lib/volunteers';
import {
  dispatchAdHocEmail,
  isValidEmail,
  normalizeEmailList,
} from '@/lib/send-ad-hoc-email';
import type { AttachmentRef } from '@/lib/email-attachments';

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

export type SendAdHocEmailInput = {
  /** Send to a volunteer on file, or an arbitrary address - exactly one should be set. */
  recipientUserId?: string;
  toEmail?: string;
  ccEmails?: string[];
  bccEmails?: string[];
  subject: string;
  bodyHtml: string;
  attachments?: AttachmentRef[];
};

export type SendAdHocEmailResult = { ok: boolean; error?: string };

export async function sendAdHocEmail(input: SendAdHocEmailInput): Promise<SendAdHocEmailResult> {
  const user = await getAdminUser();

  let toEmail: string | null = null;
  let userId: string | null = null;

  if (input.recipientUserId) {
    const directory = await getVolunteerDirectory();
    const entry = directory.get(input.recipientUserId);
    if (!entry?.email || isMockAddress(entry.email)) {
      throw new Error('This volunteer has no real email on file yet');
    }
    toEmail = entry.email;
    userId = input.recipientUserId;
  } else if (input.toEmail) {
    toEmail = input.toEmail.trim();
  }

  if (!toEmail || !isValidEmail(toEmail)) {
    throw new Error('A valid recipient is required');
  }

  const supabase = await createServiceClient();
  const result = await dispatchAdHocEmail(supabase, {
    toEmail,
    ccEmails: normalizeEmailList(input.ccEmails),
    bccEmails: normalizeEmailList(input.bccEmails),
    subject: input.subject,
    bodyHtml: input.bodyHtml,
    attachments: input.attachments,
    userId,
    adminUserId: user.id,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true };
}
