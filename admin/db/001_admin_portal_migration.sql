-- Admin Portal Migration v1
-- Additive only: no drops, renames, or modifications to existing columns.
-- Run against the same Supabase Postgres DB the mobile app uses.

-- 1. Extend sessions table
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS adjusted_hours numeric,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS letterhead_generated_at timestamptz;

-- 2. Volunteer feedback
CREATE TABLE IF NOT EXISTS public.volunteer_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  session_id uuid REFERENCES public.sessions ON DELETE SET NULL,
  source text NOT NULL CHECK (source IN ('session', 'account')),
  rating text CHECK (rating IN ('excited', 'happy', 'neutral', 'sad', 'very_sad')),
  comment text,
  flagged boolean DEFAULT false,
  submitted_at timestamptz DEFAULT now()
);

-- 3. Shop orders
CREATE TABLE IF NOT EXISTS public.shop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  items jsonb NOT NULL,
  total_cents int NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','shipped','delivered','cancelled')),
  shipping_address jsonb,
  tracking_number text,
  carrier text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Cleanup events
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location text,
  address text,
  lat numeric,
  lng numeric,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  what_to_bring text,
  organizer text,
  image_url text,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Court-ordered volunteer hours
CREATE TABLE IF NOT EXISTS public.court_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  required_hours numeric NOT NULL,
  due_date date,
  case_reference text,
  created_at timestamptz DEFAULT now()
);

-- 6. Admin audit log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  target_table text NOT NULL,
  target_id uuid,
  before_value jsonb,
  after_value jsonb,
  performed_at timestamptz DEFAULT now()
);

-- 7. RLS policies — admin role claim required
-- volunteer_feedback
ALTER TABLE public.volunteer_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_feedback" ON public.volunteer_feedback
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- shop_orders
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_orders" ON public.shop_orders
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- events (readable by all for mobile app; writable by admin only)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_published_events" ON public.events
  FOR SELECT USING (is_published = true);
CREATE POLICY "admin_full_access_events" ON public.events
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- court_orders
ALTER TABLE public.court_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_court_orders" ON public.court_orders
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- admin_audit_log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_audit_log" ON public.admin_audit_log
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
