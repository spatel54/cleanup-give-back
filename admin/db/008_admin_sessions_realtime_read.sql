-- Admin realtime read access for the sessions table.
--
-- Why: admin-web-app's server-side reads (`live-data.ts`) already bypass RLS via
-- the service-role key, but a Supabase Realtime subscription from the *browser*
-- authenticates as the signed-in admin's own JWT over the anon key, so it's
-- still subject to RLS. The only existing sessions policy (`users_own_sessions`,
-- see `backend/sessions/sql/supabase-init.sql`) scopes reads to
-- `auth.uid() = user_id`, which would hide every volunteer's rows from an admin
-- browser subscription. This adds a read-only policy for the admin role so the
-- SessionsPage/DashboardPage realtime subscriptions can see INSERT/UPDATE
-- events for all sessions, not just the signed-in admin's own (nonexistent)
-- sessions.
--
-- Claim path: `auth.jwt() -> 'user_metadata' ->> 'role'`, matching how
-- middleware.ts and getAdminUser() actually check admin status
-- (`user.user_metadata?.role === 'admin'`) — NOT the top-level `role` claim
-- used by 001_admin_portal_migration.sql's `admin_full_access_*` policies,
-- which 004_admin_refinements.sql flagged as a mismatch but never fixed.

drop policy if exists "admin_read_all_sessions" on public.sessions;
create policy "admin_read_all_sessions" on public.sessions
  for select
  using (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Realtime is off by default per-table; without this, postgres_changes
-- subscriptions receive nothing even once RLS allows the read.
alter publication supabase_realtime add table public.sessions;
