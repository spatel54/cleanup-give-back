# Spec: Approved session service letter PDF

**Date:** 2026-07-26  
**Status:** Implemented — code shipped; production requires Fly deploy + secrets. Local schema synced via `backend/sessions` Prisma (session pooler `DATABASE_URL`).  
**Related:** [sessions-api.md](../../backend/specs/sessions-api.md), [admin-portal-prd.md](../../admin/admin-portal-prd.md) §7.6

## Summary

Volunteers and admins can download a multi-page PDF for **approved** cleanup session(s): page 1 is the org verification letter (logo, address, volunteer name, date range, total hours, stewardship copy, Admin signature); following pages show per-session evidence (static route map, session times, checkpoint photos).

## User stories

- As a volunteer, I want to download a PDF for an approved session from session detail, so I can submit proof of community service.
- As a volunteer, I want to pick a date range of approved sessions and download one combined PDF or CSV, so courts or schools see total hours and all evidence without selecting each session.
- As an admin, I want the same PDF from the admin portal, so the admin's letter matches what volunteers receive.

## Acceptance criteria

- [x] AC1: **Approved only** — PDF endpoints return 4xx when any requested session is not `approved`.
- [x] AC2: **Ownership** — Volunteers may only request their own sessions; admin key bypasses ownership.
- [x] AC3: **Letter page** — Includes org logo, address/phone, Tax ID `00-0000000`, today’s date, volunteer name, hours line, stewardship paragraphs, signature image, Executive Director block and email.
- [x] AC4: **Hours** — Per session uses `adjusted_hours` when set, else `duration_seconds / 3600`. Multi-select sums hours and uses earliest `started_at` through latest `ended_at` (fallback `started_at`).
- [x] AC5: **Evidence** — For each session (chronological): title/activity, start/end/duration, static map PNG with GPS route, checkpoint selfie and progress photos with capture times.
- [x] AC6: **Single session** — `GET /sessions/:id/service-letter.pdf` returns letter + that session’s evidence.
- [x] AC7: **Multi session** — `POST /sessions/service-letter.pdf` with `{ "sessionIds": [...] }` (min 1); all same volunteer when caller is volunteer.
- [x] AC8: **Mobile UX** — Session detail shows **Download PDF** when approved (also saves a copy under Account → Letters). Sessions list fixed bottom-right **Export record** FAB (and Account Records / Privacy second links) open the date-range screen when any session is approved; otherwise an alert: **No approved sessions to download.** Select mode is delete-only (no bulk PDF; FAB hidden). Letters library: [letters-library.md](letters-library.md).
- [x] AC9: **Admin UX** — Letterhead buttons download the same PDF via admin proxy or API with admin key.
- [x] AC10: **Audit** — Sets `letterhead_generated_at` on included sessions after successful generation.
- [x] AC11: **Date-range download** — `/export-service-record` defaults to earliest approved session → latest approved session; the calendar only enables days that have approved sessions; **Download** calls `POST /sessions/service-letter.pdf` (or single GET) for approved IDs in range; success screen **View PDF** re-opens the share sheet.
- [x] AC13: **Letter logo** — page 1 top-left is the CUPGB lockup (`logo-letterhead.png`), not the Stitch briefcase placeholder.
- [x] AC12: **CSV** — Same approved date-range set exports a client-side CSV (Date, Title, Hours, Miles, Status) via the system share sheet. CSV is not added to Letters.
- [x] AC14: **Letters library** — Each PDF download appends a device-local Letters row (title **Service letter**, date · hours subtitle). Repeat downloads append. See [letters-library.md](letters-library.md).

## Out of scope

- Court-packet cover sheet from the volunteer app (admin-only).

## Dependencies

- Fly Sessions API, Supabase service role (signed photo URLs, volunteer `full_name`).
- Assets: `frontend/assets/images/logos/` (logo + `REMOVED`), copied to `backend/sessions/assets/`.

## Test plan

1. Approve a session with route + checkpoints → volunteer Download PDF → verify letter fields and evidence pages.
2. Multi-select two approved sessions → combined hours/range + two evidence sections.
3. Attempt download for pending session → error.
4. Admin Generate Letterhead → same bytes as volunteer for same session.
5. `cd frontend && npx tsc --noEmit`; `cd backend/sessions && npm run build`.
