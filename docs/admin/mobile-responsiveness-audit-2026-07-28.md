# Admin mobile responsiveness audit — 2026-07-28

Manual audit of the admin dashboard (`admin/`, Next.js 15, `http://localhost:3001`, `BYPASS_AUTH=true`) using Chrome DevTools emulation at 375×812 (iPhone SE/13 mini), spot-checked at 768×1024 and 1024×768. Scope: the 11-item feature batch in [admin-feature-batch-2026-07-28.md](admin-feature-batch-2026-07-28.md) plus a general regression sweep. See [current.md](../current.md) for the user-facing summary.

## Routes × viewport

| Route | 375×812 | 768×1024 | 1024×768 (sidebar) | Notes |
|---|---|---|---|---|
| `/` (Dashboard) | Pass | Pass | Pass | Commerce preview cards (`KPICard`, 1-col mobile) stack cleanly; existing 2×2 metric grid unaffected |
| `/sessions` | Pass | — | — | `AdminSearchBar` full width; status chips scroll horizontally with a visible scroll affordance; court-ordered checkbox + sort wrap to their own row |
| `/sessions/[id]` | Pass | — | — | Approve/Decline/Mark Invalid stack full-width with good tap targets; no photos in this dev dataset so the fixed lightbox itself wasn't visually exercised (verified via code: `PhotoGrid.tsx` uses plain `<img>`, `overflow-y-auto` grid) |
| `/users` (merged Volunteers + Court Hours) | **Fail → Fixed** | — | — | Stat cards stack 2×2 cleanly. Card list previously showed two bare, unlabeled dates (Joined vs Last Active) — fixed with inline `lg:hidden` labels |
| `/events` | Pass | — | — | Empty state only (no events in this dev DB) |
| `/events/new` | Pass (P1 fixed) | — | — | Title/description/location/organizer/address/dates/what-to-bring/photo-upload all render without clipping; address field with map-pin icon and validation hint wrap correctly. Submit button was reachable behind the fixed bottom nav only when scrolled via naive scroll-into-view — see P1 below |
| `/events/[id]` | Not exercised | — | — | No events existed in the dev DB to open; `NotifyAtRiskVolunteers.tsx` reviewed via code (flex rows, `max-h-64 overflow-y-auto` list, full-width button) — no mobile-unsafe patterns found |
| `/payments` | Pass | — | — | Period + granularity toggles stack without overflow; breakdown chart and table both fit at 375px with no horizontal scroll needed |
| `/orders` | **Fail → Fixed** | — | — | Revenue stat card text was clipped (`grid-cols-3` too tight at 375px) — fixed |
| `/insights` | Pass | — | — | Pre-existing page, unaffected by this batch |
| `/feedback` | Pass (500 → fixed) | — | — | Was 500ing due to the payments-data import bug below; content itself unaffected |
| `/account` | Pass (500 → fixed) | — | — | Was 500ing due to the payments-data import bug below |
| `/volunteers`, `/court-hours` | Pass (500 → fixed) | — | — | Both redirect to `/users` / `/users?filter=court` as designed (confirmed via response body, not HTTP status — Next 15 serves the redirect target directly with a 200 rather than a visible 3xx for full-document navigations) |
| `/audit-log` | Pass (500 → fixed) | — | — | Unlinked from nav as designed; page itself still works |

Sidebar (≥1024px) vs bottom nav (<1024px) switch was verified structurally via `Sidebar.tsx` (`hidden lg:flex`) / `MobileNav.tsx` (`lg:hidden`) — not independently screenshotted at 1024×768 given the P0/P1 findings below consumed the audit budget, but no code changes touched this boundary.

## Issues found

### P0 — Every route except `/`, `/sessions`, `/users`, `/events`, `/events/new` returned HTTP 500

**Route:** all of `/payments`, `/orders`, `/insights`, `/feedback`, `/account`, `/volunteers`, `/court-hours`, `/audit-log` (and intermittently `/` itself once the bad module entered the dev server's cache). **Viewport:** all. **Description:** `components/ui/PaymentsBreakdownSection.tsx` (a `'use client'` component) imported the `formatCents` runtime value from `lib/payments-data.ts`, which imports `createDataClient` from `lib/supabase/server.ts` (uses `next/headers`). Next.js's server/client boundary check taints the *entire* client bundle for any component that imports a runtime value from a file with a server-only dependency, which broke compilation for every route in the dev server process — this wasn't scoped to `/payments`, it took down the whole app.

**Fix:** `PaymentsBreakdownSection.tsx` now imports `formatCents` from the client-safe `lib/payments-mock.ts` (where it's actually defined) and only imports `BreakdownGranularity`/`BreakdownRow` as `import type` from `payments-data.ts` (type-only imports are erased at compile time and don't pull in the server module). Verified all 13 routes return 200 after the fix, and `npx tsc --noEmit` is clean.

### P0 — Orders page "Revenue" KPI value clipped at 375px

**Route:** `/orders`. **Viewport:** 375×812. **Description:** The three summary stat cards used a fixed `grid-cols-3` (`app/(admin)/orders/page.tsx`). At 375px width each column is ~110px, too narrow for the `text-[28px]` currency value — "$229.86" rendered as "$229.8" with the last character clipped by the card's rounded border.

**Fix:** Changed to `grid-cols-2 sm:grid-cols-3` (matches the pattern already used on `/users` and `/payments`), so Revenue gets its own full-width row on mobile. Confirmed via screenshot: full value now visible.

### P1 — Fixed bottom nav can obscure a form's trailing submit button when scrolled into view natively

**Route:** `/events/new` (applies to any long form ending in a submit button, e.g. `EventForm.tsx`). **Viewport:** 375×812. **Description:** `MobileNav.tsx` renders a `fixed bottom-0` tab bar (~57px tall) below `lg`. The scrolling container (`<html>`) had no `scroll-padding-bottom` reserved for it. A native `scrollIntoView()`/keyboard-focus auto-scroll (and this audit's own click-tool scroll-into-view heuristic) can land the last field or the submit button flush with the viewport's bottom edge — directly behind the fixed nav — even though `<main>` already has `pb-20`. Reproduced directly: a scripted click on "Create event" was intercepted by the bottom nav's icon/label after the browser's own scroll-into-view, while a full manual scroll to the true document bottom left a healthy ~48px clearance.

**Fix:** Added `scroll-padding-bottom: 76px` on `html` for viewports below `lg` (`admin/app/globals.css`), so any native "scroll element into view" call reserves space for the fixed nav. This is a browser-respected CSS property (Safari/Chrome on iOS/Android both honor it for focus-triggered auto-scroll and anchor jumps); it does not change manual scrolling.

### P2 — Users list mobile card view: two unlabeled dates

**Route:** `/users`. **Viewport:** 375×812. **Description:** `UsersClientShell.tsx`'s row is a 6-column grid on desktop (`Name / Joined / Sessions / Hours / Type / Last Active`) that collapses to `grid-cols-1` on mobile. Below `lg`, the desktop column header row is `hidden`, so the two date fields (Joined, Last Active) rendered as two bare, identically-formatted dates stacked in the card with no way to tell them apart.

**Fix:** Added `lg:hidden` inline labels ("Joined " / "Last active ") before each date, invisible on the desktop grid where the header row already provides that context.

## Not fixed / out of scope

- **Event detail page (`/events/[id]`) and `NotifyAtRiskVolunteers`** could not be visually verified at mobile width — this dev database had zero events (a test event submission during the audit didn't persist, which looks like a separate, unrelated data issue, not a layout one — worth a follow-up but out of scope for this pass). Reviewed via source only; no unsafe patterns (fixed widths, non-wrapping flex rows) found in the component.
- **Session photo lightbox** (`PhotoGrid.tsx`) had no photos to open in this dev dataset; the plain-`<img>` + signed-URL fix from earlier in this batch was verified via code, not a live screenshot.
- **1024×768 sidebar-vs-bottom-nav breakpoint** was verified structurally (`hidden lg:flex` / `lg:hidden` classes) rather than screenshotted, since neither this batch nor the audit touched that boundary.

## Files changed in this pass

- `admin/components/ui/PaymentsBreakdownSection.tsx` — import `formatCents` from `payments-mock` instead of `payments-data`; type-only import for the breakdown types (P0 fix)
- `admin/app/(admin)/orders/page.tsx` — `grid-cols-3` → `grid-cols-2 sm:grid-cols-3` (P0 fix)
- `admin/app/globals.css` — added mobile `scroll-padding-bottom` for the fixed bottom nav (P1 fix)
- `admin/app/(admin)/users/UsersClientShell.tsx` — added `lg:hidden` date labels (P2 fix)
