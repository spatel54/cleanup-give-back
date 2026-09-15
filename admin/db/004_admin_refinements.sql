-- Admin portal refinement migration — additive only
-- decline_reason, court_orders unique user, event notify history

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS decline_reason text;

-- One court order row per volunteer (upsert target)
CREATE UNIQUE INDEX IF NOT EXISTS court_orders_user_id_uidx
  ON public.court_orders (user_id);

CREATE TABLE IF NOT EXISTS public.event_volunteer_notices (
  event_id uuid NOT NULL REFERENCES public.events ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  notified_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- Align RLS admin check with app claim path (user_metadata.role)
-- Re-assert policies only if they already exist; safe to re-run.
DO $$
BEGIN
  -- No-op placeholder: existing policies in 001 may use jwt->>'role'.
  -- Prefer service-role for admin mutations; document claim path in
  -- docs/admin/refinement-contracts-2026-07-28.md
  NULL;
END $$;
