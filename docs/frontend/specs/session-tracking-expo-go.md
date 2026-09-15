# Spec: Session tracking — Expo Go test phase

**Date:** 2026-07-13 (updated 2026-07-20)  
**Status:** Implemented — Expo Go test phase (API live at `sessions.example.com`)  
**ADR:** [ADR-004](../../adr/ADR-004-sessions-backend-supabase-fly.md), [ADR-005](../../adr/ADR-005-expo-go-webview-map.md)  
**Backend:** [sessions-api.md](../../backend/specs/sessions-api.md)  
**Dev networking:** [expo-go-dev-networking.md](expo-go-dev-networking.md)  
**PRD:** §6.9–6.15 (session setup through submission confirmation)

## Summary

Wire the existing native session tracking flow (`frontend/src/app/` routes + `liveSessionStore`) to registered volunteer auth, Fly sessions API persistence, and a WebView MapLibre map so testers can exercise the full geolocation + sessions loop in **Expo Go** on a physical device — no EAS dev-client build required. Session photos are **18+ only** ([minor-session-photos.md](minor-session-photos.md)).

## User stories

- As a **tester**, I want to start a cleanup session without signing in, so that I can validate tracking quickly.
- As a **tester**, I want to see my live GPS route on a map while walking, so that I can confirm geolocation tracking works.
- As a **tester**, I want to submit photo checkpoints during a session, so that evidence is captured and stored.
- As a **tester**, I want my completed session to persist after I close the app, so that I can confirm backend integration works.
- As a **tester**, I want to see my session in the sessions list with status **Under Review**, so that the post-session lifecycle is visible.

## Acceptance criteria

### Auth

- [x] **AC-1:** On first launch, app calls `supabase.auth.signInAnonymously()` silently (no login screen)
- [x] **AC-2:** Supabase session persists across app restarts via `@react-native-async-storage/async-storage` + `react-native-url-polyfill`

### Geolocation (client — already wired, verify in Expo Go)

- [x] **AC-3:** `expo-location` foreground permission prompt on session start
- [x] **AC-28:** Session Setup's **Required Permissions** Location/Camera toggles default to **on** when the OS has already granted those permissions (via onboarding or the session-setup-guide prompts), read via `isSessionLocationPermissionGranted`/`isSessionCameraPermissionGranted` (`getForegroundPermissionsAsync`/`Camera.getCameraPermissionsAsync`, no prompt) on mount; toggles still default to off and remain user-editable when permission was declined
- [x] **AC-28b:** Turning Location or Camera **off** on Session Setup shows a native iOS `Alert` that the volunteer cannot track a session without those permissions (**OK** / **Open Settings** via `Linking.openSettings()`). Under-18 copy mentions Location only. Location/Camera row labels are 15px.
- [x] **AC-29:** Session-setup-guide `/session-setup-step6` (location) auto-`replace`s forward when location is already granted (store/EAS requires **Always**; Expo Go still skips on When In Use). Enable location requests Always after When In Use on store/EAS so lock-screen tracking can run. `/session-setup-step7` (camera) is **always shown for 18+ after location** — even if camera was already granted — and only auto-skips for under-18 (`!canUseSessionPhotos()`).
- [x] **AC-30:** Account → Permissions Camera/Location toggles (`AccountScreen.tsx`) mirror the real OS grant status (re-checked on focus); turning a toggle on calls the real permission request (shows the native iOS prompt only if that permission has never been decided — expected iOS behavior); turning one off (or on when already denied) cannot revoke/grant an OS permission from inside the app, so the switch snaps back to the actual status and an alert offers **Open Settings** (`Linking.openSettings()`)
- [x] **AC-31:** Onboarding's `/notification-preference` **Enable notifications** button fires the real `expo-notifications` `requestPermissionsAsync()` (native iOS prompt) before continuing to `/setup-complete`; Account → Permissions gets a third **Notifications** toggle following the exact same mirror-OS-status / request-on-enable / Open-Settings-on-disable pattern as Camera/Location
- [x] **AC-4:** `liveSessionStore` accumulates route polyline and distance via `watchPositionAsync` during active session
- [x] **AC-5:** Location watching stops when session ends (`endLiveSession` / `finalizeLiveSession`) — foreground watch + background task both stop
- [x] **AC-6:** 30-minute checkpoint countdown runs; **10-minute** grace (`CHECKPOINT_MISS_GRACE_MS`) after due; GPS + elapsed keep running during grace; grace miss → `forcedEndPending` (tracking frozen) → forced-end dual capture → `finalizeLiveSession({ status: 'under_review' })` (store tick, background GPS ingest, or cold-start resume — not only `LiveSessionScreen`). Mid checkpoints may be skipped with no admin flag; abandon without end photos → discard (not submitted)
- [x] **AC-39:** Session start: session setup **form** → **Start Session** stashes setup → `/photo-capture?mode=session-start` → `startNewLiveSession` + first `addPhotoCheckpoint` (GPS + elapsed begin only after dual photos)
- [x] **AC-40:** Escalating checkpoint reminders: in-app `alertPhotoCheckpointDue` (`photo-checkpoint-alert.wav`, preloaded at app start) via `CheckpointAlertLoop` when due + every ~45s during grace; scheduled local notifications via `checkpointNotifications.ts` (high-importance Android channel `photo-checkpoints-v2`, `sound: 'default'`); foreground notification tap/receive also routes through alert when session active; cancelled on submit/end; tap opens checkpoint modal or live tracker (forced-end). Requires notification permission; EAS/dev client for reliable background delivery (Expo Go foreground-limited)
- [x] **AC-41:** Volunteer delete treats remote **404** as success and always clears local recent/cache/stats; tombstone registry (AsyncStorage `@cugb/volunteer-deleted-sessions`, hydrated in `AuthProvider` before recent-session hydrate) hides deleted ids from Sessions list + Home recent (no post-delete full API rehydrate that resurrects rows)
- [x] **AC-42:** Live tracker shows **Take Photo** / **Complete Session** when checkpoint is due/in grace or forced-end pending; **End Session** available except during forced-end; checkpoint modal opens globally via `CheckpointSessionGate` when the 30-min timer hits zero
- [x] **AC-43:** **End Session** (or forced-end **Complete Session**) requires final dual photo (`/photo-capture?mode=session-end`) before `finalizeLiveSession` → `/submission-confirmation`; without end photos the session is discarded and must be restarted
- [x] **AC-32:** Position samples pass through a **2D constant-velocity Kalman** filter (`locationKalman.ts`) before append gates (out-of-order ticks ignored; predict `dt` floored at **0.25 s**); min-move is `max(1.4m, accuracy×0.22)` with gap recovery after 30s of rejected appends; slow-walk floor **0.14 m/s**
- [x] **AC-33:** Active session foreground/background watch stays **BestForNavigation** at **1s / ~1 m**; motion state affects append gates only (no watch interval flip on slow walking)
- [x] **AC-34:** **Background GPS while session active only** via `expo-task-manager` (`backgroundLocationTask.ts`) when Always permission granted. Store/EAS asks Always at onboarding Enable, session-guide Enable, session-form Location toggle / Start Session, then starts the background task when the live session begins. Expo Go is foreground-only (`backgroundLocationEnabled === false` — no tracker banner; session still starts); returning to foreground restarts GPS via `resumeLiveSessionTrackingAfterForeground`
- [x] **AC-35:** Create / checkpoint / finalize sync failures no longer show a tracker banner (local success UX preserved; remote create is best-effort in the background)

### Map (Expo Go WebView — to implement)

- [x] **AC-7:** Expo Go renders `LiveSessionMapWebView` with Carto Voyager / Dark Matter (Standard) + Esri Satellite/Hybrid and primary-color route polyline
- [x] **AC-8:** Map updates live as `routeCoordinates` and `currentCoordinate` change in `liveSessionStore`
- [x] **AC-9:** Live tracker **My Location** control: when follow is off, tap calls `setLiveSessionMapFollow(true)` + `requestLiveSessionMapRecenter()` (flyTo to smoothed position **and rotate map bearing to current heading**, then keep easing center+bearing on GPS/compass updates); when follow is on, tap turns follow off
- [x] **AC-10:** Submission confirmation and session detail use read-only WebView route preview with `fitBounds`
- [x] **AC-11:** Native MapLibre path unchanged for future EAS builds; web keeps placeholder
- [x] **AC-22:** Live and preview maps support user pan and pinch zoom; live map recenters only on first GPS fix, when follow mode is enabled, or when recenter is tapped; preview `fitBounds` runs once on initial load
- [x] **AC-23:** Live tracker map layers control toggles Standard, Satellite, and Hybrid basemaps (Carto Voyager + Esri, no API key); `MapTypesSheet` selection is wired to `liveSessionStore.mapLayer` so the basemap actually updates on tap
- [x] **AC-29:** Standard basemap light/dark theme (Voyager / Dark Matter) via `mapThemeStore` — auto by local time (19:00–05:59 dark), Account Preferences toggle to follow time of day, live sun/moon tool to override; pressed/active map-tool states use brand mint + primary; see [map-theme-and-weather-icons.md](./map-theme-and-weather-icons.md)
- [x] **AC-30:** Live location pill weather glyph reflects Open-Meteo `weather_code` (+ `is_day` for clear) via `WeatherConditionIcon`
- [x] **AC-24:** GPS uses `BestForNavigation` at 1s / **0 m** with Kalman + hardened gates (Kalman-resolved accuracy ≤**25 m**, adaptive min-move `max(1.4m, accuracy×0.22)`, slow-walk floor **0.14 m/s**, stationary ignores device `speedMps===0` and uses route-gap distance, sharp-reversal rejection, 3s warm-up, gap recovery); mid-session foreground resume preserves Kalman/append state (soft subscription stop only); maps consume precomputed `displayRouteCoordinates` (`simplifyRouteForLiveDisplay` ~0.55m + 28-point raw tail on live tracker, ~4m Douglas–Peucker on previews/replay); live maps also append EMA tip segment for display and re-ensure the WebView GeoJSON **line layer**; live Distance UI shows hundredths under 0.1 mi; stored route unchanged by display simplification
- [x] **AC-45:** Outdoor Expo Go walk (app open) draws a visible primary-green trail and increments Distance (confirmed 2026-07-21; see [progress.md](../../progress.md) “Fix live GPS trail”)
- [x] **AC-25:** Live map shows a primary-green heading-beam dot (white halo, flared cone-cylinder beam widening toward the tip with opacity fading to zero at the far arc) on EMA-smoothed `displayCoordinate` — no separate start pin (it sat on top of the tip for short walks and looked like a black duplicate); beam heading is driven by the device compass (`watchHeadingAsync`, adaptive EMA + platform accuracy gating, ~33 ms store publish) so it tracks which way the phone is facing in real time, falling back to GPS course-over-ground while the compass is unavailable; preview maps show start + end markers on simplified route polyline
- [x] **AC-26:** Live tracker **My Location** merges recenter + follow (default off); first tap flies to smoothed position **and orients map bearing to heading**, then eases (~280ms) on each GPS/heading update; second tap stops following (user pan/zoom does not auto-clear follow)
- [x] **AC-27:** Session detail / submission confirmation route maps support **Play / Pause / Replay** via `SessionRouteMapPanel` (single RAF owner, route-length-scaled duration ~3–10s); replay progress follows **path distance** on **`simplifyRouteForLiveDisplay`** (matches live tracker 1 m + raw tail); auto-replay once on load where enabled; **skips auto-play** when `useReducedMotion`; basemap opens on session-end layer (`CompletedSessionSnapshot.mapLayer`); map card is **~250px** tall with a bottom-right **My Location** control that re-fits the walking path after pan/zoom

### Camera (client — already wired, verify in Expo Go)

- [x] **AC-12:** Camera permission prompt; selfie (front) + progress (back) on `/photo-capture` via **`expo-camera` sequential** capture (mirrored front preview, selfie PiP on back step, haptic shutter; no camera remount between steps)
- [x] **AC-13:** Submitted photos appear on submission confirmation with real timestamps
- [x] **AC-36:** Sequential capture waits for `onCameraReady` on the **first** (front) step before enabling shutter (do not reset ready when flipping `facing`); null URI / capture errors show Alert + inline message (no silent empty catch)
- [x] **AC-38:** Volunteers can delete non-`approved` sessions from session detail (`DELETE /sessions/:id` + `removeVolunteerSession` clears recent/cache/stats); `approved` blocked (409 / UI hide)
- [x] **AC-44:** Sessions list supports **Select** mode — multi-select non-`approved` rows (approved rows disabled), **Select all** for visible deletable rows, **Delete (N)** bulk action with confirm alert; uses sequential `removeVolunteerSessions`; mock list respects tombstone filter when API unset

### Persistence (to implement)

- [x] **AC-14:** `startNewLiveSession()` → `POST /sessions` via Fly API; stores returned `sessionId` in store state; failure → local-only sync warning
- [x] **AC-15:** `addPhotoCheckpoint()` → upload selfie + progress to Supabase Storage `session-photos`, then `POST /sessions/:id/checkpoints`; upload/API failure → sync warning (local checkpoint kept)
- [x] **AC-16:** `finalizeLiveSession()` → `PATCH /sessions/:id/finalize` with route, duration, distance; status `under_review` (default) or `invalid` (legacy)
- [x] **AC-17:** Sessions list fetches from `GET /sessions` (replacing or merging with mock data for test phase); list includes `checkpointCount` / `photoCount` for Home impact hydration
- [x] **AC-21:** Submission confirmation **DURATION** matches **DATE & TIME** range — duration derived from `startedAt`/`endedAt` wall clock (not a stale tick counter); backend finalize recomputes `durationSeconds` server-side
- [x] **AC-18:** Completed session survives app kill + reopen (API persistence verified via production smoke test; manual Expo Go force-quit test recommended)
- [x] **AC-37:** Active live session draft debounced to AsyncStorage; on cold start, **Resume** / **Discard** modal (`LiveSessionResumeGate`) when draft exists and remote session is still `active` (or local-only); draft cleared on finalize/cancel

### Environment

- [x] **AC-19:** `frontend/.env` holds `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL` per [supabase.md](../../supabase.md)
- [x] **AC-20:** `frontend/.env.example` updated with Supabase + API URL placeholders (Firebase entries marked legacy)

## Expo Go limits (background GPS + dual camera)

| Capability | Expo Go | EAS development build |
|------------|---------|------------------------|
| Foreground GPS + Kalman pipeline | ✅ | ✅ |
| Background GPS while session active | ❌ (foreground-only; soft banner) | ✅ with Always permission |
| WebView MapLibre maps | ✅ | ✅ |
| Native MapLibre | ❌ | ✅ |
| `expo-camera` sequential checkpoint | ✅ | ✅ |
| Simultaneous dual-cam | ❌ | Code path present; **disabled by default** (native crash risk) |

## Out of scope

- Mid-session route PATCH to Fly (finalize-only; local draft resume is client-only)
- Full offline queue / sync retry beyond best-effort create/checkpoint/finalize
- Simultaneous dual-camera re-enable
- EAS production MapLibre builds beyond development profile
- Google Cloud Maps API key
- Stripe payments
- Admin approval UI (manual status change in Supabase for test)
- Email OTP / account linking
- Real-time GPS streaming to server during session (batch on finalize only for v1)

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `@supabase/supabase-js` | Auth + Storage client |
| `@react-native-async-storage/async-storage` | Persist Supabase auth session |
| `react-native-url-polyfill` | Supabase fetch compatibility |
| `react-native-webview` | Expo Go map (already installed) |
| Fly sessions API | [sessions-api.md](../../backend/specs/sessions-api.md) |
| Supabase project | [supabase.md](../../supabase.md) |

### Code touchpoints

| File | Change |
|------|--------|
| `frontend/src/lib/supabase.ts` | New — Supabase client + anon sign-in |
| `frontend/src/lib/api.ts` | New — Fly API fetch wrapper with JWT |
| `frontend/src/features/session-tracking/liveSessionStore.ts` | Wire create/checkpoint/finalize to API; resume-from-draft |
| `frontend/src/features/session-tracking/liveSessionDraft.ts` | Debounced AsyncStorage draft while session active |
| `frontend/src/features/session-tracking/checkpointConstants.ts` | Checkpoint interval + 10-min grace constants |
| `frontend/src/features/session-tracking/checkpointNotifications.ts` | Scheduled local checkpoint reminders |
| `frontend/src/features/session-tracking/pendingSessionSetup.ts` | Stash first dual photos until session setup form submits |
| `frontend/src/components/CheckpointSessionGate.tsx` | Global due/grace/forced-end routing from any tab |
| `frontend/src/components/CheckpointNotificationBootstrap.tsx` | Notification handler + tap routing |
| `frontend/src/components/LiveSessionResumeGate.tsx` | Cold-start Resume / Discard modal |
| `frontend/src/features/session-tracking/removeVolunteerSession.ts` | Volunteer delete + local cache cleanup |
| `frontend/src/features/session-tracking/utils/routeReplayDuration.ts` | Length-scaled replay duration (~3–10s) |
| `frontend/src/features/session-tracking/components/LiveSessionMapWebView.tsx` | New — WebView map for Expo Go |
| `frontend/src/features/session-tracking/components/MapInteractionContainer.tsx` | Touch responder wrapper for map pan/zoom inside ScrollViews |
| `frontend/src/features/session-tracking/utils/mapStyles.ts` | Basemap layer definitions (standard, satellite, hybrid) |
| `frontend/src/features/session-tracking/utils/routeFiltering.ts` | GPS capture filters, EMA display coordinate, Douglas-Peucker display simplification |
| `frontend/src/features/session-tracking/components/SessionMapMarkers.tsx` | Start, heading-beam dot, and end map markers |
| `frontend/src/features/session-tracking/components/LiveSessionMap.tsx` | Route Expo Go → WebView |
| `frontend/src/features/session-tracking/components/SessionRouteMapPreview.tsx` | Route Expo Go → WebView read-only |
| `frontend/src/features/session-tracking/components/SessionRouteMapPreviewWebView.tsx` | `replayOnce` prop — one-shot growing-polyline + tip-marker replay via `window.replayRoute`; initial HTML style is baked from `mapLayer` so Hybrid/Satellite open without a post-load `setStyle` race |
| `frontend/src/features/session-tracking/components/SessionRouteMapPanel.tsx` | Icon Play / Pause / Replay + synced replay timer; bottom-right My Location re-fits route; threads `replayOnce` to preview; `initialMapLayer` opens the replay on the layer the session ended with (no layer picker on replay maps) |
| `frontend/src/app/_layout.tsx` | Anon auth on mount + `LiveSessionResumeGate` |
| `frontend/src/utils/sessionPermissions.ts` | Added `isSessionLocationPermissionGranted`/`isSessionCameraPermissionGranted` status checks (no OS prompt); camera request/check now goes through the `Camera` legacy object per `expo-camera` 17 |
| `frontend/src/screens/SessionSetupFormScreen.tsx` | Location/Camera permission toggles default from actual OS-granted status on mount |
| `frontend/src/screens/SessionSetupStep6Screen.tsx`, `SessionSetupStep7Screen.tsx` | Location auto-`replace`s when already granted (to camera for 18+, finale for under-18). Camera always shows for 18+ after location; under-18 replace → complete |
| `frontend/src/features/figma-screens/screens/AccountScreen.tsx` | Permissions toggles (Camera, Location, **Notifications**) mirror real OS status (`useFocusEffect`); on-toggle calls real request/status check; off-toggle (or already-denied on-toggle) reverts the switch and alerts with an Open Settings action |
| `frontend/src/utils/notificationPermissions.ts` | New — `requestSessionNotificationPermission`/`isSessionNotificationPermissionGranted` via `expo-notifications` (creates an Android notification channel first, required for the OS prompt to appear on Android 13+) |
| `frontend/src/screens/NotificationPreferenceScreen.tsx` | **Enable notifications** now calls `requestSessionNotificationPermission()` (real OS prompt) before continuing, matching the location/camera onboarding screens |
| `frontend/app.json` | Added `expo-notifications` plugin |

## Test plan

1. From repo root: `npm start` (tunnel) or `npm run start:lan` (same Wi‑Fi) — see [expo-go-dev-networking.md](expo-go-dev-networking.md)
2. Open in **Expo Go** on a physical iPhone or Android device
3. Complete onboarding (or Log In shortcut) → Home
4. **Start Tracking** → session setup form → **Start Session** → photo capture (`session-start`) → live tracker
5. Walk outdoors ≥ 2 minutes; confirm WebView map shows route polyline and distance increments; tap **My Location** to fly to your position and follow; tap again to stop following; drag to pan and pinch to zoom without map snapping back until follow is on
6. Submit a photo checkpoint; confirm `expo-camera` sequential capture (mirror + PiP) works
7. Force-quit mid-session → reopen → **Resume** restores tracker (or **Discard** clears draft)
8. **End Session** → submission confirmation shows photos + route preview; route preview auto-replays once (length-scaled; skipped when reduced motion) before settling into the static view; footer is **Go Home**, **Share Feedback**, **Delete session**
9. **Go Home** → session appears in Recent Sessions; **View All** → `/sessions-list`; opening detail replays the walking path; session detail footer is **Share Feedback**, **Delete session** (non-approved), filled tertiary **Go Home** (no stroke); back chevron → Home
9b. Unpaid free-hour: **End Session** → session details, approved 1 hour; next Track shows **Pay now / Pay Later** — see [free-hour-tracker-paywall.md](free-hour-tracker-paywall.md)
10. Force-quit after finalize → reopen → completed session still visible (fetched from API)
11. Verify rows in Supabase `sessions` + `checkpoints` tables and objects in `session-photos` bucket
