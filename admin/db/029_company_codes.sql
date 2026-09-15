-- Single-use company codes for tracker access (never expire; inactive after redeem).
-- Admin CRUD via admin-web-app; mobile redeems via Fly POST /company-codes/redeem.

CREATE TABLE IF NOT EXISTS public.company_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'used')),
  used_by uuid REFERENCES auth.users ON DELETE SET NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  CONSTRAINT company_codes_code_digits CHECK (code ~ '^[0-9]{10}$')
);

CREATE INDEX IF NOT EXISTS company_codes_status_idx ON public.company_codes (status);
CREATE INDEX IF NOT EXISTS company_codes_created_at_idx ON public.company_codes (created_at DESC);

ALTER TABLE public.company_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_company_codes" ON public.company_codes
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
