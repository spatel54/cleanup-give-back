# Backend spec: Shippo admin labels

**Date:** 2026-08-26  
**Status:** Implemented (test API token; live postage off until `shippo_live_`)  
**Related:** [order-fulfillment.md](order-fulfillment.md), [shippo-vs-easypost-2026-08.md](../../research/shippo-vs-easypost-2026-08.md)

## Summary

Admin buys a USPS label from admin order detail. Fly holds `SHIPPO_API_TOKEN` and calls Shippo. The Expo app never talks to Shippo. Checkout still charges shop USPS as **25% of paid product subtotal** (tracker kit FREE). Pickup / `office_pickup` never calls Shippo. Paste tracking stays as fallback. There is no Pirate Ship account.

Label purchase runs only for **paid** `usps_ship` orders. Status stays `paid` until Admin marks **Shipped** (that still sends the shipped email).

## API contract

Base URL: `https://sessions.example.com`. Auth: `X-Admin-Key` (same as service-letter).

### `POST /shipping/rates`

**Body:** `{ "orderId": "<uuid>" }`

**Response:** `{ testMode, parcel, rates: [{ id, amount, currency, service, estimatedDays }] }`

USPS rates only. Uses order `shipping_address` + the admin's carton **16×5×2 in @ 1 lb** (kit, tote, and default).

### `POST /shipping/buy-label`

**Body:** `{ "orderId": "<uuid>", "rateId": "<shippo rate object_id>" }`

**Response:** `{ trackingNumber, carrier, labelUrl, transactionId, trackingStatus }`

Persists on `shop_orders`. Does not mark shipped.

### `POST /webhooks/shippo`

Shippo → Fly. Query `?token=` must match `SHIPPO_WEBHOOK_SECRET`. Events: `track_updated` (updates `tracking_status`; `DELIVERED` sets status `delivered` when already `shipped`). Return 2xx quickly.

## Data model

Migration [`admin/db/028_shippo_labels.sql`](../../../admin/db/028_shippo_labels.sql):

| Column | Purpose |
|--------|---------|
| `shippo_transaction_id` | Shippo transaction object id |
| `label_url` | Printable PDF/PNG |
| `shippo_rate_id` | Rate used for the buy |
| `tracking_status` | Carrier status from Shippo at buy + webhooks (`UNKNOWN`/`PENDING`, `PRE_TRANSIT`, `TRANSIT`, `DELIVERED`, …). Admin copy shows **Pending** instead of Unknown. |

Existing `tracking_number` / `carrier` still used by Order History and shipped email.

## Env (Fly)

| Variable | Required |
|----------|----------|
| `SHIPPO_API_TOKEN` | Yes (`shippo_test_…` first) |
| `SHIP_FROM_PHONE` | Yes (carrier requirement) |
| `SHIPPO_WEBHOOK_SECRET` | For webhooks only |
| `SHIP_FROM_NAME` / `STREET1` / `CITY` / `STATE` / `ZIP` | Optional; defaults to 600 East Algonquin Road, Des Plaines, IL 60016 |
| `SHIP_PARCEL_{KIT,TOTE,DEFAULT}_{L,W,H,LB}` | Optional; defaults **16 × 5 × 2 in @ 1 lb** |
| `ADMIN_API_KEY` | Yes (admin proxy) |

Admin-web-app needs `SESSIONS_API_URL` + `ADMIN_API_KEY` (same as letterhead).

## Acceptance criteria

- [x] **AC-1:** Volunteer JWT cannot buy labels; `X-Admin-Key` required on rates/buy.
- [x] **AC-2:** `office_pickup` / `local_dropoff` return 400; no Shippo call.
- [x] **AC-3:** Buy requires `status = paid` and a ship-to address. Pending / unpaid is rejected.
- [x] **AC-4:** Second buy on an order that already has `shippo_transaction_id` is rejected (no double postage).
- [x] **AC-5:** Success stores tracking + `label_url`; status remains `paid`.
- [x] **AC-6:** Admin order page shows Get rates → pick USPS → Buy label → **Download label PDF** (primary) and **Go to Shippo** (tertiary). Carrier tracking status is a quiet heading tag, not a competing CTA. Paste tracking remains.
- [x] **AC-7:** Token never in Expo / `EXPO_PUBLIC_*`.
- [ ] **AC-8:** Live USPS drop-off with `shippo_live_…` (ops; after test SAMPLE labels).
- [ ] **AC-9:** Webhook URL registered in Shippo portal (ops).

## Security & privacy

- Keys on Fly only.
- Webhook rejected unless `SHIPPO_WEBHOOK_SECRET` matches.
- Test labels are watermarked SAMPLE — do not mail.

## Test plan

1. Apply `028_shippo_labels.sql` in Supabase SQL Editor.
2. Fly: `SHIPPO_API_TOKEN` (test) + `SHIP_FROM_PHONE` + `ADMIN_API_KEY`. Redeploy.
3. Admin `.env.local` / Vercel: `SESSIONS_API_URL` + `ADMIN_API_KEY`.
4. Paid USPS test order → Get rates → Buy label → SAMPLE PDF downloads.
5. Pickup order: Buy label hidden / API 400.
6. Mark Shipped still sends Resend shipped email.
