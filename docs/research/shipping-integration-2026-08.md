# Shipping & tracking — research brief for Admin

**Date:** 2026-08-04  
**Audience:** Admin (operations) + engineering  
**Volume assumption:** ~20–100 packages/month  
**Status:** Phase 1 (Pirate Ship + paste tracking) is implemented. Phase 2 (Shippo) is **not** built. Deep dive for Admin: [shippo-vs-easypost-2026-08.md](shippo-vs-easypost-2026-08.md).

---

## 1. Executive summary

Volunteers who order kits and gear need a **tracking number**, an **email when the package ships**, and a way to **see that status in the app**. You need the same information on the admin side for each order/user.

**Recommendation:** Start with a **manual hybrid** — buy discounted labels on [Pirate Ship](https://www.pirateship.com/) (free software; you pay postage), paste carrier + tracking into the admin order page we already have, then automatically email the volunteer via **Resend** and show tracking in Order History. When pasting labels becomes painful at volume, move to **Shippo** so labels and live tracking updates happen inside our admin console.

Do **not** rebuild the shop on Shopify for shipping, wire three separate carrier APIs (USPS/UPS/FedEx) for MVP, or add a tracking-only vendor (AfterShip) if we will buy labels through Shippo anyway. Keep **Stripe for payments only** when that ships.

---

## 2. What we need

| Who | Need |
|-----|------|
| Volunteer | Tracking ID when shipped; email with link; in-app “track this package” |
| Admin | Per-order address, carrier, tracking #, status; path to print/buy labels |
| Org | Fit ~20–100 pkgs/month without heavy software fees or warehouse tooling |

---

## 3. What we already built

Shipping is not starting from zero.

| Piece | Today |
|-------|--------|
| Orders database | Supabase `shop_orders` already stores `shipping_address`, `tracking_number`, `carrier`, and statuses including `shipped` |
| Admin | Orders list + order detail; fulfillment form lets you set status, carrier (USPS / UPS / FedEx), and tracking number |
| Mobile | Checkout collects a shipping address and can create an order row; Order History is not yet fully wired to live tracking |
| Email | Resend sends Figma order-placed (checkout) and order-shipped (admin fulfillment) emails — see [order-emails.md](../backend/specs/order-emails.md) |
| Payments | Stripe not wired yet; ops shipping UX can land before or alongside payment |

**Gaps:** buying postage, auto-email on ship, and volunteer-facing track link/status.

---

## 4. Options compared

| Option | Labels? | Live track? | Fit for CUGB | Notes |
|--------|---------|-------------|--------------|-------|
| **Manual + Pirate Ship** | Yes (in Pirate Ship website) | Tracking # + carrier website link | **Best Phase 1** | No public API — paste into our admin. Free tool; pay postage only. |
| **Shippo** | Yes (API + web app) | Yes (webhooks; free on labels bought via Shippo) | **Best Phase 2** | Admin-friendly UI *and* developer API. Free / low-cost at our volume. |
| **EasyPost** | Yes (API-first) | Yes | Strong later | Excellent API; thinner ops UI — you work mostly through *our* admin. |
| **Native USPS / UPS / FedEx APIs** | Yes | Per carrier | Poor for MVP | High setup (accounts, OAuth, separate schemas); wrong cost/effort now. |
| **Tracking-only (AfterShip, etc.)** | No | Yes (if numbers pasted elsewhere) | Usually skip | Extra vendor after postage; Shippo already covers tracking for its labels. |
| **Shopify** | Yes (Shopify Shipping) | Yes | Overkill | We already own Expo shop + admin + volunteers/sessions. Don’t move the catalog there just for labels. |

**Pirate Ship vs Shippo:** Pirate Ship is ideal for *buying cheap labels by hand*. It [does not offer a public API](https://support.pirateship.com/en/articles/2309246-does-pirate-ship-have-an-api). Shippo is the path when we want “Buy label” inside the Clean Up Give Back admin.

---

## 5. Recommended path

### Phase 1 — Manual hybrid (about 1–2 weeks of eng)

1. Volunteer places order (address already stored on `shop_orders`).
2. Admin copies the address from admin order detail, buys a USPS/UPS label on **Pirate Ship**, packs the kit.
3. Admin enters **carrier + tracking number**, marks order **Shipped**.
4. App sends a **Resend** email: “Your order shipped” with tracking ID and a link to the carrier tracker.
5. Mobile Order History shows status, carrier, tracking #, and a **Track package** button (opens the carrier site).

No new shipping vendor account required beyond Pirate Ship (and we already use Resend).

### Phase 2 — Shippo automation (when paste volume hurts)

1. Admin “Buy label” for an order: Shippo rates → pick service → purchase → store tracking (+ optional label PDF).
2. Shippo **webhooks** update shipping status (e.g. pre-transit → in transit → delivered).
3. Optional: richer in-app status text; still one branded Resend notification when first marked shipped.

**Rough timeline after Phase 1 ships:** add Shippo when weekly label typing becomes the bottleneck (often after a month or two at 20–100/mo).

### Explicitly out of Phase 1

- Charging real shipping rates at checkout (shop still shows free shipping).
- Returns, international duties, inventory SKU system.
- Moving shop to Shopify.

---

## 6. Cost & ops notes (~20–100 packages/month)

*Verify prices on vendor pages before signing up; they change — figures below are current as of research date.*

### Recommended path (Phase 1 → Phase 2)

| Item | Rough cost | Notes |
|------|------------|-------|
| **Pirate Ship** | $0 software; postage only | No API, so this is a Phase 1 (manual) tool only |
| **Shippo App** (web UI) | Free up to ~30 labels/mo; Pro roughly **$17–19/mo** covers ~1–200 labels | Postage extra |
| **Shippo API Starter** | **30 free labels/mo**, then about **7¢ per label** | [API pricing](https://goshippo.com/pricing/api) |
| **Shippo tracking** | Included for labels bought through Shippo; ~**$0.01** per external tracking number if registered for live updates | |
| **Resend** | Already configured — shipping mail is templates + triggers, not a new vendor | $0 incremental |
| **Postage** | Main ongoing cost either way | Kits/totes → typically USPS Priority / Ground Advantage–class range |

At 20–100 packages/month, Phase 1 (Pirate Ship + manual paste) stays cheapest — effectively $0 software cost. Phase 2 Shippo fees stay small relative to postage: at 100 labels/mo that's ~30 free + 70 × $0.07 ≈ **$5/mo** on the API Starter tier, or a flat **$17–19/mo** on the App Pro tier if Admin wants the hosted UI instead of us building one.

### Costs for the other options considered (why they lost)

| Option | Cost | Why it's not the pick |
|--------|------|------------------------|
| **EasyPost API** | First 3,000 labels/mo free on the Free Access wallet plan, then **~$0.08/label**; BYOCA plan adds a flat **$20/mo**; standalone trackers ~$0.02–0.03 each; a new 3% fee on USPS postage spend applies from 2026 ([pricing](https://www.easypost.com/pricing/), [3% fee](https://goshippo.com/blog/what-easyposts-new-3-fee-means-for-your-usps-shipping-costs)) | Comparable or pricier than Shippo at our volume, and its strength (API-first, thin UI) matters less than Shippo's Admin-friendly web app |
| **AfterShip** | Free plan caps at 50 shipments/mo; Essentials **$11/mo** for 100 shipments; Premium **$70/mo** for 500 ([pricing](https://checkthat.ai/brands/aftership/pricing)) | Tracking-only — still need a separate label vendor, so it's an extra subscription on top of Pirate Ship/Shippo rather than a replacement |
| **Shopify Shipping** | Requires a paid Shopify plan — Basic **$39/mo** ($29/mo billed annually) minimum, plus 2.9% + 30¢ per transaction if using Shopify Payments ([pricing](https://sherocommerce.com/blogs/insights/shopify-pricing)) | Would mean paying monthly for a whole storefront platform just to get label/rate tooling, on top of migrating the existing Expo shop + admin |
| **USPS Web Tools / native API** | Free to use, but limited/rate-capped capabilities and its own OAuth + account setup | Free, but the eng cost of building and maintaining a direct carrier integration (vs. Shippo's unified API) isn't worth it at 20–100 pkgs/mo |
| **UPS Developer Kit** | Free to license, no documented hidden fees ([UPS Developer Kit FAQ](https://www.ups.com/us/en/support/developer-tools/faq.page)) | Same issue as USPS — free per-carrier access still means building/maintaining a bespoke integration instead of one multi-carrier API |

**Takeaway:** every alternative either (a) costs as much or more than Shippo at our volume, or (b) is "free" only in the licensing sense while pushing real cost into engineering time to integrate and maintain a single-carrier API. Shippo is the only option that's both cheap at 20–100 pkgs/mo *and* multi-carrier out of the box.

**Ops tip:** One fixed ship-from address (home/warehouse) and standard box sizes for kit vs tote make both Pirate Ship and Shippo much faster.

---

## 7. What everyone sees (target experience)

**Volunteer**

1. Place order → confirmation with order ID.  
2. Email when Admin marks shipped (tracking ID + link).  
3. Order History: status, carrier, tracking #, tap to track.

**Admin**

1. Orders list → open order → see who ordered what and the ship-to address.  
2. Phase 1: paste carrier + tracking after Pirate Ship.  
3. Phase 2: buy label in-admin; see live status updates.  
4. Same data available when reviewing a specific volunteer (via their shop orders).

---

## 8. Admin decisions (2026-08-14)

Answered in ops conversation; Phase 1 implemented per [order-fulfillment.md](../backend/specs/order-fulfillment.md).

1. **Fulfillment** — pickup at the office, local drop-off, or USPS ship. Same price.
2. **Kit** — optional; the $49.99 charge is app access, not the kit.
3. **Carriers** — USPS-first, manual Pirate Ship labels. No FedEx/fulfillment warehouse.
4. **Who packs** — Admin. Multi-chapter fulfillment is not practical.
5. **Automation** — stay on Pirate Ship until paste volume hurts (Phase 2 Shippo).
6. **Shipping cost** — keep shipping free at checkout for now.

Still open (ops, not blockers): exact ship-from address, thermal vs paper labels.

---

## 9. Sources

- Pirate Ship — [Does Pirate Ship have an API?](https://support.pirateship.com/en/articles/2309246-does-pirate-ship-have-an-api) (no public API)
- Shippo — [API pricing](https://goshippo.com/pricing/api), [App pricing](https://www.shippo.com/pricing), [Tracking](https://docs.goshippo.com/docs/Tracking/Tracking), [Webhooks](https://docs.goshippo.com/docs/Tracking/Webhooks)
- EasyPost — [Pricing](https://www.easypost.com/pricing/), [3% USPS spend fee (2026)](https://goshippo.com/blog/what-easyposts-new-3-fee-means-for-your-usps-shipping-costs)
- AfterShip — [Pricing 2026](https://checkthat.ai/brands/aftership/pricing)
- Shopify — [Pricing plans 2026](https://sherocommerce.com/blogs/insights/shopify-pricing)
- UPS Developer Kit — [FAQ](https://www.ups.com/us/en/support/developer-tools/faq.page)
- Internal ground truth — `shop_orders` schema (`admin/db/001_admin_portal_migration.sql`), admin order fulfillment UI (`admin-web-app`), Resend status (`docs/backend/context/payments.md`)

---

## Bottom line for Admin

**Start simple:** Pirate Ship for labels, our existing Orders screen for tracking entry, Resend for email, app Order History for volunteers. **Graduate to Shippo** when you’re ready to buy labels and get live package updates without leaving Clean Up Give Back’s admin. That path matches how we already store orders and keeps software cost low at 20–100 shipments a month.
