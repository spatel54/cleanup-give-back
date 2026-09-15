# Admin dashboard feature batch — 2026-07-28

Implementation notes for the 11-item feature batch + mobile audit (source plan: `admin_dashboard_features_5840bb94.plan.md`). See [current.md](../current.md) for the user-facing summary.

## What shipped

| # | Feature | Key files |
|---|---------|-----------|
| 1 | Universal search + filters | `components/ui/AdminSearchBar.tsx`; wired into Home (`DashboardWorkbench.tsx`), Sessions (`SessionsClientShell.tsx`, live `ilike` query), Payments, Orders (`OrdersClientShell.tsx`), Users |
| 2 | PDF generation fix | `lib/assertAdmin.ts` (`assertAdminRequest()` honors `BYPASS_AUTH`); `app/api/service-letter/**/route.ts` |
| 3 | Notify at-risk volunteers | `actions/events.ts` (`notifyAtRiskVolunteers`), `app/(admin)/events/[id]/NotifyAtRiskVolunteers.tsx`, `lib/resend.ts` |
| 4 | Payments breakdown | `lib/payments-data.ts` (`loadPaymentsBreakdown`); bucket size follows the page period (no Day/Week/Year UI); `PaymentsBreakdownSection.tsx` keeps All/Donations/Shop filters |
| 4b | Shop item breakdown | `lib/shop-catalog.ts` + `loadShopItemBreakdown` in `payments-data.ts`; `ShopItemBreakdownSection.tsx` on `/payments` — qty/revenue/share/rank for kit, tote, grabber, adult/child vest |
| 5 | Session photo preview fix | `app/(admin)/sessions/[id]/PhotoGrid.tsx` (plain `<img>` for signed URLs, surfaced signing errors) |
| 6 | Audit Log removed from nav | `components/nav/Sidebar.tsx`, `components/nav/MobileNav.tsx` (page + `writeAuditLog` calls untouched) |
| 7 | Event photo upload | `components/events/EventPhotoUpload.tsx` (multi-select, up to 8, **optional** — label + CTA make skip clear), `actions/events.ts` (`uploadEventPhoto` → `event-photos` bucket; persists `image_urls` + primary `image_url`), `db/003_event_image_urls.sql` |
| 8 | Address autocomplete | `components/events/AddressAutocomplete.tsx` (Google Places `Autocomplete` widget; hidden `lat`/`lng`) |
| 9 | What to bring optional | `components/events/EventForm.tsx` label copy only (field was already nullable) |
| 10 | Users tab (merged Volunteers + Court Hours) | `app/(admin)/users/page.tsx` + `UsersClientShell.tsx`; `/volunteers` and `/court-hours` now redirect |
| 11 | Dashboard commerce preview cards | `app/(admin)/page.tsx` (`commerce` prop), `PaymentsPreviewCard.tsx` (stacked bar preview), `OrdersPreviewCard.tsx` (open orders table → `/orders/[id]`), `components/dashboard/DashboardWorkbench.tsx` |
| 12 | Mobile responsiveness audit | [mobile-responsiveness-audit-2026-07-28.md](mobile-responsiveness-audit-2026-07-28.md) |
| 13 | Remove admin “Invalid” status | No Mark Invalid action; Sessions filter + insights donut drop Invalid; legacy DB `invalid` rows display as Declined |
| 14 | Live hours + photo lightbox | `SessionHoursProvider` / Duration updates on adjust; `PhotoGrid` arrows + date stamp |
| 15 | Shop order detail (shipping + status) | `lib/orders-data.ts` (shipping/tracking helpers), `app/(admin)/orders/[id]/page.tsx`, row links from `OrdersClientShell` + `OrdersPreviewCard` |

## New environment variables

Added to `admin/.env.local.example` (values left blank in `.env.local` until provisioned):

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Google Places Autocomplete for the event address field. Falls back to a plain text input (no validation gate) when unset.
- `SESSIONS_API_URL` / `ADMIN_API_KEY` — already documented for PDF letterheads; confirmed required for both single and bulk PDF routes.
- `RESEND_API_KEY` / `ADMIN_NOTIFY_EMAIL` (existing keys) — now also power the event-detail **Notify at-risk volunteers** send. `EMAIL_FROM` optional override (defaults to `noreply@example.org`, matching `backend/sessions/src/routes/emails.ts`).

## New Supabase Storage bucket

`admin/db/002_event_photos_bucket.sql` — additive migration creating a **public** `event-photos` bucket (hero images need to be readable by the mobile app) with admin-role-gated write policies. Uploads go through the service-role client in `actions/events.ts`, so these RLS policies are a defense-in-depth backstop rather than the primary access path. Run this migration against the same Supabase Postgres DB as `001_admin_portal_migration.sql`.

## Event gallery column

`admin/db/003_event_image_urls.sql` — adds `events.image_urls text[]` (default `{}`), backfills from `image_url`, and keeps `image_url` as the primary/first photo for list cards and older clients. Mobile `eventsApi.ts` maps `image_urls` into the registration detail carousel (no more duplicated single hero).

## Navigation changes

- Sidebar / mobile menu: **Volunteers** + **Court Hours** → single **Users** item (`/users`); **Audit Log** removed (page still reachable directly at `/audit-log`, just no nav entry).
- `/volunteers` and `/court-hours` (list pages) now `redirect()` to `/users` and `/users?filter=court` respectively. Volunteer detail (`/volunteers/[id]`) is unchanged.
