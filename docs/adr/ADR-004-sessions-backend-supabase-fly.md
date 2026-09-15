# ADR-004: Sessions backend — Supabase + Fastify on Fly

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

Cleanup sessions require persistence: create/start/end lifecycle, GPS route polyline, photo checkpoint evidence, and an approval workflow. Today:

- `frontend/src/features/session-tracking/liveSessionStore.ts` tracks GPS, distance, and checkpoints **in memory only** — data is lost on app restart.
- `backend/sessions/` and `backend/maps/` are empty scaffolds with no runtime code.
- The app is tested via **Expo Go** (no EAS dev-client required for this phase).
- Org accounts exist for Supabase and Fly.io; GCP and Stripe are out of scope for session tracking v1.

Privacy baseline ([ADR-003](ADR-003-minor-data-protection-baseline.md)) requires user-scoped data, session-only geolocation, and cascade deletion — Supabase Auth + RLS satisfies the test-phase baseline.

## Decision

1. **Supabase** is the data plane: Postgres (sessions, checkpoints), Auth (anonymous sign-in for testing), Storage (`session-photos` bucket).
2. **Fastify + Prisma** in `backend/sessions/` deploys to **Fly.io** as the sessions API. It verifies Supabase JWTs and performs server-side session lifecycle operations.
3. **Client → Fly** for session CRUD; **client → Supabase Storage** for photo uploads (user JWT + RLS); Fly stores storage paths only.
4. **Anonymous auth** for the Expo Go test phase — `supabase.auth.signInAnonymously()` on first launch; each device gets a `user_id` for RLS.
5. **Geolocation is client-owned** — `expo-location` + `liveSessionStore` sample GPS during active sessions only; Fly persists the finalized route as jsonb on `PATCH /sessions/:id/finalize`. No separate `backend/maps/` microservice for v1.
6. **No Google Maps API key** for tracking — map tiles use Carto Voyager / Dark Matter + Esri via MapLibre (native or WebView; see [ADR-005](ADR-005-expo-go-webview-map.md)).

### Env split

| Where | Variables |
|-------|-----------|
| Frontend `.env` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL` |
| Fly secrets | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `DATABASE_URL` |

## Consequences

- **Positive:** Free-tier friendly for testing; RLS isolates users; photos never pass through Fly; matches `backend_plan.md` Phase 1–2 intent.
- **Positive:** Anonymous auth removes login friction for testers.
- **Negative:** Anonymous users are device-bound; reinstall creates a new identity (acceptable for test phase).
- **Negative:** Admin approval for v1 is manual (Supabase table editor or `PATCH /approval` via curl) — no admin UI yet.
- **Follow-up:** Email OTP / account linking before production; full privacy ACs in [privacy-and-data-rights.md](../backend/specs/privacy-and-data-rights.md).

## Alternatives considered

- **Supabase-direct from app (no Fly)** — faster to ship but pushes more logic client-side; rejected because admin approval and server-side validation belong on an API boundary.
- **Railway instead of Fly** — equivalent; Fly chosen per org account availability.
- **Separate `backend/maps/` service** — overkill for v1; route persistence folded into sessions API.
- **Firebase** — listed in `.env.example` legacy; Supabase chosen for Postgres + Storage + Auth in one project.
