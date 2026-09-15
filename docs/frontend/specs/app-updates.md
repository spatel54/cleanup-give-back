# Spec: In-app Updates page

## Summary

Account has an **Updates** page that lists recent volunteer-facing app changes, grouped as running versions. Copy is curated from [progress.md](../../progress.md) — not a dump of the engineer log.

## User stories

- As a volunteer, I want to see what changed in the app, so I know why tracking or sign-in feels different.
- As Admin, I want testers to have a written What’s New, so TestFlight notes are not the only changelog.

## Acceptance criteria

- [x] **AC-1:** Account → Preferences → **Updates** opens `/updates`.
- [x] **AC-2:** Entries show a version (and optional build range), date, title, and short bullets.
- [x] **AC-3:** Newest version is first. Latest card is labeled **Latest**.
- [x] **AC-4:** Copy is volunteer-facing (no internal file paths, TEMP flags, or EAS IDs).
- [x] **AC-5:** Account footer shows the current app version and opens Updates.
- [x] **AC-6:** Source list lives in `frontend/src/features/updates/appUpdates.ts`. Add a card when shipping a user-visible change; keep [progress.md](../../progress.md) as the engineer log.

## Out of scope

- Auto-parsing `docs/progress.md` at runtime
- Admin console changelog
- Pushing a “what’s new” modal on launch

## Dependencies

- Account tab + `SessionSetupTopAppBar`
- `app.json` / Expo `version`

## Test plan

- Open Account → Updates; latest card is on top with **Latest**.
- Tap the footer version; same screen opens.
- Back returns to Account.
