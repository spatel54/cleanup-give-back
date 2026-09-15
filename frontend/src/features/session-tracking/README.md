# Session Tracking (feature slice)

> **Production:** The shipped Expo Router flow lives in `frontend/src/app/` and uses `liveSessionStore.ts` with real `expo-location`, `expo-camera`, Fly API, and WebView/native maps. Active sessions persist a debounced AsyncStorage draft (`liveSessionDraft.ts`) with cold-start **Resume / Discard** via `LiveSessionResumeGate`. Volunteers can delete non-approved sessions via `removeVolunteerSession`. This folder also contains a **legacy preview harness** (`dev/PreviewApp.tsx`) with mocked data for isolated UI review.

Standalone implementation of the Session Tracking flow (PRD §6.9–6.15) —
Session Setup → Permissions → Live Session → Photo Checkpoint → Session
Review → Submission Confirmation, plus the Missed Checkpoint dead-end and
the Home-minimize interaction.

Deliberately **not** wired into `frontend/src/app/` (Expo Router) for the **mock preview harness only**. Production routes import the same store/components from this folder.

## Scope of the preview harness (not production)

Every screen in `dev/PreviewApp.tsx` renders real layout, tokens, typography, and Reanimated motion
against **mocked data** (`mocks/session.ts`). The production app routes use live GPS/camera/API instead:

- Timers (elapsed / countdown) run off local `setInterval`s seeded from mock values.
- Permission toggles/buttons flip local state only — no OS permission prompt.
- Photo checkpoints use `components/PhotoPreviewCard.tsx` (tinted placeholder), not a real camera capture.
- The Live Session / Session Review map is real (`mapcn-react-native` on MapLibre) but renders a static mock route (`mocks/session.ts` polyline) — no live GPS.
- `HomeScreen` (Figma `406:291`) is a fully laid-out dashboard, but every card (service hours, impact stats, recent sessions, recent events) reads from `mocks/home.ts` — no backend, and the week-navigation arrows are non-functional (single static week).

## Folder structure

```
tokens.ts            Design tokens (color/type/spacing/radius) — brand.md/design.md sourced
motion.ts             Reanimated durations/easing/springs — emil-design-eng principles
mocks/session.ts       Static session + route data, timer formatters
mocks/home.ts          Static Home dashboard data (streak, chart, impact stats, sessions, events)
components/            Shared building blocks (buttons, pills, map, icons, nav, minimized tracker bar, chart)
components/icons/      Hand-ported Heroicons glyphs as react-native-svg (not react-icons — web-only)
screens/                One file per flow screen (see below)
dev/PreviewApp.tsx     Font-loading + screen-switcher harness for manual preview
```

## Screens

| Screen | PRD § | Notes |
|---|---|---|
| `SessionSetupScreen` | 6.9 | 4-step local wizard (intro/permissions recap → activity+date → court-ordered+description → signature); steps 5–6 of the 6-pill progress are the two Permission screens below |
| `LocationPermissionScreen` / `CameraPermissionScreen` | 6.10 | Share `PermissionRequestScreen` layout |
| `LiveSessionScreen` | 6.11 | Full-bleed `LiveSessionMap`; tapping the bottom-nav Home tab reports `onMinimize` — the parent owns the minimized/expanded state |
| `PhotoCheckpointScreen` | 6.12 | Draggable bottom sheet (`react-native-gesture-handler` Pan + Reanimated spring), replaces the legacy `PanResponder` prototype |
| `PhotoSubmittedScreen` | 6.12 | Recreated "gif" — checkmark pop + staggered fade-ups, native Reanimated instead of the legacy CSS keyframes in `assets/stitch/photo_submitted.html` |
| `MissedCheckpointScreen` | 6.13 | Recreated "gif" — short attention shake on the warning icon |
| `SessionReviewScreen` | 6.14 | Read-only summary; no Figma frame yet (see figma-to-native-handoff.md) — built from `prototype/screens/session/SessionReview.tsx` copy |
| `SubmissionConfirmationScreen` | 6.15 | Success/"Under Review" confirmation — distinct from Session Detail (§6.18), which is out of scope here |
| `HomeScreen` | — | Home & Events dashboard (Figma `406:291`); hosts `MinimizedTrackerBar` (Figma `622:176`) inline when a session is minimized. Built from `get_design_context`, not part of the §6.9–6.15 flow proper — see figma-to-native-handoff.md |

## The minimize-to-Home interaction

`LiveSessionScreen` never renders its own minimized state — it calls
`onMinimize()` and the parent (normally `dev/PreviewApp.tsx`) swaps to
`HomeScreen`, which renders `components/MinimizedTrackerBar.tsx` pinned
above the bottom nav whenever `isSessionMinimized` is true.

The parent tracks a single `isTrackingActive` boolean as the source of
truth — set once when a session starts (`CameraPermissionScreen`'s "Next"
**and** "Skip", both of which land on `LiveSessionScreen`) and cleared once
when a session truly ends (`MissedCheckpointScreen` / `SubmissionConfirmationScreen`'s
"Return Home"). `HomeScreen` is handed that flag directly as
`isSessionMinimized` — the widget's visibility is a pure function of "is a
session live", not of *how* the user got to Home. Any future real Home tab
wiring should follow the same contract (one flag, set/cleared at exactly two
places) rather than toggling a minimized flag at every navigation call site,
which is easy to miss on one path and leave the widget silently wrong.

## Previewing this feature

1. **Fonts**: `dev/PreviewApp.tsx` loads exactly the font weights `tokens.ts` references via `useFonts` — nothing renders until they resolve.
2. **Map**: MapLibre (`@maplibre/maplibre-react-native`) is a native module. In Expo Go *and* on web, `LiveSessionMap` automatically falls back to a static placeholder (`Platform.OS === 'web'` check + a `ui/map.web.tsx` stub that keeps the native module out of the web bundle — see [components.md](../../../../docs/frontend/context/components.md) Patterns). To see the real map you need an EAS dev-client build:
   ```
   cd frontend
   eas build --profile development --platform ios   # or android
   ```
   (`app.json` and `eas.json` are already configured for this — running the actual build is left to you.)
3. **Mounting the harness**: this folder intentionally has no route. Temporarily point any existing route at it while reviewing, e.g. replace the body of `frontend/src/app/index.tsx` with:
   ```tsx
   import { PreviewApp } from '@/features/session-tracking/dev/PreviewApp';
   export default PreviewApp;
   ```
   Revert before committing — this is a manual, temporary step, not a permanent route.
4. **Running it**: `cd frontend && npx expo start --web` (browser at `http://localhost:8081`) or `npx expo start` for Expo Go / a dev-client build. If `expo start` fails before you even get here, see [progress.md](../../../../docs/progress.md) "Fixed three pre-existing dev-server bugs" — those are environment fixes, not specific to this feature.
5. Use the horizontal chip strip at the top of `PreviewApp` to jump directly to any screen (useful for `MissedCheckpointScreen`, which has no natural trigger in the happy-path flow demoed here).

## Known gaps / deferred (preview harness only)

- Preview harness screens still use mocks — see production `frontend/src/app/live-session` et al. for real integrations.
- No Session Detail screen (PRD §6.18) — separate from Session Review/Submission Confirmation, belongs to the Sessions History feature.
- No backend submission call — "Submit for Approval" is a local state transition only.
- `eas build` / `eas init` have not been run — configuration only.
