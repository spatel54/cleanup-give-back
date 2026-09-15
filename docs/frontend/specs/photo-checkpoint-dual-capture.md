# Spec: Photo checkpoint — dual / sequential capture

**Date:** 2026-07-18 (updated 2026-09-01)  
**Status:** Implemented (`expo-camera` sequential)  
**PRD:** §6.12 (photo checkpoint)  
**Route:** `/photo-capture` (`PhotoCaptureScreen`)  
**Related:** [session-tracking-expo-go.md](session-tracking-expo-go.md) AC-12, AC-36; [report](../../reports/2026-07-18-backend-and-dual-camera.md)

## Summary

Photo checkpoints use a BeReal-style **preview** (full-bleed progress + selfie PiP) before submit. Capture uses **`expo-camera` sequential** capture (front selfie → back progress) without remounting the camera between steps; simultaneous multi-cam remains disabled (Fabric/Nitro crash risk — see dual-camera report).

**Age gate:** Session photos run only when `canUseSessionPhotos()` is true (known age ≥ 18, or missing birthday). Ages 13–17 skip `/photo-capture` and `/photo-checkpoint` entirely — see [minor-session-photos.md](minor-session-photos.md).

## User stories

- As a **volunteer**, I want to capture my selfie and cleanup area quickly, so that checkpoints are low-friction during an active session.
- As a **volunteer**, I want to review both photos before submitting, so that I can retake if something is wrong.
- As a **tester**, I want clear capture errors (not a stuck shutter), so that I can recover without force-quitting.

## Acceptance criteria

- [x] **AC-1:** `/photo-capture` uses **`expo-camera` `CameraView`** sequential capture (front then back) with mirrored front preview, selfie PiP on the back step, haptic shutter, and `onCameraReady` gating on the **first** (front) step only — do not reset ready when flipping `facing` (native does not re-fire `onCameraReady`).
- [x] **AC-2:** Shutter is disabled until `onCameraReady`; null URI / capture failures show Alert + inline error.
- [x] **AC-3:** Preview matches Figma `383:239`: full-bleed progress, selfie PiP, **Retake Photos** and **Submit**.
- [x] **AC-4:** **Retake** returns to live capture with a cross-fade on a black host (preview fades out with slight scale while camera mounts underneath at opacity 0, then fades in after a short head start; instant under reduced motion); **Submit** persists via `persistCheckpointPhotos`, resolves capture GPS via `resolveCheckpointCaptureCoords` (store / last-known / timed fix), calls `addPhotoCheckpoint` with `latitude`/`longitude`, navigates to `/photo-submitted`.
- [x] **AC-11:** Checkpoint rows synced to Fly include WGS84 `latitude`/`longitude` when a fix is available (session-start, in-session, and session-end); admin Walking Path pins prefer those coords over time-along-route.
- [x] **AC-9:** **Session start** mode (`?mode=session-start`): form **Start Session** pushes `/photo-capture?mode=session-start` when photos are enabled; submit consumes pending form → `startNewLiveSession` + first checkpoint → `/live-session`; under-18 starts the live session with no capture; cancel clears pending start photos and `dismissTo('/session-setup')` so the filled form remains (see AC-5)
- [x] **AC-10:** **Session end** mode (`?mode=session-end`): **End Session** on live tracker opens dual capture when photos are enabled; submit adds final checkpoint (bypasses the per-window duplicate guard so end photos still save after a mid-window checkpoint) + `finalizeLiveSession` (blocked unless ≥4 photos: start pair + end pair) → `/submission-confirmation` (route preview + replay); under-18 finalizes without camera; cancel returns to `/live-session`
- [x] **AC-5:** **Cancel** / Go Back uses `dismissTo('/live-session')` for in-session checkpoints / session-end; **session-start Cancel** clears pending start photos only (keeps pending form), then `dismissTo('/session-setup')` so title / court-ordered / description stay filled
- [x] **AC-6:** Historical VisionCamera `DualCapture` path is **not mounted**; simultaneous dual remains out of scope until native crash is fixed.
- [x] **AC-7:** Web shows “camera not available” guidance.
- [x] **AC-8:** Submitted photos appear on submission confirmation with real timestamps (see session-tracking AC-13).
- [x] **AC-12:** Zoom labels map to real optical factors on every camera. `patches/expo-camera+17.0.10.patch` (regenerated for the current SDK as `expo-camera+*.patch`) adds an absolute `zoomFactor` prop and makes `onAvailableLensesChanged` report the active device's zoom range, so `lib/cameraZoom.ts` can anchor 1× exactly instead of guessing a fraction of an unknown device maximum. The back camera stays pinned to the virtual multi-lens device (`builtInTripleCamera` / `builtInDualWideCamera`) for the whole range so iOS performs the optical hand-off and the capture input is never swapped mid-scrub. Where an optical ultra-wide exists, 0.5×→1× is a real crop into the wide lens. Where no ultra-wide exists — every front camera, and single-lens backs — 0.5× and 1× are both the sensor's full frame (no digital crop); above 1× still zooms in. **Selfie** locks to full-sensor framing (internal 0.5× / `min` zoom) with **no zoom UI**, and `findWidestFrontLens` selects the widest available front lens (ultra-wide → wide → TrueDepth); **rear** progress keeps the full 0.5×–5× pills + wheel and defaults to **0.5×**. Unpatched installs (Expo Go, Android) fall back to the 0–1 `zoom` curve with the same no-crop rule when no ultra-wide is detected.

## Out of scope

- Re-enabling simultaneous dual capture for App Store (blocked on VisionCamera / Fabric HybridObject serialization)
- Video / burst / flash customization beyond defaults
- Camera roll export before submit

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `expo-camera` | Live preview + `takePictureAsync` (Expo Go + dev client) |

## Notes

- Prefer sequential-first for production reliability; dual is a polish path once native crash is fixed.
- See progress Session 181 and the dual-camera report for the Fabric/Nitro root cause.
