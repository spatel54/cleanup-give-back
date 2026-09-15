# PRD: CleanUpGiveBack Admin Portal

> **Superseded by [admin-portal-prd-v3.md](admin-portal-prd-v3.md)** (2026-08-03). This v2 file is kept for history. The production product is `admin-web-app/` (not archived `admin/`).

**Version:** 2.0  
**Date:** 2026-07-21  
**Author:** Product  
**Status:** Historical — superseded by v3  
**Audience:** Admin (primary admin), engineering team  

---

## 1. Overview

The Admin Portal is a **responsive web application** accessible at a dedicated subdomain (e.g., `admin.example.org`). It gives Admin a single pane of glass over:

- All volunteer cleanup sessions and their approval lifecycle
- Session letterhead generation — individual per session **and** bulk per volunteer across a date range
- Volunteer directory with cumulative court-ordered hours tracking
- Shop orders and shipping status
- Payment/donation activity
- Volunteer feedback (emoji ratings + comments)
- Cleanup event management
- Automated notifications (inbound to Admin; outbound to volunteers on status changes)
- Admin audit log

The portal is **read-write over the same Supabase Postgres database** the mobile app uses. A new admin-scoped Supabase role with RLS policies restricts access to admin-only operations.

---

## 2. Goals

| # | Goal |
|---|------|
| G1 | Admin can approve, deny, or flag sessions without Supabase dashboard access |
| G2 | Admin can adjust session hours (override computed duration) for court-ordered hours tracking |
| G3 | Admin can generate a PDF letterhead per individual session |
| G4 | Admin can generate a bulk letterhead PDF covering all approved sessions for a volunteer in a date range |
| G5 | Admin can see each court-ordered volunteer's progress toward their required hours |
| G6 | Admin can view all shop orders and their shipping status |
| G7 | Admin can read all volunteer feedback submitted in the app |
| G8 | Admin can create and edit cleanup events that appear in the mobile app |
| G9 | Admin receives an email alert when a new session is submitted for review |
| G10 | Volunteers receive an email/push notification when Admin approves or declines their session |
| G11 | Admin can export filtered session data to CSV for court filings and reporting |
| G12 | All admin mutations are logged and viewable in an audit log |
| G13 | The portal is fully usable on desktop and mobile (responsive, min 320 px) |

---

## 3. Non-Goals (v1)

- Multi-admin / role-based permissions (only Admin in v1)
- Stripe refund / dispute management (link to Stripe dashboard is sufficient)
- Map replay inside admin portal
- Volunteer account management (password resets, banning)
- **No changes to the existing mobile app** — the admin portal is a completely separate Next.js project. It reads/writes the same Supabase Postgres database but touches zero files inside `frontend/`, `backend/sessions/`, or any existing app code. The mobile app must continue to function identically before and after the admin portal is built.
- **No production deployment for now** — preview and development via `localhost` only. Vercel and subdomain configuration are deferred until the feature set is reviewed and approved.

---

## 4. Users

| Role | Description |
|------|-------------|
| **Admin (Admin)** | Single org admin; full read/write over all portal sections |
| *(future) Staff* | Read-only reviewer — out of scope for v1 |

---

## 5. Tech Stack

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Framework | Next.js 15 (App Router, TypeScript) | SSR + RSC for fast first load; matches org expertise |
| Styling | Tailwind CSS | Brand tokens already defined; rapid responsive layout |
| Auth | Supabase Auth — email/password, admin role claim | No anon auth; Admin logs in with email + password |
| Data | Supabase JS client (server-side RSC + client mutations) | Same DB already used by mobile app |
| Animation | Framer Motion | Spring-based interactions; Emil Kowalski motion principles |
| PDF generation | `@react-pdf/renderer` (server action) | Runs in Node; no headless browser needed; supports individual + bulk |
| CSV export | `papaparse` or `json2csv` (server action stream) | Lightweight; streams directly to client |
| Email notifications | Resend (already partially wired for event registration) | Consistent with existing transactional email setup |
| Push notifications | Expo Push Notifications API | Volunteers already use Expo; no additional SDK needed |
| Hosting | localhost only (v1) | No deployment until feature set reviewed |
| Responsive breakpoints | Mobile-first: `sm` 640 px, `md` 768 px, `lg` 1024 px | Admin uses laptop and iPad |

---

## 6. Data Model — DB Migration

Additive migration on top of the existing `sessions` + `checkpoints` schema. **No drops, no renames, no modifications to existing columns or tables.**

```sql
-- Extend sessions table
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS adjusted_hours numeric,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS letterhead_generated_at timestamptz;

-- Volunteer feedback (mobile app must call POST /feedback to populate)
CREATE TABLE IF NOT EXISTS public.volunteer_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  session_id uuid REFERENCES public.sessions ON DELETE SET NULL,
  source text NOT NULL CHECK (source IN ('session', 'account')),
  rating text CHECK (rating IN ('excited', 'happy', 'neutral', 'sad', 'very_sad')),
  comment text,
  flagged boolean DEFAULT false,
  submitted_at timestamptz DEFAULT now()
);

-- Shop orders (requires backend/payments/ service)
CREATE TABLE IF NOT EXISTS public.shop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  items jsonb NOT NULL,
  total_cents int NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','shipped','delivered','cancelled')),
  shipping_address jsonb,
  tracking_number text,
  carrier text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cleanup events (managed by Admin via admin portal)
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location text,
  address text,
  lat numeric,
  lng numeric,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  what_to_bring text,
  organizer text,
  image_url text,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Court-ordered volunteer hours requirements
CREATE TABLE IF NOT EXISTS public.court_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  required_hours numeric NOT NULL,
  due_date date,
  case_reference text,
  created_at timestamptz DEFAULT now()
);

-- Admin audit log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  target_table text NOT NULL,
  target_id uuid,
  before_value jsonb,
  after_value jsonb,
  performed_at timestamptz DEFAULT now()
);
```

---

## 7. Feature Specifications

### 7.1 Authentication — Login & Logout

- **Login screen (`/login`):** email + password via Supabase Auth. No sign-up UI (the admin's account provisioned manually by developer).
- **Session guard:** all `/` routes redirect to `/login` when unauthenticated.
- **Admin claim check:** on login, verify `user_metadata.role === 'admin'`. Unauthorized users see "Access denied" — not redirected to app.
- **Logout:** top-right nav avatar → "Sign out" → calls `supabase.auth.signOut()` → redirects to `/login`. Clears all local session state.
- **Session expiry:** Supabase default 1-hour JWT + auto-refresh via `onAuthStateChange`. Shows "Session expired — please log in again" banner if the token lapses.

---

### 7.2 Dashboard / Home

Landing page after login. At-a-glance counts:

| Metric | Source |
|--------|--------|
| Sessions Under Review | `status = under_review` count |
| Approved This Month | `status = approved`, `ended_at` in current month |
| Declined This Month | `status = not_approved`, this month |
| Open Shop Orders | `shop_orders.status IN ('pending','paid','shipped')` |
| Total Approved Volunteer Hours | sum of `adjusted_hours ?? duration_seconds/3600` for approved sessions |
| Avg Feedback Rating | emoji label from average score of this month's `volunteer_feedback` |

Layout: 3-up on mobile, 6-up on desktop. **"Needs attention" banner** when `under_review` count > 0.

Recent activity feed (last 10 `under_review` sessions) → links to session detail.

---

### 7.3 Sessions List

**Route:** `/sessions`

#### Filters
- Status chips: All · Under Review · Approved · Declined · Invalid
- Search: volunteer name / session ID
- Date range picker
- Court-ordered toggle
- Sort: Newest · Oldest · Volunteer Name · Duration

#### Table columns (desktop) / card rows (mobile)

| Column | Notes |
|--------|-------|
| Volunteer Name | `auth.users.user_metadata.full_name` |
| Date | `started_at` as `Mon DD, YYYY` |
| Duration | `adjusted_hours ?? duration_seconds/3600` |
| Distance | miles |
| Status | colored chip |
| Court Ordered | badge icon when true |
| Photos | checkpoint count |
| Actions | Approve · Decline · View · Letterhead |

Pagination: 25 rows/page. **CSV Export button** at top-right — exports current filter result.

---

### 7.4 Session Detail

**Route:** `/sessions/[id]`

Two-column on desktop; single-column on mobile.

#### Session Info panel
- Volunteer name + user ID
- Activity type, description, court-ordered flag
- Started / ended timestamps
- Duration (computed + adjusted if set; "Adjusted by admin" label)
- Distance, checkpoint count

#### Photos panel
- Selfie + progress photo grid per checkpoint with timestamp pills
- Tap to enlarge (lightbox)
- Signed Supabase Storage URLs (1-hour expiry, auto-refreshed)

#### Admin Actions panel

| Action | Behavior |
|--------|----------|
| Approve | `status = approved`; triggers volunteer notification |
| Decline | `status = not_approved`; optional reason → `admin_notes`; triggers volunteer notification |
| Mark Invalid | `status = invalid` |
| Adjust Hours | Decimal input (e.g. `1.5`); saves to `adjusted_hours`; shown as "Adjusted to Xh Ym" |
| Admin Notes | Multi-line textarea; `admin_notes`; admin-only |
| Generate Letterhead (this session) | Single-session PDF download |
| Generate Bulk Letterhead (this volunteer) | Opens date-range picker → bulk PDF download |

Status transitions:
- `under_review` → `approved`, `not_approved`, `invalid`
- `approved` ↔ `not_approved` (appeal / correction)

---

### 7.5 Approve / Decline Inline

Quick-action from Sessions List row: confirmation popover without full navigation.
- Approve: one-click confirm → chip updates.
- Decline: popover with optional reason field → confirm.

---

### 7.6 Letterhead Generation (Individual + Bulk)

#### Individual Letterhead

**Trigger:** "Generate Letterhead (this session)" on Session Detail.  
**Output:** `CGB-Letterhead-{sessionId}-{YYYY-MM-DD}.pdf`

PDF layout (volunteer + admin — same generator on Fly):

```
Page 1: Org letter
  [Logo]  address / phone / Tax ID
  Date, Dear {volunteer}, hours from {start} to {end} total {hours}
  Stewardship copy + Admin signature PNG + Executive Director block

Pages 2–N: One page per session (chronological)
  Activity title, start/end/duration/miles
  Static OSM map with GPS route polyline
  Checkpoint selfie + progress photos (signed URLs embedded)
```

**Trigger (volunteer):** Session detail **Download PDF** or Sessions list multi-select **Download PDF**.  
**Trigger (admin):** Session detail Letterhead links → `admin/app/api/service-letter/…` proxy.  
**Output:** `CGB-Service-Letter-{YYYY-MM-DD}.pdf` (or `-multi` suffix).

After generation: set `letterhead_generated_at = now()`. Show "Last generated: {date}" on session detail.

---

#### Bulk Letterhead

**Trigger:** "Generate Bulk Letterhead (this volunteer)" on Session Detail **or** from Volunteer Profile (`/volunteers/[id]`) with a date-range picker.  
**Default date range:** current month.  
**Scope:** all `approved` sessions for that volunteer within the range.  
**Output:** `CGB-Letterhead-{volunteerId}-{YYYY-MM-DD}-bulk.pdf`

PDF structure:
```
Page 1: Cover / Summary
  [Org Logo]
  CLEAN UP - GIVE BACK — Volunteer Service Verification
  Volunteer:        {full_legal_name}
  Period:           {start_date} – {end_date}
  Total Sessions:   {count}
  Total Hours:      {sum adjusted_hours ?? computed for approved sessions}
  Total Distance:   {sum distance_miles} miles
  Court Ordered:    {Yes / No}
  Generated:        {today}

Pages 2–N: One abbreviated session page per approved session
  (same fields as individual; no repeated signature block)

Final page: Signature / Attestation
  ________________________________
  [the admin's Name], Program Administrator
  Clean Up - Give Back
```

Zero sessions in range → inline error: "No approved sessions in this range — adjust the dates and try again." No PDF generated.

**Implementation:** Next.js Server Action + `@react-pdf/renderer`. Fetches all approved sessions in one Supabase query, generates multi-page PDF, streams to client as `application/pdf`.

---

### 7.7 Volunteer Directory

**Route:** `/volunteers`

#### Filters
- Search by name
- Court-ordered toggle
- Sort: Name A–Z, Total Hours ↓, Sessions ↓, Joined ↓

#### Table columns (desktop) / cards (mobile)

| Column | Notes |
|--------|-------|
| Name | `user_metadata.full_name` |
| Joined | `created_at` |
| Total Sessions | count all statuses |
| Approved Sessions | count `approved` |
| Total Approved Hours | sum `adjusted_hours ?? duration_seconds/3600` for approved |
| Court Ordered | badge if `court_orders` row exists |
| Court Hours Progress | `{approved} / {required} hrs` progress bar (court-ordered only) |
| Actions | View Profile · Generate Bulk Letterhead |

---

### 7.8 Volunteer Profile

**Route:** `/volunteers/[id]`

- Volunteer name, join date, user ID
- Court order details: required hours, due date, case reference, progress bar
- Sessions table (all statuses, same columns as Sessions List filtered to this volunteer)
- Feedback submissions from this volunteer
- **Generate Bulk Letterhead** button with date-range picker
- **Generate Individual Letterhead** links through to each session's detail

---

### 7.9 Court-Hours Tracker

**Route:** `/court-hours`

| Column | Notes |
|--------|-------|
| Volunteer | name |
| Case Reference | `court_orders.case_reference` |
| Due Date | formatted; red if past due |
| Required | `required_hours` |
| Completed | sum approved hours |
| Remaining | `required_hours - completed`, floored at 0 |
| Progress | bar: green ≥ 100%, amber 50–99%, red < 50% |
| Status | **On Track · At Risk · Complete · Overdue** |
| Actions | View Profile · Generate Bulk Letterhead |

Admin can add/edit a court order for a volunteer inline (required hours, due date, case reference).

---

### 7.10 Volunteer Feedback

**Route:** `/feedback`

> **Dependency:** Mobile `FeedbackScreen` currently persists nothing. A `POST /feedback` endpoint must be added to the Fly API and called by the app before this view populates.

#### Summary bar
- Average emoji rating (icon + label) for current month
- Total submissions this month
- % positive (Excited + Happy)

#### Feedback List

| Column | Notes |
|--------|-------|
| Date | `submitted_at` |
| Volunteer | name |
| Source | chip: Post-Session · Account |
| Rating | emoji glyph + label |
| Comment | truncated 120 chars; expand on click |
| Session | link to `/sessions/[id]` when `session_id` set |
| Flag | toggle to mark for follow-up |

Filters: date range, rating (multi-select), source.

---

### 7.11 Shop Orders

**Route:** `/orders`

> **Dependency:** `backend/payments/` service and `shop_orders` table must exist before this view populates.

#### Order List

| Column | Notes |
|--------|-------|
| Order ID | short UUID |
| Volunteer | name |
| Date | `created_at` |
| Items | summarized ("Trash Kit × 1, Tote × 2") |
| Total | formatted USD |
| Status | chip: Pending · Paid · Shipped · Delivered · Cancelled |
| Tracking | number + carrier link if set |
| Actions | View · Update Status · Add Tracking |

#### Order Detail (`/orders/[id]`)
- Line items table: product, qty, unit price, total
- Formatted shipping address
- Status dropdown + save
- Tracking number + carrier input

---

### 7.12 Payments Summary

**Route:** `/payments`

- Total donations this month
- Shop revenue this month
- Monthly trend (bar chart, last 6 months)
- **"Manage in Stripe →"** external link

Full Stripe integration deferred to v2.

---

### 7.13 CSV Export

Available from: sessions list, volunteer profile, court-hours tracker.

**Sessions CSV columns:** Volunteer Name, Session ID, Date, Activity, Duration (hrs), Adjusted Hours, Distance (mi), Checkpoints, Status, Court Ordered, Admin Notes, Letterhead Generated  
**Court-hours CSV columns:** Volunteer Name, Case Reference, Required Hours, Completed Hours, Remaining, Due Date, Status

Implementation: Next.js Server Action streaming `text/csv` response. Respects active filters.

---

### 7.14 Event Management

**Route:** `/events`

| Column | Notes |
|--------|-------|
| Title | event name |
| Date | `starts_at` |
| Location | `location` |
| Status | Published · Draft |
| Actions | Edit · Publish/Unpublish · Delete |

#### Create / Edit Event (`/events/new`, `/events/[id]/edit`)

Fields: Title (required), Description, Location name + address, Lat/lng (from address or manual), Start date + time (required), End date + time, What to Bring, Organizer, Hero image (upload to Supabase Storage `event-images/`), Published toggle.

On save: upserts to `public.events`. Mobile app reads events from this table.

---

### 7.15 Notifications

#### Inbound — Email alert to Admin

When a volunteer finalizes a session (`status → under_review`), send Admin an email via Resend:

```
Subject: New session submitted for review — {volunteer_name}

{volunteer_name} submitted a cleanup session for your review.
Date: {date} | Duration: {Xh Ym} | Activity: {activity}

→ Review: https://localhost:3001/sessions/{id}
```

Trigger: Fly API `PATCH /sessions/:id/finalize` when status is `under_review`.

#### Outbound — Notification to volunteer

When Admin approves or declines, volunteer receives push + email:

**Approved:** Push: "Your session has been approved! 🎉 View your updated hours."  
**Declined:** Push: "Your session requires attention. View details in the app." (email includes reason if set)

Implementation: the admin's action in the portal calls `POST /admin/sessions/:id/notify` on the Fly API (or Supabase Edge Function), which sends push via Expo Push API + email via Resend. Push token stored in volunteer's `user_metadata.push_token`.

---

### 7.16 Audit Log

**Route:** `/audit-log`

Read-only table of all admin mutations.

| Column | Notes |
|--------|-------|
| Date/Time | `performed_at` |
| Action | e.g. "approved session", "adjusted hours" |
| Target | link to session or order |
| Before | previous value (collapsed JSON) |
| After | new value (collapsed JSON) |

Filters: date range, action type.

---

## 8. Navigation Structure

```
Admin Portal
├── /login                  → Auth (login)
│   └── logout              → Sign-out action in top-right nav avatar
├── /                       → Dashboard
├── /sessions               → Sessions List
│   └── /sessions/[id]      → Session Detail
├── /volunteers             → Volunteer Directory
│   └── /volunteers/[id]    → Volunteer Profile
├── /court-hours            → Court-Hours Tracker
├── /feedback               → Volunteer Feedback
├── /events                 → Event Management
│   ├── /events/new         → Create Event
│   └── /events/[id]/edit   → Edit Event
├── /orders                 → Shop Orders
│   └── /orders/[id]        → Order Detail
├── /payments               → Payments Summary
└── /audit-log              → Admin Audit Log
```

**Sidebar nav on desktop** (persistent, 240 px, collapsible).  
**Bottom tab bar + hamburger on mobile** (primary sections; overflow in hamburger menu).

---

## 9. Responsive Design

| Breakpoint | Layout |
|------------|--------|
| < 640 px | Single-column cards; tables → cards; modals → bottom sheets; bottom nav bar |
| 640–1023 px | Two-column where applicable; top nav; sidebar hidden, toggled by hamburger |
| ≥ 1024 px | Persistent left sidebar; content area fills remaining width; full table columns visible |

All interactive targets ≥ 44 × 44 px.

---

## 10. Motion & Animation

Animation library: **Framer Motion**. All motion follows Emil Kowalski's design engineering principles.

### 10.1 Animation Decision Rules

| Trigger frequency | Decision |
|-------------------|----------|
| Constant (table sort, filter chips, search typing) | No animation |
| Keyboard-initiated (shortcuts, tab navigation) | No animation ever |
| Occasional (modals, drawers, toasts, status changes) | Standard animation |
| Rare / first-time (onboarding, PDF success) | Delight animation allowed |

### 10.2 Easing & Duration Reference

```css
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

| Element | Duration | Easing |
|---------|----------|--------|
| Button press feedback | 100–160 ms | ease-out |
| Tooltips, small popovers | 125–200 ms | ease-out |
| Confirm dialogs | 150–250 ms | ease-out |
| Mobile bottom sheets | 300–400 ms | `--ease-drawer` |
| Sidebar expand/collapse | 250–350 ms | ease-in-out |
| Toast enter / exit | 400 ms / 200 ms | ease / ease-out |

### 10.3 Core Principles

- **Never animate from `scale(0)`** — always start from `scale(0.95) opacity(0)`
- **Button press:** `transform: scale(0.97)` on `:active`, 160ms
- **Hover gated:** `@media (hover: hover) and (pointer: fine)` always
- **GPU only:** animate `transform` and `opacity` exclusively — never `height`, `width`, `padding`
- **Asymmetric timing:** exit faster than enter
- **Stagger:** list entry on first page load only, 40ms between items; never block interaction

### 10.4 Component-Specific Motion

**Dashboard KPI cards:** stagger 50ms, fade up from `translateY(8px)` + `opacity: 0`. Number count-up on mount (disabled with `prefers-reduced-motion`).

**Status chip change:** Framer Motion `key` swap — `scale(0.9) opacity(0) → scale(1) opacity(1)`, 180ms, spring.

**Confirm dialogs:** backdrop `opacity: 0 → 0.4` (200ms) + dialog `scale(0.95) opacity(0) → resting` (200ms ease-out). `transform-origin: center` (modal, not popover). Exit 150ms.

**Inline popovers (approve/decline from list):** scale from `0.95` at `transform-origin` of the action button. 150ms enter / 100ms exit.

**Mobile bottom sheets:** `translateY(100%) → translateY(0)`, `--ease-drawer`, 300ms. Drag-to-dismiss with momentum; velocity > 0.11 dismisses regardless of drag distance.

**Sidebar collapse (desktop):** Framer Motion `layout` animation, 280ms ease-in-out.

**Session photos lightbox:** backdrop fade 200ms + photo `scale(0.92) opacity(0) → resting` 250ms ease-out. Close 150ms.

**Sidebar nav active indicator:** Framer Motion `layoutId="nav-indicator"` — pill slides between active items with spring `{ duration: 0.3, bounce: 0.15 }`. No animation on keyboard nav.

**Letterhead PDF button (rare action):**
1. Idle → Loading: content crossfades to spinner (blur during crossfade)
2. Loading → Success: spinner morphs to checkmark via spring `{ bounce: 0.25 }`; brief `scale(1.04 → 1.0)`
3. Auto-resets to idle after 2.5s

**Toast notifications:** CSS transitions (not keyframes — toasts fire rapidly). `translateY(-100%) → translateY(0)` from top-right, 400ms ease. Exit 200ms ease-out.

### 10.5 Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  .fade-in { transition: opacity 200ms ease !important; }
}
```

```jsx
const prefersReducedMotion = useReducedMotion();
const slideY = prefersReducedMotion ? 0 : 8;
```

---

## 11. Web Brand Guidelines

> **Source of truth:** `docs/frontend/brand.md` and `frontend/src/constants/tokens.ts`.  
> **Rule:** Do NOT modify `docs/frontend/brand.md` or `frontend/src/constants/tokens.ts`. This section adapts the same token values into CSS for the Next.js admin portal.  
> **Separate file:** full web brand doc at `docs/admin/brand-web.md`.

### 11.1 Color Primitives (from `tokens.ts → primitives`)

| Name | Hex |
|------|-----|
| `green-500` | `#009540` |
| `green-50` | `#f7fff1` |
| `gray-900` | `#1c1b1b` |
| `gray-700` | `#3e4a3d` |
| `gray-500` | `#6e7a6c` |
| `gray-300` | `#bdcaba` |
| `gray-200` | `#e5e2e1` |
| `white` | `#ffffff` |
| `cream-50` | `#fcf9f8` |
| `lime-500` | `#c2d832` |
| `surface-elevated` | `#f6f3f2` |
| `chip-bg` | `#f0edec` |
| `amber-100` | `#ffddb5` |
| `amber-700` | `#835400` |
| `amber-500` | `#fcab29` |
| `red-50` | `#ffd9de` |
| `red-600` | `#ba1a1a` |
| `overlay-scrim` | `rgba(28,27,27,0.4)` |

### 11.2 CSS Custom Properties (`globals.css`)

```css
:root {
  --color-bg-app:              #fcf9f8;
  --color-bg-surface:          #ffffff;
  --color-bg-surface-elevated: #f6f3f2;
  --color-text-primary:        #1c1b1b;
  --color-text-tertiary:       #3e4a3d;
  --color-text-on-primary:     #ffffff;
  --color-text-on-primary-soft:#fcf9f8;
  --color-border-outline:      #bdcaba;
  --color-border-chip-selected:#e5e2e1;
  --color-primary:             #009540;
  --color-accent-lime:         #c2d832;
  --color-status-approved-bg:  #f7fff1;
  --color-status-approved-text:#009540;
  --color-status-approved-border:#009540;
  --color-status-pending-bg:   #ffddb5;
  --color-status-pending-text: #835400;
  --color-status-pending-border:#fcab29;
  --color-status-declined-bg:  #ffd9de;
  --color-status-declined-text:#ba1a1a;
  --color-status-declined-border:#ba1a1a;
  --shadow-nav-bottom: 0 -4px 5px rgba(0,0,0,0.02);
  --shadow-bar-top:    0 4px 5px rgba(0,0,0,0.15);
  --color-overlay-scrim: rgba(28,27,27,0.4);
}
```

Light-mode only for v1 — no `prefers-color-scheme: dark` block.

### 11.3 Typography

Fonts loaded via `next/font/google`. Same three families as mobile:

```ts
// admin/app/fonts.ts
import { Sanchez, Noto_Sans, IBM_Plex_Sans } from 'next/font/google';

export const sanchez = Sanchez({
  weight: ['400'], subsets: ['latin'],
  variable: '--font-sanchez', display: 'swap',
});
export const notoSans = Noto_Sans({
  weight: ['400', '500', '600', '700'], subsets: ['latin'],
  variable: '--font-noto-sans', display: 'swap',
});
export const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600'], subsets: ['latin'],
  variable: '--font-ibm-plex-sans', display: 'swap',
});
```

#### Text Styles (from `tokens.ts → textStyles`, dp → px 1:1)

| Style | Font | Size | Line-height | Letter-spacing |
|-------|------|------|-------------|----------------|
| display-hero | Sanchez 400 | 40px | 48px | — |
| headline-page | Sanchez 400 | 28px | 36px | — |
| headline-section | Sanchez 400 | 34px | 42px | — |
| headline-detail | Sanchez 400 | 20px | 28px | — |
| body-default | Noto Sans 400 | 16px | 24px | — |
| body-large | Noto Sans 400 | 18px | 26px | — |
| body-small | Noto Sans 400 | 14px | 20px | — |
| body-emphasis | Noto Sans 500 | 16px | 24px | — |
| body-strong | Noto Sans 700 | 16px | 24px | — |
| label-overline | IBM Plex Sans 500 | 12px | 18px | 0.96px |
| label-status | IBM Plex Sans 500 | 12px | 16px | — |
| label-button | IBM Plex Sans 600 | 16px | 20px | — |
| nav-tab | IBM Plex Sans 600 | 12px | 18px | — |
| data-stat | IBM Plex Sans 600 | 28px | 36px | — |

### 11.4 Spacing, Radius, Shadow

**Spacing** (from `tokens.spacing`): xs=4, sm=8, md=16, lg=24, xl=32, 2xl=40, 3xl=48, 4xl=64 px. Default page horizontal margin: 24px.

**Border radius** (from `tokens.radius`): sm=8px, md=16px, search=22px, full=9999px.

**Shadow:** structural chrome only — never on cards, buttons, or table rows; use `border: 1px solid var(--color-border-outline)` instead.

### 11.5 Tailwind Config

```ts
// admin/tailwind.config.ts
import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:    '#009540',
        'bg-app':   '#fcf9f8',
        'bg-surface': '#ffffff',
        'bg-surface-elevated': '#f6f3f2',
        'text-primary':  '#1c1b1b',
        'text-tertiary': '#3e4a3d',
        'border-outline': '#bdcaba',
        'accent-lime': '#c2d832',
        status: {
          approved: { bg: '#f7fff1', text: '#009540', border: '#009540' },
          pending:  { bg: '#ffddb5', text: '#835400', border: '#fcab29' },
          declined: { bg: '#ffd9de', text: '#ba1a1a', border: '#ba1a1a' },
        },
      },
      fontFamily: {
        heading: ['var(--font-sanchez)', 'Georgia', 'serif'],
        body:    ['var(--font-noto-sans)', 'system-ui', 'sans-serif'],
        data:    ['var(--font-ibm-plex-sans)', "'Courier New'", 'monospace'],
      },
      borderRadius: { sm: '8px', md: '16px', search: '22px' },
      spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', '2xl': '40px', '3xl': '48px', '4xl': '64px' },
      boxShadow: { 'nav-bottom': '0 -4px 5px rgba(0,0,0,0.02)', 'bar-top': '0 4px 5px rgba(0,0,0,0.15)' },
    },
  },
  plugins: [],
};
export default config;
```

### 11.6 Copy Tone (Admin Context)

Same voice as mobile — clear and encouraging — but admin-specific:
- Direct and action-oriented: "Approve", "Decline", "Generate" — not "Please approve" or "Would you like to…"
- Confirm dialogs: positive-first button order — **[Approve]** before **[Cancel]**
- Errors name the problem and the fix: "No approved sessions in this range — adjust the dates and try again."
- Professional tone only — no volunteer-facing copy, no cleanup emojis in UI chrome.

### 11.7 Accessibility (Web)

WCAG 2.1 AA. Web-specific:
- Focus ring: `outline: 2px solid #009540; outline-offset: 2px` on all interactive elements
- Min click target: `min-height: 44px; min-width: 44px`
- `#3e4a3d` (gray-700) is the sole de-emphasized text — do not use `#6e7a6c` (gray-500) as body text
- `#009540` must not be used for normal-weight body text on white (fails AA)
- Hover states always gated behind `@media (hover: hover) and (pointer: fine)`

---

## 12. Security & Access Control

- Supabase RLS: new `admin` policy on all new tables granting full read/write when `auth.jwt() ->> 'role' = 'admin'`
- the admin's account provisioned with `role: admin` in `user_metadata` (one-time CLI command by developer)
- Service role key used only in Next.js server-side code (Server Actions, Route Handlers) — never in the browser
- All admin mutations written to `admin_audit_log`
- Push tokens stored in `user_metadata.push_token` (set by mobile app on notification permission grant)

---

## 13. Fly API Changes Required

| Endpoint | Purpose |
|----------|---------|
| `POST /feedback` | Persist volunteer feedback from mobile (blocker for §7.10) |
| `POST /admin/sessions/:id/notify` | Trigger push + email to volunteer on status change |
| Trigger on `finalize` | Send inbound email alert to Admin when `status → under_review` |

Alternatively: notification side effects via Supabase Edge Functions triggered by DB row changes.

---

## 14. Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-A1 | Admin can log in with email + password; all routes redirect to `/login` when unauthenticated |
| AC-A2 | Logout clears session and redirects to `/login` |
| AC-A3 | Dashboard shows correct counts: under review, approved this month, open orders, avg feedback |
| AC-A4 | Sessions list renders all sessions; status/date/court-ordered filters work correctly |
| AC-A5 | Admin can approve a session inline from the list without navigating away |
| AC-A6 | Admin can decline a session with an optional reason; reason saves to `admin_notes` |
| AC-A7 | Admin can adjust hours; adjusted value persists with "Adjusted" label on detail |
| AC-A8 | Individual letterhead PDF downloads with correct session fields and signature block |
| AC-A9 | `letterhead_generated_at` is set; "Last generated: {date}" shows on session detail |
| AC-A10 | Bulk letterhead generates a multi-page PDF covering all approved sessions in the selected date range |
| AC-A11 | Bulk letterhead cover page shows correct totals (session count, total hours, total distance) |
| AC-A12 | Bulk letterhead with zero approved sessions in range shows inline error — no PDF generated |
| AC-A13 | Volunteer directory shows all volunteers; court-hours progress bar visible for court-ordered volunteers |
| AC-A14 | Court-hours tracker shows all court-ordered volunteers with required vs. completed hours |
| AC-A15 | Admin can add/edit a court order (required hours, due date, case reference) for a volunteer |
| AC-A16 | Feedback list shows all submissions with rating, comment, source, and volunteer |
| AC-A17 | Post-session feedback entries link back to the associated session |
| AC-A18 | Shop orders list shows all orders; Admin can update status and add tracking number |
| AC-A19 | Event create/edit saves to `public.events`; published events appear in mobile app event feed |
| AC-A20 | Admin receives an inbound email alert when a volunteer submits a session for review |
| AC-A21 | Volunteer receives push + email notification when Admin approves or declines their session |
| AC-A22 | CSV export from sessions list downloads correctly filtered session data |
| AC-A23 | All admin mutations appear in `/audit-log` with before/after values |
| AC-A24 | All views are usable at 375 px (iPhone SE) and 1280 px desktop |
| AC-A25 | Session photos load via signed Supabase Storage URLs (1-hour expiry, refreshed on demand) |
| AC-A26 | The existing mobile app (`frontend/`) is completely unaffected by the admin portal |

---

## 15. Execution Agents

Each phase is assigned specific agent `subagent_type` values to spawn via the `Agent` tool.

| Phase | Agent | Role |
|-------|-------|------|
| All — scaffold | `feature-dev:code-architect` | Next.js project structure, Supabase client config, auth middleware, layout shell, Tailwind config |
| All — orientation | `feature-dev:code-explorer` | Read existing `backend/sessions/`, Prisma schema, `frontend/src/` to understand data shapes |
| DB Migration | `ruflo-migrations:migration-engineer` | Generate ordered SQL migration files; validate against existing schema |
| Phase 1 — Sessions Core | `ruflo-core:coder` | Auth pages, dashboard, sessions list/detail, approve/decline/adjust server actions, audit log, Resend email |
| Phase 1 — Dev setup | `vercel:deployment-expert` | Configure `admin/package.json`, Next.js config, `.env.local` template, `npm run dev` at localhost |
| Phase 2 — Letterhead | `ruflo-core:coder` | Individual + bulk `@react-pdf/renderer` server actions, date-range picker, streaming PDF response |
| Phase 3 — Volunteers | `ruflo-core:coder` | `/volunteers`, `/volunteers/[id]`, `/court-hours`, court-order forms, progress bar |
| Phase 4 — Feedback | `ruflo-core:coder` | `POST /feedback` Fly route + `/feedback` admin list |
| Phase 5 — Events | `ruflo-core:coder` | Events CRUD, image upload to Supabase Storage, publish toggle |
| Phase 6 — Orders | `ruflo-core:coder` | `/orders`, `/orders/[id]`, `/payments`, wire `shop_orders` table |
| Phase 7 — Notifications | `ruflo-core:coder` | Expo push + Resend outbound; `POST /admin/sessions/:id/notify` |
| Phase 7 — CSV | `ruflo-core:coder` | Streaming CSV server actions for sessions, volunteers, court hours |
| Phase 7 — Review | `pr-review-toolkit:code-reviewer` | Pre-merge code review each phase |
| Phase 7 — Security | `ruflo-security-audit:security-auditor` | RLS policy audit, service-role key confinement, auth guard coverage |
| Phase 7 — Tests | `ruflo-testgen:tester` | Integration tests for all server actions |

---

## 16. Implementation Checklist

### Pre-work
- [ ] Create `docs/admin/brand-web.md` (web brand guidelines — CSS tokens, fonts, Tailwind config). **Do not modify** `docs/frontend/brand.md`
- [ ] Scaffold `admin/` Next.js 15 app at monorepo root. **Do not touch any file inside `frontend/`, `backend/sessions/`, or any existing directory.**
- [ ] Configure Tailwind with web brand tokens (§11.5)
- [ ] Load fonts via `next/font/google` (Sanchez, Noto Sans, IBM Plex Sans)
- [ ] Set up Supabase client (server + browser) with admin role claim check
- [ ] Create `admin/.env.local` with Supabase URL, anon key, service role key, Resend key — never commit
- [ ] Run `npm run dev` inside `admin/` — preview at `http://localhost:3001`. No Vercel deployment.
- [ ] Run DB migration: add columns to `sessions`, create `volunteer_feedback`, `shop_orders`, `events`, `court_orders`, `admin_audit_log`
- [ ] Provision the admin's admin account: `supabase.auth.admin.updateUserById(id, { user_metadata: { role: 'admin' } })`

### Phase 1 — Sessions Core
- [ ] `/login`: email + password form → `supabase.auth.signInWithPassword`
- [ ] Logout: `supabase.auth.signOut` + redirect `/login` from top-right nav avatar
- [ ] Session expiry banner: `onAuthStateChange` lapse detection
- [ ] `middleware.ts`: redirect unauthenticated requests to `/login`
- [ ] Admin role guard: reject non-admin users with "Access denied"
- [ ] Root layout: sidebar nav (desktop, 240px) + hamburger (mobile) with all route links
- [ ] Dashboard: 6 KPI cards, "Needs attention" banner, recent activity feed
- [ ] `/sessions`: table/card list, status chips, date range, court-ordered toggle, sort, pagination (25/page)
- [ ] `/sessions/[id]`: two-column detail, signed photo URLs (1hr expiry), all admin action buttons
- [ ] Server action: approve → `status = approved`, `admin_audit_log`
- [ ] Server action: decline → `status = not_approved`, `admin_notes`, audit log
- [ ] Server action: mark invalid → `status = invalid`, audit log
- [ ] Server action: adjust hours → `adjusted_hours`, audit log
- [ ] Server action: save admin notes → `admin_notes`, audit log
- [ ] Inline approve/decline from list row (confirmation popover)
- [ ] Inbound Resend email to Admin when `status → under_review`
- [ ] `/audit-log`: read-only table with date, action, target link, before/after JSON
- [ ] Responsive: all Phase 1 views pass 375 px test

### Phase 2 — Letterhead
- [ ] Individual PDF server action (`@react-pdf/renderer`): session data + org branding
- [ ] "Generate Letterhead" button → download PDF
- [ ] Set `letterhead_generated_at`; show "Last generated: {date}"
- [ ] Reusable date-range picker component (used in bulk letterhead + CSV export)
- [ ] Bulk PDF server action: query all approved sessions in range → multi-page PDF (cover + session pages + attestation)
- [ ] "Generate Bulk Letterhead" on session detail + volunteer profile
- [ ] Zero-session guard: inline error, no PDF generated
- [ ] Set `letterhead_generated_at` for each session in bulk

### Phase 3 — Volunteer Directory + Court Hours
- [ ] `/volunteers`: list with name search, court-ordered toggle, sort options
- [ ] Table: name, joined, sessions count, approved count, hours, court badge, progress bar
- [ ] `/volunteers/[id]`: profile with sessions table, feedback list, bulk letterhead button
- [ ] `/court-hours`: all court-ordered volunteers with progress bars, status chips
- [ ] Add/edit court order inline form (required hours, due date, case reference)
- [ ] Court-order server actions: upsert `court_orders`, audit log
- [ ] Progress bar: green ≥ 100%, amber 50–99%, red < 50%

### Phase 4 — Feedback
- [ ] **Blocker**: `POST /feedback` added to Fly API (Fastify route + Prisma insert to `volunteer_feedback`)
- [ ] **Blocker**: Mobile `FeedbackScreen` calls `POST /feedback` on submit
- [ ] `/feedback`: list + summary bar (avg rating, total count, % positive)
- [ ] Columns: date, volunteer, source chip, emoji + label, truncated comment, session link, flag toggle
- [ ] Filters: date range, rating (multi-select), source
- [ ] Flag server action: toggle `volunteer_feedback.flagged`, audit log

### Phase 5 — Events
- [x] `/events`: list with published/draft chip, edit + publish/unpublish + delete
- [x] `/events/new` + `/events/[id]/edit`: full form with all fields
- [ ] Hero image upload → Supabase Storage `event-images/` bucket (v1: paste image URL)
- [x] Geocode address → lat/lng (or manual lat/lng fields for v1)
- [x] Publish toggle: `is_published = true` → visible in mobile app
- [x] Confirm mobile event feed reads from `public.events`
- [x] Delete with confirmation dialog, audit log

### Phase 6 — Orders + Payments
- [ ] **Blocker**: `backend/payments/` service + `shop_orders` table
- [ ] `/orders`: list with status chips, date range, search, pagination
- [ ] `/orders/[id]`: line items, shipping address, status dropdown, tracking input
- [ ] Order status update + tracking save → audit log
- [x] `/payments`: donation + shop revenue cards, 6-month bar chart, Stripe link-out
  (mock donations + shop fixtures; live `shop_orders` overlay for current-month shop revenue when rows exist; full Stripe deferred to v2)

### Phase 7 — Notifications, Export, Hardening
- [ ] Push token: mobile app saves `push_token` to `user_metadata` on permission grant
- [ ] Volunteer push on approve/decline via Expo Push API
- [ ] Volunteer email on approve/decline via Resend (include decline reason if set)
- [ ] CSV export: sessions (respects active filters)
- [ ] CSV export: volunteers summary
- [ ] CSV export: court hours summary
- [ ] "Export CSV" buttons on sessions list, volunteer profile, court-hours tracker
- [ ] Security audit: RLS policies, service-role key confinement, auth guard coverage
- [ ] Integration tests for all server actions (approve, adjust-hours, individual letterhead, bulk letterhead, CSV)
- [ ] Accessibility: all interactive elements ≥ 44px, keyboard navigation, ARIA on status chips
- [ ] Full responsive QA: 375px, 768px, 1280px
- [ ] Final code review via `pr-review-toolkit:code-reviewer`

---

## 17. Isolation Guarantee

| Concern | Constraint |
|---------|------------|
| Source code | New `admin/` directory only; zero modifications to `frontend/`, `backend/sessions/`, `docs/frontend/`, or any existing file |
| Database | Additive migrations only (new columns/tables — never drops or renames existing ones) |
| Auth | Separate Supabase user with `role: admin`; does not affect anon volunteer auth flow |
| API | Admin mutations via Next.js Server Actions to Supabase direct; no changes to Fly API routes in v1 |
| Environment | `admin/.env.local` — never shared with `frontend/.env` |
| Running | `cd admin && npm run dev` (localhost only); `frontend/` dev server unaffected |

---

## 18. Open Questions

| # | Status |
|---|--------|
| Q4 (bulk letterhead) | **Resolved** — bulk letterhead is in scope (§7.6) |

---

## 19. External Dependencies / Blockers

| Blocker | Affects | Required before |
|---------|---------|-----------------|
| `POST /feedback` endpoint + mobile app wiring | §7.10 Feedback view | Phase 4 |
| `backend/payments/` service + `shop_orders` table | §7.11 Orders view | Phase 6 |
| Volunteer `push_token` in `user_metadata` (mobile app) | §7.15 outbound push | Phase 7 |
| Resend API key in Fly secrets | §7.15 + inbound email | Phase 1 |

---

*End of PRD v2.0*
