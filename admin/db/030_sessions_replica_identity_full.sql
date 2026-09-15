-- Deliver session UPDATE events to admin Realtime subscribers.
--
-- Finalize on mobile is `active` → `under_review` (an UPDATE, not an INSERT).
-- With RLS on `public.sessions` and replica identity DEFAULT (primary key
-- only), Supabase Realtime often cannot evaluate `admin_read_all_sessions`
-- against the old row and silently drops the change. The Home "N to review"
-- queue then stays frozen until a hard reload — and even then Next fetch
-- cache can keep the previous RSC payload.
--
-- FULL replica identity lets postgres_changes authorize UPDATE/DELETE the
-- same way INSERT already works. Complements
-- `008_admin_sessions_realtime_read.sql` (RLS + publication).

alter table public.sessions replica identity full;
