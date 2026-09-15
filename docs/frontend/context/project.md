# Context: project

Product-wide ontology and cross-cutting decisions.

## Ontology

| Term | Meaning |
|------|---------|
| Volunteer | Community service participant |
| Court-ordered participant | User completing mandated hours |
| Admin | Org staff reviewing submissions |
| Cleanup session | Tracked service period with location + photo evidence |
| Activity log | Record of hours and checkpoints |
| Evidence | Photos and GPS data supporting a session |
| Profile photo | Volunteer avatar on Account — optional `{user_id}/profile.jpg` in Supabase `session-photos`; `user_metadata.avatar_path` + local-uri cache |
| Age-gate | Pre-auth month/year DOB screen before any PII collection (planned); today check on account-details |
| Under-age block | COPPA: users under 13 cannot sign up; onboarding PII wiped immediately |
| Session photo age gate | Checkpoint camera (start / mid / end) is 18+ only; ages 13–17 track GPS and hours without session photos |
| Parental consent | Deferred — not in current product (under-13 = block + wipe) |
| DPIA | Data Protection Impact Assessment for child-safety risks |
| Service letter | Signed PDF for approved session(s): org letterhead plus evidence pages. Generated on download; copies the volunteer saved appear under Account → Letters |

## Stack

- **Frontend:** Expo SDK 54, React Native 0.81, TypeScript, Expo Router (`frontend/`)
- **Backend:** `backend/sessions/` Fastify + Prisma on Fly (`sessions.example.com`); payments/maps services still planned
- **Docs:** `docs/` living documentation

## Decisions

- Monorepo layout — see [ADR-001](../adr/ADR-001-monorepo-layout.md)
- **Volunteer auth:** email/password + Apple/Google/Facebook via Supabase; no anonymous bootstrap. Spec: [volunteer-auth.md](../specs/volunteer-auth.md).
- **In-app Updates:** Account What’s New is a curated list in `appUpdates.ts`, not a live parse of [progress.md](../../progress.md). Spec: [app-updates.md](../specs/app-updates.md).
- Path aliases: `@/*` → `frontend/src/*`, `@/assets/*` → `frontend/assets/*`
- Figma is the design ground truth; Stitch/HTML pipeline is frozen — see [ADR-002](../adr/ADR-002-figma-design-ground-truth.md)
- Nationwide minor data protection uses strictest-baseline strategy — see [ADR-003](../adr/ADR-003-minor-data-protection-baseline.md)
- Privacy UI split: `account-privacy` hub, `privacy-permissions`, policy viewers — see [privacy-screen-split-decision.md](../../compliance/privacy-screen-split-decision.md)
- Session Tracking **production** flow (PRD §6.9–6.15) ships via `frontend/src/app/` + `liveSessionStore` (Fly API, GPS, `expo-camera`, WebView/native maps). The same folder keeps a **legacy mock PreviewApp** harness for isolated UI review — see [session-tracking README](../../../frontend/src/features/session-tracking/README.md) and [figma-to-native-handoff.md](../specs/figma-to-native-handoff.md).
- **Session duration:** wall-clock timestamps (`startedAt` → `endedAt`) are the canonical source for completed-session duration; `liveSessionStore` derives live elapsed time and checkpoint countdown from timestamps (not a fragile `+1s` counter). Backend finalize recomputes `durationSeconds` server-side.
- **GPS route capture:** samples pass a 2D Kalman filter (monotonic timestamps, **0.25 s** min predict `dt`), then append when movement exceeds `max(1.4m, accuracy × 0.22)` (plus stationary/speed/turn/gap-recovery gates; slow cleanup walking ≥ ~0.14 m/s); foreground/background watch at **1 s / 0 m** so slow sidewalk steps and corners are not skipped; mid-session resume soft-stops subscriptions without resetting Kalman; optional background GPS while session active (`expo-task-manager`); live map uses lighter display simplify (~0.55 m + 28-point raw tail) + tip segment to the EMA arrow; live map arrow uses EMA-smoothed `displayCoordinate` + adaptive-EMA compass heading (platform accuracy gate, ~33 ms publish); live tracker **My Location** (flyTo + optional follow, default off, ~**280 ms** ease). Active sessions debounce a local draft to AsyncStorage; cold start offers **Resume / Discard** (`LiveSessionResumeGate`). Route replay on completed sessions animates by **path distance** (~3–10s), not GPS timestamps.
- **Checkpoint camera:** `expo-camera` sequential selfie → progress (Expo Go + dev client); simultaneous dual-cam out of scope ([photo-checkpoint-dual-capture.md](../specs/photo-checkpoint-dual-capture.md)). **18+ only** — `canUseSessionPhotos()` / live `photosEnabled`; 13–17 skip capture ([minor-session-photos.md](../specs/minor-session-photos.md)). Account profile photo is not gated. Missing birthday stays photo-eligible.
- **Home stats:** Service Hours / impact derive from `sessionStatsStore` (local finalize snapshots + `GET /sessions` with `photoCount`).
- **Volunteer session delete:** non-`approved` sessions can be removed via `DELETE /sessions/:id` + `removeVolunteerSession` (clears recent/cache/stats).
- **Profile photo:** Account hero avatar is optional; stored at `{user_id}/profile.jpg` in the existing `session-photos` bucket (same as checkpoint photos), with `user_metadata.avatar_path` for lookup and AsyncStorage caching the last local file URI for instant display. Pick → `ProfilePhotoCropModal` (pan/pinch, Fill/Crop presets) → square JPEG export via `expo-image-manipulator`. Camera + photo-library permission strings extended in `app.json` for profile use (not only checkpoints).
- **Volunteer notifications:** Inbox rows live in `volunteer_notifications`. Incoming Expo banners (except photo-checkpoint live nudges) are merged into Messages and persist the original send/receive time (`createdAt` from the payload or Expo `notification.date`). Category toggles persist as `user_metadata.notification_preferences` (UI defaults all off). Delivery skips inbox+push only when a key is explicitly `false`; a missing preferences object stays opted-in so existing users still get approve/decline. An empty or failed inbox fetch shows sample Messages (not written to Supabase) unless the volunteer used **Clear all messages** or already has a live row. Unread rows keep a green dot only. Type chips: Approved / Not approved / Under review use status colors; Status / Order / Event / Reminder share one chip. Session-update copy includes the place name (`description`, else activity). Taps: session notices → that session; Event → event detail; Order → `/order-history`.
- **Letters library:** Account → Letters lists PDFs the volunteer has already downloaded (session **Download PDF** or Download Service Record PDF), persisted on-device. It is not a list of every approved session. Spec: [letters-library.md](../specs/letters-library.md).

## Related

- [brand.md](../brand.md) · [design.md](../design.md) · [screen-map.md](../screen-map.md)
