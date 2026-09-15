# Context: sessions

Session lifecycle, photo checkpoints, and activity tracking.

## Purpose

Core domain for cleanup sessions: setup, live tracking, photo evidence, submission, and approval. Native screens cover session setup, live session, photo checkpoint, submission confirmation, and sessions list/detail in `frontend/src/app/`.

**Architecture:** [ADR-004](../../adr/ADR-004-sessions-backend-supabase-fly.md)  
**API spec:** [sessions-api.md](../specs/sessions-api.md)  
**Setup:** [supabase.md](../../supabase.md)

## API surface (live)

Fastify service in `backend/sessions/` on Fly.io (`https://sessions.example.com`):

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/health` | Fly health check |
| DELETE | `/users/me` | Volunteer account deletion (court holds retained) |
| GET | `/health/deep` | Checks Prisma DB connectivity (`SELECT 1`); polled by admin-web-app's `/settings` production readiness page |
| POST | `/sessions` | Create + start session |
| POST | `/sessions/:id/checkpoints` | Record photo checkpoint metadata |
| PATCH | `/sessions/:id/finalize` | End session → `under_review` or `invalid` (legacy `skipOrientation` ignored — never auto-approves) |
| GET | `/sessions` | List user's sessions (includes `checkpointCount` / `photoCount`) |
| GET | `/sessions/:id` | Session detail + checkpoints |
| PATCH | `/sessions/:id/approval` | Admin status change |
| DELETE | `/sessions/:id` | Volunteer delete (not when `approved`); writes an `admin_audit_log` row (`volunteer deleted session`) feeding admin-web-app's volunteer activity-pattern rollup |
| GET | `/sessions/:id/service-letter.pdf` | Approved service letter PDF (CUPGB lockup + letter + evidence); `?courtPacket=true` adds a court cover sheet + adjusted-hours annotations |
| POST | `/sessions/service-letter.pdf` | Multi-session service letter PDF; body `courtPacket: true` for the court-packet variant |
| GET | `/me/court-progress` | Caller's court-order progress (required/completed/remaining hours, due date, risk status) — mirrors admin-web-app's `lib/court-risk.ts` math server-side so mobile never reads `court_orders` directly (that table's RLS stays admin-only) |
| POST | `/emails/event-registration` | Event Register confirmation (Resend) |
| POST | `/emails/order-placed` | Shop order-placed confirmation (Resend; Figma `1311:359`) |
| POST | `/emails/email-change/request` | Send email-change OTP |
| POST | `/emails/email-change/confirm` | Validate email-change OTP |

Auth: Supabase JWT verified via JWKS (ES256). Requires `SUPABASE_URL` + `DATABASE_URL` (Supabase Postgres) on Fly. Email routes also need `RESEND_API_KEY` (+ optional `EMAIL_FROM`); without Resend they return `{ skipped: true }`.

## Data model

- **`sessions`** — lifecycle, route jsonb polyline, duration (wall-clock `started_at` → `ended_at`), distance, status enum (`active` → `under_review` → `approved` / `not_approved` / `invalid`); **`decline_reason`** (text, volunteer-facing when admin declines — exposed to mobile as `declineReason`, not `admin_notes`)
- **`sessions.plausibility_signal`** (jsonb, nullable) — server-computed GPS/speed signal from `computePlausibilitySignal()` (`backend/sessions/src/lib/sessionPlausibility.ts`), written at finalize. Advisory only — never gates `status`; feeds admin-web-app's red-flag badge in the session drawer. See `docs/agents/session-abuse-checklist.md` §1 and `admin/db/009_session_plausibility_signal.sql`.
- **`checkpoints`** — selfie/progress Storage paths, `captured_at`, `submitted_early`
- **`court_orders`** (Prisma `CourtOrder` model, added 2026-08-07) — maps the existing `court_orders` table (`admin/db/001_admin_portal_migration.sql`); admin-managed via `upsertCourtOrder` in admin-web-app, read here by `/me/court-progress` and the court-packet cover sheet
- **Storage bucket `session-photos`** — private; client uploads; API stores paths only
- **List enrichment:** `GET /sessions` returns `checkpointCount` and `photoCount` (`checkpointCount * 2`) for Home impact hydration
- **`email_log`** (new, `admin/db/010_email_log.sql`, 2026-08-07) — every outbound volunteer email (this service has no Supabase client, only Prisma, so `routes/sessions.ts`/`routes/emails.ts` insert via `prisma.$executeRaw`, mirroring admin-web-app's `lib/email-log.ts`). Feeds the admin "Communication" section and the attention-inbox failed-email bucket.
- **`email_templates`** (new, `admin/db/011_email_templates.sql`, 2026-08-07) — `routes/emails.ts`'s event-registration send reads an admin-editable override here (falling back to a hardcoded default), same pattern as admin-web-app's `lib/email-templates.ts`
- **`volunteer_notifications`** (`admin/db/025_volunteer_notifications.sql`, 2026-08-25) — volunteer in-app inbox. Admin `notify.ts` inserts via service role on approve/decline/hours adjust/order update; hours-reminder cron inserts `hours_reminder`; Fly order-placed also inserts `order_update`. Expo push `data` includes `notificationId` + `createdAt` so Messages keep the send time when a banner is ingested. Volunteers SELECT own rows, UPDATE `read_at`, INSERT own rows when a banner arrives (`027`), and DELETE own rows (`026`). Preference object in `user_metadata.notification_preferences` gates inbox+push (email still sends).

Full schema: [supabase.md](../../supabase.md) §2.

## Integrations

- **Supabase** — Postgres (via Prisma), Auth (volunteer JWT: email / Apple / Google), Storage (photo evidence)
- **Fly.io** — API hosting
- **Frontend** — `liveSessionStore` wires `startNewLiveSession` / `addPhotoCheckpoint` / `finalizeLiveSession` to API (local session activates immediately; remote create is best-effort); grace miss → `forcedEndPending` + end photos → `finalizeLiveSession({ status: 'under_review' })` (not `invalid`; no missed-checkpoint flag)
- **Live session draft** — debounced AsyncStorage snapshot while `isActive` (`liveSessionDraft.ts`); cold-start **Resume/Discard** via `LiveSessionResumeGate` (not a server mid-session route sync)
- **Home stats** — `sessionStatsStore` + `homeDashboardStats.ts` hydrate from list `photoCount` / duration / miles
- **Maps** — geolocation is client-owned (Kalman + optional background while active); route persisted on finalize. See [maps.md](maps.md).
- **Camera** — `expo-camera` sequential checkpoint capture (Expo Go + dev client); simultaneous dual-cam out of scope

- **Admin review queue** — Home heading "N to review" is the open `under_review` count. The list itself matches `/sessions` (submitted rows, newest `created_at` first, cap 20, **View more** → `/sessions?period=all`). Finalize is an UPDATE; `public.sessions` uses REPLICA IDENTITY FULL (`admin/db/030_sessions_replica_identity_full.sql`) so Realtime can authorize that change under `admin_read_all_sessions`.

## Policies

- RLS: users read/write own sessions and checkpoints only; admins SELECT all via `admin_read_all_sessions`
- GPS sampling only while session is `active` (foreground + optional background; both stop on finalize/cancel)
- `service_role` key only on Fly — never in client or docs
- Retention / deletion / minor protection: [privacy-and-data-rights.md](../specs/privacy-and-data-rights.md)

## Related

- Code: `backend/sessions/` — Fastify + Prisma API deployed to Fly.io
- Frontend store: `frontend/src/features/session-tracking/liveSessionStore.ts`
- Frontend draft / resume: `liveSessionDraft.ts`, `components/LiveSessionResumeGate.tsx`
- Frontend delete: `removeVolunteerSession.ts` / `removeVolunteerSessions` (bulk from Sessions list) + `sessionsApi.deleteSession`; client tombstones in `volunteerDeletedSessions.ts` (AsyncStorage)
- Frontend stats: `sessionStatsStore.ts`, `utils/homeDashboardStats.ts`
- Frontend spec: [session-tracking-expo-go.md](../../frontend/specs/session-tracking-expo-go.md)
- Service letter PDF: [service-letter-pdf.md](../../frontend/specs/service-letter-pdf.md); local Prisma via `backend/sessions/.env` ([supabase.md](../../supabase.md) §3)
