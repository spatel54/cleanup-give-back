# Implementation plan

High-level milestones for Clean Up - Give Back.

## Done

- [x] Monorepo layout: `frontend/`, `backend/`, `docs/`
- [x] Expo Router app with WebView-based Stitch HTML prototype
- [x] Metro config for `.html` asset bundling
- [x] Navigation bridge between HTML screens (postMessage)
- [x] Export all 39 Stitch screens to Figma as auto-layout frames (6 flow pages)
- [x] Figma Design System v1 — 104 variables, 14 text styles, BottomNav + Input components
- [x] Figma design ground-truth scaffold — `frontend/design/figma/`, `manifest.yaml`, ADR-002
- [x] Privacy & compliance documentation — `docs/compliance/`, ADR-003, main PRD §6.0a–6.37, 13 manifest routeKeys, screen-split decision
- [x] Figma compliance frames — Page 6 (`account-privacy`, `privacy-permissions`) + Page 7 (11 screens); node IDs in `manifest.yaml`

## Next

### Sessions + geolocation (Expo Go test phase)

Docs complete — see [ADR-004](adr/ADR-004-sessions-backend-supabase-fly.md), [ADR-005](adr/ADR-005-expo-go-webview-map.md), [sessions-api.md](backend/specs/sessions-api.md), [session-tracking-expo-go.md](frontend/specs/session-tracking-expo-go.md), [supabase.md](supabase.md).

- [x] Architecture ADRs (Supabase + Fly, Expo Go WebView map)
- [x] Backend API spec + Supabase schema documentation
- [x] Frontend Expo Go integration spec
- [x] Supabase project: Prisma schema pushed; run `sql/supabase-init.sql` for storage RLS if needed
- [x] `backend/sessions/` — Fastify + Prisma sessions API implemented
- [x] Deploy API to Fly.io (`fly deploy` — live at `https://sessions.example.com`)
- [x] Frontend: `lib/supabase.ts`, `lib/api.ts`, wire `liveSessionStore` to API
- [x] Frontend: `LiveSessionMapWebView` for Expo Go (ADR-005)
- [x] API smoke test: create/finalize/list against production (Supabase Postgres)
- [x] Remove placeholder session mocks from production UI (`SessionsScreen`, `SessionDetailScreen`)
- [x] Live-session draft Resume/Discard (AC-37) + GPS harden + distance-scaled route replay (Session 214: live display smoothness + Expo Go foreground banner)
- [x] GPS trail precision + continuity — denser ~1m capture, soft resume (preserve Kalman), slow-walk gates, EAS background re-assert (Session 2026-07-21; see [progress.md](progress.md))
- [x] Outdoor Expo Go live trail restore — resolved-accuracy 25 m, `speedMps===0` stationary fix, WebView line-layer reliability, distance hundredths &lt; 0.1 mi (2026-07-21; see [progress.md](progress.md) “Fix live GPS trail”)
- [x] Session route replay uses live display simplify (`simplifyRouteForLiveDisplay`) on detail/confirmation maps (2026-07-21)
- [x] Test-readiness harden — remove unused `expo-dual-camera`, `expo-camera` plugin, checkpoint 404 recreate/retry, eslint, root scripts, [expo-go-eas-tester-runbook.md](frontend/specs/expo-go-eas-tester-runbook.md)
- [x] Volunteer `DELETE /sessions/:id` + session detail delete UI (AC-38)
- [x] Delete 404 → local cleanup + tombstones so Sessions list stays in sync (AC-41)
- [x] Sessions list multi-select bulk delete + AsyncStorage tombstones (AC-44, AC-41 persistence)
- [x] Photo before start / end; due-only checkpoints; 5‑min grace + local notification reminders (AC-39–40, AC-42–43)
- [x] Expo Go map gate via `isExpoGoClient()` (avoid `MLRNCameraModule` crash)
- [x] Expo Go networking matrix — [expo-go-dev-networking.md](frontend/specs/expo-go-dev-networking.md)
- [ ] End-to-end test in Expo Go on physical device (force-quit persistence — AC-18/AC-37; outdoor foreground trail **AC-45 signed off**; closed-app checkpoint alarms + lock-screen GPS need EAS/dev client; API sync needs valid anon JWT in `.env`)

### Other

- [ ] Bind design tokens to remaining Figma screens (compliance frames use DS components; variable binding pending)
- [ ] **Approve and modify existing screens** — see [figma-compliance-screen-gap-audit.md](compliance/figma-compliance-screen-gap-audit.md#existing-screens-pending-approval)
- [x] Native session flow in `frontend/src/app/` — `expo-location`/`expo-camera` wired; GPS route + distance live in Expo Go
- [x] Stripe Checkout for shop + donate on Fly sessions API (test mode; webhook + `023_stripe_checkout.sql` ops)
- [ ] Phase 2 shipping — Shippo **Buy label** in admin (code in repo; apply `028_shippo_labels.sql`, set `SHIP_FROM_PHONE`, redeploy Fly, `SESSIONS_API_URL` + `ADMIN_API_KEY` on admin). Live postage after `shippo_live_`. Spec: [shippo-labels.md](backend/specs/shippo-labels.md).
- [ ] Replace remaining HTML prototype screens per [manifest.yaml](../frontend/design/figma/manifest.yaml) and [figma-to-native-handoff.md](frontend/specs/figma-to-native-handoff.md)
- [x] Sequential checkpoint capture (`expo-camera`) — [photo-checkpoint-dual-capture.md](frontend/specs/photo-checkpoint-dual-capture.md) (simultaneous dual out of scope)
- [x] Home dashboard session stats — chart + impact from `sessionStatsStore` — [home-dashboard-session-stats.md](frontend/specs/home-dashboard-session-stats.md)
- [x] Session route replay on detail maps — [session-route-replay.md](frontend/specs/session-route-replay.md)
- [x] Approved session service letter PDF — [service-letter-pdf.md](frontend/specs/service-letter-pdf.md) (Fly API + mobile date-range Download Service Record PDF/CSV + session-detail PDF + admin proxy)
- [ ] EAS dev-client builds — run `eas build --profile development` from `frontend/` (see [accounts-and-access.md](accounts-and-access.md); needed for background GPS + native MapLibre)

## Privacy & compliance

Living launch board: [compliance/launch-checklist.md](compliance/launch-checklist.md).

- [ ] Counsel review of privacy policy + ToS before App Store submission
- [x] Figma Page 6 — `account-privacy` hub + `privacy-permissions`
- [x] Figma Page 7 — pre-auth compliance screens (age-gate, parental consent, policy viewers) — **design only**
- [x] Native COPPA under-13 block (`age < 13`) + immediate onboarding PII wipe + universal opt-in notification defaults
- [x] Session photos 18+ only — 13–17 track GPS/hours without checkpoint camera ([minor-session-photos.md](frontend/specs/minor-session-photos.md))
- [x] Account Updates / What’s New ([app-updates.md](frontend/specs/app-updates.md))
- [x] Volunteer in-app notifications inbox (`volunteer_notifications`) + preference-gated Expo push on approve/decline/hours adjust/hours reminder
- [ ] Pre-auth age-gate before PII (move birthday earlier in flow)
- [ ] Age eligibility backend (reject under-13 registration when auth ships)
- [ ] App Store Declared Age Range API integration (iOS / Google Play age signals)
- [x] Session-only geolocation enforcement — background GPS only while session active; stops on finalize
- [x] Core tracking audit — Kalman + adaptive sampling, Always-while-active background GPS (`expo-task-manager`), sync-failure banners, missed-checkpoint → `invalid`, list `photoCount` for Home stats (see [session-tracking-expo-go.md](frontend/specs/session-tracking-expo-go.md) AC-32–36)
- [ ] CCPA deletion/export endpoints + admin audit log
- [ ] DPIA completed and signed off
- [ ] External security assessment path — see [launch-checklist.md](compliance/launch-checklist.md) §11 (MASVS/ASVS internally; pen test; MASA AL2 only if we want a Play badge; skip COPPA Safe Harbor while under-13 is blocked)

## References

- PRD layouts: [frontend/specs/](frontend/specs/)
- Backend domains: [backend/context/](backend/context/)
- ADR index: [adr/overview.md](adr/overview.md)
