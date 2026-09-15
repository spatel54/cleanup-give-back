-- Shippo label buy (admin Phase 2). Additive columns on shop_orders.
-- Apply in Supabase SQL Editor after 024_stripe_payment_details.sql.

ALTER TABLE public.shop_orders
  ADD COLUMN IF NOT EXISTS shippo_transaction_id text,
  ADD COLUMN IF NOT EXISTS shippo_rate_id text,
  ADD COLUMN IF NOT EXISTS label_url text,
  ADD COLUMN IF NOT EXISTS tracking_status text;

CREATE INDEX IF NOT EXISTS shop_orders_shippo_transaction_idx
  ON public.shop_orders (shippo_transaction_id)
  WHERE shippo_transaction_id IS NOT NULL;
