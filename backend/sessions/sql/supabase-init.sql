-- Run in Supabase SQL Editor (one-time).
-- See docs/supabase.md

create type session_status as enum
  ('active', 'under_review', 'approved', 'not_approved', 'invalid');

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  activity text,
  court_ordered boolean default false,
  description text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds int,
  distance_miles numeric,
  route jsonb,
  status session_status default 'active',
  created_at timestamptz default now()
);

create table if not exists public.checkpoints (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions on delete cascade,
  selfie_path text,
  progress_path text,
  captured_at timestamptz,
  submitted_early boolean default false,
  latitude double precision,
  longitude double precision
);

alter table public.sessions enable row level security;
alter table public.checkpoints enable row level security;

drop policy if exists "users_own_sessions" on public.sessions;
create policy "users_own_sessions" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users_own_checkpoints" on public.checkpoints;
create policy "users_own_checkpoints" on public.checkpoints
  for all using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- Storage bucket for checkpoint photos
insert into storage.buckets (id, name, public)
values ('session-photos', 'session-photos', false)
on conflict (id) do nothing;

drop policy if exists "users_upload_own_photos" on storage.objects;
create policy "users_upload_own_photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'session-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users_read_own_photos" on storage.objects;
create policy "users_read_own_photos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'session-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users_update_own_photos" on storage.objects;
create policy "users_update_own_photos" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'session-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
