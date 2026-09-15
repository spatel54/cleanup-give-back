-- Court-ordered volunteers no longer track "hours remaining" against a total.
-- Completed hours are always derived live (sum of approved, court-ordered
-- sessions) — this marker is the reset point: only sessions dated after it
-- count. Generating a service letter auto-resets this; Admin can also reset
-- manually (single volunteer or bulk across a session multi-select).

ALTER TABLE public.court_orders
  ADD COLUMN IF NOT EXISTS hours_reset_at timestamptz;
