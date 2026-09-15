# Context: shipping (Shippo)

USPS labels for shop orders. The volunteer app never calls Shippo.

## Purpose

Admin buys a printable USPS label from admin order detail after Stripe marks the order **paid**. Tracking and `label_url` land on `shop_orders`. After a buy, **Download label PDF** is a primary button, **Go to Shippo** is tertiary, and carrier `tracking_status` is a quiet heading tag (Unknown displays as **Pending**). Pickup orders skip Shippo. Checkout pricing is unchanged (25% of paid products; tracker kit FREE).

## API surface

| Method | Path | Auth |
|--------|------|------|
| POST | `/shipping/rates` | `X-Admin-Key` |
| POST | `/shipping/buy-label` | `X-Admin-Key` |
| POST | `/webhooks/shippo` | `SHIPPO_WEBHOOK_SECRET` query token |

## Data model

`admin/db/028_shippo_labels.sql` — `shippo_transaction_id`, `shippo_rate_id`, `label_url`, `tracking_status`.

## Integrations

- Shippo REST (`api.goshippo.com`) from Fly `backend/sessions`
- Admin proxy uses `SESSIONS_API_URL` + `ADMIN_API_KEY` (same as letterhead)

## Policies

- Token never in Expo / git.
- Buy only for `usps_ship` + `paid` + no existing transaction.
- Do not auto-mark shipped (Resend shipped email stays on the admin's Save).
- Test token → SAMPLE labels; do not mail.
- No Pirate Ship account.
- Carton for rate quotes and labels: **16×5×2 in @ 1 lb** (`backend/sessions/src/lib/parcels.ts`). Same box for kit, tote, and default.

## Related

- Spec: [shippo-labels.md](../specs/shippo-labels.md)
- Code: `backend/sessions/src/routes/shipping.ts`, `backend/sessions/src/lib/parcels.ts`, `admin-web-app/src/app/orders/[id]/OrderShippoLabelForm.tsx`
