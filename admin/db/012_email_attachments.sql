-- Attachments + inline images for the ad-hoc Compose flow and the rich-text
-- template editor.
--
-- `email-attachments` — PRIVATE. Documents (PDFs, etc.) attached to an outgoing
-- email. Resend fetches the object once, at send time, via a short-lived signed
-- URL (`lib/email-attachments.ts`) — it doesn't need to stay reachable after
-- that, so the bucket stays private.
--
-- `email-inline-images` — PUBLIC. Images embedded directly in an email body
-- (`<img src="...">`) must keep rendering whenever the recipient opens the
-- email, potentially weeks later — a short-lived signed URL would break the
-- image. Same public-read / admin-write shape as `event-photos`
-- (admin/db/002_event_photos_bucket.sql).

insert into storage.buckets (id, name, public)
values ('email-attachments', 'email-attachments', false)
on conflict (id) do nothing;

drop policy if exists "admin_full_access_email_attachments" on storage.objects;
create policy "admin_full_access_email_attachments" on storage.objects
  for all to authenticated
  using (bucket_id = 'email-attachments' and (auth.jwt() ->> 'role') = 'admin')
  with check (bucket_id = 'email-attachments' and (auth.jwt() ->> 'role') = 'admin');

insert into storage.buckets (id, name, public)
values ('email-inline-images', 'email-inline-images', true)
on conflict (id) do nothing;

drop policy if exists "public_read_email_inline_images" on storage.objects;
create policy "public_read_email_inline_images" on storage.objects
  for select
  using (bucket_id = 'email-inline-images');

drop policy if exists "admin_write_email_inline_images" on storage.objects;
create policy "admin_write_email_inline_images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'email-inline-images' and (auth.jwt() ->> 'role') = 'admin');

drop policy if exists "admin_delete_email_inline_images" on storage.objects;
create policy "admin_delete_email_inline_images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'email-inline-images' and (auth.jwt() ->> 'role') = 'admin');

-- Filenames of any documents attached to a logged send — informational only,
-- the objects themselves live in `email-attachments` under a per-send prefix.
alter table public.email_log
  add column if not exists attachments jsonb;
