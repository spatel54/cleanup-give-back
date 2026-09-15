# Backend spec: order emails

**Date:** 2026-08-13  
**Status:** Implemented. `/email/*` assets are live on Vercel (`example-admin-web`, 2026-08-12). Apply [`admin/db/020_order_emails_figma.sql`](../../../admin/db/020_order_emails_figma.sql) on Supabase; Fly redeploy `backend/sessions` for production `POST /emails/order-placed`.  
**Design:** [Figma Order Shipped `1311:359`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1311-359)

Keep HTML in sync: `admin-web-app/src/lib/order-email-html.ts` ↔ `backend/sessions/src/lib/order-email-html.ts`.

## Summary

Two transactional emails share one 600px table layout from Figma. HTML is **code-owned** (`buildOrderEmailHtml`) — the Emails-tab sanitizer strips tables/images. DB rows store **subject** only (body is a stub).

| Variant | Trigger | `email_templates.template_type` | Subject |
|---------|---------|----------------------------------|---------|
| **placed** | Mobile checkout after a successful `shop_orders` insert → Fly `POST /emails/order-placed` | `order_placed` | Thank you for your order! |
| **shipped** | Admin first transition into `shipped` → `sendShopOrderEmail` | `shipped` | Your order is on its way! |

Both variants use the green-banner headline **Your order is on its way!** Placed keeps the thank-you subject and greeting. Shipped **Track Order** appears only when carrier + tracking yield a URL.

Not editable in `/emails` → Templates. Sage footer is a full-width `#bdcaba` **row in the same outer table** as the cream card (`width/min-width: 100%`, `height: 100%` so leftover preview height is sage). Not a sibling table — Gmail hides a trailing signature table behind “…”. Hidden order-number token so threaded sends stay unique.

## Layout and type

Gmail strips webfonts and does not play Lottie/SVG. **All copy is live HTML.** Production sends **CID-inline** logo, header pixel, shipping GIF, and product thumbs (`buildOrderEmailForSend`) so Gmail shows them without “Display images.” Hosted HTTPS fallbacks remain at `https://admin.example.com/email/`. Outlook typically shows the first GIF frame.

| Face | Copy | HTML stack |
|------|------|------------|
| Sanchez | Headline `Your order is on its way!` (28px, white on green); **Track Order** CTA (18px) — primary `#009540` fill, 2px `#004d21` stroke, white label (no lime/amber) | `'Sanchez', Georgia, 'Times New Roman', serif` |
| Noto Sans | Body (16px laptop / 18px phone), labels, greeting, live fields, support, footer | `'Noto Sans', 'Trebuchet MS', Tahoma, Arial, Helvetica, sans-serif` |

**Header truck:** white GIF from `frontend/assets/animations/shipping.svg` (same motion as the Lottie) at **220×106** with a transparent background. Laptop nudges it slightly left (`padding-right: 24px`). Phone keeps `padding-right: 36px` (Gmail Android GIF clip). The green header tiles `header-pixel.png` and uses `color-scheme: light only` so Apple Mail does not invert the white headline.

**Greeting:** one wrapping HTML line (`Thank you for your order, {name}!`). Body sits on cream `#fcf9f8` (`cream/50` / `color/bg/app`, not white). All copy uses **`letter-spacing: 0.02em`** (head `<style>` plus inline on every text cell/link), same token as Forgot Password and hours-reminder.

**Body copy** is left-aligned HTML; phone bumps to 18px via `@media (max-width: 600px)`.

## Placeholder-first

Figma sample copy is the default. Real `shop_orders` / volunteer fields replace a placeholder only when that field is present. Do not invent missing data.

| Field | Placeholder until |
|-------|-------------------|
| Volunteer name | `Volunteer Name` |
| Address | `XXXXX, XXXXX, XX XXXXX` until street **and** city exist (partial rows, `Address not provided`, country-only objects do not count) |
| Payment method | `—` until `shop_orders.payment_method_label` exists (set by Stripe webhook) |
| Order total | `$XX.XXX` until `total_cents` > 0 |
| Order # | `X-XXXX` / `######` until a real id |
| Order date | `MM/DD/YYYY` |
| Line items | `Product Item` / `X` / `$XX.XXX` until named items exist (same mask as order total) |

**Support:** volunteer-facing contact is `support@example.org`. Do not name Admin in these emails.

**Pricing in HTML:** tracker-access orders show total **$59.99**, included kit at **$0.00**, and **Shipping: FREE** (USPS) / pickup method name. Shop USPS shipping is **25% of paid product-item subtotal** (standalone kit **$49.99** included; free kit line ignored). `$0.00` is a valid formatted amount (kit line).

## Hosted assets (production)

- `shipping.gif` (transparent 220×106; cache-bust `?v=6` in HTML)
- `header-pixel.png` (8×8 `#009540` tile; Apple Mail inversion skip)
- `logo-mark.png` (white filled mark on transparent — green order/hours header)
- `logo-mark-green.png` (primary `#009540` filled mark on transparent — Forgot Password cream card)
- `sender-avatar.png` (256×256 white filled mark on `#009540` — inbox/BIMI companion; not inlined in HTML)
- `bimi-logo.svg` (SVG Tiny P/S square with filled mark; host for BIMI `l=` URL after DNS is published)
- Product thumbs: `cleanup-kit.png`, `trash-grabber.png`, `tote-bags.png`, `adult-safety-vest.png`, `child-safety-vest.png`, `product-placeholder.png`
- Fonts: `/email/fonts/NotoSans-Regular.ttf`, `NotoSans-Bold.ttf`, `Sanchez-Regular.ttf`

## API contract

### `POST /emails/order-placed`

- **Auth:** volunteer JWT (`Authorization: Bearer`)
- **Body:** `{ "orderId": "<uuid>" }`
- **Guards:** order must exist and `shop_orders.user_id` must match the JWT subject
- **Recipient:** authenticated volunteer's email (JWT claim, else Auth `user_metadata.email`) — never a client-supplied `to`
- **Response:** `200 { "ok": true }` or `{ "ok": true, "skipped": true }` when Resend/email is missing; `404` if order not owned; `502` on send failure
- **Side effects:** Resend send + `email_log` row (`template_type: order_placed`) + `volunteer_notifications` `order_update` inbox row (and Expo push when a token exists; gated by `notification_preferences.shopOrders`)
- **Client:** `frontend/src/lib/shopOrders.ts` fires this after insert (non-blocking)

Shipped mail is sent from admin-web-app `updateOrderFulfillment` → `sendShopOrderEmail` (not this endpoint).

## Data model

Uses existing `shop_orders` (`items` jsonb, `shipping_address`, `total_cents`, `tracking_number`, `carrier`, `created_at`) plus `fulfillment_method` from `022` and `payment_method_label` from `024`. Shipped email still fires only on first `shipped` transition **and** only when `fulfillment_method = usps_ship`. Migration `020` adds `order_placed` to `email_templates` / `email_log` check constraints.

## Acceptance criteria

- [x] AC-1: Placed email sends on checkout when API + Resend are configured (non-blocking if send fails)
- [x] AC-2: Shipped email sends only on first transition into `shipped`
- [x] AC-3: Layout matches Figma structure (green header, cream `#fcf9f8` body, summary, items, sage footer)
- [x] AC-4: Every field shows Figma-style placeholder when real data is missing
- [x] AC-5: Real `shop_orders` / volunteer fields replace placeholders when present (per-field only)
- [x] AC-6: Payment method row always visible; value from `payment_method_label` when set, else `—`
- [x] AC-6b: Address row always visible; value `XXXXX, XXXXX, XX XXXXX` until street and city are both present
- [x] AC-7: Shipped Track Order button appears only when carrier + tracking yield a real URL
- [x] AC-8: Production/test sends CID-inline logo, header pixel, shipping GIF, and product thumbs (`buildOrderEmailForSend` in admin + Fly). Hosted HTTPS URLs remain as fallbacks.
- [x] AC-12: CTA is primary `#009540` + `#004d21` stroke + white label. Support is `support@example.org`. Tracker bundle emails show `$59.99` and `Shipping: FREE`.
- [x] AC-9: Greeting is one wrapping HTML line; body copy is left-aligned live HTML (16px / 18px phone)
- [x] AC-10: All copy is live HTML; Sanchez/`@font-face` + Georgia for headline/CTA; Noto/`@font-face` + Trebuchet MS for body/labels/footer. Images are logo, shipping GIF, and product thumbs only.
- [x] AC-11: Tracking is `letter-spacing: 0.02em` on all copy (inline + head CSS), matching Forgot Password and hours-reminder.

## Security & privacy

- Order-placed recipient is never request-body `to` (same anti-relay rule as event registration)
- Order ownership check prevents sending another volunteer's receipt
- HTML interpolations are escaped in `buildOrderEmailHtml`
- Mock / missing emails skip send (`isMockAddress` on admin path)

## Test plan

1. `cd admin-web-app && npx tsx scripts/preview-order-emails.mts` — writes `tmp/order-email-*.html` and asserts copy
2. `cd admin-web-app && npx tsx scripts/send-test-order-email.mts --to=<inbox>` — live Resend of both variants (CID-inlined images)
3. `cd admin-web-app && npx tsc --noEmit`
4. `cd backend/sessions && npx tsc --noEmit`
5. Apply `admin/db/020_order_emails_figma.sql` on Supabase before production sends log `order_placed`
6. After Vercel deploy, confirm images load from `https://admin.example.com/email/`
7. Fly redeploy `backend/sessions` so production checkout uses the same HTML as admin
