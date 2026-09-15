-- Pickup vs USPS ship fulfillment (Admin Phase 1).
-- Additive: fulfillment_method + includes_kit, plus `fulfilled` status
-- for office pickup / local drop-off completion (no tracking).

ALTER TABLE public.shop_orders
  ADD COLUMN IF NOT EXISTS fulfillment_method text NOT NULL DEFAULT 'usps_ship',
  ADD COLUMN IF NOT EXISTS includes_kit boolean NOT NULL DEFAULT true;

ALTER TABLE public.shop_orders
  DROP CONSTRAINT IF EXISTS shop_orders_fulfillment_method_check;

ALTER TABLE public.shop_orders
  ADD CONSTRAINT shop_orders_fulfillment_method_check
  CHECK (fulfillment_method IN ('usps_ship', 'office_pickup', 'local_dropoff'));

ALTER TABLE public.shop_orders
  DROP CONSTRAINT IF EXISTS shop_orders_status_check;

ALTER TABLE public.shop_orders
  ADD CONSTRAINT shop_orders_status_check
  CHECK (status IN ('pending', 'paid', 'shipped', 'fulfilled', 'delivered', 'cancelled'));
