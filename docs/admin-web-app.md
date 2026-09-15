# Clean Up - Give Back Web Application

## Overview

The web application provides a desktop-friendly admin interface for managing Clean Up - Give Back operations, complementing the existing React Native mobile app.

## Project Structure

```
CleanUpGiveBackApp/
├── frontend/          # React Native mobile app
├── admin/             # ARCHIVED legacy admin — keep admin/db/*.sql migrations
├── backend/           # Backend services
└── admin-web-app/           # Production Next.js admin console (Vercel)
    ├── src/
    │   ├── app/       # Next.js App Router pages
    │   ├── components/ # Reusable UI components
    │   └── lib/       # Utility functions
    └── package.json
```

## Features

### Animated Sidebar Navigation
- **Desktop (≥1024px / `lg`)**: Auto-expand on hover (72px ↔ 240px)
- **Tablet & mobile (<1024px)**: Top bar + full-screen overlay drawer (matches admin MobileNav breakpoint)
- **Responsive**: Tables stay card-stacked until `lg`; KPI/chart grids use 1→2→3 columns across phone/tablet/desktop
- **Accessible**: Keyboard navigation support; Escape closes the mobile drawer

### Authentication
- **`/login`**: Email/password via Supabase `signInWithPassword`; requires `user_metadata.role === 'admin'`. Branded full-page canvas uses `GradientBarsBackground` (`components/ui/gradient-bars-background.tsx`) — cream `#fcf9f8`, soft forest-green bars (`rgba(0,149,64,0.14)`), slow pulse, `prefers-reduced-motion` respected. Password field uses the same `EyeIcon` / `EyeOffIcon` (`react-icons/io5` `IoEye` / `IoEyeOff`) show/hide toggle as Account and mobile onboarding.
- **Middleware** (`src/middleware.ts`): When `BYPASS_AUTH` is off, unauthenticated users redirect to `/login`; signed-in non-admins are signed out with `?error=access_denied`. When `BYPASS_AUTH=true`, auth is skipped but `/login` is still served for UI preview.
- No production credentials in this sample — see [SECURITY.md](../SECURITY.md).

### Navigation Sections (sidebar order)
- **Home** (`/`): Overview metrics and recent activity
- **Attention** (`/attention`, 2026-08-07): Unified "Needs attention" queue — sessions under review, flagged feedback, order issues, failed emails, at-risk volunteers, red-flagged sessions, data-quality alerts, filterable by type
- **Sessions** (`/sessions`): Session review and management; header **Export** accordion (CSV download + PDF via print dialog); **Compare sessions** from the filter toggle or the multi-select bar (when 2+ rows are selected; opens `/sessions/compare` for exactly two same-volunteer sessions). Row checkboxes select any session for bulk approve / compare. Court-ordered rows (and the session preview drawer) expose per-session **Reset hours**. Session list + preview drawer show `CourtBadge` for `sessions.court_ordered` and `ServiceTypeBadge` for onboarding `service_type`, but skip the service-type pill when it is **Court Ordered** on an already court-ordered session (same signal twice).
- **Users** (`/users`): Volunteer / user directory; **Export** accordion; type column uses `CourtBadge` (slate + border) vs shared `VoluntaryBadge` (green fill + `#007536` border). Session rows show `ServiceTypeBadge` for onboarding service type — **Court Ordered** uses the same slate pill as `CourtBadge`, and is omitted next to `CourtBadge` when the session is already court-ordered.
- **Court Risk** (`/court-risk`, 2026-08-07, terminology + severity fix 2026-08-09): At-risk court-ordered volunteers — deadline, hours progress, "Missed checkpoints" (30d, renamed from "Invalid" — a header tooltip explains it means a missed selfie/progress checkpoint, not necessarily fraud), "Late rush" (renamed from "Spike"). Deadline column is a 3-step severity pill, not a flat at-risk/not binary: solid dark red = overdue, light red = due within 5 days, amber = due within 14 days. Row click → volunteer profile; that profile's Session History now opens the shared session-preview drawer (was a dead `/sessions/[id]` link) and no longer crashes for court-ordered volunteers (`CourtOrderForm` stopped taking `formatDate` as a function prop across the server/client boundary)
- **Insights** (`/insights`): Data visualization and reports (no Enhanced Geocoding toggle; standard US heatmap only); header **Export** accordion (CSV + PDF)
- **Feedback** (`/feedback`): Volunteer feedback; **Export** accordion
- **Events** (`/events`): Event management and scheduling; **Export** accordion (+ New Event)
- **Orders** (`/orders`): Shop order processing (USPS ship vs office pickup / local drop-off; kit requested; Shippo Buy label on paid USPS orders; **Download label PDF** primary, **Go to Shippo** tertiary, package status as a quiet heading tag — Unknown shows as **Pending**); **Export** accordion
- **Payment** (`/payments`): Payment tracking; **Export** accordion
- **Audit Log** (`/audit-log`): Plain-language before/after history; diffs render as stacked field transitions in `AuditDiffCard` — each changed field shows its label, then a from pill → chevron → to pill (2026-08-17, replacing the two-column Before/After grid). Value pills keep per-value tint (e.g. "Declined" = red) driven by the value itself, not column position
- **Emails** (`/emails`, 2026-08-09): **Compose** shows a read-only **From** line (`EMAIL_FROM` / default `noreply@example.org`), unified To (volunteer search or typed email — no Volunteer/Custom tabs), optional Cc/Bcc (hidden until Add Cc / Add Bcc), font/size/color in the rich-text toolbar, Send or Schedule send. Schedule send and the Scheduled-tab edit drawer use a shared `ScheduleDateTimePicker` (native date input + custom 15-min-increment time dropdown, `TIME_OPTIONS`) instead of the browser's `datetime-local` UI, for consistent styling across browsers. Attachments are explicitly labeled optional; when Send/Schedule are disabled, an inline hint lists what's still missing (recipient/subject/message — attachments were never required). **Scheduled** tab lists queued mail with Edit / Send now / Cancel for `pending` rows. **Templates** uses everyday-language insert chips (e.g. “Volunteer name”) — Admin never types `{{brackets}}`. Apply `admin/db/013_scheduled_emails.sql`; set `CRON_SECRET` for `/api/cron/send-scheduled-emails` (`vercel.json` once daily on Hobby — use **Send now** for sooner delivery). **Forgot Password HTML** (Figma `1311:449`) lives in `src/lib/password-reset-email-html.ts` — preview/test scripts only; not in the Emails tab and not sent from Welcome yet. Card fill is cream `#fcf9f8` (`color/bg/app`). All copy is live HTML (Georgia / Trebuchet MS fallbacks; hosted `@font-face` where clients allow); only `logo-mark-green.png` is an image. Tracking is `letter-spacing: 0.02em` on Forgot Password, order, and hours-reminder. Spec: [backend/specs/password-reset-email.md](backend/specs/password-reset-email.md).
- **Company codes** (`/company-codes`): Generate and manage 10-digit single-use tracker unlock codes. Layout matches Audit Log / Orders (SidebarDemo, Sanchez heading, cream canvas, surface table, Active/Used status chips). Header **Generate code** opens a success modal with Copy/Done plus a Admin tip: look up redeemers on **Volunteers** by name/email, or paste a long ID after `/volunteers/` in the address bar when email is missing. Toolbar: left search (code / email) + right-aligned **Select**; select mode reveals per-row checkboxes (no header select-all) and swaps actions to red **Delete All (n)** + gray secondary **Cancel**. Spec: [frontend/specs/company-codes.md](frontend/specs/company-codes.md). Migration: `admin/db/029_company_codes.sql`.
- **Admin / Settings**: Footer links (`/profile`, `/settings`); `/profile` Account page loads the admin's signed-in Supabase name/email, persists profile + password via `actions/account.ts` (`updateUser` + current-password verify), writes audit log entries, and shows show/hide eye toggles on password fields; account row shows name + initials; brand mark uses `/logo.png` (not a CG placeholder)

### Technical Features
- **TypeScript**: Full type safety
- **Tailwind CSS v4**: Utility-first styling — custom `--spacing-*` tokens must be paired with explicit `--max-width-*` so `max-w-2xl` etc. do not collapse to spacing values (e.g. 40px)
- **Framer Motion**: Smooth animations
- **Dark Mode**: Automatic theme switching
- **SEO Ready**: Next.js App Router benefits
- **Copy:** UI strings use a hyphen (`-`), never an em dash (`—`), including empty values

## Getting Started

1. **Navigate to web app directory**:
   ```bash
   cd admin-web-app
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open browser**:
   Visit [http://localhost:3000](http://localhost:3000)

## Development

### Current Status
- ✅ Sidebar navigation implemented
- ✅ Responsive design working
- ✅ Basic page structure created
- ✅ Animation system integrated
- ✅ Dark mode support
- ✅ **Live-wired to the shared Supabase project** (same one `admin/` and `frontend/` use) — see [Live data wiring](#live-data-wiring) below
- ✅ Home dashboard (`/dashboard`) uses the real interactive `UsHeatmap` (nation → state → county → neighborhood drill-down), ported verbatim from `admin/`
- ✅ Dashboard review-queue **age labels** (`Nh ago` / `Xd ago`) use date-fns full elapsed hours/days (truncated), so day counts are not off-by-one from rounding hours first
- ✅ Dashboard **Court-ordered only** toggle filters the Needs you queue (pressed state + `N of M` heading; empty copy when none match)
- ✅ Dashboard **How long sessions wait** card (`QueueAgeCard`) expands each age bucket to list volunteer names, activity, wait time, and **Review** (defaults open on the oldest bucket, e.g. 8+ days); **Needs you** lists the same recent sessions as `/sessions` (not only `under_review`), newest-first by `created_at`, first **20**, status chips, **Review**/**View**, and **View more** → `/sessions?period=all`. Heading count stays open `under_review`. The adjacent **Hours & submissions** chart (`TrendAreaChart`) fills the same grid row; the plot stays a fixed `h-52` and is vertically centered so a tall wait-queue sibling does not stretch the area chart.
- ✅ Dashboard **metric tiles** (Waiting / Approved / Hours / Feedback) use a denser layout (label top / value+visual middle / signed delta + period-specific prior caption bottom: “vs yesterday” / “vs last month” / “vs last year” / “vs prior range”). Approved/Hours/Feedback are period-scoped via `PeriodToggle`; Waiting stays live open-queue with a prior-window open-count proxy delta. All-time shows “-” / “No prior”
- ✅ **Sticky page chrome** (`PageStickyHeader`): Home (“Welcome back Admin”), Sessions, Users, Insights, Feedback, Shop Orders, Payments, and Audit Log keep the title + top filter bar (`PeriodToggle`, or Users search/type chips) pinned while the main pane scrolls. Sessions also pins search, status chips, Court-ordered only, Compare sessions, and the session count. Audit Log also pins the search field, action dropdown, and Search. Opaque cream `bg-bg-app` fill so list/chart content cannot show through behind it.
- ✅ Insights (`/insights`, also `/analytics`) matches admin Insights layout: trend, queue age, decisions, court progress (View more when >5), donuts, US heatmap — live `sessions` + `court_orders` only; empty tables show empty charts (`isMock={false}`), not `resolveInsightsFixtures`.
- ✅ `/sessions` supports Approve/Decline moderation on `under_review` rows (writes to `sessions` + `admin_audit_log`, emails/pushes the volunteer via `notifyVolunteerSessionDecision` and inserts a `volunteer_notifications` inbox row before push); mock mode does a local-only optimistic update
- ✅ `/sessions` also supports **bulk approve** (row checkboxes + "Approve selected"), and the session preview drawer (`SessionPreviewDrawer.tsx`) adds **Hours Adjustment**, **Admin Notes**, and **Letterhead PDF generation** — all wired to the same admin server actions/API routes, mock-mode-safe. **Walking Path** and **Photos** hydrate from live Supabase when available: MapLibre polyline from `sessions.route` + signed `session-photos` checkpoint thumbs (via `loadSessionEvidence`)
- ✅ `/events/[id]` supports Edit / Publish-Unpublish / Delete and **Notify at-risk volunteers** (emails court-ordered volunteers behind on hours about the event via Resend), matching admin's event detail actions
- ✅ **Decision templates (2026-08-07):** `SessionPreviewDrawer.tsx`'s Decline action opens a reason picker sourced from hardcoded `DECLINE_REASON_TEMPLATES` (`lib/decisionTemplates.ts`) — selecting a template fills an editable textarea, and whatever text is present is passed to `declineSession(id, reason)` and recorded in `admin_audit_log.after_value`. Admin Notes gets a matching `ADMIN_NOTE_SNIPPETS` insert-dropdown that appends to the existing free-text notes field.
- ✅ **Volunteer risk timeline (2026-08-07):** `/volunteers/[id]` renders a chronological "Timeline" section (`VolunteerTimeline.tsx`) between Activity Pattern and Session History — approvals/declines/hours-adjustments/notes/court-order edits/volunteer-deletes sourced from `admin_audit_log` via `loadVolunteerTimeline` (`lib/live-data.ts`), plus a new `'email sent'` audit action written by `notify.ts` whenever a decision email actually sends, so emails show up on the same timeline. Reuses `auditActionLabel`/`auditActionTone`/`describeAuditChanges` from `lib/audit-log-summary.ts`.
- ✅ **Production readiness page (2026-08-07):** `/settings` now renders `ProductionReadinessPanel.tsx` above the Notifications placeholder — probes Resend, the Sessions API (via a new `GET /health/deep` on `backend/sessions` that checks Prisma DB connectivity), the admin API key, Supabase Auth admin claim, Supabase data reads, the `session-photos`/`event-photos` storage buckets, and a Realtime **round-trip** check (subscribes + sends its own broadcast and waits up to 4s for delivery, since a broken RLS/publication setup connects but silently drops events). `lib/health-checks.ts` + `actions/health.ts` (`refreshHealthChecks`, admin-gated, "Re-run" button).
- ✅ **Court packet export (2026-08-07):** `SessionPreviewDrawer.tsx`'s Letterhead section adds an "Export Court Packet" link (`court_ordered` sessions only) that calls `/api/service-letter/[sessionId]?courtPacket=true`, proxying to `backend/sessions`' extended `buildServiceLetterPdf(..., { includeCourtCoverSheet: true })`. Adds a cover sheet (case reference, due date, required/completed hours, completion %) and per-session "Adjusted from Xh to Yh by admin" annotations when `adjusted_hours` differs from the raw logged duration.

### Live data wiring
admin-web-app reads/writes the same Supabase project as `admin/` and the mobile app (`frontend/`), via a `admin-web-app/src/lib/supabase/{server,client}.ts` pair ported from `admin/lib/supabase/`. Copy `admin-web-app/.env.local.example` → `admin-web-app/.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` (same project as `admin/.env.local`) to go live. Add `NEXT_PUBLIC_CARTO_BASEMAP_API_KEY` (free at https://carto.com/basemaps/apikey — same value as mobile `EXPO_PUBLIC_CARTO_BASEMAP_API_KEY`) so session walking-path and event location raster maps do not show CARTO’s “KEY REQUIRED” watermark. Data/Admin-API reads use a **cookie-free service-role client** (`createServiceRoleClient`) so a signed-in admin JWT does not collapse lists under volunteer RLS. **Empty tables yield empty real lists** (`useMock: false`) — Dashboard, Sessions, Feedback, Orders, Payments, Events, Insights/Analytics, Users, and Volunteers never inject sample fixtures. The Sample data banner stays in page components but loaders no longer set `isMock`.

**Realtime refresh (2026-08-04, hardened 2026-09-14):** `SidebarDemo` calls `useSessionsRealtimeRefresh()` so Home "N to review", Sessions, Attention, and every other shelled page stay in sync. The hook listens for `postgres_changes` on `public.sessions` (INSERT/UPDATE/DELETE, debounced 400ms) and also polls / refreshes on tab focus (15s), because Realtime can connect and still drop finalize `UPDATE`s. Server reads use a cookie-free service-role client with `cache: 'no-store'` plus `connection()` in `loadLiveSessions`, so `router.refresh()` re-queries Postgres instead of a cached RSC snapshot. Requires `admin/db/008_admin_sessions_realtime_read.sql` (RLS + publication) and `admin/db/030_sessions_replica_identity_full.sql` (FULL replica identity so UPDATE events can pass RLS). The browser subscription still authenticates as the signed-in admin over the anon key.

Each `app/*/page.tsx` route is now an async Server Component that calls a loader in `admin-web-app/src/lib/live-data.ts`, then passes the result as props into the (still `"use client"`) page component:

| Page | Live source | Loader |
|------|-------------|--------|
| `/`, `/dashboard` | `sessions`, `shop_orders`, `volunteer_feedback` tables | `loadLiveSessions`, `loadLiveOrders`, `loadLiveMonthlyRevenue`, `loadLiveFeedback` |
| `/sessions` | `sessions` table + Auth directory | `loadLiveSessions` |
| `/feedback` | `volunteer_feedback` table + Auth directory + `sessions` | `loadLiveFeedback` |
| `/orders` | `shop_orders` table + Auth directory | `loadLiveOrders` |
| `/payments` | `shop_orders` + `donations` tables, scoped by URL `period`/`from`/`to` (day→daily bars; **Month**→last 6 months as monthly bars; **Year**→last 6 years as yearly bars; all→years; empty windows stay zeroed, no sample mix). PeriodToggle: Today / Month / Year / All / Custom (no 30-day). | `loadPaymentsBreakdown`, `loadShopItemBreakdown` (`@/lib/payments-data`); window via `paymentsPeriodInterval` |
| `/users`, `/volunteers` | Auth Admin API (`listUsers`) + `sessions` + `court_orders` | `loadLiveUsers` |
| `/volunteers/[id]` | Auth Admin (`getUserById`) + `sessions` (incl. `distance_miles`) + `court_orders` — KPI strip shows Sessions, Approved Hours, **Miles Walked** (sum of `distance_miles` on approved sessions), and Court Progress when applicable | `loadLiveVolunteerById` |
| `/events`, `/events/[id]` | `events` table — same rows the mobile app reads for its Upcoming Events feed | `loadLiveEvents`, `loadLiveEvent` |
| `/events/new`, `/events/[id]/edit` | Writes to `events` table + `event-photos` storage bucket via the `createEvent`/`updateEvent` server actions (`admin-web-app/src/actions/events.ts`, ported from `admin/actions/events.ts`) | — |
| `/events/[id]` actions | Publish/unpublish/delete write to `events`; **notify at-risk volunteers** reads `court_orders` + `sessions` + Auth directory via `buildCourtRisk`, emails through Resend, and records `event_volunteer_notices` | `setEventPublished`, `deleteEvent`, `notifyAtRiskVolunteers` (`admin-web-app/src/actions/events.ts`) |
| `/sessions` moderation | Approve/decline write to `sessions` + `admin_audit_log`, then email + preference-gated inbox row (`volunteer_notifications`) + Expo push | `approveSession`, `declineSession` (`admin-web-app/src/actions/sessions.ts`) |
| `/sessions` bulk approve + drawer actions | Bulk-approve (`SessionsPage.tsx` checkboxes) writes each `sessions` row + `admin_audit_log`, same notify path as single approve. Hours/Notes/Letterhead (`SessionPreviewDrawer.tsx`) write `adjusted_hours`/`admin_notes`/`letterhead_generated_at` + `admin_audit_log`; hours adjust also calls `notifyVolunteerHoursAdjusted` (inbox + push). Drawer Walking Path / Photos load `sessions.route` + signed checkpoint URLs when present | `approveSessionsBulk`, `adjustHours`, `saveAdminNotes`, `markLetterheadGenerated`, `loadSessionEvidence` (`admin-web-app/src/actions/sessions.ts`) |
| `/insights`, `/analytics` | `sessions` + `court_orders`; empty → empty charts (`isMock={false}`) | `loadLiveSessions` |
| `/attention` (2026-08-07) | Aggregates `loadLiveSessions`, `loadLiveFeedback`, `loadLiveOrders`, `email_log`, `loadLiveCourtProgress`, per-session `computeRedFlags`, and `data-quality.ts` checks into one typed list | `buildAttentionItems` (`admin-web-app/src/lib/attention-inbox.ts`) |
| Session deep links (2026-08-07 fix) | There is no `/sessions/[id]` route — Sessions is a filtered list + client-state preview drawer, not routable per-session. Attention/Audit Log session links were 404ing on `/sessions/${id}`; now point at `/sessions?period=all&open=${id}`, and `SessionsPage.tsx` opens `SessionPreviewDrawer` for that id once it loads | `attention-inbox.ts`, `audit-log-summary.ts`'s `auditTargetLabel`, `SessionsPage.tsx` (`openId` effect) |
| `/court-risk` (2026-08-07) | `court_orders` + `sessions` + `admin_audit_log` (delete count), batched across every court-ordered volunteer (3 queries total, not N) | `loadCourtRiskDashboard` (`lib/live-data.ts`) |
| `/volunteers/[id]` Communication section (2026-08-07) | New `email_log` table (`admin/db/010_email_log.sql`) + `admin_audit_log` (`'logged contact note'` action) | `loadVolunteerEmailLog`, `loadVolunteerContactNotes` (`lib/live-data.ts`); write via `logManualContactNote` (`actions/communication.ts`) |
| `/sessions/compare` (2026-08-07) | `sessions` (2 rows by id, server-validated same-`user_id`) + `loadSessionEvidence` for each | `loadSessionsForCompare` (`lib/session-compare.ts`) |
| `/emails` (2026-08-09) | `email_templates` (`011`), attachments (`012`), `scheduled_emails` + `email_log.cc/bcc` (`013`); From via `getFromAddress()`; Compose/Scheduled/Templates | `sendAdHocEmail`, `scheduleAdHocEmail` / `updateScheduledEmail` / `cancelScheduledEmail` / `sendScheduledEmailNow`, cron `processDueScheduledEmails`, `listScheduledEmails`, `RichTextEditor` + `email-template-tokens` |

Volunteer name/email resolution (`admin-web-app/src/lib/volunteers.ts`), event timing/date helpers (`admin-web-app/src/lib/events.ts`), and court-ordered at-risk math (`admin-web-app/src/lib/court-risk.ts`, `buildCourtRisk`) are direct ports of `admin/lib/volunteers.ts` / `admin/lib/events.ts` / `admin/lib/court-risk.ts`. Audit logging (`admin-web-app/src/lib/audit.ts` → `admin_audit_log`) and volunteer notifications (`admin-web-app/src/lib/notify.ts` + `admin-web-app/src/lib/resend.ts`, soft-failing when `RESEND_API_KEY` is unset) are ports of `admin/lib/audit.ts` / `admin/lib/notify.ts` / `admin/lib/resend.ts`. **In-app inbox (2026-08-25):** `notifyVolunteerSessionDecision` / `notifyVolunteerHoursAdjusted` / `notifyVolunteerOrderUpdate` insert `volunteer_notifications` (`admin/db/025_volunteer_notifications.sql`) **before** Expo push; `user_metadata.notification_preferences.approvalStatus === false` skips inbox+push for session status but still sends email; `shopOrders === false` skips order inbox+push. Missing preferences object stays opted-in so existing volunteers still get session status. Apply `025` on Supabase. Incoming mobile banners also persist (run `027`). **Editable templates + delivery logging (2026-08-07):** `notify.ts`, `actions/events.ts`'s `notifyAtRiskVolunteers`, and the backend's event-registration route now render subject/body from the `email_templates` table (`lib/email-templates.ts` / `lib/email-template-render.ts`, editable at `/emails` → Templates) instead of inline strings, falling back to a hardcoded default if the row is missing. `{{variable}}` interpolation is HTML-escaped before landing in the body (`renderTemplate(..., { escapeHtml: true })`) — some variables (event titles, volunteer display names) originate from user-editable fields, so unescaped interpolation into an HTML body is an injection vector; subjects stay plain-text substitution (rendered via JSX text nodes, not `innerHTML`, so no separate escaping needed there). Every send (plus the backend's Admin-review-session notice and the mobile email-change code flow) logs to the new `email_log` table via `lib/email-log.ts`; an optional Resend webhook at `/api/webhooks/resend` upgrades `sent` → `delivered`/`bounced`/`complained` once an admin configures the webhook URL + signing secret in the Resend dashboard (the app can't self-register it). Order fulfillment (`actions/orders.ts`) sends the Figma **order shipped** email (`lib/order-email-html.ts` / `lib/send-order-email.ts`) on the `pending`/`paid` → `shipped` transition. Mobile checkout sends **order placed** via Fly `POST /emails/order-placed`. Both layouts are code-owned (Emails tab sanitizer cannot store tables). Apply [`admin/db/020_order_emails_figma.sql`](../admin/db/020_order_emails_figma.sql). Spec: [backend/specs/order-emails.md](backend/specs/order-emails.md). **Hours reminder** (Figma Nudge `1311:432`) is the same pattern: `lib/hours-reminder-email-html.ts` + `lib/hours-reminder-send.ts` + cron `sendHoursReminders`; live HTML (logo + transparent bell GIF CID-inlined on send); cream `#fcf9f8` support strip; placeholders `Volunteer` / `XXX`; not editable in Templates. Apply [`admin/db/021_hours_reminder_figma.sql`](../admin/db/021_hours_reminder_figma.sql) if the DB stub is missing. Spec: [backend/specs/hours-reminder-email.md](backend/specs/hours-reminder-email.md). **`POST /emails/event-registration`** (backend) now always sends to the authenticated caller's own JWT `email` claim, never a client-supplied `to` — closes a pre-existing open-relay gap where any authenticated user could direct arbitrary-content email to any third party.

**Emails redesign — Compose + rich-text templates (2026-08-07):** replaced the raw-HTML-textarea editor with `RichTextEditor` (`components/ui/RichTextEditor.tsx`) — a zero-dependency `contentEditable`/`execCommand` WYSIWYG (bold/italic/underline/lists/link/image), so Admin never edits HTML by hand; `execCommand` also only ever produces a small safe tag set, which is a security improvement over the free-form textarea it replaces, not just a UX one. Email HTML sinks share `sanitizeEmailHtml` (`lib/sanitize-html.ts`) via **`sanitize-html` (htmlparser2)** — not `isomorphic-dompurify`/`jsdom`, which crashed Vercel Node 24 serverless with `ERR_REQUIRE_ESM` from `@exodus/bytes` and 500'd `/emails`, `/attention`, and session actions that pulled the notify/email graph (fixed 2026-08-08). `email_templates` gained `id` (real PK), `name`, and `is_system` columns so **custom templates** (Admin-authored, no fixed `template_type`) coexist with the 5 system templates in one table (`admin/db/011_email_templates.sql`). New **Compose** flow (`actions/emails.ts` → `sendAdHocEmail`) sends a real email straight from `/emails` — to a volunteer picked from the Auth directory or a manual address — optionally seeded from any template, with inline body images (public `email-inline-images` bucket, permanent URL) and file attachments (private `email-attachments` bucket, signed URL fetched by Resend once at send time — `admin/db/012_email_attachments.sql`, `lib/email-attachments.ts`). Ad-hoc sends log to `email_log` (`template_type: 'other'`) and `admin_audit_log` (`'sent email'`) same as the automated sends. **Resend (2026-08-03):** domain `example.org` verified; set `RESEND_API_KEY` / `EMAIL_FROM` / `ADMIN_NOTIFY_EMAIL` in `.env.local` for local sends (see `.env.local.example`). Production Vercel still needs those vars for hosted admin email. Letterhead PDF generation proxies to the same `backend/sessions` service admin uses, via `admin-web-app/src/app/api/service-letter/[sessionId]/route.ts` and `.../bulk/[volunteerId]/route.ts` (ported from `admin/app/api/service-letter/`), configured with `SESSIONS_API_URL`/`ADMIN_API_KEY` (`admin-web-app/src/lib/sessionsApiConfig.ts`, `assertAdmin.ts`).

**Order emails (2026-08-18):** Figma `1311:359` placed + shipped share `lib/order-email-html.ts` (keep in sync with `backend/sessions/src/lib/order-email-html.ts`). Shipped send: `updateOrderFulfillment` → `sendShopOrderEmail`. Placed send: Fly `POST /emails/order-placed`. CTA is primary `#009540` + `#004d21` stroke + white label; support `support@example.org`. Production sends CID-inline logo, header pixel, shipping GIF, and product thumbs (`buildOrderEmailForSend`). Hosted `/email/*` remain as HTTPS fallbacks. Tracker bundle emails show `$59.99` and `Shipping: FREE`. Shop USPS emails use **25% of paid product subtotal** (free kit ignored). Inbox BIMI assets (`/email/bimi-logo.svg`, `/email/sender-avatar.png`) are in the repo; DNS + CMC/VMC not published. Not editable in Templates. Spec: [backend/specs/order-emails.md](backend/specs/order-emails.md).

**Emails Compose upgrades (2026-08-09):** read-only **From** line on Compose / edit-scheduled / preview (value from `getFromAddress()` → `EMAIL_FROM` or `noreply@example.org`); unified To picker; Cc/Bcc chips; font family / size / color toolbar + sanitizer `style` allowlist; natural-language template chips (`lib/email-template-tokens.ts`); schedule queue in `scheduled_emails` (`admin/db/013_scheduled_emails.sql`) with Scheduled tab (edit / send now / cancel) and Vercel cron `GET /api/cron/send-scheduled-emails` (`Authorization: Bearer CRON_SECRET`; Hobby allows **one daily** cron — `vercel.json` uses `0 15 * * *` UTC; **Send now** covers earlier sends). Template/select chevrons use the audit-log `appearance-none` + right padding pattern.

**Donations revenue** reads live `public.donations` rows written by Fly Stripe checkout (`POST /payments/donate-checkout` + webhook). `/payments` shows a **Recent donations** table with payment method labels and Stripe Dashboard deep links. Order detail (`/orders/[id]`) includes a **Payment** section (`payment_method_label`, Stripe link). Apply `admin/db/024_stripe_payment_details.sql` for payment method + PaymentIntent columns.

### Mock Page Ports
Several pages started as faithful, read-only ports of their `admin/app/(admin)/...` counterparts, backed by fixtures in `admin-web-app/src/lib/mock-data.ts` (types + format helpers remain). Route loaders pass live rows or empty arrays — they do not swap in those fixtures at runtime:
- **`/orders`** (`components/pages/OrdersPage.tsx`) — ports `admin/app/(admin)/orders` + `OrdersClientShell.tsx`; accepts a live `orders` prop, defaults to `MOCK_ORDERS`. **PeriodToggle** scopes Open/Total/Revenue KPIs + the list/export via client `filterByListPeriod` on `createdAt` (**Month** = rolling last 30 days; status + search still apply on top).
- **`/feedback`** (`components/pages/FeedbackPage.tsx`) — ports `admin/app/(admin)/feedback`; accepts a live `feedback` prop, defaults to `MOCK_FEEDBACK` + `EMOJI_MAP`. **PeriodToggle** scopes KPIs, distribution, list, and export via `filterByListPeriod` on `submittedAt` (**Month** = rolling last 30 days). Client-side **rating filter** chips (All / Excited → Very Sad) apply on top of the period window; rating-distribution columns are also toggleable filters.
- **`/sessions`** (`components/pages/SessionsPage.tsx`) — ports `admin/app/(admin)/sessions` + `SessionsClientShell.tsx`; accepts a live `sessions` prop, defaults to `[]` (no fixture list). **Default landing:** [`app/sessions/page.tsx`](admin-web-app/src/app/sessions/page.tsx) redirects bare `/sessions` to `?period=all` (preserves `open=` deep links); client guard catches PeriodToggle clears that strip query params. **PeriodToggle** scopes the list/export via client `filterByListPeriod` (`ended_at` → `started_at` → `created_at`; **Month** = rolling last 30 days); when the period hides rows but others exist, empty state shows an outside-window count + **Show all sessions** CTA. Search, status, and court-ordered filters apply on top. Bulk-select clears when the period changes. **Date** column (desktop + mobile) shows the session **`started_at`** local calendar day (via shared `formatDate`), not `created_at`. Status chips use `getSessionStatusConfig` (same set as admin: `active` / `under_review` / `approved` / `not_approved` / `invalid`) so live `active` rows don't crash SSR. Volunteer names link to `/volunteers/[user_id]` with `hover:text-primary hover:underline` (desktop + mobile list; click does not open the session drawer). `under_review` rows show inline **Approve**/**Decline** actions (decline opens a small reason modal, simplified vs. admin's floating actions menu — no toast system in admin-web-app, so feedback is an inline status line) wired to `approveSession`/`declineSession`; live success updates list status optimistically (same as mock). Every row exposes a checkbox for multi-select; the action bar offers **Approve selected** (under-review only), **Reset hours** (distinct court-ordered volunteers in the selection), and **Compare sessions** when 2+ are selected (requires exactly two same-volunteer sessions). Court-ordered rows also show per-row **Reset hours**.
- **Session preview drawer** (`components/ui/SessionPreviewDrawer.tsx`) — Session Info, **Walking Path** (live MapLibre polyline from `sessions.route` when ≥2 points, with mobile-style **Play / Pause / Replay**, labeled **Start** / **End**, **fullscreen** map mode, and **square rounded checkpoint photo thumbnails** (12px radius; tap to enlarge) placed along the trail by capture time; otherwise an honest empty/loading state), **Photos** (signed `session-photos` checkpoint grid + lightbox via `SessionPhotoGrid`), live Approve/Decline (**only when `under_review`**; error feedback in red), **Reset hours** for court-ordered sessions (`resetCourtOrderHours`), **Hours Adjustment** / **Admin Notes** (`adjustHours`/`saveAdminNotes`), and **Letterhead PDF** (`/api/service-letter/[id]`). Evidence loads on open through `loadSessionEvidence` (`lib/session-evidence.ts`); empty/mock Photos show four dashed placeholders (Selfie → Progress → Selfie → Progress). **Red-flag badge** (`RedFlagBadge.tsx`): hover shows a portaled card with a brief why per flag (grouped **This session** vs **This volunteer**); click opens a modal with the full explanation and where to look. Invalid (30d) and deleted (all-time) are separate flags — a zero invalid count is not shown as a reason.
- **`/payments`** (`components/pages/PaymentsPage.tsx`) — ports `admin/app/(admin)/payments` + breakdown UI; **PeriodToggle** drives server-side `loadPaymentsBreakdown` / `loadShopItemBreakdown` so KPIs, revenue bars, period table, and shop-item donut/table all match the selected window (Today = single day bar; **Month** = last 6 months as monthly bars; **Year** = last 6 years as yearly bars via `paymentsPeriodInterval`). All / Donations / Shop chips still filter the chart series client-side. Empty donation or shop-item windows stay at zero (no sample mix / Sample banner). **Revenue share** donut uses a simplified admin-facing layout: product name + share % only (no per-item MoM deltas, top-mover strip, or duplicate dollar amounts); optional one-line month-over-month shop sales caption. Item table keeps sold/revenue/share/rank detail.
- **`/dashboard` US map** (`components/dashboard/UsHeatmap.tsx`) — verbatim port of `admin/components/dashboard/UsHeatmap.tsx`, plus its supporting `admin/lib/us-geo.ts` and `admin/lib/us-heatmap.ts` (copied unmodified to `admin-web-app/src/lib/`). Loads live TopoJSON (`us-atlas` via CDN) with `d3-geo`/`topojson-client` for the same nation/state/county/neighborhood drill-down as admin. Fed by `buildGeoActivity(sessions)` in `mock-data.ts`, now parameterized to accept live sessions; county/neighborhood tiers stay empty until session GPS → FIPS geocoding ships (same placeholder admin uses). County drill-down uses `CountyTractMap` (MapLibre); tract hover labels resolve to colloquial place names (e.g. Lincoln Park) via **`/api/place-reverse`** (Photon → Nominatim) with a background queue that prioritizes the hovered tract; muted `Tract …` fallback until resolved. **Full-screen place search** (`PlaceSearchField`) uses free **Census (streets) + Photon (places) → Nominatim** via `/api/place-search` (`lib/place-search.ts`, `lib/census-geocode.ts`); optional **Google Places** when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set. After a pick, suggestions stay closed until the user types again; a green MapLibre pin + address popup marks the match (cleared on new typing or exit fullscreen). Shared Places loader: `lib/google-places.ts`. Shared reverse helper: `lib/place-reverse.ts` + client cache in `lib/nominatim.ts`.
- **`/events/new`, `/events/[id]/edit`** (`components/pages/NewEventPage.tsx` + `components/events/*`) — port of `admin/app/(admin)/events/new/page.tsx` + `.../[id]/edit/page.tsx` and `EventForm` / `AddressAutocomplete` / `EventPhotoUpload`. Linked from Events → **+ New Event** and from an event detail page's **Edit event** action. `EventForm` submits to the real `createEvent`/`updateEvent` server actions (`admin-web-app/src/actions/events.ts`) via `useActionState`, writing to Supabase and uploading photos to the `event-photos` bucket. Address field: **US Census verify-on-blur** by default (`verifyEventAddress` → `forwardGeocodeAddress`); when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set, switches to **Google Places Autocomplete**. On save, if `lat`/`lng` are still missing, `geocodeAddress` runs Census first, then **Google Geocoding** if a Maps key is configured (`GOOGLE_MAPS_API_KEY` or `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`). The edit route redirects back to the read-only detail view if `id` doesn't resolve to a real row (mock fixtures aren't editable).
- **`/events/[id]`** (`components/pages/EventDetailPage.tsx` + `components/events/EventDetailActions.tsx` + `components/events/NotifyAtRiskVolunteers.tsx` + `components/events/EventLocationMap.tsx`) — ports `admin/app/(admin)/events/[id]/page.tsx` + `EventDetailActions.tsx` + `NotifyAtRiskVolunteers.tsx`. For a live event, renders Edit/Publish-Unpublish/Delete buttons and an at-risk-volunteer email picker (candidates computed server-side via `buildCourtRisk`); mock fixtures show the original read-only actions panel only. When `lat`/`lng` are present (live rows or the sample fixture), shows a **Location map** via `EventLocationMap` — in-page MapLibre GL JS (`maplibre-gl`) + Carto Voyager *raster* tiles with brand pin (mobile Expo Go WebView uses the same raster style); tap opens Google Maps. Raster avoids blank cream maps when vector tile hosts are blocked. Photo carousel at the top of detail (and list-card thumbnail) use `image_urls` / sample Unsplash placeholders.
- **Events sample fixture** — when Supabase `events` is empty, `EventsPage` falls back to a **single** mock event (`Downtown Riverfront Clean-up`, Example City `42.0417,-87.887`) aligned with mobile `downtownRiverfrontEvent`, including Unsplash photo placeholders and coords for the location map.
- **Period toggle** (`components/ui/PeriodToggle.tsx`) — port of `admin/components/ui/PeriodToggle.tsx` (Today / Month / Year / All / Custom + From–To datepicker; 30-day preset removed). Wired on Home (`/`), Insights (`/insights` + `/analytics`), Sessions (`/sessions`), Feedback (`/feedback`), Payments (`/payments`), and Orders (`/orders`) via URL `period`/`from`/`to` params. **Today** writes `period=day` explicitly (Dashboard/Home bare URLs still default to Today via `parsePeriod`). **Data scope:** Payments reloads server loaders (`paymentsPeriodInterval` — Month = last 6 months); Sessions / Orders / Feedback filter client-side with `filterByListPeriod` (Month = rolling last 30 days); Home / Insights keep calendar month via `periodInterval` / `filterByPeriod`. **Dashboard** Waiting / Approved / Hours metric tiles link to `/sessions?period=all`. Title + PeriodToggle sit in sticky `PageStickyHeader` on those pages (Users uses the same chrome for search + type chips).
- **`/insights`, `/analytics`** (`components/pages/AnalyticsPage.tsx`) — port of `admin/app/(admin)/insights/page.tsx` using `TrendAreaChart`, `HorizontalBarChart`, `CourtProgressChart`, `DonutChart`, and `UsHeatmap`. Prefers live `sessions`/`courtProgress`; when the live list is empty **or the selected period has no live sessions** (All time only mocks when fully empty), injects Insights-only fixtures (`buildInsightsMockSessions` relative to now + `MOCK_COURT_PROGRESS`) and shows `SampleDataBanner`. Sessions/Users loaders stay empty-real. Court progress card: in-card name search, names link to `/volunteers/[id]`, scrolls in place past 5 rows, and an expand control opens a full-screen list (Escape / Exit to close).

### Next Steps
1. **Backend Integration**:
   - ✅ Connect to existing Supabase database (see [Live data wiring](#live-data-wiring))
   - ✅ `/login` + middleware auth gate shipped; keep `BYPASS_AUTH=false` in production. Account **Sign out** (`/profile`) calls `supabase.auth.signOut()` then redirects to `/login`
   - Share user sessions with admin panel (single sign-on across `admin.example.org` and web-app once both are deployed)
   - ✅ `/sessions` moderation actions (approve/decline), `/events` edit/publish/delete/notify, and `/insights` + `/analytics` chart series are now live-wired

2. **Content Development**:
   - Volunteer profile detail pages
   - ✅ Order status — USPS ship (Shippo Buy label + paste tracking + shipped email) vs pickup/local (**Fulfilled**, no tracking)
   - ✅ Bulk session approve, admin notes, hours adjustment, and letterhead PDF generation — now wired (`/sessions` list checkboxes + `SessionPreviewDrawer.tsx`)

3. **API Integration**:
   - ✅ Reused admin's audit logging and Resend notification patterns (`admin-web-app/src/lib/audit.ts`, `resend.ts`, `notify.ts`)
   - Add loading states and error handling around the live-data loaders

4. **Enhanced UI**:
   - Form components
   - Data tables
   - Modal dialogs
   - Toast notifications

## Integration with Existing Systems

### Shared Resources
- **Database**: Same Supabase instance as mobile app and admin — live-wired (see above)
- **Authentication**: Can share auth with admin panel (same `user_metadata.role === 'admin'` convention; `BYPASS_AUTH` supported for local dev)
- **Assets**: Reuse logos, images, branding
- **API Endpoints**: Leverage existing backend services

### Deployment
- **Live on Vercel**: Project `example-admin-web` → https://admin.example.com. **Production deploys** via GitHub Action (`.github/workflows/deploy-admin-web-app.yml`) on `main` pushes that touch `admin-web-app/` (secrets `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID`); manual `cd admin-web-app && vercel --prod` still works. Native Vercel↔GitHub integration isn’t wired — personal-repo owners only can connect, and this repo is owned by `example-user`. Env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_CARTO_BASEMAP_API_KEY`, `BYPASS_AUTH`) are set for Production and Development on Vercel; **Production `BYPASS_AUTH=false`** (signed-out visitors redirect `/` → `/login`). Preview env vars still need to be added manually in the Vercel dashboard (CLI non-interactive add hit a `git_branch_required` prompt for the Preview target).
- **Netlify**: Alternative static hosting (not used)
- **Subdomain**: consider `app.example.org` once DNS is ready

## Architecture Benefits

### Separation of Concerns
- **Mobile App** (`frontend/`): Native user experience
- **Web App** (`admin-web-app/`): Production admin console (Vercel)
- **Archived admin** (`admin/`): Legacy Next portal — migrations in `admin/db/` only; see [admin/README.md](../admin/README.md)
- **Backend** (`backend/`): Shared services

### Progressive Enhancement
- Admin product work continues in `admin-web-app/`
- Legacy `admin/` is frozen reference + SQL migrations
- Independent deployment cycles for mobile / admin-web-app / Fly

### Technology Alignment
- **React**: Shared component patterns
- **TypeScript**: Consistent type safety
- **Tailwind**: Unified styling approach
- **Modern Tooling**: Better developer experience

## Component Architecture

### Sidebar System
```typescript
// Context-based state management
const { open, setOpen, animate } = useSidebar();

// Responsive components
<SidebarBody>          // Wrapper for desktop + mobile
  <DesktopSidebar />   // Auto-expanding desktop version
  <MobileSidebar />    // Full-screen mobile overlay
</SidebarBody>

// Navigation links
<SidebarLink link={{
  label: "Dashboard",
  href: "/dashboard", 
  icon: <LayoutDashboard />
}} />
```

### Animation Features
- **Framer Motion**: Smooth width transitions
- **Desktop rail:** collapsed `72px` is the SSR/first-paint width (`initial={false}`) so hover-expand does not hydrate-mismatch
- **Hover States**: Interactive feedback
- **Mobile Gestures**: Touch-friendly interactions
- **Performance**: GPU-accelerated animations

## Customization Guide

### Branding
- Logo: Update `Logo` and `LogoIcon` components
- Colors: Modify Tailwind classes (currently using green theme)
- Typography: Adjust font families in `globals.css`

### Navigation
- Links: Edit the `links` array in `sidebar-demo.tsx`
- Icons: Use Lucide React or custom SVGs
- Routes: Add new pages in `src/app/`

### Styling
- Theme: Modify CSS variables in `globals.css`
- Components: Update Tailwind classes
- Responsive: Adjust breakpoints as needed

## Performance Considerations

### Optimizations
- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Next.js Image component
- **Font Loading**: Optimized web fonts
- **Bundle Size**: Tree shaking and compression

### Monitoring
- **Core Web Vitals**: Next.js built-in metrics
- **Analytics**: Google Analytics or similar
- **Error Tracking**: Sentry or similar service
- **Performance**: Lighthouse audits

## Security

### Best Practices
- **Authentication**: Secure token handling
- **Authorization**: Role-based access control
- **Input Validation**: Client and server-side
- **XSS Protection**: Next.js built-in security

### Integration Security
- **CORS**: Configure for backend APIs
- **CSP**: Content Security Policy headers
- **HTTPS**: Enforce secure connections
- **Environment Variables**: Secure config management