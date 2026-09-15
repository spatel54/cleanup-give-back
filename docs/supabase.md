# Supabase setup (sessions + geolocation)

Org-owned Supabase project for Auth, Postgres, and Storage. **Do not store secrets, API keys, or passwords in this repo.**

**Architecture:** [ADR-004](adr/ADR-004-sessions-backend-supabase-fly.md)  
**API contract:** [backend/specs/sessions-api.md](backend/specs/sessions-api.md)  
**Frontend spec:** [frontend/specs/session-tracking-expo-go.md](frontend/specs/session-tracking-expo-go.md)

---

## 1. Project setup (dashboard)

1. Create a Supabase project under the org email.
2. **Authentication → Providers** — enable **Email**, **Apple**, **Google**, and **Facebook**. Disable **Anonymous**. Add Redirect URL `nonprofitmobileapp://auth/callback` (and the Expo Go `exp://…/--/auth/callback` URL from `Linking.createURL('auth/callback')` in local dev).
3. Run the schema SQL below in **SQL Editor**.
4. Create a **private** Storage bucket `session-photos` with RLS (see §4).

---

## 2. Schema (v1)

```sql
create type session_status as enum
  ('active', 'under_review', 'approved', 'not_approved', 'invalid');

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  activity text,
  court_ordered boolean default false,
  description text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds int,
  distance_miles numeric,
  route jsonb,
  status session_status default 'active',
  created_at timestamptz default now()
);

create table public.checkpoints (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions on delete cascade,
  selfie_path text,
  progress_path text,
  captured_at timestamptz,
  submitted_early boolean default false
);

alter table public.sessions enable row level security;
alter table public.checkpoints enable row level security;

create policy "users_own_sessions" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_checkpoints" on public.checkpoints
  for all using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );
```

**Admin realtime read (2026-08-04):** `admin-web-app`'s `/sessions` + `/dashboard` pages subscribe to Supabase Realtime from the browser (anon key + admin's own JWT), which is still subject to RLS — `users_own_sessions` alone would hide every volunteer's rows from an admin. Run [`admin/db/008_admin_sessions_realtime_read.sql`](../admin/db/008_admin_sessions_realtime_read.sql) once (adds an `admin_read_all_sessions` SELECT policy keyed on `user_metadata.role = 'admin'`, plus adds `public.sessions` to the `supabase_realtime` publication) or the subscription connects but silently receives nothing.

**Volunteer inbox (2026-08-25):** Run [`admin/db/025_volunteer_notifications.sql`](../admin/db/025_volunteer_notifications.sql) once. Volunteers read their own rows and set `read_at`; admin JWT role `admin` has full access; service-role inserts from `admin-web-app/src/lib/notify.ts`. **Clear all (2026-08-26):** Run [`admin/db/026_volunteer_notifications_delete.sql`](../admin/db/026_volunteer_notifications_delete.sql) so volunteers can DELETE their own inbox rows. **Received banners (2026-08-26):** Run [`admin/db/027_volunteer_notifications_inbox_receive.sql`](../admin/db/027_volunteer_notifications_inbox_receive.sql) so volunteers can INSERT their own rows when an Expo banner arrives, and so `volunteer_notifications` is in the Realtime publication.

---

## 3. Environment variables

### Frontend (`frontend/.env` — copy from `frontend/.env.example`)

| Variable | Source | Notes |
|----------|--------|-------|
| `EXPO_PUBLIC_SUPABASE_URL` | Dashboard → Settings → API → **Project URL** (e.g. `https://<ref>.supabase.co`) | **Not** the REST path (`/rest/v1`). Safe to ship in client |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Dashboard → Settings → API → **anon public** JWT (`eyJ…`) | Not the publishable `sb_publishable_…` key. Safe to ship in client |
| `EXPO_PUBLIC_API_URL` | Fly app URL after deploy (e.g. `https://sessions.example.com`) | Fly Fastify sessions API |

### Backend local (`backend/sessions/.env` — gitignored)

Used by **Prisma CLI** (`npm run db:push`) and local API dev — **not** read by the Expo app.

| Variable | Source | Notes |
|----------|--------|-------|
| `DATABASE_URL` | Dashboard → **Database** → **Connect** → URI | From a **Mac/home network**, prefer **Session pooler** (port 5432, `*.pooler.supabase.com`). Direct `db.<ref>.supabase.co:5432` often fails with Prisma **P1001** (IPv6 / firewall). Append `?sslmode=require` if omitted. |
| `SUPABASE_URL` | Same as frontend Project URL | Optional for local `npm run dev` when testing PDF routes |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → Settings → API → **service_role** | Required locally to test service-letter PDF generation (signed photos + volunteer name) |

Copy template: create `backend/sessions/.env` manually; do **not** commit. Keep `DATABASE_URL` out of `frontend/.env` (client bundle scope).

```bash
cd backend/sessions
npm run db:push   # loads .env from this directory only
```

### Fly secrets (server only — never in repo)

Set after `fly auth login` and first deploy:

```bash
fly secrets set \
  SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co" \
  DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres" \
  SUPABASE_SERVICE_ROLE_KEY="eyJ..." \
  ADMIN_API_KEY="your-admin-proxy-key"
```

| Secret | Source |
|--------|--------|
| `SUPABASE_URL` | Same as frontend Project URL — used for JWKS JWT verification |
| `DATABASE_URL` | Settings → Database → Connection string → URI (direct or pooler; Fly usually tolerates **direct**) |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role — service letter PDFs, signed Storage URLs |
| `ADMIN_API_KEY` | Generate locally; must match admin portal `ADMIN_API_KEY` for `/api/service-letter/*` and Shippo Buy label |
| `SHIPPO_API_TOKEN` | Shippo dashboard API token (`shippo_test_…` until live) |
| `SHIP_FROM_PHONE` | Required for labels; ship-from address defaults to sample office |

Store real values in `credentials.local.md` (gitignored) or a password manager — **not** in `docs/`.

---

## 4. Storage bucket `session-photos`

- **Private** bucket; path conventions:
  - Checkpoint photos: `{user_id}/{session_id}/{checkpoint_id}-selfie.jpg` and `…-progress.jpg`.
  - **Account profile photo (2026-08-18):** `{user_id}/profile.jpg` — square JPEG (512×512 exported client-side); path mirrored in Auth `user_metadata.avatar_path`. Spec: [frontend/specs/account-profile-photo.md](frontend/specs/account-profile-photo.md).
- Client uploads with the user's Supabase JWT; RLS policy restricts paths to the authenticated user's prefix.
- Fly API stores **paths only** in `checkpoints` — checkpoint photos are not proxied through Fly. Profile photos are mobile-client-only (not in Fly API).

---

## 5. Fly.io CLI

Install if `fly` is not found:

```bash
curl -L https://fly.io/install.sh | sh
# Add ~/.fly/bin to PATH, then:
fly auth login
```

Deploy from `backend/sessions/` when implemented (see [sessions-api.md](backend/specs/sessions-api.md)).

### Transactional email (Resend)

**Status (2026-08-03):** Sending domain `example.org` is **verified** in Resend. Fly `example-sessions` has `RESEND_API_KEY`, `EMAIL_FROM`, and `ADMIN_NOTIFY_EMAIL`. Admin local mail uses the same vars in `admin-web-app/.env.local`. Vercel production admin still needs those vars if hosted approve/decline email is required.

The sessions API also serves email routes (auth required):

| Route | Purpose |
|-------|---------|
| `POST /emails/event-registration` | Event Register confirmation |
| `POST /emails/email-change/request` | Send 6-digit code to new email |
| `POST /emails/email-change/confirm` | Validate code |

Fly secrets (do not commit):

- `RESEND_API_KEY` — Resend API key
- `EMAIL_FROM` — verified sender (default `noreply@example.org`)
- `ADMIN_NOTIFY_EMAIL` — inbox for “session ready for review” on finalize

When `RESEND_API_KEY` is unset, routes return `{ ok: true, skipped: true }` (dev-safe).

---

## 6. Secret rotation (required if keys were exposed)

If service_role key, JWT secret, or database password appeared in chat, git history, or committed docs:

1. **Database password:** Settings → Database → Reset database password → update `DATABASE_URL` on Fly.
2. **JWT secret:** Settings → API → JWT Settings → Generate new secret → update `SUPABASE_JWT_SECRET` on Fly; all existing user sessions invalidate (anonymous users re-sign-in on next launch).
3. **Service role:** Cannot rotate independently — resetting JWT secret invalidates the service_role JWT as well; update `SUPABASE_SERVICE_ROLE_KEY` on Fly from the dashboard after rotation.

---

## 7. What does not need Supabase keys

| Capability | Provider | Key? |
|------------|----------|------|
| Map tiles (Expo Go WebView + native) | Carto / MapLibre GL | No |
| Live weather + reverse geocoding | Open-Meteo | No |
| Google Cloud Maps | — | Not used for session tracking in v1 |
