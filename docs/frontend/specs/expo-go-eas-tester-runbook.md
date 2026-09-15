# Spec: Expo Go + EAS tester runbook

**Date:** 2026-07-21  
**Related:** [session-tracking-expo-go.md](./session-tracking-expo-go.md), [expo-go-dev-networking.md](./expo-go-dev-networking.md), [accounts-and-access.md](../../accounts-and-access.md)

## Prerequisites

1. Copy [`frontend/.env.example`](../../../frontend/.env.example) → `frontend/.env` (gitignored).
2. Set **Supabase** `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Dashboard → Settings → API).
3. Set `EXPO_PUBLIC_API_URL=https://sessions.example.com` (or your Fly app URL).
4. Enable **Anonymous auth** in Supabase (see [supabase.md](../../supabase.md)).

## Repo commands

From repo root:

| Command | Use |
|---------|-----|
| `npm run typecheck` | TypeScript (frontend) |
| `npm test` | Jest unit tests (frontend) |
| `npm run lint` | ESLint via Expo |
| `npm start` | Expo Go — default tunnel |
| `npm run start:lan` | Expo Go — same Wi‑Fi LAN |
| `npm run start:device` | Expo Go — tunnel for cellular/hotspot |

EAS development client (after installing a dev build):

```bash
cd frontend && npm run start:dev-client
```

Build dev client (org Expo account):

```bash
cd frontend && eas build --profile development --platform ios
# and/or --platform android
```

## Session flow (matches app code)

**Start Tracking** → session setup **form** → **Start Session** → `/photo-capture?mode=session-start` (dual photos) → `/live-session` (GPS + timer start) → checkpoints on timer → **End Session** → final photos → submission confirmation.

## Expo Go vs EAS

| Capability | Expo Go | EAS dev client + Always location |
|------------|---------|----------------------------------|
| Live map | WebView MapLibre | Native MapLibre |
| GPS while app open | Yes | Yes |
| GPS while locked / background | Gap expected; resumes on unlock | Should continue via `expo-task-manager` |
| Checkpoint camera | Sequential `expo-camera` | Same |
| Checkpoint API sync | Yes (with `.env`) | Yes |

## Smoke checklist (both runtimes)

1. Cold start → Home (onboarding or Log In).
2. Start Tracking → form → Start Session → capture selfie + progress → live tracker.
3. Wait for **Getting precise location…** to clear; walk outdoors ≥ 2 min — route polyline + distance update.
4. Brief app switch → return — GPS resumes (no long blank trail).
5. Submit an in-session checkpoint when timer allows (or wait for modal).
6. Force-quit mid-session → **Resume** → tracker restored.
7. End Session → final photos → confirmation + route replay.
8. Sessions list / detail — row visible; optional delete (non-approved).
9. Supabase: `sessions`, `checkpoints`, `session-photos` objects (when API healthy).

## Troubleshooting

### Green trail not drawing (pin moves, no line)

1. Confirm **Distance** increments while walking (shows hundredths under 0.1 mi, e.g. `0.03`) — if stuck at `0.0`, check **Precise Location** (iOS Settings → app → Location).
2. Metro **`[supabase] anonymous sign-in failed: Invalid path`** — set `EXPO_PUBLIC_SUPABASE_URL` to the dashboard **Project URL** only (`https://<ref>.supabase.co`, **no** `/rest/v1/`); use the **anon public** JWT key; restart `npm start`.
3. In `__DEV__`, if the route stays empty >10 s while the pin updates, Metro logs once with last raw/resolved accuracy — fixes >25 m resolved accuracy are rejected until GPS improves.
4. After map JS changes, fully **Reload** Expo Go so the WebView HTML remounts (stale HTML can leave a route source without a line layer).

## Known limits

- **Expo Go:** foreground-only GPS; lock-screen route gaps are expected.
- **Checkpoint 404:** client recreates remote session once and retries; if Fly/Supabase misconfigured, local photos still kept with sync warning.
- **Notifications:** background delivery limited in Expo Go; EAS for reliable closed-app alarms.

## Verify before handoff

```bash
npm run typecheck && npm test && npm run lint
```
