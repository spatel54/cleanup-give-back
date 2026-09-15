-- Event hero photo uploads (EventForm phone camera / picker)
-- Additive only. Uploads go through the service-role client in
-- admin/actions/events.ts, so these policies are a defense-in-depth
-- backstop, not the primary access-control path.

insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', true)
on conflict (id) do nothing;

-- Public bucket: anyone can read (mobile app hero images), only the
-- admin-role JWT can write.
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
