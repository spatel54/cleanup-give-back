# Project context

## Product

Clean Up - Give Back is a 501(c)(3) nonprofit that turns neighborhood cleanups into **provable** volunteer service hours.

**Major journeys:**
- **Volunteers (mobile):** Onboard → start a cleanup session → GPS route + timed selfie/progress photos → submit → view approval status → download service letter when approved.
- **Court-ordered participants:** Same flow with court-progress tracking and stricter evidence expectations.
- **Admin / admins (web):** Review sessions (route, photos, hours), approve/decline, manage users/orders/events, email volunteers.
- **Shop:** Browse gear, cart, checkout (USPS ship or office pickup), tracker-access paywall after free hour.

**Important outcomes:** Trusted hours for courts/schools; less admin paperwork; mission impact (cleanups completed).

**Constraints:** COPPA — users under 13 blocked; volunteer-facing copy must not mention Admin by name; transactional email from `support@example.org`.

## Users and evidence

| Who | Goal | Context |
|-----|------|---------|
| Volunteer | Log cleanup hours with evidence | Mobile app, often outdoors, intermittent connectivity |
| Court-ordered participant | Complete mandated hours with defensible proof | Higher scrutiny on route/photos/time |
| Admin (admin operator) | Verify and approve sessions quickly | Admin web console, everyday language, real Supabase data |
| Donor / shopper | Support mission or buy gear | Shop/checkout flows; shipping is 25% of paid product subtotal (free kit excluded) |

**Evidence locations:**
- Product/docs: `docs/` (living docs), `README.md`, `docs/current.md`
- Design: Figma CleanUpGiveBack, `docs/frontend/brand.md`, `frontend/design/figma/`
- Research: `docs/research/` (e.g. shipping integration)
- No formal persona library — use roles above and ontology in `docs/frontend/context/project.md`

## Engineering

| Surface | Stack |
|---------|-------|
| Mobile | Expo SDK 54, React Native 0.81, TypeScript, Expo Router (`frontend/`) |
| Admin | Next.js App Router, Tailwind, shadcn-style UI (`admin-web-app/`, Vercel) |
| Backend | Fastify + Prisma on Fly (`backend/sessions/`), Supabase Auth/RLS/storage |
| Docs | `docs/` with backpressure rules in `.cursor/rules/docs-backpressure.mdc` |

**Workflow:** Path aliases `@/*` → `frontend/src/*`. Verify with `cd frontend && npx tsc --noEmit`. Spec-first for features (`docs/*/specs/`). ADRs in `docs/adr/`.

**UX-relevant technical constraints:**
- Expo Go uses WebView map fallback (ADR-005); native MapLibre in dev/prod builds
- Live/replay maps must not draw paths until real GPS movement exists
- Mobile list/detail loading uses `BrandLoadingView`, not bare spinners
- Admin must stay on real Supabase data (no fixture fallback for sessions/users)

## Accessibility

- Target POUR principles; React Navigation light/dark theming via `useColorScheme` / `useThemeColor`
- `BrandLoadingView` respects reduced motion (label-only on cream)
- Session route replay auto-play skips when reduced motion
- Volunteer UI: semantic color tokens from Figma (`docs/frontend/brand.md`); tertiary text token for de-emphasized copy
- **UNKNOWN:** Formal WCAG audit level or automated a11y test gate in CI

## Terminology

See `docs/frontend/context/project.md` ontology. Key distinctions:
- **Volunteer** vs **court-ordered participant** vs **admin**
- **Cleanup session** — tracked period with GPS + photo evidence
- **Service type** (onboarding `user_metadata.service_type`) vs per-session `court_ordered` / `court_orders`
- **Tracker access** — paid unlock after free hour; not the same as shop merchandise cost
- Tote variants: **Earth / Ocean** labels in data (not green/blue UI labels)

## Unknowns

- Live Stripe checkout + Shippo rate selection not fully backend-wired (Phase 2 shipping decision pending Admin approval)
- Formal user-research repository beyond docs and operator feedback
- Target WCAG conformance level for app store / compliance claims
