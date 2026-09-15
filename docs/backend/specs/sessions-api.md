# Backend spec: Sessions API

**Date:** 2026-07-13  
**Status:** Implemented (including service letter PDF — deploy Fly + set `SUPABASE_SERVICE_ROLE_KEY` for photo/name resolution)  
**ADR:** [ADR-004](../../adr/ADR-004-sessions-backend-supabase-fly.md)  
**Setup:** [supabase.md](../../supabase.md)  
**Frontend:** [session-tracking-expo-go.md](../../frontend/specs/session-tracking-expo-go.md)

## Summary

Fastify + Prisma sessions service on Fly.io. Persists cleanup session lifecycle, GPS route polyline, and photo checkpoint metadata. Supabase Postgres is the database; Supabase Auth JWTs authenticate requests; photo binaries upload directly from the client to Supabase Storage.

## API contract

Base URL: `EXPO_PUBLIC_API_URL` (e.g. `https://sessions.example.com`).

All authenticated routes require:

```
Authorization: Bearer <supabase_access_token>
```

### Endpoints

#### `GET /health`

- **Auth:** none
- **Response:** `200 { "status": "ok" }`
- **Purpose:** Fly health check

#### `POST /sessions`

Create and start a session.

- **Body:**
  ```json
  {
    "activity": "Trash Clean Up",
    "courtOrdered": false,
    "description": "Park cleanup",
    "date": "2026-07-13"
  }
  ```
- **Response:** `201 { "id": "<uuid>", "status": "active", "startedAt": "<iso8601>" }`
- **Side effects:** inserts `sessions` row with `status = active`, `started_at = now()`, `user_id` from JWT

#### `POST /sessions/:id/checkpoints`

Record checkpoint metadata after client uploads photos to Storage.

- **Body:**
  ```json
  {
    "selfiePath": "{user_id}/{session_id}/{checkpoint_id}-selfie.jpg",
    "progressPath": "{user_id}/{session_id}/{checkpoint_id}-progress.jpg",
    "capturedAt": "<iso8601>",
    "submittedEarly": true
  }
  ```
- **Response:** `201 { "id": "<uuid>" }`
- **Validation:** session must belong to caller and be `active`

#### `PATCH /sessions/:id/finalize`

End session and submit for review.

- **Body:**
  ```json
  {
    "endedAt": "<iso8601>",
    "durationSeconds": 3600,
    "distanceMiles": 1.2,
    "route": [[-122.4, 37.8], [-122.41, 37.81]],
    "status": "under_review",
    "skipOrientation": false
  }
  ```
- **`status` (optional):** `under_review` (default) or `invalid`. Client cannot set `approved`.
- **`skipOrientation` (optional, legacy):** ignored. Free orientation auto-approve is off; flag accepted only so older clients still finalize as `under_review`.
- **Response:** `200 { "id": "<uuid>", "status": "under_review" | "invalid" }`
- **Side effects:** sets `ended_at`, duration, distance, route jsonb; `status → under_review` (or `invalid`); Admin review email when `under_review`
- **Duration:** server computes `duration_seconds` from `started_at` and request `endedAt` (client `durationSeconds` is ignored when `started_at` is set)

#### `GET /sessions`

List caller's sessions (newest first).

- **Query:** `status` (optional filter), `limit` (default 50), `offset` (default 0)
- **Response:** `200 { "sessions": [ … ] }` — each session includes `checkpointCount` (Prisma `_count.checkpoints`) and `photoCount` (`checkpointCount * 2`, selfie + progress per checkpoint) for Home dashboard hydration

#### `GET /sessions/:id`

Session detail including checkpoints.

- **Response:** `200 { "session": { … }, "checkpoints": [ … ] }` — session includes `declineReason` when admin set one at decline time (volunteer-facing only)
- **Validation:** session must belong to caller

#### `PATCH /sessions/:id/approval`

Admin status change (test phase: manual curl or Supabase table editor).

- **Body:** `{ "status": "approved" | "not_approved" | "invalid" }`
- **Auth:** admin role or service_role (implementation TBD for v1)
- **Response:** `200 { "id": "<uuid>", "status": "<new_status>" }`

#### `DELETE /sessions/:id`

Volunteer-owned hard delete (removes session from admin review queue).

- **Auth:** JWT; session must belong to caller
- **Allowed when:** status is `active`, `under_review`, `not_approved`, or `invalid`
- **Rejected when:** status is `approved` → `409 { "error": "Approved sessions cannot be deleted" }`
- **Response:** `204` (no body); checkpoints cascade-delete via FK

#### `GET /sessions/:id/service-letter.pdf`

Approved-session **service letter** PDF (org letter + static route map + checkpoint photos).

- **Auth:** volunteer JWT **or** header `x-admin-key: <ADMIN_API_KEY>`
- **Guards:** session `status === approved`; volunteer must own session unless admin key
- **Response:** `200` `application/pdf`, `Content-Disposition: attachment; filename="CGB-Service-Letter-YYYY-MM-DD.pdf"`
- **Side effects:** sets `letterhead_generated_at` on the session

#### `POST /sessions/service-letter.pdf`

Combined letter PDF for multiple approved sessions (same volunteer when using JWT).

- **Body:** `{ "sessionIds": ["<uuid>", …] }` (minimum one id)
- **Auth / guards:** same as GET
- **Response:** multi-session filename includes `-multi`
- **Side effects:** sets `letterhead_generated_at` on all included sessions

Spec: [service-letter-pdf.md](../../frontend/specs/service-letter-pdf.md).

#### `DELETE /users/me`

Close the volunteer account.

- **Auth:** volunteer JWT
- **Response:** `200 { "courtLogsRetained": true | false }`
- **Side effects:** deletes non-court sessions + checkpoint photos + inbox/feedback. Shop orders/donations stay. If the volunteer has court-ordered sessions or a `court_orders` row, those records stay and the Auth user is anonymized + banned. Otherwise the Auth user is deleted.

#### `POST /emails/order-placed`

Order-placed confirmation (Figma `1311:359`). Spec: [order-emails.md](order-emails.md).

- **Auth:** volunteer JWT
- **Body:** `{ "orderId": "<uuid>" }`
- **Guards:** `shop_orders.user_id` must match the JWT subject
- **Response:** `200 { "ok": true }` or `{ "ok": true, "skipped": true }` when Resend/email is missing
- **Side effects:** Resend HTML email + `email_log` (`order_placed`)

## Data model

### `sessions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK → auth.users | RLS: `auth.uid() = user_id` |
| `activity` | text | |
| `court_ordered` | boolean | |
| `description` | text | |
| `started_at` | timestamptz | set on create |
| `ended_at` | timestamptz | set on finalize |
| `duration_seconds` | int | Server-derived from `started_at` → `ended_at` on finalize |
| `distance_miles` | numeric | |
| `route` | jsonb | `[[lng, lat], …]` polyline |
| `status` | enum | `active` → `under_review` → `approved` / `not_approved` / `invalid` |
| `decline_reason` | text | Volunteer-facing reason when admin declines (not private `admin_notes`) |
| `adjusted_hours` | numeric | optional admin override (letter PDF hours) |
| `letterhead_generated_at` | timestamptz | set when service letter PDF is generated |
| `created_at` | timestamptz | |

### `checkpoints`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `session_id` | uuid FK | |
| `selfie_path` | text | Storage path, not URL |
| `progress_path` | text | Storage path |
| `captured_at` | timestamptz | |
| `submitted_early` | boolean | true if before 30-min countdown |
| `latitude` | double precision | WGS84 at capture (nullable for legacy) |
| `longitude` | double precision | WGS84 at capture (nullable for legacy) |

### Storage: `session-photos`

Private bucket. Path: `{user_id}/{session_id}/{checkpoint_id}-selfie.jpg`.

## Acceptance criteria

- [ ] **AC-1:** `POST /sessions` creates an `active` session tied to the JWT `user_id`
- [ ] **AC-2:** `POST /sessions/:id/checkpoints` stores metadata; rejects if session not `active` or not owned
- [x] **AC-3:** `PATCH /sessions/:id/finalize` sets `under_review` (or `invalid`) with route, duration, distance; legacy `skipOrientation` is ignored and never auto-approves
- [x] **AC-4:** `GET /sessions` and `GET /sessions/:id` return only the caller's data (RLS + API check)
- [x] **AC-5:** Anonymous Supabase users can create sessions (test phase)
- [x] **AC-6:** GPS route stored as jsonb `[[lng, lat], …]` matching `liveSessionStore` `RouteCoordinate` type
- [x] **AC-7:** Photo binaries never pass through Fly — client uploads to Storage; API stores paths only
- [x] **AC-8:** Session ends with `invalid` when client calls finalize with `status: "invalid"` (missed-checkpoint grace expiry)
- [x] **AC-9:** `GET /health` returns 200 for Fly health checks
- [x] **AC-10:** `GET /sessions` includes `checkpointCount` and `photoCount` per row for Home impact stats
- [x] **AC-12:** `POST /sessions/:id/checkpoints` accepts optional `latitude` / `longitude` (WGS84) and persists them for admin/web-app trail photo pins; omitted on legacy clients


## Security & privacy

- JWT verification via Supabase JWT secret on Fly (see [supabase.md](../../supabase.md))
- RLS on `sessions` and `checkpoints` — users read/write own rows only
- `service_role` key only on Fly secrets — never in client or docs
- Session-only geolocation: client stops foreground watch + background task when session ends (`finalizeLiveSession` / cancel in `liveSessionStore`)
- Retention, cascade deletion, minor protection: [privacy-and-data-rights.md](privacy-and-data-rights.md) (full ACs not blocking test phase)

## Test plan

1. Deploy API to Fly with secrets set per [supabase.md](../../supabase.md)
2. `curl GET /health` → 200
3. Obtain anonymous JWT from Supabase client; `POST /sessions` → 201
4. Upload test image to `session-photos`; `POST /sessions/:id/checkpoints` → 201
5. `PATCH /sessions/:id/finalize` with sample route → `under_review`
6. `GET /sessions/:id` → route + checkpoints present
7. Expo Go end-to-end: start session → walk → photo → end → kill app → reopen → session visible in list
