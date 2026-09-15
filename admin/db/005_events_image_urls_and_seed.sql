-- Events follow-up: multi-photo gallery + storage policies + seed backfill
-- Additive only. Safe to re-run.
--
-- The base `public.events` table already exists (from 001_admin_portal_migration.sql).
-- This adds `image_urls` (003), storage policies for `event-photos` (002), and
-- backfills the published Downtown Riverfront sample if present.
--
-- Run in: Supabase Dashboard → SQL Editor → New query → Run

-- 1. Multi-photo gallery column (mobile + web-app read this)
alter table public.events
  add column if not exists image_urls text[] not null default '{}';

-- Backfill single-hero rows into the gallery array
update public.events
set image_urls = array[image_url]
where image_url is not null
  and image_url <> ''
  and (image_urls is null or cardinality(image_urls) = 0);

-- 2. Ensure event-photos bucket exists (also creatable via Storage API)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-photos',
  'event-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

-- 3. Storage RLS (defense-in-depth; service-role uploads bypass these)
drop policy if exists "public_read_event_photos" on storage.objects;
create policy "public_read_event_photos" on storage.objects
  for select
  using (bucket_id = 'event-photos');

drop policy if exists "admin_write_event_photos" on storage.objects;
create policy "admin_write_event_photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'event-photos'
    and (auth.jwt() ->> 'role') = 'admin'
  );

drop policy if exists "admin_update_event_photos" on storage.objects;
create policy "admin_update_event_photos" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'event-photos'
    and (auth.jwt() ->> 'role') = 'admin'
  );

drop policy if exists "admin_delete_event_photos" on storage.objects;
create policy "admin_delete_event_photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'event-photos'
    and (auth.jwt() ->> 'role') = 'admin'
  );

-- 4. Enrich the published Des Plaines sample with gallery placeholders
--    (matches mobile Unsplash stand-ins for 600 E Algonquin Rd)
update public.events
set
  image_urls = array[
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80'
  ],
  image_url = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
  updated_at = now()
where title = 'Downtown Riverfront Clean-up'
  and address ilike '%600 E Algonquin%';
