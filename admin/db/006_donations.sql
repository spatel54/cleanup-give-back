-- Donations table — additive only.
-- Backs Payments "Donations" revenue in admin/ and admin-web-app/, previously mock-only
-- (see admin/lib/payments-data.ts, admin-web-app/src/lib/live-data.ts). No writer exists
-- yet — the mobile Donate flow (`frontend/src/app/donate.tsx`) is still local/mock
-- until Stripe (or another processor) ships; this table is the landing spot for
-- that integration and can be seeded/tested manually in the meantime.

CREATE TABLE IF NOT EXISTS public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  amount_cents int NOT NULL CHECK (amount_cents > 0),
  donor_name text,
  donor_email text,
  message text,
  status text NOT NULL DEFAULT 'succeeded'
    CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  payment_reference text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS donations_created_at_idx ON public.donations (created_at);
CREATE INDEX IF NOT EXISTS donations_user_id_idx ON public.donations (user_id);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_donations" ON public.donations
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
