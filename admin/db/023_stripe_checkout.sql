-- Stripe Checkout — payment reference + volunteer read access for order history.
-- Apply in Supabase SQL Editor. Writes remain server-side (sessions API + DATABASE_URL).

ALTER TABLE public.shop_orders
  ADD COLUMN IF NOT EXISTS payment_reference text;

CREATE INDEX IF NOT EXISTS shop_orders_payment_reference_idx
  ON public.shop_orders (payment_reference)
  WHERE payment_reference IS NOT NULL;

-- Volunteers may read their own orders (order history); inserts/updates via API only.
DROP POLICY IF EXISTS "volunteer_read_own_orders" ON public.shop_orders;
CREATE POLICY "volunteer_read_own_orders" ON public.shop_orders
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "volunteer_read_own_donations" ON public.donations;
CREATE POLICY "volunteer_read_own_donations" ON public.donations
  FOR SELECT
  USING (auth.uid() = user_id);
