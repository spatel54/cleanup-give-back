# Context: payments

Shop checkout and donation processing.

## Purpose

Handles cart checkout, order history, tracker unlock ($59.99 access + included kit, FREE shipping), and donation flows. Mobile checkout records `fulfillment_method` (`usps_ship` / `office_pickup`) and `includes_kit`; `local_dropoff` remains a stored enum for historical/admin orders. Shop USPS shipping is **25% of paid product-item subtotal** (standalone kit $49.99 is included; the free tracker kit at $0 is ignored).

## Status (2026-08-23)

- **Stripe Checkout (test mode)** — shop + standalone donate on `backend/sessions` (`POST /payments/shop-checkout`, `/payments/donate-checkout`, `POST /webhooks/stripe`). Mobile opens hosted Checkout in `expo-web-browser` (Expo Go compatible). Apply `admin/db/024_stripe_payment_details.sql` for payment method labels. Spec: [stripe-checkout.md](../specs/stripe-checkout.md).
- **Tracker $59.99** — still mock (`markTrackerPaid` + client `createShopOrder`); IAP deferred.
- Admin `/payments` reads `shop_orders` (paid+ only for revenue) / `donations` (`succeeded`).
- Order-placed email fires from webhook after shop payment (not from client before pay).

## Integrations

- **Stripe** — `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` on Fly; publishable key in `frontend/.env` only. See [accounts-and-access.md](../../accounts-and-access.md).
- Resend — order-placed (webhook) and order-shipped (admin fulfillment). Spec: [order-emails.md](../specs/order-emails.md)
- **Shippo** — admin Buy label on Fly (`POST /shipping/rates`, `/shipping/buy-label`). Checkout still uses 25% shop shipping / tracker FREE. Paste tracking remains. Spec: [shippo-labels.md](../specs/shippo-labels.md).

## Code

- `backend/sessions/src/routes/payments.ts` — Checkout Session + webhook (v1 runtime)
- `backend/sessions/src/lib/shop-catalog.ts` — server-side repricing
- `backend/payments/` — placeholder; v1 lives on sessions API
- Mobile: `CheckoutScreen`, `DonateScreen`, `frontend/src/lib/paymentsApi.ts`

## Policies

- Webhook is source of truth for `paid` / `succeeded` — not client redirect alone.
- Never store PAN; card entry is Stripe-hosted only for shop/donate.
