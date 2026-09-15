# Spec: Order fulfillment (pickup vs USPS ship)

**Date:** 2026-08-15  
**Status:** Implemented (Phase 1 pickup/USPS + Phase 2 Shippo Buy label)  
**Related:** [shipping-integration-2026-08.md](../../research/shipping-integration-2026-08.md), [order-emails.md](order-emails.md)

## Summary

Volunteers choose **how they'll receive an order** in mobile checkout: **USPS ship** or **office pickup**. Local drop-off was removed from the mobile UI (2026-08-18); `local_dropoff` remains a stored `fulfillment_method` for historical/admin orders. Tracker access is **$59.99** and always includes the cleanup kit (USPS shipping **FREE**). Shop USPS shipping is **25% of paid product-item subtotal** (standalone kit **$49.99** counts; free tracker kit at $0 is ignored). Admin buys USPS labels via **Shippo** on the admin order page (or pastes tracking). Pickup orders are marked **Fulfilled** with no tracking email.

Mobile checkout labels this **How you'll receive it**; admin shows **Pickup** vs **Shipping** sections.

## User stories

- As a volunteer, I want to pick up locally or have Admin ship via USPS, so I am not forced to mail every order.
- As a volunteer buying tracker access, I want the cleanup kit included at $59.99 with free shipping.
- As Admin, I want to see fulfillment type and kit requested on each order, so I know whether to print a label or coordinate a handoff.

## Data model

Migration [`admin/db/022_order_fulfillment.sql`](../../../admin/db/022_order_fulfillment.sql):

| Column | Values |
|--------|--------|
| `fulfillment_method` | `usps_ship` (default) · `office_pickup` · `local_dropoff` |
| `includes_kit` | boolean, default `true` |
| `status` | existing + `fulfilled` (pickup complete) |

`shipping_address` is `null` when fulfillment is office pickup. For local drop-off it stores the volunteer’s drop-off address.

## Acceptance criteria

- [x] **AC-1:** Mobile checkout (shop + tracker) offers USPS ship / office pickup only. Address fields are required only for USPS ship. Office pickup shows the Clean Up Give Back address + **Hours: 10am–5pm**; tapping opens Maps; copy uses the org name (not Admin). `local_dropoff` remains a valid stored value for historical/admin orders but is not offered in `CheckoutScreen`.
- [x] **AC-2:** Tracker checkout persists a `shop_orders` row and fires order-placed email. Total **$59.99**. Kit always included (`includes_kit` true, kit line $0). USPS shipping FREE.
- [x] **AC-3:** Admin order detail shows fulfillment method and kit requested. Copy-address + carrier/tracking only for USPS ship.
- [x] **AC-4:** Admin marks ship orders **Shipped** (USPS tracking required) and pickup orders **Fulfilled**. Shipped email fires only on first `shipped` transition when `fulfillment_method = usps_ship`.
- [x] **AC-5:** Order History reads live `shop_orders`. **Track package** appears only for USPS ship with a tracking URL.

## Out of scope

- Live carrier-rate shopping at checkout (shop USPS uses **25% of paid product subtotal**; tracker bundle is FREE)
- FedEx/UPS as offered carriers
- Multi-chapter fulfillment
- Separate prices for pickup vs ship
- Ready-for-pickup email (Admin coordinates in person)

Shippo admin Buy label: [shippo-labels.md](shippo-labels.md).

## Test plan

1. Shop checkout → USPS ship → address required → admin copy-address works.
2. Shop checkout → office pickup → no address → admin Fulfilled, no shipped email.
3. Tracker checkout → kit off → `includes_kit = false`.
4. Tracker checkout writes `shop_orders` and sends order-placed when API+Resend are configured.
5. Admin ship + USPS tracking → shipped email once.
6. Order History shows live rows; track link only on shipped USPS orders.
