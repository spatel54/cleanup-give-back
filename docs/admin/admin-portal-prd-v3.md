# PRD: CleanUpGiveBack Admin Web App

**Version:** 3.0  
**Date:** 2026-08-03  
**Supersedes:** [admin-portal-prd.md](admin-portal-prd.md) (v2.0, 2026-07-21 — kept for history)  
**Status:** Living — reflects shipped product + near-term roadmap  
**Audience:** Admin (primary admin), engineering  
**Codebase:** `admin-web-app/` (Next.js App Router)  
**Living impl notes:** [admin-web-app.md](../admin-web-app.md) · [current.md](../current.md)

---

## 1. Overview

The Admin Web App is a **responsive Next.js console** for Admin to operate Clean Up - Give Back day to day. It is the **production admin product** (Vercel project `example-admin-web`).

| | |
|---|---|
| **Local** | http://localhost:3000 (`cd admin-web-app && npm run dev`) |
| **Production** | https://admin.example.com |
| **Target domain** | `admin.cleanupgiveback.org` (DNS deferred — near-term) |

Admin gets a single pane of glass over:

- Volunteer cleanup sessions (review, approve/decline, hours override, notes, letterheads)
- Session evidence (walking path replay + checkpoint photos)
- Users directory (volunteers + court-hours progress in one place)
- Events (create/edit/publish + notify at-risk court-ordered volunteers)
- Feedback, shop orders, payments/donations rollups, insights charts
- Transactional email side effects (Resend) and audit writes on mutations

The app is **read-write against the same Supabase Postgres** as the mobile Expo app (`frontend/`) and Fly sessions API (`backend/sessions/`). The legacy portal under `admin/` is **archived** — keep `admin/db/*.sql` for migrations only.

---

## 2. Goals

| # | Goal | Status (2026-08-03) |
|---|------|---------------------|
| G1 | Approve / decline / flag sessions without Supabase dashboard | **Shipped** (approve/decline + bulk approve; invalid status retired from UI) |
| G2 | Adjust session hours + admin notes | **Shipped** (session preview drawer) |
| G3 | Individual session letterhead PDF | **Shipped** (proxy → Fly `backend/sessions`) |
| G4 | Bulk letterhead PDF per volunteer / date range | **Shipped** (API route + volunteer profile flows) |
| G5 | Court-ordered progress visibility | **Shipped** via **Users** (`/users`, court filter) + volunteer profile + Insights; dedicated `/court-hours` list redirects to Users |
| G6 | Shop orders + shipping status | **Mostly shipped** (list + detail + fulfillment form); depends on real `shop_orders` writers (Stripe still pending on mobile) |
| G7 | Read volunteer feedback | **Shipped** (live table + rating filters); **blocker:** mobile feedback still UI-only — rows stay empty until `POST /feedback` persists |
| G8 | Create / edit / publish cleanup events | **Shipped** (photos, geocode, at-risk notify) |
| G9 | Email Admin when a session awaits review | **Shipped** on Fly finalize → Resend (`ADMIN_NOTIFY_EMAIL`) |
| G10 | Email / push volunteer on approve or decline | **Shipped** (soft-fail if Resend / push token missing) |
| G11 | CSV (and printable PDF table) export for filtered lists | **Shipped** (client `ExportMenu` / `export-download`) |
| G12 | Audit log of admin mutations | **Partial** — writes to `admin_audit_log` on mutations; **dedicated viewer UI** not in nav (near-term) |
| G13 | Usable on desktop, tablet, and phone (≥320px) | **Shipped** (hamburger &lt;1024px; hover rail ≥1024px) |
| G14 | Production admin login (Supabase email/password + admin claim) | **Required product goal** — **temporarily bypassed** via `BYPASS_AUTH` for local/demo; must re-enable before treating production as secure |
| G15 | Hosted production ops (Vercel env, Resend on Vercel, custom domain) | **Partial** — Vercel live; Resend env still needed on Vercel; custom domain near-term |

---

## 3. Non-Goals

| Item | Notes |
|------|--------|
| Multi-admin RBAC | Single Admin admin for now; staff/read-only roles later |
| Stripe refunds / disputes in-app | Link out to Stripe Dashboard |
| Changing mobile or Fly schemas for admin-only convenience | Additive migrations only (`admin/db/`) |
| Reviving archived `admin/` Next app | Do not run or deploy; ports land in `admin-web-app/` |
| Full map geocoding → county/neighborhood heatmap tiers | Nation/state tiers live; FIPS drill-down deferred |
| Processing live shop/donate money inside admin | Payments UI reads `shop_orders` / `donations`; Stripe writers are a mobile/`backend/payments` dependency |

**Changed since v2:** Map **replay** of walking paths *is* in scope and **shipped** in the session drawer (MapLibre). Volunteer password resets / banning remain out of scope (Admin edits her own account on `/profile`).

---

## 4. Users

| Role | Description |
|------|-------------|
| **Admin (Admin)** | Full read/write over portal sections; `user_metadata.role === 'admin'` |
| *(future) Staff* | Read-only reviewer — out of scope |

---

## 5. Product architecture

| Concern | Choice |
|---------|--------|
| Framework | Next.js App Router, TypeScript (`admin-web-app/`) |
| Styling | Tailwind CSS + brand tokens — see [brand-web.md](brand-web.md) |
| Auth (target) | Supabase Auth email/password; middleware enforces admin claim |
| Auth (current interim) | `BYPASS_AUTH=true` skips cookie auth for local/demo — **not a production posture** |
| Data | Supabase RSC loaders (`live-data.ts`) + Server Actions; empty tables → fixtures + **Sample data** banner |
| PDFs | Fly service letter endpoints proxied by `app/api/service-letter/**` |
| Email | Resend (`RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL`) |
| Push | Expo Push via `user_metadata.push_token` (soft-skip if missing) |
| Maps | MapLibre GL JS (session route + event location) |
| Hosting | Vercel (`example-admin-web`) |
| Migrations | Shared SQL under `admin/db/` |

### Isolation

- Product code lives in **`admin-web-app/`** only.
- Shared DB with mobile/Fly; do not break mobile contracts.
- Prefer porting patterns from archived `admin/` rather than re-inventing.

---

## 6. Data model

Additive schema (see `admin/db/*.sql`). Highlights:

- `sessions`: `adjusted_hours`, `admin_notes`, `letterhead_generated_at`, optional `decline_reason` (volunteer-facing)
- `volunteer_feedback`, `shop_orders`, `donations`, `events` (+ `image_urls`), `court_orders` (`user_id` UNIQUE), `admin_audit_log`, `event_volunteer_notices`
- Storage: `session-photos`, `event-photos`
- Checkpoint GPS: `admin/db/007_checkpoint_coordinates.sql` for trail photo pins

RLS and JWT checks use `user_metadata.role === 'admin'` (not a top-level JWT `role`). Contracts: [refinement-contracts-2026-07-28.md](refinement-contracts-2026-07-28.md).

---

## 7. Feature specifications (as-built + deltas)

Status tags: **Shipped** · **Partial** · **Near-term** · **Blocked (external)**

### 7.1 Authentication — Login & Logout — Partial (logout shipped; bypass may still be on for demo)

**Product requirement (unchanged from v2 intent):**

- Login at `/login`: email + password via Supabase Auth; no self-serve sign-up. **Shipped** in `admin-web-app` with branded subtle gradient-bars background.
- Guard all admin routes; deny non-`admin` claim with Access denied. **Shipped** via `src/middleware.ts` when `BYPASS_AUTH` is off.
- Logout from Account (`/profile`) → `signOut()` → `/login`. **Shipped** (`ProfilePage` Sign out).
- Session expiry: Supabase JWT refresh; banner on lapse. **Near-term**.

**Current interim:** `BYPASS_AUTH` may skip auth so Admin/eng can demo without login friction; `/login` remains reachable for UI preview while bypass is on. Treat bypass as **temporary**. Before calling production secure:

1. Set `BYPASS_AUTH=false` on Vercel production (and keep it false).
2. Ensure the admin's Auth user has `user_metadata.role = 'admin'`.
3. Verify middleware / layout / Server Actions / `assertAdmin` all enforce the claim when bypass is off.
4. Smoke-test login, denied non-admin, logout, and an approve action end-to-end.

Ops/login notes: [accounts-and-access.md](../accounts-and-access.md).

---

### 7.2 Dashboard / Home — Shipped

Routes: `/`, `/dashboard`.

- KPI strip, recent under-review activity, commerce preview cards, interactive **US heatmap** (nation → state; county/neighborhood placeholders until FIPS geocoding).
- Period toggle (`period` / `from` / `to` URL params).
- Search/filter workbench patterns from feature batch.

---

### 7.3 Sessions list — Shipped

Route: `/sessions`.

- Filters: status (incl. **Active**), search, court-ordered, period.
- Inline Approve / Decline (decline reason modal); **bulk approve** via checkboxes.
- Volunteer name → `/volunteers/[user_id]` without opening the drawer.
- Export menu (CSV / printable table) where wired.
- No **Mark Invalid** in UI (legacy `invalid` rows display as Declined).

---

### 7.4 Session review (drawer) — Shipped

Primary UX: **`SessionPreviewDrawer`** (not a separate long-lived `/sessions/[id]` product surface in `admin-web-app`).

| Panel | Behavior |
|-------|----------|
| Session info | Activity, times, duration, distance, court flag |
| Walking path | MapLibre polyline from `sessions.route`; Play / Pause / Replay; fullscreen; Start/End; square rounded checkpoint thumbs on trail (tap to enlarge) |
| Photos | Signed `session-photos` grid + lightbox |
| Admin actions | Approve / Decline, hours adjust, admin notes, letterhead download |

Evidence loads via `loadSessionEvidence`. Mock mode uses honest placeholders.

---

### 7.5 Letterhead (individual + bulk) — Shipped

- Proxies: `/api/service-letter/[sessionId]`, `/api/service-letter/bulk/[volunteerId]`.
- Requires `SESSIONS_API_URL` + `ADMIN_API_KEY`.
- Stamps `letterhead_generated_at` on success.
- Spec alignment: [service-letter-pdf.md](../frontend/specs/service-letter-pdf.md).

---

### 7.6 Users / Volunteers — Shipped

| Route | Role |
|-------|------|
| `/users` | Primary directory (volunteers + court progress; court filter) |
| `/volunteers` | Alias / same directory loaders |
| `/volunteers/[id]` | Profile: sessions, court order, **Miles Walked** KPI (sum approved `distance_miles`), letterhead entry points |
| `/court-hours` | Redirect → Users with court filter (v2 dedicated page folded in) |

Court order upsert (required hours / due date / case ref) remains a refinement contract when the form is exposed — see contracts doc.

---

### 7.7 Feedback — Partial (admin UI shipped; mobile write Blocked)

Route: `/feedback`.

- Live `volunteer_feedback` + rating filter chips (All / Excited → Very Sad); distribution columns toggle filter.
- Flag / follow-up behaviors as implemented in page components.

**External dependency:** Mobile `/session-feedback` and `/give-feedback` do not yet persist. Need Fly `POST /feedback` (or equivalent) + app wire-up before KPIs reflect production usage.

---

### 7.8 Events — Shipped

| Route | Capability |
|-------|------------|
| `/events` | List published/draft |
| `/events/new`, `/events/[id]/edit` | Create/edit; photos → `event-photos`; Census / optional Google Places geocode |
| `/events/[id]` | Detail, location map, Edit / Publish / Delete, **Notify at-risk volunteers** (Resend + `event_volunteer_notices`) |

Published rows feed the mobile Upcoming Events strip.

---

### 7.9 Orders — Shipped (data-dependent)

| Route | Capability |
|-------|------------|
| `/orders` | List, search, period, status filters |
| `/orders/[id]` | Detail, copy address, **Update Fulfillment** (status / carrier / tracking → `updateOrderFulfillment` + audit) |

Live rows require `shop_orders` population from a real checkout path (Stripe pending).

---

### 7.10 Payments — Partial

Route: `/payments`.

- Monthly revenue bars; Donations vs Shop filters; shop item breakdown (kit / tote / grabber / vests).
- Donations read `public.donations` (fixtures until mobile donate writes).
- External “Manage in Stripe” remains acceptable until in-app refunds are scoped.

---

### 7.11 Insights / Analytics — Shipped

Routes: `/insights`, `/analytics` (same analytics surface).

- Trend, queue age, decisions, court progress, donuts, US heatmap.
- Period toggle; chart series re-scoping by period may still deepen over time.

---

### 7.12 Notifications — Shipped (ops env Near-term)

| Flow | Trigger | Channel |
|------|---------|---------|
| G9 inbound | Fly finalize → `under_review` | Resend → `ADMIN_NOTIFY_EMAIL` |
| G10 outbound | Admin approve/decline | Resend + Expo Push |
| Events | Notify at-risk | Resend |

Soft-fail when keys missing. Set Resend vars on your own admin host if hosted approve/decline email is required.

---

### 7.13 Audit log — Partial → Near-term UI

- **Shipped:** `writeAuditLog` on mutations (sessions, orders, events, etc.).
- **Near-term:** Dedicated `/audit-log` viewer (filters by date/action) and optional nav entry. v1 intentionally removed Audit Log from nav; restore when Admin needs browseable history.

---

### 7.14 CSV / export — Shipped

Client-side CSV download + printable HTML table via `ExportMenu` / `export-download`. Expand column coverage on Users / court views as needed to match v2 court CSV columns.

---

### 7.15 Profile / Settings — Partial

| Route | Notes |
|-------|-------|
| `/profile` | Name / email / password edit (real persist when auth on); password show/hide toggles |
| `/settings` | App settings chrome |

Full value of profile edits assumes **§7.1 auth enabled**.

---

## 8. Navigation (current)

```
Admin Web App
├── /login                    → Auth (target; bypassed while BYPASS_AUTH=true)
├── / , /dashboard            → Home
├── /sessions                 → Sessions (+ preview drawer)
├── /users                    → Users (volunteers + court)
│   ├── /volunteers           → same directory
│   └── /volunteers/[id]      → Volunteer profile
├── /insights , /analytics    → Insights
├── /feedback                 → Feedback
├── /events                   → Events
│   ├── /events/new
│   ├── /events/[id]
│   └── /events/[id]/edit
├── /orders                   → Orders
│   └── /orders/[id]
├── /payments                 → Payments
├── /profile                  → Admin account
├── /settings                 → Settings
└── /audit-log                → Near-term viewer (may lack nav until restored)
```

Shell: hover-expand icon rail ≥ `lg` (1024px); top bar + overlay drawer below.

---

## 9. Responsive design

| Breakpoint | Layout |
|------------|--------|
| &lt; 640px | Single-column cards; stacked toolbars |
| 640–1023px | 2-col KPI/chart grids; hamburger shell |
| ≥ 1024px | Persistent hover sidebar; full tables |

Targets ≥ 44×44 px. Audits: [mobile-responsiveness-audit-2026-07-28.md](mobile-responsiveness-audit-2026-07-28.md), [a11y-audit-2026-07-22.md](a11y-audit-2026-07-22.md).

---

## 10. Motion & brand

- Framer Motion; prefer transform/opacity; honor `prefers-reduced-motion`.
- Full motion/brand token tables: retain v2 §10–11 spirit; canonical web tokens in [brand-web.md](brand-web.md) (scope note: apply to `admin-web-app/`, not archived `admin/`).
- Copy tone: direct (“Approve”, “Decline”, “Generate”); errors name the fix; no volunteer-facing emoji chrome.

---

## 11. Security

| Rule | Detail |
|------|--------|
| Admin claim | `user_metadata.role === 'admin'` everywhere (middleware, layouts, actions, API) |
| Bypass | `BYPASS_AUTH` local/demo only; **false in production** |
| Service role | Server-only; never shipped to the browser |
| Mutations | Write `admin_audit_log` |
| Secrets | Documented in [accounts-and-access.md](../accounts-and-access.md) — never commit `.env.local` |

---

## 12. External dependencies

| Dependency | Why |
|------------|-----|
| Supabase project + migrations | Shared truth with mobile |
| Fly `example-sessions` | Session lifecycle, Admin “ready for review” email, service-letter PDFs |
| Resend + verified `cleanupgiveback.org` | Admin + Fly transactional mail |
| Mobile feedback API write | Populate `/feedback` |
| Stripe / payments writers | Real `/orders` + `/payments` (non-fixture) |
| Optional Google Maps key | Places autocomplete + geocode fallback for events |
| Vercel env parity | Supabase + Resend + letterhead keys on Production (and Preview) |

---

## 13. Near-term roadmap

Prioritized for stakeholder + eng — **includes auth even while currently bypassed**.

| Priority | Item | Outcome |
|----------|------|---------|
| P0 | **Re-enable production auth** | `BYPASS_AUTH=false` on Vercel; login/logout/claim guard verified; profile password change works against real Auth |
| P0 | **Vercel Resend env** | Hosted approve/decline + notify-at-risk emails succeed |
| P1 | **Custom domain** | `admin.cleanupgiveback.org` (or chosen host) → Vercel |
| P1 | **Audit log viewer** | Browseable `/audit-log` (+ optional nav) |
| P1 | **Court-hours authoring** | Upsert required hours / due date / case ref from Users or volunteer profile |
| P2 | **Order fulfillment polish** | Status/tracking reliability on live rows; toast/error UX consistency |
| P2 | **CSV column parity** | Sessions + court exports match reporting needs for filings |
| P2 | **Mobile feedback persistence** | Unblock G7 with real `volunteer_feedback` rows |
| P3 | **Stripe-backed commerce** | Live shop/donate → admin lists without Sample data |
| P3 | **Heatmap FIPS tiers** | County/neighborhood activity when GPS→FIPS pipeline exists |
| P3 | **Multi-admin / RBAC** | Explicitly deferred |

---

## 14. Acceptance criteria

| ID | Criterion | State |
|----|-----------|-------|
| AC1 | Admin can approve/decline under-review sessions; volunteer notified when Resend configured | Met (local/Fly); Vercel Resend pending |
| AC2 | Admin can adjust hours and save admin notes; values persist on `sessions` | Met |
| AC3 | Individual + bulk letterhead PDFs download when Fly + admin API key set | Met |
| AC4 | Users directory shows court progress; volunteer profile shows miles + hours | Met |
| AC5 | Events CRUD + publish reflects on mobile feed | Met |
| AC6 | Order detail can update status/tracking when live orders exist | Met (form); data volume depends on Stripe |
| AC7 | Dashboard/Insights render live or Sample data without crash | Met |
| AC8 | Session drawer shows route + photos when evidence exists | Met |
| AC9 | Production requires admin login; bypass off | **Not met** while bypass intentionally on |
| AC10 | All mutations leave an audit row; Admin can browse them | Writes met; browse UI near-term |
| AC11 | Responsive shell usable on phone and desktop | Met |

---

## 15. Environment checklist

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + RSC Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Server loaders / Auth Admin / privileged writes |
| `BYPASS_AUTH` | Temporary auth skip — **false in production** |
| `RESEND_API_KEY` / `EMAIL_FROM` / `ADMIN_NOTIFY_EMAIL` | Outbound admin mail |
| `SESSIONS_API_URL` / `ADMIN_API_KEY` | Letterhead proxy |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` / `GOOGLE_MAPS_API_KEY` | Optional event address UX |

Template: `admin-web-app/.env.local.example`.

---

## 16. Doc map

| Doc | Role |
|-----|------|
| This file (v3) | Product requirements + status |
| [admin-portal-prd.md](admin-portal-prd.md) | Historical v2 (pre–`admin-web-app` rename / archive) |
| [admin-web-app.md](../admin-web-app.md) | Implementation detail / route loaders |
| [current.md](../current.md) | What runs today |
| [admin-feature-batch-2026-07-28.md](admin-feature-batch-2026-07-28.md) | Users merge, commerce cards, etc. |
| [refinement-contracts-2026-07-28.md](refinement-contracts-2026-07-28.md) | Side-effect + schema contracts |

---

## 17. Revision history

| Ver | Date | Notes |
|-----|------|-------|
| 2.0 | 2026-07-21 | Original admin portal PRD (`admin/`) |
| 3.0 | 2026-08-03 | Rebased on shipped `admin-web-app/`, Vercel host, Users merge, session drawer evidence, Resend ops, near-term roadmap; auth kept as explicit goal while temporarily bypassed |
