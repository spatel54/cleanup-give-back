# Spec: Account Letters library

**Date:** 2026-09-11  
**Status:** Implemented  
**Routes:** `/letters`, `/letter-detail`  
**Related:** [service-letter-pdf.md](service-letter-pdf.md)

## Summary

Account → Records → **Letters** is a device library of service-letter PDFs the volunteer has already downloaded (session **Download PDF** or **Download Service Record** PDF). It is not a list of every approved session. Each download appends a row. Row tap opens a detail screen with **View PDF** / **Share**. Export FAB can start a new date-range download or share a combined PDF of selected letters.

## User stories

- As a volunteer, I want every service letter I download to appear under Letters, so I can find it later without re-exporting from Sessions.
- As a volunteer, I want a combined date-range letter to show one row with the date span and total hours, so I can tell multi-session packets from single-session letters.
- As a volunteer, I want to preview a saved letter and share the PDF again, so I can send it to a court or school.

## Acceptance criteria

- [x] AC1: **Download history only** — Letters lists persisted downloads, not all approved sessions. Empty copy is **No letters downloaded**.
- [x] AC2: **Record on PDF download** — Session detail **Download PDF** and Download Service Record **PDF** each append a Letters row (CSV does not). Repeat downloads append; they do not replace.
- [x] AC3: **Row copy** — Title is always **Service letter**. Subtitle is `{date} · {hours}` (e.g. `Apr 12, 2026 · 2.0 hrs`) or `{start} – {end} · {hours}` when the PDF covers more than one calendar day.
- [x] AC4: **Row tap** — Opens `/letter-detail?id=` (metadata + **View PDF** / **Share**). Does not share immediately.
- [x] AC5: **Export all** — Same approved-session gate as Download Service Record, then `/export-service-record?returnTo=letters`. Empty list: FAB goes straight to that flow.
- [x] AC6: **Share (multi-select)** — Regenerates one combined PDF via `POST /sessions/service-letter.pdf` (or single GET) from the selected letters’ session ids, then records a new Letters row and opens the OS share sheet.
- [x] AC7: **Persistence** — PDF files live under app document storage (`letters/`); metadata in AsyncStorage. Log out / delete account clears both.
- [x] AC8: **Search / sort** — Existing search + Most recent / Oldest / A–Z remain; sort uses downloaded time (and subtitle for A–Z).

## Out of scope

- Inline in-app PDF renderer (View PDF uses the OS share sheet / Quick Look, same as export success).
- Server-side letter library (rows are device-local).
- CSV rows in Letters.

## Dependencies

- Fly `GET /sessions/:id/service-letter.pdf` and `POST /sessions/service-letter.pdf`
- `sessionStatsStore` for dates/hours on the recorded row
- `expo-file-system` document directory + `expo-sharing`

## Test plan

1. Approve a session → session detail **Download PDF** → Account → Letters shows **Service letter** with that date and hours.
2. Download Service Record PDF for two days → Letters shows a range subtitle and summed hours.
3. Tap the row → detail → **View PDF** / **Share** re-opens the file.
4. Letters **Export** → select two rows → **Share** → combined PDF + a new Letters row.
5. Letters **Export all** (or FAB with an empty list) → Download Service Record date-range screen.
6. Empty library → **No letters downloaded**.
7. `cd frontend && npx tsc --noEmit`; `npm test -- downloadedLetters`.
