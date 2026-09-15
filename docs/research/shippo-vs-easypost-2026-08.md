# Shippo vs EasyPost — Admin brief (Phase 2 shipping)

**Date:** 2026-08-20  
**Audience:** Admin (operations) first; engineering second  
**Volume assumption:** ~20–100 packages/month (USPS-first, Admin packs)  
**Status:** Research only — **neither vendor is connected to the app yet**  
**Admin report (hand this over):** [2026-08-20-shippo-vs-easypost-admin.md](../reports/2026-08-20-shippo-vs-easypost-admin.md)  
**Related:** [shipping-integration-2026-08.md](shipping-integration-2026-08.md) (Phase 1 Pirate Ship is live), [order-fulfillment.md](../backend/specs/order-fulfillment.md), [order-emails.md](../backend/specs/order-emails.md)

Prices below were checked against vendor pages on **2026-08-20**. Postage and plan fees change — confirm on the linked pages before signing up.

---

## 0. What this is (and is not)

This is a handoff so Admin can decide **if/when** to leave Pirate Ship paste-tracking for an automated label tool.

**Today (Phase 1):** Volunteer places an order in the app → the order appears in admin → Admin buys a label on Pirate Ship → she pastes the tracking number → the volunteer gets a shipped email and a Track package button.

**Neither Shippo nor EasyPost “picks up” that order automatically.** They only run after we (a) create an account and (b) engineering wires them into admin or checkout. The volunteer never sees Shippo or EasyPost.

**Recommendation (unchanged from Phase 1):** Stay on Pirate Ship until paste tracking is the bottleneck. When you are ready to buy the label inside Clean Up Give Back’s admin, **use Shippo**, not EasyPost. Shippo has a website Admin can use *and* an API we can put behind a **Buy label** button. EasyPost is cheaper on paper at high volume, but it is built for developers, has a thinner packing UI, and (as of mid-2026) extra USPS fees to watch.

Do **not** auto-buy postage the moment a volunteer taps Place Order until Stripe is charging for real. Otherwise we would spend postage on unpaid orders.

---

## 1. Bottom line for Admin

| Question | Answer |
|----------|--------|
| Do I have to print a label? | **Yes, a barcode still has to go on the box.** Print at home (paper or 4×6 thermal) **or** show a USPS QR at the Post Office and they print it. |
| Does the volunteer’s phone talk to Shippo/EasyPost? | **No.** Checkout already saves the order. The shipping company only talks to our **admin / server**. |
| Will this replace packing? | **No.** You still pack, label, and drop off (or schedule a pickup). |
| Software cost at 20–100/month | Shippo API: about **$0–$5/month** plus postage. EasyPost Wallet: **$0 platform fee** in this volume band, **plus postage** (and possibly a **3% USPS postage fee** on their wallet path — confirm with EasyPost). |
| Hard volume cap? | **No** useful cap for us. Pirate Ship, Shippo, and EasyPost all handle far more than 100/month. The limit is your packing time, not the software. |
| What should I set up now? | Nothing required. Optional: create a **Shippo** account and fund billing so we can test later. Keep Pirate Ship for live orders until the button exists. |

---

## 2. How they work (plain English)

Think of Shippo and EasyPost as **postage stores with a computer interface**.

1. We send them: who it’s from (your office), who it’s to (the volunteer’s address), and box size/weight.  
2. They ask USPS (and others) for prices.  
3. We pick a service (usually USPS Ground Advantage or Priority).  
4. They charge **postage** (and sometimes a small software fee).  
5. They give us a **PDF/PNG label** and a **tracking number**.  
6. We save that tracking number on the same `shop_orders` row the volunteer already created.  
7. You print (or QR at USPS), stick the label on the kit, and hand the box to USPS.  
8. USPS scans the barcode. From then on, Shippo/EasyPost **push status updates** (accepted → in transit → delivered) to our server. We can show that in admin and, later, in Order History.

Pirate Ship does steps 1–5 in a website you operate by hand, and **cannot** do step 6 for us (no public API). That is why you paste tracking today.

---

## 3. Full path: volunteer taps Place Order → USPS has the box

### 3.1 What already happens (no Shippo/EasyPost)

```text
Volunteer (mobile app)
  Shop cart or tracker $59.99
       │
       ▼
  Checkout: USPS ship or office pickup
  (address only if USPS)
       │
       ▼
  Place Order
       │
       ├─► Supabase shop_orders  (status: pending, tracking empty)
       ├─► “Thank you for your order” email (Resend)
       └─► Purchase confirmation screen
```

Pickup orders stop here until you mark **Fulfilled**. They never need a label.

USPS ship orders wait in admin until **you** buy postage.

**Honest gap:** card fields are collected in the app, but **Stripe is not charging yet.** The order row is real; the money is not.

### 3.2 If we integrate Shippo (recommended Phase 2)

```text
Same as 3.1, then for USPS ship orders only:

Admin opens order in admin
       │
       ▼
  [Buy label]
       │
       ├─► Our server → Shippo: from-address, to-address, box
       ├─► Shippo returns USPS rates
       ├─► Admin (or a default) picks Ground Advantage / Priority
       ├─► Shippo charges postage + returns PDF + tracking #
       │
       ├─► We save carrier + tracking on shop_orders, status shipped
       ├─► “Your order is on its way” email (already built)
       └─► Volunteer Order History → Track package

Admin prints PDF or shows USPS Label Broker QR
       │
       ▼
  Stick label on kit → drop at Post Office / mailbox / scheduled pickup
       │
       ▼
  USPS first scan
       │
       ▼
  Shippo webhook → we update “in transit” / “delivered”
```

**Automatic paste tracking:** yes, **after** Buy label. The tracking number is in Shippo’s response. No typing.

**Not automatic:** packing, printing (unless QR at USPS), and dropping off.

### 3.3 If we integrate EasyPost (same volunteer path, different vendor)

Same diagram as 3.2, with EasyPost instead of Shippo:

- Create shipment → get rates → buy chosen rate → get `postage_label.label_url` + `tracking_code`.  
- Buying a label **automatically creates a Tracker**; webhooks fire on scans.  
- You still print or use a carrier QR where supported.

EasyPost’s own website (Nexus / dashboard) is weaker as a day-to-day packing tool than Shippo’s web app. If the API is down or we have not built Buy label yet, Admin would have a harder time shipping from EasyPost’s UI than from Shippo or Pirate Ship.

### 3.4 What the mobile app would change

| Screen | Today | After Shippo or EasyPost |
|--------|--------|---------------------------|
| Checkout / confirmation | Unchanged | Unchanged. Do **not** put vendor API keys in the Expo app. |
| Order History | Status + tracking after you paste | Same fields, filled automatically when the label is bought. Optional later: “In transit” / “Delivered” from webhooks instead of only “Shipped”. |
| Track package | Opens USPS/UPS website | Same, or a branded tracking page (Shippo Pro / EasyPost Advanced Tracking — extra cost, not needed at our volume). |

The volunteer never creates a Shippo or EasyPost account.

---

## 4. Costs (software + postage)

**Postage is the real bill** either way (typically USPS Ground Advantage or Priority for a kit). Software fees below are **on top of postage**.

### 4.1 Shippo

Two products, same company:

| Product | Who uses it | Software cost (2026-08-20) |
|---------|-------------|----------------------------|
| **Web app** ([shippo.com/pricing](https://www.shippo.com/pricing)) | Admin in a browser, like Pirate Ship | **Starter:** free, **up to 30 labels/month**, 1 login. **Pro:** **$17/mo** billed annually ($205/year) for **1–200 labels/month** (monthly billing is a bit higher; their help center also lists **$19/mo** for 31–200). Higher tiers as volume grows. |
| **API** ([goshippo.com/pricing/api](https://goshippo.com/pricing/api)) | Our admin **Buy label** button | **API Starter:** **$0/month**, **30 labels free**, then **7¢ per extra label**. Tracking for labels **bought through Shippo is included**. |

Standalone API extras (only if we use them without buying that label through Shippo):

| Extra | API Starter |
|-------|-------------|
| Track a number **not** bought on Shippo | **2¢** per track |
| Rate quote without buying | **1¢** |
| US address validation | **2¢** (USPS addresses on a shipment are validated as part of the label flow) |
| Non-US address validation | **8¢** |

Insurance (optional): domestic about **1.25%** of declared value + shipping; international **1.5%**. Not required for kits.

**Own carrier account** on the free web Starter plan: **5¢ extra per label**. Pro includes connecting your own USPS/UPS account at no per-label add-on.

### 4.2 EasyPost

Official page: [easypost.com/pricing](https://www.easypost.com/pricing/). Support: [Billing & Payments](https://support.easypost.com/hc/en-us/articles/360042414212-Billing-Payments).

| Plan | Monthly | Labels | Notes |
|------|---------|--------|--------|
| **Free Access (Wallet Carriers)** | **$0** | **3,000 free / month**, then **8¢/label** | Uses EasyPost’s USPS/UPS/etc. wallet. Postage prepaid from the wallet. This is the plan we would pick. |
| **BYOCA** (bring your own USPS account) | **$20/month** | **8¢ per label** from the first label (no 3,000 free on BYOCA per EasyPost billing docs) | Postage billed by USPS to your Enterprise Payment Account. Overkill for 20–100/month. |

Tracking **with a label you bought on EasyPost: free**. Standalone trackers (Pirate Ship numbers, etc.): about **3¢ USPS** / **2¢ other**.

Other EasyPost wallet gotchas:

| Item | Cost |
|------|------|
| Load wallet with **credit card** | **3.75%** convenience fee — use **ACH/bank** instead |
| Address verify not tied to a shipment | **2¢** domestic / **6¢** international |
| Extra rate shopping | **2¢** per shipment rated beyond 3× labels purchased |
| Insurance API | **1%** of value, **$1.00 minimum** |

**USPS 3% postage fee (verify):** Shippo published that EasyPost began charging **3% of USPS spend** on **PC Postage / wallet** customers on **June 1, 2026**. EasyPost’s public pricing page (fetched the same day as this brief) does **not** list that 3%. Treat it as **unconfirmed on EasyPost’s own pricing page**. Ask EasyPost in writing before choosing them. If it is real, 100 kits at ~$8 postage would add ~**$24/month** — more than Shippo’s entire software bill.

### 4.3 What we would actually pay at CUGB volume

Software only (postage extra). Assumes we **buy the label through the vendor** (tracking included). Pickup orders do not create labels.

| Labels / month | Shippo API Starter | Shippo App Pro (annual) | EasyPost Free Access* |
|----------------|--------------------|-------------------------|------------------------|
| 20 | **$0** (under 30 free) | ~$17 if you subscribe | **$0** |
| 30 | **$0** | ~$17 | **$0** |
| 50 | 20 × $0.07 = **$1.40** | ~$17 | **$0** |
| 100 | 70 × $0.07 = **$4.90** | ~$17 (covers 1–200) | **$0** (+ possible 3% of postage) |
| 200 | 170 × $0.07 = **$11.90** | ~$17 | **$0** |

\*Until 3,000 labels/month.

**Pirate Ship (today):** $0 software, postage only. Still the cheapest until paste tracking costs you more time than ~$5/month.

### 4.4 Volume ceilings

| Vendor | Software cap that would stop us |
|--------|----------------------------------|
| Pirate Ship | None. Credit-card **transaction** limits on big batch buys — they recommend **ACH**. |
| Shippo Starter web | Soft cap: **30 labels/month** then you pay or upgrade. Not a hard shutoff if you move to API/Pro. |
| Shippo API | No practical cap; 7¢ after 30. |
| EasyPost Free Access | 3,000 included; we would not get near it. |

People “outgrow” these tools when they need FedEx, warehouses, or multi-channel automation — not at 20–100 USPS kits.

---

## 5. Side-by-side (ops + product)

| | **Shippo** | **EasyPost** | **Pirate Ship (today)** |
|--|------------|--------------|-------------------------|
| Admin-friendly website | **Yes** — compare rates, print, tracking | Dashboard exists; packing UX is thinner | **Yes** — this is the product |
| Public API for our admin | **Yes** | **Yes** (their strength) | **No** |
| USPS discounts | Commercial / partner rates | Merchant Discount on wallet | Commercial Plus, no markup |
| Tracking on their labels | Included + webhooks | Included (auto Tracker) + webhooks | You copy the number |
| QR / print-at-Post-Office | USPS Label Broker QR ([docs](https://docs.goshippo.com/docs/Shipments/QRCode)) | Carrier-dependent; not the headline feature | Pirate Ship also supports USPS QR in their UI |
| Carriers | 40+ (we would use USPS) | 100+ (we would use USPS) | USPS + UPS only |
| Fit for CUGB | **Best Phase 2** | Better if we were API-only and shipping thousands | **Best until paste hurts** |

---

## 6. Setup instructions — Admin (operations)

Nothing here is required until we decide to leave Pirate Ship. If you want to be ready for a test, do **Shippo** only.

### 6.1 Decide before signing up

1. **Ship-from address** — one office/home address, hours 10am–5pm for pickup copy (already in the app). Still open from Phase 1.  
2. **Printer** — regular paper + tape is fine; a **4×6 thermal** (Dymo/Rollo) is faster if volume grows.  
3. **Who pays postage** — org card or ACH on the vendor wallet (not a personal card mixed with program money).  
4. **Do not turn off Pirate Ship** until Buy label is tested on a real kit.

### 6.2 Create a Shippo account (ops)

1. Sign up at [apps.goshippo.com/join](https://apps.goshippo.com/join) with an **org** email (for example `support@example.org`), not a personal Gmail if you can avoid it.  
2. Complete billing: add a bank **ACH** if offered (avoids card fees).  
3. Set **ship-from** to the Clean Up Give Back address you pack from.  
4. On the free Starter plan you can buy up to **30 labels/month** in their website — useful as a Pirate Ship alternative, but **paste tracking would still be required** until engineering connects the API.  
5. Send engineering: “Shippo account is open; please create **test** and **live** API keys.” Do **not** put keys in email/Slack long-term; they copy once from [portal.goshippo.com](https://portal.goshippo.com/api-config/api) into Fly/Vercel secrets.  
6. Optional: buy **one test label** in Shippo (test mode prints **SAMPLE – DO NOT MAIL**). Then buy **one live label** for a real order and confirm USPS accepts it.

### 6.3 Create an EasyPost account (only if we choose them)

1. Sign up at [app.easypost.com/signup](https://app.easypost.com/signup).  
2. Choose **Free Access (Wallet Carriers)** — not BYOCA — unless a USPS rep is setting up a direct account.  
3. **Fund the wallet with ACH**, not a credit card (card loads add 3.75%). USPS labels are prepaid when created.  
4. Enable **USPS** under Wallet carriers.  
5. Ask EasyPost support in writing: *“Do you charge a percentage fee on USPS postage for wallet/PC Postage customers in 2026? What is it?”* Save the reply.  
6. Hand test + production API keys to engineering the same way (dashboard → Account Settings → API Keys). Treat them like passwords.

### 6.4 Day-of shipping checklist (either vendor, once wired)

1. Admin → Orders → open the volunteer’s **Shipping** order (skip pickup).  
2. Confirm address looks right.  
3. Pack the kit; weigh it once so we can save a standard box (kit vs tote).  
4. **Buy label** (or buy in the vendor website).  
5. Print 4×6 or letter PDF, or open the QR at a participating Post Office ([USPS Label Broker](https://www.usps.com/ship/label-broker.htm)).  
6. Confirm the volunteer got the shipped email.  
7. Drop off. First USPS scan usually appears later the same day or next morning.

Office pickup: mark **Fulfilled**. No label, no shipped email.

---

## 7. Setup instructions — engineering

**Constraint:** API keys stay on the server (Fly `backend/sessions` and/or `admin-web-app`). Never `EXPO_PUBLIC_*`. Never commit keys.

**Do not auto-purchase on Place Order** until Stripe `checkout.session.completed` (or equivalent) exists.

### 7.1 Architecture (both vendors)

```text
Mobile checkout  ──insert──►  shop_orders (already)
                                    │
Admin “Buy label” ──►  Next.js server action or Fly route
                                    │
                         Shippo or EasyPost API
                                    │
                    tracking_number, carrier, label_url
                                    │
                         PATCH shop_orders
                         sendShopOrderEmail (already)
                                    │
Vendor webhook ──►  HTTPS endpoint on Fly
                         (track_updated / tracker.updated)
                         update status / tracking_status
```

Suggested env (names only; values in Fly/Vercel):

- `SHIPPO_API_TOKEN` or `EASYPOST_API_KEY`  
- `SHIPPO_WEBHOOK_SECRET` / EasyPost `webhook_secret`  
- `SHIP_FROM_*` (name, street, city, state, zip, phone)  
- Default parcel: kit and tote dimensions/weight once Admin measures them  

Webhook URL examples:

- `https://sessions.example.com/webhooks/shippo`  
- `https://sessions.example.com/webhooks/easypost`  

Admin-web-app on Vercel can buy the label (it already updates fulfillment). Webhooks should live on **Fly** (always-on POST, no cookie JWT). Verify signatures; return **2xx quickly** and process in the background.

Pickup / `office_pickup`: never call the vendor. `local_dropoff` is historical only.

### 7.2 Shippo API usage

Docs: [Authentication](https://docs.goshippo.com/docs/Guides_general/authentication), [First label](https://docs.goshippo.com/guides/generate-shipping-label), [Tracking](https://docs.goshippo.com/docs/Tracking/Tracking), [Webhooks](https://docs.goshippo.com/docs/Tracking/Webhooks), [QR](https://docs.goshippo.com/docs/Shipments/QRCode).

**Keys:** Test keys start with `shippo_test_`. Live keys `shippo_live_`. Header: `Authorization: ShippoToken <token>`. Live token creation may require Shippo’s API team review.

**Libraries:** `npm install shippo` (Node). Base URL `https://api.goshippo.com/`.

**Two-call buy (recommended so Admin can see rates):**

1. `POST /shipments/` with `address_from`, `address_to` (from `shop_orders.shipping_address`), `parcels[]` (`length`, `width`, `height` inches, `weight` lb), `async: false`.  
   Response includes `rates[]` (service, amount, estimated days).  
2. `POST /transactions/` with chosen `rate` object id.  
   Response includes `tracking_number`, `tracking_url_provider`, `label_url` (PDF).

**One-call buy** if we always want USPS Ground Advantage: create shipment with `servicelevel_token` in one transaction (see Shippo “single API call” section of the label guide).

**QR instead of home print:** set extra `qr_code_requested: true` on the transaction. Response may include `qr_code_url` (USPS domestic).

**Webhooks:** API Portal → Webhooks. Events: `transaction_created`, `track_updated`. Labels purchased through Shippo are tracked automatically. Endpoint must respond 2xx within ~3 seconds; they retry twice on 408/429/5xx.

**Test:** test labels are watermarked **SAMPLE – DO NOT MAIL**. US addresses validate on shipment create.

### 7.3 EasyPost API usage

Docs: [Getting started](https://docs.easypost.com/guides/getting-started), [Tracking](https://docs.easypost.com/guides/tracking-guide), [Webhooks](https://docs.easypost.com/guides/webhooks-guide), [USPS paths](https://learn.easypost.com/usps-integrations).

**Auth:** HTTP Basic, API key as username, **empty password**. TLS 1.2+. Test key vs Production key from the dashboard.

**Two-call buy:**

1. `POST https://api.easypost.com/v2/shipments` with nested `to_address`, `from_address`, `parcel` (weight in **ounces** in many examples — convert from lb).  
   Response: `rates[]`.  
2. `POST /v2/shipments/:id/buy` with `{ "rate": { "id": "rate_..." } }`.  
   Response: `tracking_code`, `postage_label.label_url`. A **Tracker is created automatically**.

**Webhooks:** Dashboard → Webhooks & Events, or `POST /v2/webhooks`. Prefer HMAC `webhook_secret` and `validate_webhook()`. Respond 2xx within **7 seconds**; they retry up to six times. Filter with `X-Easypost-Event-Type`.

**USPS path for us:** **PC Postage / Wallet**, not USPS Ship BYOCA (needs CRID, MID, EPA, NSA).

### 7.4 Suggested implementation order (when Admin says go)

1. Measure kit + tote box; hard-code two parcels.  
2. Shippo **test** key: Buy label on one staging order; store tracking; don’t email if test.  
3. Webhook `track_updated` → optional `tracking_status` column (or reuse status).  
4. Live key + one real USPS drop-off.  
5. Only then hide or keep Pirate Ship paste as fallback.

Skip EasyPost unless Shippo is blocked (account rejection, rate issues).

### 7.5 What not to build

- Putting Shippo/EasyPost in the Expo client  
- Registering Pirate Ship tracking as “external trackers” (paid per number, still paste)  
- Charging live carrier rates at checkout (shop already uses **25% of paid product subtotal**; tracker kit shipping is **FREE**)  
- Auto-buy on Place Order before Stripe  
- Shopify migration  

---

## 8. Open ops questions for Admin

1. Exact **ship-from** street address and phone for labels.  
2. Thermal 4×6 vs paper until volume grows.  
3. Stay on **Pirate Ship** until paste hurts, or start a **Shippo** account now for a dry run?  
4. When Stripe is live: still require **Buy label** click, or auto-buy USPS ship orders? (Recommend keep the click.)

---

## 9. Sources (fetched 2026-08-20)

- Shippo API pricing — [goshippo.com/pricing/api](https://goshippo.com/pricing/api)  
- Shippo App pricing — [shippo.com/pricing](https://www.shippo.com/pricing)  
- Shippo plan overview — [support.goshippo.com … Subscription Plan Overview](https://support.goshippo.com/hc/en-us/articles/360003855652-Shippo-Subscription-Plan-Overview)  
- Shippo first label, tracking, webhooks, QR — docs.goshippo.com  
- EasyPost pricing — [easypost.com/pricing](https://www.easypost.com/pricing/)  
- EasyPost billing — [support.easypost.com Billing & Payments](https://support.easypost.com/hc/en-us/articles/360042414212-Billing-Payments)  
- EasyPost USPS PC Postage vs USPS Ship — [learn.easypost.com/usps-integrations](https://learn.easypost.com/usps-integrations)  
- Reported EasyPost 3% USPS fee — [Shippo blog](https://goshippo.com/blog/what-easyposts-new-3-fee-means-for-your-usps-shipping-costs) (competitor source; confirm with EasyPost)  
- USPS Label Broker — [usps.com/ship/label-broker.htm](https://www.usps.com/ship/label-broker.htm)  
- CUGB ground truth — `frontend/src/lib/shopOrders.ts`, `CheckoutScreen.tsx`, `admin-web-app` fulfillment, [order-fulfillment.md](../backend/specs/order-fulfillment.md)

---

## Bottom line

**Keep Pirate Ship** for live kits. **Shippo** is the right next vendor when you want the tracking number to land in admin without paste: about **$0–$5/month** software at our volume, a website you can use, and an API we can put behind Buy label. **EasyPost** is a strong developer API with 3,000 “free” labels, but you would still pack and print, the packing website is weaker, and USPS wallet fees need a written confirmation.

The volunteer app already does its job at Place Order. Shipping automation is an **admin + server** project, not a mobile-app project.
