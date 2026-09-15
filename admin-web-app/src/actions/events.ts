'use server';

/**
 * Event server actions - ported from `admin/actions/events.ts`. Writes straight
 * to the shared `public.events` table and `event-photos` storage bucket, so a
 * published/edited/deleted event here shows up immediately in the mobile
 * app's Upcoming Events feed.
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';
import { fromDatetimeLocalValue, formatEventWhen, type EventRow } from '@/lib/events';
import { geocodeAddress } from '@/lib/geocode';

const EVENT_PHOTOS_BUCKET = 'event-photos';
const MAX_EVENT_PHOTOS = 8;

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

function revalidateEventPaths(eventId?: string) {
  revalidatePath('/events');
  if (eventId) {
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}/edit`);
  }
}

async function uploadEventPhoto(supabase: SupabaseClient, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(EVENT_PHOTOS_BUCKET)
    .upload(path, bytes, { contentType: file.type || 'image/jpeg', upsert: false });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  const { data } = supabase.storage.from(EVENT_PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function collectPhotoFiles(formData: FormData): File[] {
  return formData
    .getAll('photo_files')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

async function resolveEventImageUrls(
  supabase: SupabaseClient,
  formData: FormData,
): Promise<{ image_url: string | null; image_urls: string[] }> {
  const existing = formData
    .getAll('existing_image_urls')
    .map((v) => String(v).trim())
    .filter(Boolean);

  const room = Math.max(0, MAX_EVENT_PHOTOS - existing.length);
  const uploaded = await Promise.all(
    collectPhotoFiles(formData)
      .slice(0, room)
      .map((file) => uploadEventPhoto(supabase, file)),
  );

  const seen = new Set<string>();
  const imageUrls: string[] = [];
  for (const url of [...existing, ...uploaded]) {
    if (seen.has(url)) continue;
    seen.add(url);
    imageUrls.push(url);
    if (imageUrls.length >= MAX_EVENT_PHOTOS) break;
  }

  return { image_urls: imageUrls, image_url: imageUrls[0] ?? null };
}

function parseOptionalNumber(raw: FormDataEntryValue | null): number | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

async function eventFieldsFromForm(supabase: SupabaseClient, formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  if (!title) {
    throw new Error('Title is required');
  }

  const startsAtRaw = String(formData.get('starts_at') ?? '').trim();
  const startsAt = fromDatetimeLocalValue(startsAtRaw);
  if (!startsAt) {
    throw new Error('Start date and time are required');
  }

  const endsAtRaw = String(formData.get('ends_at') ?? '').trim();
  const endsAt = endsAtRaw ? fromDatetimeLocalValue(endsAtRaw) : null;

  const { image_url: imageUrl, image_urls: imageUrls } = await resolveEventImageUrls(supabase, formData);

  const address = String(formData.get('address') ?? '').trim() || null;
  let lat = parseOptionalNumber(formData.get('lat'));
  let lng = parseOptionalNumber(formData.get('lng'));

  // Any venue: if the form has an address but no verified/selected pin,
  // Census (then Google if keyed) geocodes so EventLocationMap works.
  if (address && (lat == null || lng == null)) {
    const geo = await geocodeAddress(address);
    if ('latitude' in geo) {
      lat = geo.latitude;
      lng = geo.longitude;
    }
  }

  return {
    title,
    description: String(formData.get('description') ?? '').trim() || null,
    location: String(formData.get('location') ?? '').trim() || null,
    address,
    lat,
    lng,
    starts_at: startsAt,
    ends_at: endsAt,
    what_to_bring: String(formData.get('what_to_bring') ?? '').trim() || null,
    organizer: String(formData.get('organizer') ?? '').trim() || null,
    image_url: imageUrl,
    image_urls: imageUrls,
    is_published: formData.get('is_published') === 'on' || formData.get('is_published') === 'true',
    updated_at: new Date().toISOString(),
  };
}

export type EventActionState = {
  error?: string;
};

export async function createEvent(
  _prev: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  try {
    const user = await getAdminUser();
    const supabase = await createServiceClient();
    const fields = await eventFieldsFromForm(supabase, formData);

    const { data, error } = await supabase.from('events').insert(fields as never).select('id').single();

    if (error) return { error: error.message };
    if (!data?.id) return { error: 'Failed to create event' };

    await writeAuditLog(supabase, {
      adminUserId: user.id,
      action: 'created event',
      targetTable: 'events',
      targetId: data.id,
      afterValue: fields,
    });

    revalidateEventPaths(data.id);
    redirect(`/events/${data.id}`);
  } catch (err) {
    if (err && typeof err === 'object' && 'digest' in err) throw err;
    return { error: err instanceof Error ? err.message : 'Failed to create event' };
  }
}

export async function updateEvent(
  eventId: string,
  _prev: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  try {
    const user = await getAdminUser();
    const supabase = await createServiceClient();
    const fields = await eventFieldsFromForm(supabase, formData);

    const { data: before } = await supabase.from('events').select('*').eq('id', eventId).single();

    const { error } = await supabase.from('events').update(fields as never).eq('id', eventId);
    if (error) return { error: error.message };

    await writeAuditLog(supabase, {
      adminUserId: user.id,
      action: 'updated event',
      targetTable: 'events',
      targetId: eventId,
      beforeValue: before,
      afterValue: fields,
    });

    revalidateEventPaths(eventId);
    redirect(`/events/${eventId}`);
  } catch (err) {
    if (err && typeof err === 'object' && 'digest' in err) throw err;
    return { error: err instanceof Error ? err.message : 'Failed to update event' };
  }
}

export async function setEventPublished(eventId: string, isPublished: boolean) {
  const user = await getAdminUser();
  const supabase = await createServiceClient();

  const { data: before } = await supabase.from('events').select('is_published').eq('id', eventId).single();

  const { error } = await supabase
    .from('events')
    .update({ is_published: isPublished, updated_at: new Date().toISOString() } as never)
    .eq('id', eventId);

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: isPublished ? 'published event' : 'unpublished event',
    targetTable: 'events',
    targetId: eventId,
    beforeValue: before,
    afterValue: { is_published: isPublished },
  });

  revalidateEventPaths(eventId);
}

export async function deleteEvent(eventId: string) {
  const user = await getAdminUser();
  const supabase = await createServiceClient();

  const { data: before } = await supabase.from('events').select('*').eq('id', eventId).single();

  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'deleted event',
    targetTable: 'events',
    targetId: eventId,
    beforeValue: before,
  });

  revalidateEventPaths(eventId);
  redirect('/events');
}

