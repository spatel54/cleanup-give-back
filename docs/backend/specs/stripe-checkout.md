# Backend spec: Stripe Checkout (shop + donate)

**Date:** 2026-08-23  
**Status:** Implemented on `backend/sessions` (`sessions.example.com`)

## Summary

Volunteer JWT endpoints create Stripe Checkout Sessions for shop cart and standalone donate flows. Pending rows are inserted server-side; `checkout.session.completed` webhooks mark them paid/succeeded and trigger order-placed email for shop.

Tracker checkout (`mode=tracker`) is **out of scope** — remains client mock.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/payments/shop-checkout` | Bearer JWT | Insert `pending` `shop_orders` row; return Checkout Session URL |
| POST | `/payments/donate-checkout` | Bearer JWT | Insert `pending` `donations` row; return Checkout Session URL |
| POST | `/webhooks/stripe` | Stripe signature | Idempotent payment completion |

## Shop checkout body

```json
{
  "items": [{ "id": "cleanup-kit", "quantity": 1 }],
  "donationCents": 500,
  "fulfillmentMethod": "usps_ship",
  "shipping": { "fullName": "...", "street": "...", "city": "...", "state": "...", "zip": "..." },
  "successUrl": "exp://…/--/purchase-confirmation",
  "cancelUrl": "exp://…/--/checkout"
}
```

- Server reprices from catalog (ignores client `unitPrice`).
- Accepts shop-grid ids `1`–`4` mapped to catalog slugs.
- Shipping: 25% of paid product subtotal when `usps_ship`; $0 for pickup.
- Tax: **565 cents** ($5.65) when at least one product line (matches mobile mock).
- Cart donation folded into Stripe line item + `shop_orders.items` donation row.

## Donate checkout body

```json
{
  "amountCents": 1000,
  "successUrl": "exp://…/--/purchase-confirmation?mode=donation",
  "cancelUrl": "exp://…/--/donate"
}
```

- `amountCents` min 100, max 1_000_000.
- Insert with `status: pending`.

## Webhook

- Event: `checkout.session.completed`
- Metadata `kind`: `shop` | `donation`
- Retrieve expanded session (`payment_intent.payment_method`) to format `payment_method_label` (e.g. `Visa •••• 4242`; fallback `Card (Stripe Checkout)`)
- Shop: `pending` → `paid`, set `payment_reference` = session id, `stripe_payment_intent_id`, `payment_method_label`
- Donation: `pending` → `succeeded`, same payment fields
- Shop: send order-placed email with `paymentMethod` (same HTML as `POST /emails/order-placed`)

## Migration

Apply [`admin/db/024_stripe_payment_details.sql`](../../../admin/db/024_stripe_payment_details.sql) after `023` — adds `payment_method_label` and `stripe_payment_intent_id` on `shop_orders` and `donations`.

## Env

| Variable | Where |
|----------|-------|
| `STRIPE_SECRET_KEY` | Fly + local `backend/sessions/.env` |
| `STRIPE_WEBHOOK_SECRET` | Fly (after Dashboard webhook) |

## Acceptance criteria

- [x] AC-1: Shop checkout creates pending order + Stripe Session; no client Supabase insert for shop
- [x] AC-2: Donate checkout creates pending donation + Stripe Session
- [x] AC-3: Webhook verifies signature; idempotent status updates
- [x] AC-4: Order-placed email sent from webhook on shop success
- [x] AC-5: Unknown product ids rejected with 400
- [x] AC-6: Webhook persists `payment_method_label` + `stripe_payment_intent_id`; order-placed email shows real payment method when available

## Test plan

1. `POST /payments/shop-checkout` with JWT → `{ url, orderId, sessionId }`
2. Pay with `4242…` in Stripe Checkout → webhook marks `paid`
3. Admin Payments counts shop revenue only for paid+ statuses
4. Donate flow → `donations.status = succeeded`
