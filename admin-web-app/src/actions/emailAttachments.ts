'use server';

/**
 * Upload targets for the Compose flow and the rich-text template editor.
 *
 * `email-inline-images` is PUBLIC - an `<img>` embedded in an email body must
 * keep rendering whenever the recipient opens the email, even weeks later, so
 * inline images get a permanent public URL (mirrors `event-photos`).
 *
 * `email-attachments` is PRIVATE - real file attachments (PDFs, docs) are only
 * fetched once, by Resend, at send time via a short-lived signed URL
 * (`getAttachmentSignedUrls` in `lib/email-attachments.ts`), so they never need
 * to be public.
 */
import { createClient, createServiceClient } from '@/lib/supabase/server';

const INLINE_IMAGES_BUCKET = 'email-inline-images';
const ATTACHMENTS_BUCKET = 'email-attachments';

async function assertAdmin(): Promise<void> {
  if (process.env.BYPASS_AUTH === 'true') return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== 'admin') {
    throw new Error('Unauthorized');
  }
}

function extFromFilename(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || 'bin';
}

/** Uploads an inline body image; returns its permanent public URL. */
export async function uploadEmailInlineImage(formData: FormData): Promise<string> {
  await assertAdmin();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('No file provided');
  }

  const supabase = await createServiceClient();
  const path = `${crypto.randomUUID()}.${extFromFilename(file.name)}`;
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(INLINE_IMAGES_BUCKET)
    .upload(path, bytes, { contentType: file.type || 'image/jpeg', upsert: false });
  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage.from(INLINE_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export type UploadedAttachment = { path: string; filename: string; sizeBytes: number };

/** Uploads a document attachment; returns its storage path for later signed-URL generation. */
export async function uploadEmailAttachment(formData: FormData): Promise<UploadedAttachment> {
  await assertAdmin();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('No file provided');
  }
  const MAX_BYTES = 25 * 1024 * 1024; // Resend's overall message cap is 40MB; leave headroom.
  if (file.size > MAX_BYTES) {
    throw new Error('Attachment too large (25MB max)');
  }

  const supabase = await createServiceClient();
  const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, '_')}`;
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(path, bytes, { contentType: file.type || 'application/octet-stream', upsert: false });
  if (error) throw new Error(`Attachment upload failed: ${error.message}`);

  return { path, filename: file.name, sizeBytes: file.size };
}

export async function removeEmailAttachment(path: string): Promise<void> {
  await assertAdmin();
  const supabase = await createServiceClient();
  await supabase.storage.from(ATTACHMENTS_BUCKET).remove([path]);
}
