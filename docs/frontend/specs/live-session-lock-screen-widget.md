# Spec: Live session Lock Screen widget (ActivityKit)

**Date:** 2026-08-11  
**Status:** In progress — JS bridge + widget target wired; needs EAS rebuild and device QA  
**Surfaces:** iOS Lock Screen + Dynamic Island (iPhone 14 Pro/Pro Max and later)  
**Native additions:** Widget Extension target (SwiftUI/ActivityKit), a local Expo module bridge, an App Group  
**Related:** [session-tracking-expo-go.md](./session-tracking-expo-go.md), [expo-go-eas-tester-runbook.md](./expo-go-eas-tester-runbook.md), `docs/xcode-build.md`

## Summary

While a cleanup session is active, show a **Live Activity** on the Lock Screen (and Dynamic Island where available) with elapsed time and distance tracked so far, so a volunteer can glance at session progress without unlocking the phone or reopening the app. This is **ActivityKit**, not a static WidgetKit home-screen widget — a static widget only refreshes on a ~15–30 min background budget and would look stale for something meant to feel live. Android has no equivalent surface; this is iOS-only.

**Cannot run in Expo Go.** This needs a native Widget Extension target and a small native bridge module, so every test cycle is an EAS/`expo prebuild` dev-client build (see `expo-go-eas-tester-runbook.md`).

## User stories

- As a **volunteer running a cleanup session**, I want to see elapsed time and distance on my Lock Screen, so that I don't have to unlock my phone and reopen the app just to check progress.
- As a **volunteer**, I want the Live Activity to end automatically when I submit my end-of-session photos, so that it doesn't keep showing a session that's already over.

## Design decisions

1. **Elapsed time renders via `Text(timerInterval:)`, not per-second app updates.** ActivityKit's SwiftUI view can bind directly to a `Date` range and let the OS tick the timer locally — the recommended Apple pattern for Live Activities showing a running clock. The RN side does **not** need to call an update every second; it only needs to pass the session's `startedAt` timestamp once, at activity start.
2. **Distance updates are throttled, not tied to the 1s tick in `liveSessionStore.ts`.** `syncSessionClocks()` already runs every second (`startTicking()` in `liveSessionStore.ts:245`) to drive `elapsedSeconds`/`checkpointSecondsRemaining` for the RN UI — reusing that cadence to also push native `Activity.update()` calls would be wasteful (ActivityKit updates cost battery and are rate-limited in practice). Push a native update on **distance-mile-tenth crossing** or **every 30s while `isActive`**, whichever comes first — mirrors the existing "meaningful change" throttling pattern already used for compass heading (`HEADING_NOTIFY_MIN_INTERVAL_MS` in the same file).
3. **Local updates only — no remote push.** `frontend/plugins/withNoPushEntitlement.js` deliberately strips the `aps-environment` entitlement (push notifications were removed from this app; see `xcode-build.md`). ActivityKit's `Activity.update()`/`.end()` calls work fine locally from a running process without that entitlement — only *remote* push-token-driven updates need it. Practical consequence: if iOS suspends the app process for longer than its background execution budget (e.g., phone locked and app not doing active background location work), the Live Activity freezes at its last pushed value until the app resumes. This is an accepted limitation, not a bug — call it out in the AC below rather than silently over-promising "always live."
4. **iOS 16.1+ only.** ActivityKit requires iOS 16.1 (Dynamic Island compact/expanded views need 16.2 for full reliability). Current `app.json` → `expo-build-properties` sets `ios.deploymentTarget: "15.1"` — this needs to move to **16.1**, gated behind `if #available(iOS 16.1, *)` in the native bridge so the call is a no-op on unsupported OS versions rather than a crash. Confirm with the user whether dropping pre-16.1 device support project-wide is acceptable, or whether the deployment target bump should be scoped to the widget extension target only (the main app target can stay at a lower minimum while the extension requires more — config-plugin support for per-target deployment targets needs checking against whatever `@bacons/apple-targets` exposes).
5. **Data handoff via an App Group**, not just in-memory bridge calls — a Live Activity's SwiftUI view runs in the widget extension's own process, so it can't read `liveSessionStore.ts`'s JS state directly. `Activity<SessionActivityAttributes>.request(attributes:content:)` passes an initial snapshot at start, and subsequent `.update(...)` calls from the native bridge push new snapshots — no shared file/UserDefaults needed for the *display* data itself, since ActivityKit's content state is the transport. An App Group is still useful for a "tap to open / resume tracking" deep link consistency check, but is not required for v1's read path.
6. **Visual design — Lock Screen two-tone premium (not a copy of the in-app amber pill).** **Live:** primary green `#009540` top bar + soft `green/50` `#f7fff1` body; dark stats (`#1c1b1b` / tertiary `#3e4a3d`); checkpoint progress bar tints green → amber `#f0ad1e` (70–90%) → declined red (≥90%). **Photos on:** **mi | TIME | next photo** with Strava-style center hero (elapsed **40pt** IBM Plex SemiBold vs **20pt** side stats, plus a **time** unit label). Hero is a `ZStack` overlay at true center — side columns hug the edges (~12pt inset) and must not share an equal-width `HStack` with the timer. Stats sit **16pt** below the green/red bar (`LiveLayout.bodyTop` in Swift, `.body { padding-top: 16px }` in `preview.html`) so the 40pt hero does not crowd the chrome. **Photos off:** **mi | TIME** — same centered 40pt **time** hero as photos-on (left `mi` only; no progress). **Photo due:** **mi | TIME | remaining** — same hero plus the 10-minute grace countdown on the right (`timerInterval` from due → grace end; sits at `0:00` after grace). No progress bar. **Photo due:** declined red `#BA1A1A` top bar + soft `red/50` `#ffd9de` body. No amber chrome on the card itself (only the progress fill). **Bar flush:** card `VStack(spacing: 0)` + `.contentMarginsDisabled()` so the green/red bar abuts the tinted body; outer stack background is the bar color and the stats block paints the body (1pt overlap) so a compositor hairline cannot show white. **Layout constraint:** `Text(timerInterval:)` sizes for the widest string in the 12h range (~`11:59:59` at 40pt) — never let that intrinsic width drive column weights. Overlay the live timer on a current-format stub (`0:00` / `0:00:00`) and keep the hero `.fixedSize()`. Side columns stay `minWidth: 0` + `layoutPriority(1)`. **Dynamic Island compact:** CUPGB logo leading + elapsed timer trailing (fixed ~48pt width — do **not** use `maxWidth: .infinity` on trailing). Overdue DI accents use declined red on the system-black island. **Typography:** Noto Sans SemiBold (bar titles / units) + **IBM Plex Sans SemiBold** (all stat values / timers). **No Sanchez** in the widget extension (display/headings only in the main app). Fonts ship in `targets/live-session-widget/assets/Fonts/` (linked as extension resources) and are also registered at process start via `CTFontManagerRegisterFontsForURL`.
7. **Checkpoint countdown is system-driven.** Pass `checkpointWindowStartedAt` (ms) once at start / on reset; Swift renders countdown with `Text(timerInterval: windowStart...dueAt, countsDown: true)` and overdue with `countsDown: false` from `dueAt`. JS pushes `checkpointDueOrGrace` on throttle (or immediately on checkpoint reset) for styling only — not per-second.

## Data flow / hook points

All in `frontend/src/features/session-tracking/liveSessionStore.ts` unless noted:

| Event | Existing function | New call |
|---|---|---|
| Session starts | `startNewLiveSession()` | `startLiveSessionLiveActivity({ startedAt, distanceMiles, checkpointWindowStartedAt, photosEnabled, checkpointDueOrGrace })` |
| Distance / due-state changes | `syncSessionClocks()` (1s tick) | Throttled `maybeUpdateLiveSessionLiveActivity(...)` — mile-tenth, 30s interval, or `checkpointDueOrGrace` flip |
| Checkpoint window reset | `resetCheckpointCountdown()` | Immediate `syncLiveSessionLiveActivityCheckpoint(...)` with new `checkpointWindowStartedAt` |
| Session ends | `finalizeLiveSession()` / `endLiveSession()` | `endLiveActivity()` |

The native bridge should be gated the same way the existing background-location code already gates Expo Go (`isExpoGoClient()` in `frontend/src/utils/isExpoGoClient.ts`) — Expo Go has no widget extension at all, so every call must be a safe no-op there, not just deferred.

## Acceptance criteria

- [ ] **AC-1:** Starting a Live Activity shows primary-green **Live** bar flush over soft green body (no white seam), **mi | TIME | next photo** (when photos enabled) all fully visible with a centered **time** label, Strava-style hero time (~40pt SemiBold vs ~20pt sides; timer overlaid on a `0:00` stub so `timerInterval` cannot off-center or clip sides), taller progress, on-brand fonts (Noto SemiBold + IBM Plex SemiBold), system-driven elapsed timer.
- [ ] **AC-2:** Distance on the Live Activity updates within ~30s of a meaningful change while the app process is alive (foreground or active background location tracking) — not necessarily while the app is fully suspended (see Design decision #3).
- [ ] **AC-2b:** When a checkpoint is due/in grace, the Live Activity uses a red top bar + soft red body and shows **mi | TIME | remaining** (centered hero + 10-minute grace countdown on the right); elapsed session time stays accurate via `timerInterval`.
- [ ] **AC-2c:** Dynamic Island compact places logo in `compactLeading` and timer in `compactTrailing` (split across the sensor) — not both packed on the left.
- [ ] **AC-2d:** When photos are disabled, Lock Screen shows **mi | TIME** (same centered hero as Live), no progress bar.
- [ ] **AC-3:** Ending a session (photo submit → `finalizeLiveSession`, or a forced/auto end) ends the Live Activity with a brief "Session complete" state, then dismisses it.
- [ ] **AC-4:** On a device below iOS 16.1, or in Expo Go, every call in the bridge module is a silent no-op — no crash, no console error loop.
- [ ] **AC-5:** Tapping the Live Activity (Lock Screen or Dynamic Island) deep-links into `/live-session` in the running app (or launches the app to that route if backgrounded/killed).
- [ ] **AC-6:** `tsc --noEmit` clean; the native bridge module's TS types compile against both Expo Go (no-op path) and dev-client (real path) without conditional `any`.

## Out of scope (v1)

- Android — no ActivityKit equivalent; not attempted.
- Static WidgetKit home-screen widget (separate surface, separate refresh model) — a possible future addition, not bundled with this work.
- Remote push updates via `aps-environment` / APNs live-activity push tokens — would require reversing the `withNoPushEntitlement` plugin decision; out of scope unless the user explicitly revisits that.
- Interactive buttons on the Live Activity (e.g. an in-place "End Session" or "Photo checkpoint" button via `Button(intent:)` / App Intents) — meaningfully larger scope (App Intents target, shared action handling); flag as a fast-follow idea, not v1.
- Per-checkpoint history/list inside the Live Activity — v1 shows current elapsed/distance/checkpoint window only.

## Dependencies

- `@bacons/apple-targets` (or equivalent config-plugin approach) to manage the Widget Extension target from within the Expo project so it survives `expo prebuild`.
- A local Expo module (`npx create-expo-module --local`, e.g. `frontend/modules/live-activity/`) for the Swift↔JS bridge — no existing custom native module in this project yet, so this establishes the pattern.
- `expo-build-properties` deployment target bump to 16.1 (see Design decision #4 — needs a scoping decision).
- Xcode with the widget extension SwiftUI files checked into the repo (not generated/ignored) so they're reviewable like any other source.
- EAS dev-client build for every test cycle — see `expo-go-eas-tester-runbook.md`. No Expo Go path.

## Test plan

0. **Browser HTML (no Xcode):** Open [`frontend/targets/live-session-widget/preview.html`](../../../frontend/targets/live-session-widget/preview.html) in any browser for a static stand-in of the Lock Screen card. Tokens, logo paths, and the five states (photos-on green/amber/red, photo due, photos off) match `SessionLiveActivity.swift` + `BrandLogoMark.swift`. Not ActivityKit — no ticking timer or system chrome.
0b. **Xcode Canvas (no app session):** Open `frontend/targets/live-session-widget/SessionLiveActivity.swift` in the widget extension target → Editor → Canvas. `#Preview` macros cover Lock Screen (photos on / off / photo due) and Dynamic Island (compact, compact photo due, expanded, minimal). Requires a built widget target so NitroActivityKitCore + fonts resolve.
1. `eas build --profile development --platform ios` (or local `expo prebuild` + Xcode run) after the widget extension target and bridge module are wired in.
2. Start a session on a physical iPhone (Live Activities don't render in Simulator reliably pre-17) → lock the phone → confirm the Live Activity appears on the Lock Screen with a ticking timer.
3. Walk around / let mocked or real GPS accumulate distance → confirm distance updates within the ~30s throttle window while the app stays backgrounded-but-alive (active location watch keeps the process running).
4. On an iPhone 14 Pro or later, confirm the Dynamic Island compact + expanded presentations render sensibly (not just the Lock Screen banner).
5. Submit end-of-session photos → confirm the Live Activity shows a brief "Session complete" state, then disappears.
6. Force-quit the app mid-session → confirm the Live Activity does **not** update further (expected per Design decision #3) and doesn't crash or hang when the app is later reopened.
7. Run the same session flow in **Expo Go** → confirm zero crashes, zero console spam, and the rest of the session flow (already fixed for the background-location crash) still works.
8. `npx tsc --noEmit` clean in `frontend/`.
