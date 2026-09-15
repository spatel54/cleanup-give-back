/** Server-only helper - signs `email-attachments` paths for Resend to fetch at send time. */
import { createServiceClient } from '@/lib/supabase/server';

const ATTACHMENTS_BUCKET = 'email-attachments';
/** Just long enough for Resend to fetch the object once during the send call. */
const SIGNED_URL_TTL_SECONDS = 5 * 60;

export type AttachmentRef = { path: string; filename: string };

export async function getAttachmentSignedUrls(
  attachments: AttachmentRef[],
): Promise<{ filename: string; path: string }[]> {
  if (attachments.length === 0) return [];

  const supabase = await createServiceClient();
  const signed = await Promise.all(
    attachments.map(async (a) => {
      const { data, error } = await supabase.storage
        .from(ATTACHMENTS_BUCKET)
        .createSignedUrl(a.path, SIGNED_URL_TTL_SECONDS);
      if (error || !data) {
        console.warn(`[email-attachments] failed to sign ${a.path}:`, error);
        return null;
      }
      return { filename: a.filename, path: data.signedUrl };
    }),
  );

  return signed.filter((s): s is { filename: string; path: string } => s != null);
}
