-- Stripe payment details — method label + PaymentIntent id for admin, emails, and mobile history.
-- Apply in Supabase SQL Editor after 023_stripe_checkout.sql.

ALTER TABLE public.shop_orders
  ADD COLUMN IF NOT EXISTS payment_method_label text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS payment_method_label text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

CREATE INDEX IF NOT EXISTS shop_orders_stripe_payment_intent_idx
  ON public.shop_orders (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS donations_stripe_payment_intent_idx
  ON public.donations (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
