# Spec: Session route replay

**Date:** 2026-07-18  
**Status:** Implemented  
**Screens:** `/session-detail`, `/submission-confirmation`  
**Component:** `SessionRouteMapPanel`

## Summary

Completed sessions show an animated **route replay** on the walking-path map: Play advances the polyline over a **route-length-scaled** duration (clamped ~3–10s), Pause holds progress, Replay restarts from the start. Progress is **distance along the display path** (interpolated tip), not GPS timestamp playback. The displayed path uses **`simplifyRouteForLiveDisplay`** (1 m Douglas–Peucker + raw tail) — the same pipeline as the live tracker — not the coarser 4 m preview simplify. Auto-replay once on load respects **`useReducedMotion`** (static full route when enabled). Works in Expo Go (WebView MapLibre) and EAS dev-client native MapLibre previews.

## User stories

- As a **volunteer**, I want to replay my cleanup route on session detail, so that I can review the path I walked.

## Acceptance criteria

- [x] **AC-1:** When a route has ≥ 2 GPS points, `SessionRouteMapPanel` shows icon **Play**, **Pause**, and **Replay** controls plus a synced `MM:SS / MM:SS` replay timer.
- [x] **AC-2:** Play animates partial polyline from start to end (duration from `computeRouteReplayDurationMs`, ~3–10s by path length); progress follows **distance along the live-display path** (`simplifyRouteForLiveDisplay` then `sliceRouteByDistanceProgress` with interpolated tip), not vertex index; end marker appears when complete.
- [x] **AC-3:** Pause stops animation at current progress; Play resumes from that point.
- [x] **AC-4:** Replay resets to start and plays again.
- [x] **AC-5:** Expo Go WebView uses `setRouteReplayProgress`; native MapLibre slices coordinates by distance progress (shared `sliceRouteByDistanceProgress` / WebView helper).
- [x] **AC-6:** Animation has a **single RAF owner** — `startReplay` / Play only set `isPlaying`; the `isPlaying` effect schedules `requestAnimationFrame` (no double-RAF from effect + imperative start).
- [x] **AC-8:** Session detail / submission confirmation map cards are taller (~250px) and show a bottom-right **My Location** control (`TrackerMyLocationIcon`) that re-fits the walking path (`fitBounds` / single-point flyTo) after the user pans or zooms away.

## Out of scope

- Live-session mid-track replay (during active tracking)
- Scrubber / timeline drag
- Speed controls

## Test plan

1. Complete a session with outdoor GPS → open submission confirmation or session detail.
2. Confirm auto-replay runs once on load (or stays static when reduced motion is enabled).
3. Tap **Play** → route draws progressively over ~3–10s by path length; **Pause** → holds; **Replay** → restarts.
4. Pan/zoom away from the path → tap bottom-right location pin → map re-fits the route.
5. Confirm on Expo Go (WebView) and dev client (native) if available.
