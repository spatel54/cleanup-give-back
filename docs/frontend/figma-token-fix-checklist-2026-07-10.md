# Figma Token Fix Checklist — Pages 2–7

> **Scope:** All flow screens excluding Page 1 · Onboarding  
> **File:** [CleanUpGiveBack](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack) (`DrDcQH14n7ntDQ80F7au9S`)  
> **Audit date:** 2026-07-10  
> **Owner:** Agent session — track completion here

---

## Critical

| # | Issue | Sections / nodes | Status |
|---|-------|------------------|--------|
| C1 | Phantom token `color/text-nav-inactive` → rebind to `color/text/tertiary` | Pages 2–7 all text/fill uses | ✅ N/A in Figma — nodes already bound to `color/text/tertiary`; MCP export aliases as `color-text-nav-inactive` with `#3e4a3d` fallback |
| C2 | Bottom nav: first tab label **Profile** → **Home** (house icon) | `Navbar` / `BottomNav` on all flow screens | ✅ Fixed — leftmost tab = Home; regression on account tab reverted (`503:1057` → Profile) |
| C3 | Retired `#758080` on `events_detail` address block | `196:384` | ✅ Rebound to `color/text/tertiary` |

## High — token bindings

| # | Issue | Target token | Status |
|---|-------|--------------|--------|
| H1 | Hardcoded `#f0edec` chip/badge fills | `color/bg/surface` or new `color/bg/surface-alt` | ✅ Verified — 0 unbound `#f0edec` nodes in file (already variable-bound or intentional hero placeholders) |
| H2 | `home_dashboard` greeting inline `#1c1b1b` / `#009540` | `color/text/primary`, `color/primary` | ⬜ Deferred — mixed-style greeting spans (`137:2183`); needs designer pass on rich text |
| H3 | `events_detail` organizer span `#3e4a3d` | `color/text/tertiary` | ✅ Same fix as C3 (`196:384`) |
| H4 | `events_detail` Add to calendar `border-black` | `color/border/outline` or `color/text/primary` | ✅ Verified — 0 hardcoded `border-black` on `196:390` |
| H5 | Green CTA text using `color/bg/app` (cream) | `color/text/on-primary` | ✅ Fixed — 13 button text nodes rebound |
| H6 | Card fills using `color/text/on-primary` or raw `white` | `color/bg/surface` (`#f6f3f2`) | ✅ Verified — 0 unbound white card fills found in bulk scan |

## Medium — content / copy values

| # | Issue | Screen | Status |
|---|-------|--------|--------|
| M1 | Filter chip text **Pending** → **Under Review** | `sessions_list` `515:1906` | ✅ Fixed |
| M2 | Order history prices vs shop ($45→$29.99, tote $14.50→$3.00) | `order_history` `854:116` | ✅ Fixed (`864:133`, `864:146`, `864:159`) |
| M3 | Checkout header **Cart** → **Checkout** | `shop_checkout_final` `657:1809` | ✅ Fixed (`657:1901`) |
| M4 | Photo checkpoints duplicate times / labels | `submission_confirmation` `269:1615` | ✅ Fixed — differentiated midpoint/end times (`289:115`–`289:123`) |
| M5 | Copy grammar: "Your sessions has been" → "Your session has been" | `submission_confirmation` `289:338` | ✅ Fixed |

## Low — manifest / missing frames (document only)

| # | Issue | Action | Status |
|---|-------|--------|--------|
| L1 | `home_hamburger` vs `home_dashboard` frame name | Update `manifest.yaml` to `137:2174` | ✅ Updated |
| L2 | `live-session` frame missing | Flag in manifest; frame TBD | ✅ Flagged — no Figma frame; RN slice uses Stitch HTML reference |
| L3 | `sessions-calendar` frame missing | Flag in manifest; frame TBD | ✅ Flagged — legacy frames `88:123` / `93:2` exist but not in current flow section |
| L4 | `settings`, `account-privacy`, `privacy-permissions` nodes missing | Verify Account Flow; update manifest | ✅ Verified — nodes `723:405`/`723:455` not found; manifest notes updated |
| L5 | Page 7 section `718:236` merged into Account Flow | Update `pages/07-compliance-legal.md` | ✅ Documented — compliance frames live in file root; section node retired |

---

## Verification

After each batch:

- [x] Spot-check `get_design_context` on `shop_home` `498:606` — nav shows Home + Profile correctly; MCP still emits `color-text-nav-inactive` alias (Figma binding is `color/text/tertiary`)
- [x] Bottom nav first tab reads **Home**, last tab **Profile** on shop (`503:1043`, `503:1057`)
- [x] Copy fixes verified: Under Review chip, Checkout header, order prices, session grammar
- [x] `manifest.yaml` updated for home node + missing-frame flags
- [x] `docs/progress.md` session entry appended

---

## Session log

| Timestamp | Action | Result |
|-----------|--------|--------|
| 2026-07-10 | Audit completed (pages 2–7) | Checklist created |
| 2026-07-10 | Figma fixes batch 1 | H5, M1–M5, C3; nav Home labels (partial) |
| 2026-07-10 | Nav regression fix | `503:1057` and rightmost tab restored to **Profile** |
| 2026-07-10 | Verification + docs | Checklist marked; manifest + page 7 doc updated |
