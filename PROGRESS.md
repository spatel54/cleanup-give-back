# PROGRESS.md — CleanUpGiveBack Prototype

Session-by-session progress log. Append a new dated block each session.
Distinct from `notes/journey.md` (correction-loop log) and `IMPLEMENTATION_PLAN.md` (task list).

Canonical detailed log: [`docs/progress.md`](docs/progress.md).

---

## [2026-08-12] — Admin Sessions “not syncing” diagnosis + default All polish

**Session goal:** Co-dev reported sessions not showing in admin after GitHub push; diagnose and fix the admin's approve queue visibility.

**Outcome:** Mobile sync was fine — admin `/sessions` defaulted to **Today**, hiding rows until **All**. Shipped default `?period=all`, Dashboard links, empty-state CTA, optimistic approve UI. Fly API healthy. Full write-up: [`docs/progress.md`](docs/progress.md) (first entry).

**Follow-up:** Vercel production deploy + confirm `SUPABASE_SERVICE_ROLE_KEY` on Production.

---

## [2026-08-12] — Session-guide Skip/Continue + photo Retake motion (documented)

**Session goal:** Document shipped guide Skip/Continue one-hop navigation and BeReal Retake cross-fade after user confirmed done.

**Shipped:** `skipSessionSetupGuideForward` / `continueFromSessionFreeKit`; `/photo-capture` retake opacity cross-fade (not slide). Docs: `docs/progress.md`, `docs/current.md`, `docs/frontend/context/app.md`, `docs/frontend/context/components.md`, `docs/frontend/specs/photo-checkpoint-dual-capture.md` AC-4.

---

## [2026-08-12] — Free-hour paywall Pay Later → session detail + Go Home (documented)

**Session goal:** Ship and document free-hour expiry (1h default), one-shot alert, Pay Later finalize → session detail, and session-detail Go Home.

**Shipped:** Spec `docs/frontend/specs/free-hour-tracker-paywall.md`; living docs in `docs/progress.md`, `docs/current.md`, `docs/frontend/context/app.md`, `docs/frontend/context/components.md`, `docs/README.md`.

---

## [2026-08-12] — Session-start Cancel → Hold On → fade Home (documented)

**Session goal:** Fix session-onboarding Previous/Cancel; ship Hold On bridge; sync living docs.

**Shipped:** Guide Previous = named `replace`s; session-start Cancel → `/hold-on` (progress) → fade into Home; in-session Cancel → live tracker. Docs: `docs/progress.md`, `docs/current.md`, `docs/frontend/context/app.md`, `docs/frontend/context/components.md`, `docs/frontend/specs/photo-checkpoint-dual-capture.md`.

---

## [2026-08-12] — Service Hours “This week” jump (documented)

**Session goal:** One-tap return to the current week on the Home Service Hours chart after arrow navigation; quiet but visible chip styling; living docs synced.

**Shipped:** `ServiceHoursWeekPicker` trailing **This week** chip; docs in `docs/progress.md`, `docs/current.md`, `docs/frontend/context/components.md`, `docs/frontend/specs/home-dashboard-session-stats.md` (AC-8).

---

## [2026-08-12 Session 16] — Branded shipped-order email template; deployed admin; fixed a second Expo Go background-location crash; wrote iOS Live Activity spec

**Session goal:** Design and ship branded HTML for the admin's order-tracking email, deploy the admin console, diagnose a live-reported "app breaks after submitting first photos, can't see the map" crash, and scope a Lock Screen widget feature.

**Workflow used:** Chat-driven — `superpowers:systematic-debugging` for the crash (evidence-first: live Metro log tail + an actual iOS crash report the user pulled from Analytics Data, not guesswork), `AskUserQuestion` for scoping decisions (commit scope, template-editor protection, widget content direction), direct edits otherwise.

### Tasks Completed

| Task | Location | Status |
|---|---|---|
| Branded `shipped` email template | `admin-web-app/src/lib/email-template-render.ts` | ✅ new `emailShell()` — green header bar w/ hosted logo, white card, cream footer w/ tagline; inline-CSS table layout for Gmail/Outlook compatibility |
| Protected the branded template from the WYSIWYG editor | same file | ✅ `shipped` removed from `EMAIL_TAB_TEMPLATE_TYPES` — the Emails tab's rich-text editor saves through a narrow sanitizer allowlist (`lib/sanitize-html.ts`) that has no `table`/`tr`/`td` and would silently flatten the branding on save |
| Synced the live Supabase `email_templates` row | one-off script, user-run via `!` (classifier-blocked for direct execution) | ✅ code default alone doesn't take effect once a DB row exists for a template type — `getTemplate()` prefers the row |
| Sent verification test emails via Resend | one-off scripts | ✅ confirmed both the plain and branded renders in a real inbox before/after |
| Committed + pushed a large batch (my work + pre-existing uncommitted court-risk removal/hours-reminder work) | commit `3f004c3` | ✅ explicit `AskUserQuestion` on scope first — chose "everything" |
| Deployed `admin-web-app` to Vercel production | `admin.example.com` | ✅ first attempt hit a transient `ECONNRESET` from Vercel's API, second attempt succeeded |
| Started the Expo Go dev server (tunnel mode) | `frontend` (`npm run start`) | ✅ background task; ngrok tunnel URL retrieved via its local API since Expo's CLI TUI doesn't print the URL to a piped log |
| Root-caused a **second, distinct** Expo Go background-location crash | `frontend/src/features/session-tracking/liveSessionStore.ts` (`enableBackgroundLocationIfPossible`) | ✅ `Location.requestBackgroundPermissionsAsync()` was called unconditionally, before the `isExpoGoClient()` gate that already protected the sibling `startBackgroundLocationUpdates()` call is ever reached. Root-caused via the user's actual iOS crash log (`EXC_BAD_ACCESS`/`SIGKILL`/`CODESIGNING`/`Invalid Page`, main thread, `Expo Go → CoreLocation → LocationSupport`), not inference alone. Now gated the same way; real builds unaffected (`app.json`'s `expo-location` plugin already declares `isIosBackgroundLocationEnabled`/`isAndroidBackgroundLocationEnabled`) |
| Committed + pushed the crash fix | commit `0d8e1c0` | ✅ `tsc --noEmit` clean |
| Wrote the iOS Lock Screen widget spec | `docs/frontend/specs/live-session-lock-screen-widget.md` (+ indexed in `docs/README.md`) | ✅ scoped to ActivityKit Live Activity (not a static WidgetKit widget) per the "live tracker" content direction the user picked; flags two open decisions (deployment-target bump scope, no-push-entitlement staleness tradeoff) rather than deciding them unilaterally; not yet implemented |
| Backpressure | `admin-web-app`, `frontend` (`tsc --noEmit`) | ✅ clean after each round of edits |

### Key Decisions

- Branded templates stay code-only (excluded from the admin's WYSIWYG-editable set) rather than trying to widen the sanitizer allowlist — narrower blast radius, matches an existing pattern already used for other automated-send templates.
- The Lock Screen widget is scoped as ActivityKit (Live Activity), not a static home-screen WidgetKit widget — the user picked "live session tracker" content, which a background-refresh-budgeted static widget can't serve well.

### Learnings

- Recorded in memory: the Expo Go background-location crash pattern needs its own `isExpoGoClient()` guard **per call site**, not once per file — a second, independent unconditional call in a sibling function reproduced the same crash class after the first occurrence was already fixed.
- Recorded in memory: Claude Code's auto-mode classifier blocks more than deploy commands — `git push` to a shared remote and direct Supabase service-role writes hit the same block this session, even after explicit approval and on retry.
- A large amount of unrelated, already-in-progress work (court-risk feature removal, hours-reminder cron, and — found only at `/wrap` time — a separate same-day session's photo-checkpoint modal-stack fix) was present in the working tree throughout; none of it was authored in this conversation, and none of its rationale is claimed here.

**Current failure:** None outstanding from this session's own work. The Expo dev server background process was stopped (by the user or a tool) before the fix could be re-verified live in Expo Go — worth a fresh reproduction pass before considering it fully confirmed end-to-end, though the fix itself is evidence-backed (same guard pattern as the first, already-verified occurrence).

**Verify:** `cd admin-web-app && npx tsc --noEmit` clean. `cd frontend && npx tsc --noEmit` clean. Manual: order-tracking email renders branded in a live inbox (confirmed). Manual outstanding: resubmit session-start photos in Expo Go and confirm the live-session map now loads instead of crashing.

---

## [2026-08-12 Session 15] — Diagnosed sync-error toast; fixed photo-checkpoint modal overlap; removed false pause-notification copy

**Session goal:** Diagnose a "sync failed" toast reported after logging a session, fix the "Photo submitted" popup rendering on top of the still-mounted "Photo required" popup instead of replacing it, fix a post-submit grace countdown showing 10 minutes instead of 10 seconds, and remove a checkpoint-reminder notification that falsely claims a missed photo pauses the session.

**Workflow used:** Chat, driven by `superpowers:systematic-debugging` for the sync-error investigation; direct root-cause tracing (no plan mode) for the follow-up bug reports.

### Skills Invoked

| Skill | Purpose | Outcome |
|---|---|---|
| `superpowers:systematic-debugging` | Phase 1 root-cause investigation for the sync-error toast | Traced banner to `persistFinalizeToRemote`; verified API URL config + backend health; added temporary `__DEV__` diagnostics to surface the real error inline since no Metro terminal was available. User confirmed it resolved before the exact cause was pinned down; diagnostics reverted. |

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Sync-error diagnostics (temporary, later reverted) | `frontend/src/features/session-tracking/liveSessionStore.ts`, `frontend/src/screens/SubmissionConfirmationScreen.tsx` | ✅ added then cleanly reverted once user confirmed the toast stopped appearing |
| Fix "Photo submitted" rendering on top of "Photo required" | `frontend/src/screens/PhotoCaptureScreen.tsx` | ✅ checkpoint submit now `router.dismissTo('/photo-submitted')` instead of `router.replace`, which pops the still-mounted `/photo-checkpoint` modal first |
| Fix grace countdown showing 10 min instead of 10 sec | `frontend/src/features/session-tracking/checkpointConstants.ts` | ✅ `CHECKPOINT_MISS_GRACE_MS` scaled to match the (already-temporary) 10s `PHOTO_CHECKPOINT_INTERVAL_SECONDS` — both marked `// TEMP: testing only`; user's local copy has since reverted the interval to `30 * 60`, grace constant should be rechecked against that |
| Remove false "session will pause" checkpoint notification | `frontend/src/features/session-tracking/checkpointNotifications.ts` | ✅ removed the "Last chance for this checkpoint" branch (claimed pause/forced-end, a mechanism already deleted from `liveSessionStore.ts`); all grace reminders now use one neutral nudge; deleted unused `graceMinutesRemaining` helper |
| Living docs | `docs/progress.md`, `docs/frontend/context/components.md` | ✅ session entry + new Patterns notes (dismissTo-vs-replace modal-stack gotcha; removed forced-end/pause mechanism) |

### Key Decisions

- Used temporary `__DEV__`-only instrumentation rather than asking the user to dig through Xcode/Android Studio device logs — reverted once no longer needed, per the "no half-finished scaffolding" rule.
- Only removed the notification text explicitly flagged as false ("session will pause"); flagged to the user (not silently changed) that the sibling "forced to end" reminder relies on the same removed mechanism and is likely equally stale.

### Learnings

- `PhotoCheckpointScreen`'s auto-dismiss effect is guarded to only act while it is the *focused* screen (to avoid a stale tick popping whatever got pushed on top of it instead). That guard has a side effect: once `/photo-capture` is pushed on top, the guard permanently blocks the screen from ever popping itself — the *caller* has to dismiss it via `router.dismissTo(...)` instead of `router.replace(...)`. Documented in `docs/frontend/context/components.md`.
- The forced-end/pause-on-missed-checkpoint mechanism (`forcedEndPending`) was fully removed from `liveSessionStore.ts` in earlier work, but notification copy in `checkpointNotifications.ts` still referenced it — a reminder that removing a mechanism doesn't automatically catch every place its behavior was described in user-facing text.
- `PHOTO_CHECKPOINT_INTERVAL_SECONDS` and `CHECKPOINT_MISS_GRACE_MS` are independent constants; scaling one for testing without the other produces confusing mixed-unit countdowns.

### Progression

Photo-checkpoint flow (required → capture → submitted) now correctly dismisses intermediate modals. Checkpoint-miss notification copy no longer makes false claims about session consequences. Sync-error toast is no longer reproducing per the user, but the root cause was not conclusively identified — if it recurs, the diagnostic-instrumentation approach described above is the fastest path back to an answer.

---

## [2026-08-10 Session 14] — Fixed Expo Go background-location crash; Court Progress on Accounts + severity redesign; fixed instant back-animations

**Session goal:** Diagnose and fix a real crash reported mid-session (photo submit → app dies before the live-session map appears), plus a batch of follow-up UI requests: Court Progress card on Accounts (not just Home), simplified card design with a 3-tier green/orange/red severity, instant-feeling back transitions on three flows, and a home icon-size tweak.

**Workflow used:** Chat-driven — `systematic-debugging` skill for the crash (root-caused via diagnostic logging + reading `expo-location`'s own source, not guesswork), Explore agents for investigation, direct edits for the rest, `AskUserQuestion` once for an ambiguous card-simplification design choice.

### Tasks Completed

| Task | Location | Status |
|---|---|---|
| Root-caused + fixed Expo Go crash | `frontend/src/features/session-tracking/liveSessionStore.ts` (`startBackgroundLocationUpdates`) | ✅ `Location.startLocationUpdatesAsync` was called unconditionally; `expo-location`'s own `_validate()` warns about Expo Go then calls the native module anyway, which hard-crashes on a real device (no catchable JS error — confirmed via temporary diagnostic logging showing the crash occurs before `LiveSessionMap` ever mounts). Now gated behind `isExpoGoClient()`, matching the existing map-provider guard pattern; foreground GPS tracking is unaffected |
| Court Progress card on Accounts | `frontend/src/features/figma-screens/screens/AccountScreen.tsx` | ✅ same `shouldShowCourtProgress` gating as Home, rendered right below the profile hero |
| Simplified Court Progress card | `frontend/src/features/figma-screens/components/CourtProgressCard.tsx` | ✅ dropped the 3 stat tiles + footnote per user's explicit choice (via `AskUserQuestion`) in favor of a progress bar + single "X of Y hours" line |
| 3-tier severity (green/orange/red) | same file | ✅ green = on track/completed, orange = `at_risk` and not yet overdue, red = computed overdue (`dueDate` in the past) independent of backend status; reuses existing `statusApproved`/`statusPending`/`statusDeclined` tokens, no new colors invented; red/orange states show a "N days left" / "N days overdue" message |
| Local mock-data toggle for testing | `frontend/src/features/session-tracking/courtProgressStore.ts` | ✅ `USE_MOCK_COURT_PROGRESS` const, defaults `false` (real API data); explicitly flipped back to `false` before this session's commit after being toggled on for live preview |
| Deployed `/me/court-progress` to production | `backend/sessions` on Fly (`example-sessions`) | ✅ route existed in the repo since 2026-08-07 but was never deployed — confirmed via a live unauthenticated probe returning a genuine 404 before deploy, 401 (needs-auth) after. User explicitly approved the production deploy |
| Fixed instant back-navigation animations | `frontend/src/app/_layout.tsx`, `ExportRecordSuccessScreen.tsx`, `RequestDataSentScreen.tsx`, `EventDetailScreen.tsx` | ✅ all three used `router.replace()` into `animation: 'none'` tab-root routes (`/account`, `/`); gave `account` the same `enter=fade` opt-in `index` already had and updated the three call sites to request it. Normal bottom-nav tab switches stay instant, unaffected |
| Home notification bell resized | `frontend/src/features/figma-screens/screens/HomeScreen.tsx` | ✅ 24px → 20px per explicit request |
| Committed + pushed to `main` | commit `4c0c081` | ✅ `npx tsc --noEmit` clean before push |
| Backpressure | `frontend` (`tsc --noEmit`) | ✅ clean after every edit round |

### Key Decisions

- Root-caused the crash via targeted diagnostic `console.log`s + reading `expo-location`'s own source rather than guessing from the error's absence — the systematic-debugging Iron Law ("no fixes without root cause") held even though the failure mode (native crash, zero JS trace) made evidence-gathering harder than usual.
- Card severity is computed **client-side** from `dueDate` (overdue = red) rather than adding a third backend status enum value — the backend's existing `at_risk` field already encodes "due within 14 days OR overdue" (matches admin's `AT_RISK_WINDOW_DAYS` ladder), so splitting it into orange/red locally needed no backend schema change.
- Flipped `USE_MOCK_COURT_PROGRESS` back to `false` before committing — it had been toggled on mid-session for live device preview and would have shipped fake data to every court-ordered volunteer if pushed as-is.
- Included the pre-existing, already-modified `PROGRESS.md`/`docs/progress.md` diffs (from an earlier, unrelated Figma-asset session) in this session's commit per the user's general "push to github when done" — not authored by this session, flagged to the user after the fact.

### Learnings

- `expo-location`'s `_validate()` (called by `startLocationUpdatesAsync`/`hasStartedLocationUpdatesAsync`/`stopLocationUpdatesAsync`) detects `isRunningInExpoGo()` and prints a warning, but **does not skip the native call** — callers must gate it themselves. The existing `isExpoGoClient()` guard was only applied to the map component, not location; the same guard needed to be replicated wherever a native-module call happens, not assumed to be global.
- A completely silent Metro log (no JS error, no red screen) after a WARN is itself diagnostic — it points at a native (non-JS-catchable) crash, not "nothing happened." Confirmed by adding markers immediately before/after the suspected call and observing zero markers fired.
- The Claude Code auto-mode safety classifier blocks `flyctl deploy` (and likely other production-deploy commands) even after explicit in-conversation user confirmation — it must be run by the user directly via the `!` prefix, or permitted via a settings rule; there is no way to route around it from within the session, nor should there be.

---

## [2026-08-09 Session 2] — Schedule-send time picker, court-risk terminology/severity fixes, fixed volunteer-profile crash

Custom time picker for email schedule-send; seeded tagged mock demo data into `/court-risk` (empty in prod); fixed a real crash where court-ordered volunteer profiles 404'd (server component passed a function prop to a client component across the RSC boundary); renamed confusing "Invalid"/"Spike" columns and gave the Deadline column a real overdue > due-soon > at-risk severity ladder after user feedback that it all looked equally red; fixed a second 404 — volunteer profile Session History linked to a `/sessions/[id]` route that doesn't exist, now opens the shared session drawer instead. Full detail: [`docs/progress.md`](docs/progress.md#2026-08-09-session-2--schedule-send-time-picker-court-risk-terminologyseverity-fixes-fixed-volunteer-profile-crash).

---

## [2026-08-07] — Decision templates, volunteer timeline, readiness page, court packet export, mobile court progress

**Session goal:** User requested five features from a single ask: admin decision templates (decline reasons + note snippets), a volunteer risk timeline, a production readiness page, court packet PDF export, and a mobile "court progress" card for court-ordered volunteers.

**Workflow used:** Plan mode — two parallel Explore agents (admin-web-app, mobile) → four clarifying questions via AskUserQuestion (templates storage, timeline placement, court packet approach, mobile RLS-vs-backend routing) → one Plan agent for the full implementation plan → user approval → sequential implementation with `tsc --noEmit` after each feature.

### Tasks Completed

| Task | Location | Status |
|---|---|---|
| Decline-reason templates + admin-note snippets | `admin-web-app/src/lib/decisionTemplates.ts`, `SessionPreviewDrawer.tsx` | ✅ hardcoded templates fill an editable field; `declineSession` reason now reaches `admin_audit_log.after_value` |
| Volunteer risk timeline | `admin-web-app/src/lib/live-data.ts` (`loadVolunteerTimeline`), `components/ui/VolunteerTimeline.tsx`, `app/volunteers/[id]/page.tsx` | ✅ chronological view sourced from `admin_audit_log`; added a new `'email sent'` audit action in `lib/notify.ts` |
| Production readiness page | `admin-web-app/src/lib/health-checks.ts`, `actions/health.ts`, `components/ui/ProductionReadinessPanel.tsx`, `/settings`; `backend/sessions/src/server.ts` `GET /health/deep` | ✅ probes Resend, Sessions API, admin API key, Supabase Auth/data, both storage buckets, and a Realtime **round-trip** check (not just connection status) |
| Court packet export | `backend/sessions/src/letterhead/{buildServiceLetter,ServiceLetterPdf}.tsx`, `routes/serviceLetter.ts`, `prisma/schema.prisma` (`CourtOrder` model), admin proxy routes | ✅ extends the existing service-letter PDF with a cover sheet (case reference/due date/required+completed hours/completion %) and per-session "Adjusted from Xh to Yh by admin" annotations |
| Mobile Court Progress card | `backend/sessions/src/routes/courtProgress.ts` (`GET /me/court-progress`), `frontend/src/lib/courtProgressApi.ts`, `features/session-tracking/courtProgressStore.ts`, `features/figma-screens/components/CourtProgressCard.tsx`, `HomeScreen.tsx` | ✅ gated on `serviceType === 'Court Ordered'` (`user_metadata.service_type`) OR an active order — corrected mid-build per explicit user direction, saved to memory as `court-progress-gating` |
| Docs sync | `docs/admin-web-app.md`, `docs/backend/context/sessions.md`, `docs/frontend/context/app.md`, `docs/current.md`, `docs/progress.md` | ✅ |
| Backpressure | `admin-web-app` (`tsc --noEmit` + `next build`), `backend/sessions` (`tsc --noEmit`), `frontend` (`tsc --noEmit`) | ✅ all clean |

### Key Decisions

- Decision templates are hardcoded constants, not a DB-editable table (user's explicit call over the DB-table alternative).
- Volunteer timeline lives on the **existing** `/volunteers/[id]` page, not a new route.
- Court packet **extends** the existing service-letter generator rather than a new standalone generator.
- Mobile court progress routes through a **new backend endpoint**; `court_orders` RLS stays admin-only (no new self-read policy).
- Did not touch unrelated pre-existing working-tree changes present at session start/end — a large concurrent batch of attention-inbox / court-risk dashboard / communication log / session-compare / editable-email-template work (`admin-web-app/src/app/{attention,court-risk,email-templates,sessions/compare}/`, `admin/db/010_email_log.sql`, `011_email_templates.sql`, `frontend/src/components/ui/EmptyState.tsx`, checkpoint-sync-status work in `liveSessionStore.ts`, etc.) is present in the tree but was not authored by this session — left as-is, not reverted, not claimed here.

### Learnings

- `admin_audit_log.target_id` for `court_orders` rows is the **volunteer's user id**, not the court-order row's own id — `upsertCourtOrder` (`actions/courtOrders.ts`) upserts with `onConflict: 'user_id'` and logs `targetId: userId`. This simplified the timeline query considerably (no need to fetch/thread a separate court-order id).
- `'volunteer deleted session'` audit rows are written with `admin_user_id` = the volunteer's own id (`backend/sessions/src/routes/sessions.ts`), not an actual admin — matched in the timeline query via `admin_user_id = userId AND action = 'volunteer deleted session'` rather than `target_id`.
- `audit-log-summary.ts`'s `auditActionLabel`/`auditActionTone`/`describeAuditChanges` were directly reusable for the new volunteer timeline — no need to duplicate label-formatting logic.

---

## [2026-08-07] — Verified heatmap search fix live; shipped county choropleth fill

**Session goal:** User reported the full-screen heatmap search dropdown/Search button still broken after the prior session's fix; investigate, then (separately) fill in real county-shape choropleth for the state drill-down map.

**Workflow used:** Live repro against local dev + production (already-authenticated Chrome MCP tab) with real and simulated-slow-network clicks → could not reproduce → asked user for repro specifics → re-tested directly on production with the exact reported click sequence, still no repro → reported findings and asked to move on. Then: code investigation → implementation → local browser verification across multiple states → typecheck → commit → push → confirmed Vercel prod deploy READY.

### Tasks Completed

| Task | Location | Status |
|---|---|---|
| Re-verified prior session's search/dropdown fix (`bd7c73f`) against live prod, not just local | `admin.example.com` full-screen county map search | ✅ suggestion click flies to location + drops pin immediately; Search button works right after picking a suggestion — both symptoms from the original report no longer reproduce, including under artificially throttled network |
| Replaced county-level circle-bubble markers with a real polygon choropleth | `admin-web-app/src/components/dashboard/UsHeatmap.tsx` | ✅ every county in a drilled-into state now renders its actual shape, filled by session-count intensity (same treatment as the nation-level state view); zero-session counties render unfilled instead of not appearing |
| Confirmed the choropleth isn't Illinois-specific | same file, `stateCounties` derived from nationwide `us-atlas` counties-10m.json | ✅ spot-checked California in-browser — full county shape set renders correctly with no data |
| Typecheck + commit + deploy | `admin-web-app` | ✅ `tsc --noEmit` clean, commit `f240a81`, pushed to `main`, Vercel prod deploy `dpl_AfKionP6raCfuMvk9p85Jd7f4CGK` confirmed READY |

### Key Decisions

- Did not touch the pre-existing unrelated working-tree diffs present at session start/end (`.cursor/hooks/state/*`, `.gitignore`, `AGENTS.md`, `docs/backend/context/sessions.md`, `admin-web-app/src/components/ui/SessionPreviewDrawer.tsx`, `admin-web-app/src/lib/decisionTemplates.ts`) — out of scope, not from this session's work, left untouched and uncommitted.
- Committed only the single file this session actually changed (`UsHeatmap.tsx`), not a broad `git add -A`, per [[broad-commit-authorization-scope]].

### Learnings

- Confirms [[verify-before-fixing-ui-bug-reports]]: this time the live-production repro genuinely found nothing wrong (unlike the prior incident) — exercising the actual deployed feature, including with an authenticated real session and artificially slowed network, is what makes "I can't reproduce this" a trustworthy answer instead of a guess.
- `loadUsCounties()` (`admin-web-app/src/lib/us-geo.ts`) already loads the full nationwide `us-atlas` counties topology once — any "add county data for state X" request is almost always a rendering/UI gap, not a missing-data gap; check what's already loaded before assuming new geo data needs to be sourced.

---

## [2026-08-07] — Fixed silently-broken heatmap search in production (Photon/Nominatim geocoding)

**Session goal:** User reported the admin heatmap search dropdown / location pin+popup "worked on localhost but not on Vercel"; determine root cause and fix.

**Workflow used:** Vercel deployment audit → live browser repro against the deployed prod URL (Chrome MCP, already-authenticated tab) → network/log inspection → fix → redeploy → re-verify live.

### Tasks Completed

| Task | Location | Status |
|---|---|---|
| Confirmed prod deploy matches `HEAD` (ruled out "changes didn't ship") | Vercel project `example-admin-web` | ✅ latest READY deploy at session start = commit `56c1029`, aliased to prod |
| Live-tested the actual feature on the deployed prod URL, not just visual inspection | `admin.example.com` heatmap fullscreen search | ✅ found `/api/place-search` returning `{hits:[],source:"none"}` / one-off `503` — search dropdown never populated, so the pin/popup (which only renders on selection) could never appear |
| Traced root cause to silent fetch failures | `admin-web-app/src/lib/{place-search,photon,census-geocode,place-reverse}.ts` | ✅ every Photon/Nominatim/Census call had no fetch timeout and a bare `catch {}`, so a slow/refused connection from Vercel's egress produced empty results with nothing logged |
| Added timeouts + error logging | same 4 lib files + `app/api/place-search/route.ts`, `app/api/place-reverse/route.ts` | ✅ 5s `AbortSignal.timeout()` on every upstream fetch, `console.error` on each fallback path — commit `bd7c73f` |
| Redeployed and re-verified live | Vercel + Chrome MCP | ✅ `/api/place-search?q=Willis+Tower` now returns real hits (`source:"photon"`); selecting a suggestion flies the map, drops the pin, shows the readable popup with top-right close button |

### Key Decisions

- Superseded the prior same-day entry below (now corrected) that concluded "no fix needed, prod already matches HEAD" — that check only ruled out a stale deploy, it never exercised the feature's actual server-side API calls against production.
- Did not touch the pre-existing unrelated working-tree diffs (`.cursor/hooks/state/*`, `.gitignore`, `AGENTS.md`, `docs/backend/context/sessions.md`) — out of scope, not touched this session.

### Learnings

- Matching Vercel's deployed `githubCommitSha` to `HEAD` proves the right code shipped — it does **not** prove a feature works if that feature depends on third-party server-side calls. Must exercise the live prod endpoint directly (see [[verify-before-fixing-ui-bug-reports]]).
- Free geocoding APIs (Photon, Nominatim, Census) can behave differently from Vercel's serverless egress vs. a developer's home network; combined with bare `catch {}` blocks, failures were completely invisible in both the UI and the logs. Always add a fetch timeout + logged catch for any external call reachable only server-side (see [[silent-geocoding-failures-vercel]]).

---

## [2026-07-26] — Approved session service letter PDF

**Session goal:** Ship shared volunteer + admin PDF (letter page + per-session evidence maps/photos); sync Supabase schema for letterhead columns.

### Tasks Completed

| Task | Location | Status |
|---|---|---|
| PDF generator on Fly Sessions API | `backend/sessions/src/letterhead/` | ✅ |
| PDF routes | `GET/POST …/service-letter.pdf` | ✅ |
| Mobile download UX | `SessionDetailScreen`, `SessionsScreen`, `downloadServiceLetterPdf.ts` | ✅ |
| Admin proxy routes | `admin/app/api/service-letter/` | ✅ |
| Spec + docs | `docs/frontend/specs/service-letter-pdf.md`, `docs/supabase.md` env table | ✅ |
| Prisma `db push` (session pooler) | `backend/sessions/.env` | ✅ |

### Key Decisions

- **One PDF generator** on Fly for volunteer JWT and admin `x-admin-key` (admin portal proxies).
- **`DATABASE_URL` only in `backend/sessions/.env`** — not Expo `frontend/.env`.
- **Local Prisma:** Supabase **session pooler** URI; direct host often unreachable (P1001) from dev machines.

### Remaining for production

- `fly deploy` from `backend/sessions/` with `SUPABASE_SERVICE_ROLE_KEY` (and verify `DATABASE_URL` on Fly).
- Admin `.env.local`: `SESSIONS_API_URL`, `ADMIN_API_KEY`.
- End-to-end QA on device + admin letterhead links.

---

## [2026-07-10 Session 4] — Figma Home Screen → Native (figma-screens feature scaffold + HomeScreen)

**Session goal:** Create a frozen backup of the `session-tracking` Expo Go flow, scaffold a new `figma-screens` feature with all 52 manifest screens as placeholders, and implement the Figma Home screen (node 406:291) as the first native screen.
**Workflow used:** Plan Mode → figma:figma-use skill → get_design_context → Write + Edit

### Skills Invoked

| Skill | Purpose | Outcome |
|---|---|---|
| `figma:figma-use` | Load Figma Plugin API rules before using MCP tools | Rules loaded; `get_design_context` used correctly |
| `superpowers:using-superpowers` | Session-start skill registry | Loaded automatically |

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Freeze session-tracking as legacy backup | `frontend/src/features/session-tracking-legacy/` (cp -r) | ✅ |
| Create figma-screens feature scaffold | `frontend/src/features/figma-screens/` | ✅ |
| PlaceholderScreen for all 52 unimplemented screens | `figma-screens/screens/PlaceholderScreen.tsx` | ✅ |
| PreviewApp harness with all 52 screens grouped by Figma page | `figma-screens/dev/PreviewApp.tsx` | ✅ |
| Boot index.tsx from figma-screens | `frontend/src/app/index.tsx` | ✅ |
| Fetch Figma Home screen design (node 406:291) | `get_design_context` MCP call | ✅ |
| Implement HomeScreen from Figma design only | `figma-screens/screens/HomeScreen.tsx` | ✅ |
| Wire `home` as boot screen in PreviewApp | `figma-screens/dev/PreviewApp.tsx` — FIRST_KEY + case | ✅ |
| Fix babel-preset-expo version mismatch (57→54) | `frontend/package.json` | ✅ |

### Key Decisions

- **Figma-only policy:** HomeScreen.tsx derived solely from `get_design_context` for node 406:291 — no repo code patterns referenced. User explicitly requested this.
- **figma-screens isolation:** New feature dir is entirely separate from session-tracking. session-tracking-legacy is a frozen read-only snapshot.
- **Icons:** `@expo/vector-icons` (Ionicons) used as functional equivalents for Figma asset URLs that expire in 7 days.
- **Bar chart:** View-based implementation (no chart lib) — proportional heights from static data matching Figma exactly.
- **ngrok tunnel broken on M-series Mac:** `@expo/ngrok-bin-darwin-arm64` ships empty (no v2 binary for arm64). Workaround: USB + `npx expo start --go`. Documented for future sessions.

### Learnings

- `babel-preset-expo` must match SDK version exactly — v57 installed against SDK 54 causes Hermes "private properties" runtime errors
- `@expo/ngrok-bin-darwin-arm64` package is empty stub; ngrok v2 never shipped arm64 binary; tunnel mode is non-functional on Apple Silicon without a workaround
- `npx expo start --go` flag required when `eas.json` exists — otherwise Expo CLI seeks a dev build instead of Expo Go
- USB connection to iPhone + `--go` flag is the reliable dev path on this machine
- Figma `get_design_context` returns Tailwind/React web code; must manually translate all CSS to React Native StyleSheet (flexbox model differs, no CSS grid, no absolute position via classes)

---

## [2026-06-30 Session B] — Figma Design Tokens & Variables Extension

**Session goal:** Audit existing Figma variable collections and extend them: add WEB/iOS/Android code syntax to all variables, fix forbidden `ALL_SCOPES`, rename mode names from "Mode 1" to descriptive values, and create Typography Primitives + Typography semantic variable collections.
**Run ID:** `cugb-tokens-2026-06-30`
**Workflow used:** Figma MCP (`use_figma` + `figma-generate-library` skill), sequential phased execution.

### Outcome

| Deliverable | Location | Status |
|---|---|---|
| WEB/Android/iOS code syntax on all 46 pre-existing variables | All 4 collections | ✅ |
| Collection modes renamed (`Mode 1` → `Value` / `Light`) | Primitives, Spacing, Radius, Color | ✅ |
| `color/primary` scope fixed (`ALL_FILLS` → `FRAME_FILL, SHAPE_FILL, STROKE_COLOR`) | Color collection | ✅ |
| `lime/500` scope fixed (`ALL_SCOPES` → `[]` hidden primitive) | Primitives collection | ✅ |
| `color/accent/lime` scope fixed (`ALL_SCOPES` → `FRAME_FILL, SHAPE_FILL`) | Color collection | ✅ |
| Typography Primitives collection (16 vars) | Font families (3), weights (4), sizes (9) | ✅ |
| Typography semantic collection (42 vars) | Aliases per text style × family/weight/size | ✅ |
| Spacing bar widths variable-bound | Design System page `spacing/*` rects | ✅ |
| Radius sample corner radii variable-bound | Design System page `radius/*` rects | ✅ |
| Phase 1 validation | 104 local vars, 0 broken aliases, 0 missing code syntax, 0 scope violations | ✅ PASS |

### Final token counts

| Collection | Mode | Variables |
|---|---|---|
| Primitives | Value | 15 |
| Color | Light | 19 |
| Spacing | Value | 8 |
| Radius | Value | 4 |
| Typography Primitives | Value | 16 |
| Typography | Value | 42 |
| **Total** | | **104** |

### Key decisions

- Typography Primitives holds raw font families, weights (as Figma `FONT_STYLE` strings), and sizes. Typography holds semantic aliases (one per text style × 3 properties).
- Spacing scope kept as `WIDTH_HEIGHT, GAP` (existing convention retained, not narrowed).
- Effect styles: 2 active (`Shadow/Nav/Bottom`, `Shadow/Bar/Top`) — 9 unused styles removed 2026-07-01 after shadow reduction on pages 1–6.
- Screen re-binding remains out of scope.

---

## [2026-06-30 Session] — Figma Design System v1 on Design System page

**Session goal:** Build design system in Figma from audited screen designs (not repo docs); populate empty Design System page `1:3`.
**Workflow used:** Figma MCP (`use_figma` + `figma-generate-library` skill), sequential phased execution.

### Outcome

| Deliverable | Location | Status |
|---|---|---|
| Variable collections (44 tokens) | File-level: Primitives, Color, Spacing, Radius | ✅ |
| Text styles (14) | Local styles | ✅ |
| Foundations docs | [Design System page](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1-3) — Cover, Getting Started, Color, Typography, Spacing/Radius, Known Inconsistencies | ✅ |
| BottomNav | Cloned from screen Navbar [`536:2046`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=536-2046) — replaces simplified placeholder (`672:471`) | ✅ |
| Input | Component set [`675:125`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=675-125) — `State=Default \| Focus \| Error`; value text center-aligned | ✅ |
| Accent lime token | `color/accent/lime` → `#c2d832` + Color Palette swatch | ✅ |
| Pending border palette | `color/status/pending/border` → `#fcab29` swatch on Color Palette | ✅ |
| Screen re-binding | Existing flow screens | ⏭️ Out of scope v1 |

### Locked tokens

- Primary: `#009540` only (removed `#0fca7a`, `#008739`, `#006b2c`)
- Nav inactive: `#3e4a3d` (separate from secondary `#6e7a6c`)
- Fonts: Sanchez, Noto Sans, IBM Plex Sans
- Excluded: Archived page `1:2`

### Key decisions

- v1 scope: foundations + core components on DS page only
- Success surface: single `#f7fff1`
- Search radius: 22px dedicated token
- Noto Sans Bold kept as Body/Strong style

---

**Session goal:** Fix duplicate dropdown arrows on "Few Details" screen; persist hamburger nav across Sessions and Shop tabs; add donation checkout/confirmation flow; add photo submitted confirmation screen; wire distinct session vs event bottom-sheet popups; fix sidebar X button; fix account page scroll clipping.
**Workflow used:** Chat / Skill-driven (`/run`)

### Skills Invoked

| Skill | Purpose | Outcome |
|---|---|---|
| `/run` | Launch Expo iOS simulator to test UI changes | `npx expo start --ios --localhost --clear` running; prototype verified on simulator |

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Replace `<select>` dropdowns with custom div dropdowns | `account_details___standardized_progress.html` | ✅ No native iOS arrow; single chevron rotates on open/close |
| Persist hamburger header + 3-button nav on Sessions tab | `sessions_list___hybrid_redesign.html` | ✅ Sidebar drawer, backdrop, and 3-button nav added |
| Persist hamburger header + 3-button nav on Shop tab | `shop_home___prd___reference_aligned.html` | ✅ Same pattern applied |
| New donation checkout screen | `donation_checkout.html` | ✅ Header, summary card, contact, payment fields, sticky CTA |
| New donation confirmation screen | `donation_confirmation.html` | ✅ Animated checkmark, summary card, Return to Home / View History CTAs |
| New photo submitted confirmation screen | `photo_submitted.html` | ✅ Pop-in checkmark, timer chip, Continue Tracking CTA |
| Wire all new screens into router | `frontend/src/app/prototype/[screen].tsx` | ✅ HTML_MAP, NAV_RULES, SCREEN_RULES, LOCATION_REMAP updated |
| Distinct session bottom-sheet popup (vs event popup) | `home_hamburger.html` | ✅ `openSessionModal(idx)` / `closeSessionModal()` with SESSIONS data array |
| Fix session modal + event modal cut off by navbar | `home_hamburger.html` | ✅ Modal backdrops raised to `z-[60]` |
| Fix sidebar X button navigating away instead of closing | `home_hamburger.html` | ✅ Removed `data-nav-wired="true"` from `#sidebar-close` |
| Fix account page scroll clipping | `account.html` | ✅ `pb-28` → `pb-40` on `<main>` |

### Key Decisions

- Custom div-based dropdowns chosen over `<select>` + CSS `appearance-none` because iOS WKWebView does not reliably suppress the native select arrow via CSS alone.
- Modal z-index raised to `z-[60]` (above navbar's `z-50`) to prevent bottom nav from overlapping bottom-sheet popups.
- Sidebar X button `data-nav-wired="true"` removed so the router does not intercept the close tap.

### Learnings

- iOS WKWebView ignores `-webkit-appearance: none` on `<select>` — always use fully custom div dropdowns for prototype selects.
- `data-nav-wired="true"` on any element causes `[screen].tsx` buildNavScript to intercept its click for routing — do not apply to UI controls that should stay local (close buttons, toggles).
- Bottom-sheet modals must be `z-[60]` or higher; the fixed bottom nav sits at `z-50`.
- Expo iOS simulator requires `--localhost` flag; LAN IP fails on simulator (physical device needs LAN).

---

## [2026-06-12 Session 2] — Export all 39 HTML prototype screens to Figma as editable frames

**Session goal:** Write every screen from the Expo Go prototype flow into the CleanUpGiveBack Figma file as real auto-layout frames, ready for redesign.
**Workflow used:** Skill-driven (`/figma-use`)

### Skills Invoked

| Skill | Purpose | Outcome |
|---|---|---|
| `/figma-use` | Write screens to Figma via Plugin API | 39 screens created as real auto-layout frames across 6 pages |

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Identify correct Expo Go screen source | `src/app/prototype/[screen].tsx` | ✅ HTML Stitch screens via WebView — NOT the React Native `.tsx` screens |
| Create 6 Figma pages by flow | Figma file `DrDcQH14n7ntDQ80F7au9S` | ✅ 1·Onboarding, 2·Home & Events, 3·Shop & Payments, 4·Session Tracking, 5·Sessions History, 6·Account & Settings |
| Onboarding page — 7 screens | `assets/stitch/welcome*.html`, `create_account*.html`, `account_details*.html`, `notification_preference*.html`, `setup_complete.html`, `coachmark_tutorial.html` | ✅ Nodes 78:2–89:52 |
| Home & Events page — 3 screens | `assets/stitch/home_dashboard*.html`, `home_hamburger.html`, `events_detail.html` | ✅ Nodes 90:2–90:204 |
| Shop & Payments page — 8 screens | `assets/stitch/shop_home*.html`, `product_detail*.html`, `shopping_cart*.html`, `checkout_form.html`, `thank_you*.html`, `donate.html`, `donation_checkout.html`, `donation_confirmation.html` | ✅ Nodes 81:2–87:86 |
| Session Tracking page — 8 screens | `assets/stitch/session_setup*.html`, `live_session*.html`, `photo_checkpoint.html`, `photo_submitted.html`, `restart_required.html`, `submission_confirmation*.html`, `approval_history.html` | ✅ Nodes 86:2–92:64 |
| Sessions History page — 6 screens | `assets/stitch/sessions_list*.html`, `sessions_calendar*.html`, `session_detail.html`, `cleanup_giveback_redone*.html` | ✅ Nodes 88:2–93:173 |
| Account & Settings page — 7 screens | `assets/stitch/account.html`, `settings.html`, `notification_settings*.html`, `privacy_security.html`, `order_history.html`, `donation_history.html`, `export_service_record.html` | ✅ Nodes 91:2–95:128 |

### Key Decisions

- Target confirmed as HTML Stitch screens (`assets/stitch/*.html`) not React Native `.tsx` — the `prototype/App.tsx` component is never mounted because expo-router's entry point overrides `registerRootComponent`.
- Screens rendered as 390×844 auto-layout frames using real Figma vector/text nodes (not screenshot images) so the designer can edit every layer.
- Material Symbols Outlined icons cannot be loaded via Figma Plugin API — represented as 24×24 `#bdcaba` placeholder rects with 2-char labels.
- 6 parallel agents used (one per Figma page) to maximize throughput while staying within per-call op limits.

### Learnings

- The `prototype/App.tsx` React Native file uses `registerRootComponent` but is silently overridden by `expo-router/entry` — it is dead code. Expo Go always boots expo-router.
- Figma Plugin API `figma.loadFontAsync` must be awaited for every font family+style combination before any text node mutation, including `appendChild` on frames that contain text children.
- `layoutSizingHorizontal = 'FILL'` must be set AFTER `parent.appendChild(child)` — setting it on an unparented node throws silently or is ignored.

---

## [2026-07-11 Session 5] — Calendar picker UX fixes + Compass component (985:567)

**Session goal:** Fix drum/wheel date picker scrollability and header UX, rebuild the date badge row, implement the Header Container (406:300), and build a fully functional SVG compass (985:567) with live magnetometer heading.
**Workflow used:** Chat → Edit/Write (no plan mode; iterative visual feedback loop)

### Skills Invoked

| Skill | Purpose | Outcome |
|---|---|---|
| `superpowers:using-superpowers` | Session-start skill registry | Loaded automatically |
| `figma:figma-use` | Figma design context lookups (406:305, 406:300, 985:567) | Design tokens and layout extracted |

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Fix drum picker scrollability | `ServiceHoursWeekPicker.tsx`, `WheelPickerColumn.tsx` | ✅ Replaced Pressable backdrop with sibling absoluteFill Pressable; ScrollViews now receive touch responder |
| Remove Day column from DateWheelPicker | `DateWheelPicker.tsx` | ✅ Month + Year only; day preserved for clamping |
| Picker header: "‹ Back" when drum open | `ServiceHoursWeekPicker.tsx` | ✅ Conditional header; backBtnInner View with flexDirection:row fixes chevron+text alignment |
| Remove "Today" button when drum picker open | `ServiceHoursWeekPicker.tsx` | ✅ Gated on `!monthYearPickerVisible` |
| Rebuild date badge row (Figma 406:305) | `ServiceHoursWeekPicker.tsx` | ✅ View container + absolute-positioned text/icon + Pressable overlay |
| Implement Header Container (Figma 406:300) | `ServiceHoursWeekPicker.tsx` | ✅ "Service Hours" + "20.5 hrs" + date nav row |
| Build Compass component (Figma 985:567) | `src/components/ui/Compass.tsx` | ✅ expo-location watchHeadingAsync; Reanimated rotate; SVG dial |
| Refactor LiveSessionScreen to use Compass | `src/screens/LiveSessionScreen.tsx` | ✅ All inline SVG paths replaced with `<Compass size={44} />` |
| Fix compass visual: add needle body + line ticks | `Compass.tsx` | ✅ Rect bodies added; TICK_NEAR/FAR diamonds replaced with Polygon arrows |
| Redesign compass: static bg + rotating red tick | `Compass.tsx` | ✅ Background fixed; red tick rotates with +heading; center label shows N/NE/E… |
| Add all 4 cardinal green ticks + centering fix | `Compass.tsx` | ✅ CARDINAL_ANGLES=[0,90,180,270]; label top computed explicitly |

### Key Decisions

- **Pressable as backdrop**: `Pressable` intercepts scroll gestures from child `ScrollView`s — fix is sibling `Pressable style={absoluteFillObject}` next to the card, not wrapping it.
- **Pressable layout bug**: `Pressable` does not reliably apply `flexDirection: 'row'` to children — always wrap icon+text in an inner `View` with explicit flex.
- **Date badge absolute positioning**: `Pressable` as a layout container for a badge (icon + text) fails on both flex and absolute modes — use plain `View` for layout, overlay `Pressable` for taps.
- **Compass heading init**: first `watchHeadingAsync` reading applied as immediate snap (no `withTiming`) to avoid dial spinning from 0° on mount.
- **Compass architecture**: static SVG background (cardinal/intercardinal ticks); separate `Animated.View` for red tick rotating by `+heading` (facing direction at top); center `Text` label updates via `useState`.

### Learnings

- `onStartShouldSetResponder={() => true}` on a View steals the responder from ALL child ScrollViews — never use it as a "capture backdrop" pattern.
- `Pressable` `flexDirection: 'row'` style does not apply to children reliably in RN — confirmed pattern: inner `View` with `flexDirection: 'row'` inside every Pressable that needs row layout.
- Compass "facing direction" design: red tick rotates by `+heading` (clockwise with heading) so the top of the ring always shows the direction the phone is pointing. Static background ticks serve as cardinal/intercardinal reference marks.
- `bearingToLabel`: `Math.round(deg/45) % 8` maps continuous heading to 8-point cardinal label.

---

## [2026-08-04] — Fix stationary-session route line; diagnose Sessions tab / backend outage

**Session goal:** Stop the live/replay map from drawing a walking path when the user hasn't moved, then diagnose why a locally-logged session wasn't appearing in the Sessions tab.

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Raise GPS movement gate so stationary jitter isn't recorded as a route point | `frontend/src/features/session-tracking/utils/routeFiltering.ts` | ✅ `getMinMovementMeters` floor raised (1m→2m, 0.25×→0.4× accuracy); updated `routeFiltering.test.ts` expectations |
| Diagnose "no sessions logged yet" on Expo Go | (investigation only) | ✅ Traced to `example-sessions` Fly backend outage (stale `DATABASE_URL`, see [[fly-example-sessions-outage]] memory) — finalize sync fails, session stays `active`, `SessionsScreen.tsx` filters those out with no local fallback |
| Push accumulated uncommitted work to `origin/main` | 23 files (admin-web-app realtime refresh, finalize retry/sync-warning banner, route fix) | ✅ Commit `1b824b3` |
| Security review flagged admin RLS policy privilege escalation | `admin/db/008_admin_sessions_realtime_read.sql` | ⚠️ Deferred — user chose "hold off, don't change auth yet"; needs `app_metadata` migration + teammate coordination before fixing |

### Key Decisions

- Movement-gate fix targets the gate threshold only (not `isStationary`'s speed logic), since raising the speed floor would reject genuine slow "cleanup" walking pace — the app's real use case.
- Admin-role privilege escalation (client-writable `user_metadata.role` used for admin checks app-wide, not just the new RLS policy) is a known, deliberately deferred issue — see `admin-role-privilege-escalation` memory. Do not fix without re-confirming with the user.

### Learnings

- GPS jitter while stationary commonly exceeds a `accuracy × 0.25` movement floor at good reported accuracy (4-8m), which is what let a single noisy fix register as a "walked" route point — fixed by raising the floor, not the speed threshold (`MIN_SPEED_TO_RECORD_MPS` stays low to still catch slow real walking).
- `SessionsScreen.tsx` has no offline/local fallback — any failed `finalizeSession` sync makes a session permanently invisible in that tab even though local state believes it completed. The finalize-retry + sync-warning banner (already in progress before this session) is the mitigation, but the underlying Fly/Postgres outage is infra, not app-fixable from this machine.
- Before assuming a session-sync bug is client-side, verify the Fly backend can actually write to Postgres first — see [[fly-example-sessions-outage]].

---

## [2026-08-06] — Fix admin-web-app stale data, dead review buttons, and session-privacy gaps

**Session goal:** Diagnose why mobile sessions weren't showing in admin (last visible session 13d stale), then fix a string of admin-web-app bugs Admin found while using it live: dead Dashboard buttons, wrong photo count, missing volunteer-name reliability, and in-progress sessions being admin-visible.
**Workflow used:** Chat, `superpowers:systematic-debugging` for the root-cause investigation

### Skills Invoked

| Skill | Purpose | Outcome |
|---|---|---|
| `superpowers:systematic-debugging` | Root-cause the stale-sessions report before proposing a fix | Found `/sessions`, `/dashboard`, `/` were statically prerendered at build time (no `dynamic`/`revalidate` export, service-role read triggers no dynamic API) — froze session data as of last deploy |
| `update-config` | Add a Bash permission rule for `vercel deploy --prod` after the auto-mode classifier blocked a direct prod deploy | `.claude/settings.local.json` created (gitignored) with `Bash(vercel deploy --prod*)` allow rule |

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Fix stale Sessions/Dashboard/Home (static prerender) | `admin-web-app/src/app/{sessions,dashboard,}/page.tsx` | ✅ Added `export const dynamic = 'force-dynamic'` to all three |
| Fix "Photos on trail" undercount | `SessionPreviewDrawer.tsx`, `SessionWalkingPathMap.tsx` | ✅ Was counting checkpoint pins (1 per checkpoint) instead of actual photos (selfie+progress per checkpoint) — sourced from `evidence.photos.length` |
| Make volunteer-name sync reliable | `frontend/src/lib/supabase.ts` (`syncVolunteerProfile`) | ✅ Was fire-and-forget, single attempt, no verification — now retries with backoff (500/1500/3000ms) and confirms `updateUser`'s response reflects the new `full_name` before trusting it |
| Wire up dead Dashboard "Review"/"Start" buttons | `DashboardPage.tsx` | ✅ Both had no `onClick` — now open the same `SessionPreviewDrawer` `/sessions` uses |
| Remove non-functional bulk-select checkboxes + tip | `DashboardPage.tsx` | ✅ Checkboxes were `readOnly`/dead; Admin reviews sessions individually, not in bulk |
| Make "Needs you" queue scrollable | `DashboardPage.tsx` | ✅ Was hard-capped at 5 items with the rest invisible; now shows the full queue, scrollable past ~5 rows |
| Remove Dashboard Snapshot section | `DashboardPage.tsx` | ✅ Removed per request; cleaned up now-unused `approvalRatePct`/`ChevronRightIcon` |
| Exclude in-progress (`active`) sessions from all admin surfaces | `admin-web-app/src/lib/live-data.ts`, `SessionsPage.tsx` | ✅ Privacy requirement — admin must not see a volunteer's session while still in progress. `.neq('status','active')` added to every sessions query (Dashboard/Sessions/volunteer detail/court progress/user counts); removed now-unreachable "Active" filter chip. 6 real active/abandoned sessions confirmed excluded. |

### Key Decisions

- GitHub Actions was mid-outage (confirmed via githubstatus.com) for most of this session — every deploy went out via direct `vercel deploy --prod --yes` instead of the `Deploy admin-web-app` GitHub Action, after the user added a scoped `Bash(vercel deploy --prod*)` permission rule.
- git push required switching the active `gh`/git credential from `spatel-fm` (no write access) to `spatel54` (has push access) — `gh auth switch --user spatel54` + `gh auth setup-git`.
- "Active" sessions are excluded at the query layer (`live-data.ts`), not by hiding the status client-side — guarantees no admin surface can ever leak one, present or future.

### Learnings

- A Next.js App Router route with no `dynamic`/`revalidate` export and a cookie-free data fetch (service-role Supabase client, no `cookies()` call) gets statically prerendered at build time with no warning — `next build`'s route table (`○` vs `ƒ`) is the fastest way to confirm this class of bug.
- Client-side `router.refresh()` (e.g. a Supabase-realtime hook) cannot un-stale a statically-prerendered route on Vercel — it just re-requests the same cached payload. Only a redeploy or `revalidatePath`/`revalidateTag` actually re-executes the server component.
- `syncVolunteerProfile` and `liveSessionStore`'s finalize retry now share the same backoff-retry pattern — worth reusing for any other single-attempt Supabase write in onboarding/session flows.
- Sessions can be real, identifiable DB rows stuck in `status='active'` indefinitely (finalize never completed) — not fake test data. Worth periodically checking `select id from sessions where status='active'` for volume, since it signals ongoing finalize-sync reliability, not just a privacy filter.

---

## [2026-08-06 Session 9] — Fix Fly DB outage, stationary-route replay, sync ServiceType/phone to admin

**Session goal:** Confirm mobile sessions actually reach the backend and admin now that Fly.io is a paid app; fix a stationary-session replay bug; surface each volunteer's ServiceType next to their sessions in admin.
**Workflow used:** Chat, with `Explore` subagents for codebase tracing (mobile Sessions tab data source, service-type field path, ServiceType storage/join point)

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Diagnose + fix `example-sessions` Fly `DATABASE_URL` outage | Fly secret `DATABASE_URL` (no code change) | ✅ Reproduced via live `POST /sessions` (500, mangled tenant name); user reset the Supabase DB password, `flyctl secrets set` pushed the corrected pooler URL, verified with a real write → `201` → confirmed row in Postgres → cleaned up test row |
| Audit mobile Sessions tab read path | (research only) | ✅ Confirmed it hits real `GET /sessions`, not local-only; found silently-swallowed fetch errors and a mock-data fallback when `EXPO_PUBLIC_API_URL` is unset |
| Audit EAS build env-var config | (research only) | ✅ `eas env:list` showed zero vars configured for development/preview/production — real builds would ship with `EXPO_PUBLIC_API_URL`/Supabase vars all `undefined`; flagged, not yet fixed |
| Fix stationary-session replay drawing a fake walked line | `frontend/src/features/session-tracking/utils/routeFiltering.ts`, `components/SessionRouteMapPanel.tsx`, `components/SessionRouteMapPreviewWebView.tsx` | ✅ Added `getRouteSpanMeters`/`collapseStationaryRoute` (8m floor) so a GPS-settle jitter point no longer renders as an animated line; also fixed the WebView branch, which previously showed no marker at all for a single-point route |
| Persist volunteer phone + account-level ServiceType to Supabase | `frontend/src/lib/supabase.ts` (`syncVolunteerProfile`), `frontend/src/features/onboarding/onboardingStore.ts` (`getE164Phone`), `frontend/src/screens/SetupCompleteScreen.tsx` | ✅ Extended the existing `full_name` sync (with its verify-then-retry pattern) to also write `phone`/`service_type` into `user_metadata` at the terminal onboarding step |
| Surface ServiceType next to each volunteer in admin Sessions tab | `admin-web-app/src/lib/volunteers.ts`, `live-data.ts`, `mock-data.ts`, `components/pages/SessionsPage.tsx`, `components/ui/SessionPreviewDrawer.tsx`, new `components/ui/ServiceTypeBadge.tsx` | ✅ Directory-level `serviceType` resolved from `user_metadata.service_type`, badge shown next to volunteer name (list + drawer) and as a Session Info row |
| Deploy admin-web-app to production | — | ✅ `vercel deploy --prod --yes`, live at `admin.example.com`; `/sessions` still correctly `ƒ` (dynamic), not statically prerendered |

### Key Decisions

- ServiceType stays **account-level, not per-session** — set once at onboarding, same value shown for every session that volunteer logs. User explicitly chose this over a per-session picker.
- ServiceType/phone persist into Supabase `user_metadata` (same mechanism as `full_name`) rather than a new `profiles` table/migration — avoids a schema change for a field with no other relational use yet.
- Mobile changes were committed and pushed to `main` but **not** shipped via EAS build this session — user deferred that. Admin-web-app was pushed and deployed to production.

### Learnings

- Paying a Fly.io bill does not fix a broken `DATABASE_URL` secret — those are orthogonal failure modes (billing/suspension vs. a stale DB credential). Always verify with a live write, not just `/health`.
- `EXPO_PUBLIC_*` vars in a gitignored `.env` are invisible to EAS cloud builds unless mirrored into `eas env:create` — local `expo start` dev testing can look fully wired while a real device build silently falls back to mock data.
- `ServiceType` had been mobile-only, in-memory, unpersisted (`onboardingStore.ts` comment: "no persistence yet") despite already having onboarding UI for it — a good reminder to check persistence, not just UI presence, when asked "does X get logged accurately."

---

## [2026-08-06 Session 10] — Real GPS geocoding + real neighborhood map for the admin US activity heatmap

**Session goal:** Make the admin dashboard's "US activity" map plot real session locations instead of a hardcoded Illinois placeholder, and give the county drill-down a real map (not a schematic tile mockup) with usable names, search, and full-screen controls.
**Workflow used:** Chat, iterative — each round driven by a live browser-tested bug report or follow-up ask.

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Wire dead Waiting/Approved/Hours dashboard tiles to `/sessions` | `components/pages/DashboardPage.tsx` | ✅ Tiles linked to `/dashboard` (no-op self-link) |
| Geocode real session GPS (route/checkpoint) → state + county FIPS | `lib/live-data.ts`, `lib/us-geo.ts` | ✅ Point-in-polygon against states/counties TopoJSON, no external geocoding API/cost; sessions with no GPS fall back to the IL placeholder with `state_fips_placeholder` flagged |
| Fix 0-session county drill-down | `lib/mock-data.ts` (`buildGeoActivity`) | ✅ `byCounty` was always empty for live sessions — now aggregated from geocoded `county_fips` |
| Ensure the map never shows mock/fixture data | `app/analytics/page.tsx`, `app/insights/page.tsx`, `components/pages/AnalyticsPage.tsx`, `DashboardPage.tsx` | ✅ Added a `realSessions` prop threaded separately from the page's mock-fallback `sessions`, so Insights/Analytics map stays real even when other charts show demo fixtures |
| Replace schematic 8-tile Cook-County-only neighborhood mockup with a real map | new `components/dashboard/CountyTractMap.tsx`, `lib/census-tracts.ts` | ✅ MapLibre GL (Carto Voyager basemap, already used elsewhere in the app) + real US Census tract boundaries (Census Bureau TIGERweb `Generalized_ACS2023` REST API, free/no-key), fetched per-county on demand — works for any US county, not just Chicago |
| Real neighborhood names on hover (not "Census Tract 8080.01") | new `lib/nominatim.ts`, `UsHeatmap.tsx`, `CountyTractMap.tsx` | ✅ Reverse-geocodes via OpenStreetMap Nominatim, but only for tracts with actual session activity (rate-limited to ~1req/sec — can't geocode a county's full 1,000+ tract set); zero-activity tracts fall back to a cleaned tract ID |
| Search box for counties/neighborhoods in the sidebar list | `UsHeatmap.tsx` | ✅ Client-side name filter over the existing ranked list, state reset via render-time adjustment (not an effect) to avoid a `set-state-in-effect` lint violation |
| Full-screen mode for the county map | `CountyTractMap.tsx` | ✅ Same fixed-overlay pattern as the existing `SessionWalkingPathMap.tsx`; Escape-to-exit |
| Zoom controls + address/place search in full-screen mode | `CountyTractMap.tsx`, `lib/nominatim.ts` (`searchPlace`) | ✅ MapLibre `NavigationControl` added/removed on fullscreen toggle; Nominatim forward-geocode search flies the map to the result |
| Fix map bleeding past its rounded card corner | `CountyTractMap.tsx` | ✅ WebGL canvas can composite to a layer that ignores parent `overflow-hidden`/`border-radius` — fixed by applying the radius directly to `.maplibregl-canvas` |
| Distinguish resolved vs. fallback names on hover | `CountyTractMap.tsx`, `UsHeatmap.tsx` | ✅ Real Nominatim names render full-contrast black; unresolved tract-ID fallbacks stay muted gray |
| Delete dead, unwired earlier attempt at this same feature | removed `components/ui/EnhancedUsHeatmap.tsx`, `GeocodingStats.tsx`, `lib/enhanced-geo-activity.ts` | ✅ Confirmed nothing imported them before deleting |

### Key Decisions

- Chose point-in-polygon against bundled TopoJSON/Census tract data over a paid geocoding API — zero marginal cost, and the states/counties TopoJSON was already being fetched for the map's own rendering.
- Census tracts (not city-specific "community area" datasets like Chicago's 77) were chosen for the neighborhood tier specifically so the feature works for *any* county nationwide, not just Cook County — confirmed with the user before building.
- Real place names are only fetched for tracts with actual session activity, never a county's full tract set, to respect Nominatim's ~1 req/sec usage policy. This means zero-activity tracts permanently show a tract-ID fallback on hover, not a real name — an accepted tradeoff, not a bug.
- Deleted rather than patched an old unused `EnhancedUsHeatmap`/`enhanced-geo-activity.ts` attempt at the same feature once it started failing `tsc` after the `UsHeatmap` prop change — verified zero importers first.

### Learnings

- `admin-web-app` already had MapLibre GL JS + Carto Voyager raster tiles standardized in two other components (`EventLocationMap.tsx`, `SessionWalkingPathMap.tsx`) — worth checking for an existing mapping pattern before reaching for a new library when a "real map" feature comes up again. Extracted the shared style into `lib/maplibre-basemap.ts` to stop the third copy-paste.
- The Census Bureau's TIGERweb has both full-resolution (`Tracts_Blocks`) and pre-generalized (`Generalized_ACS2023`) tract layers — the generalized one is ~8x smaller (Cook County: 1.1MB vs 9.5MB) and plenty precise for a session-count choropleth; worth defaulting to generalized boundary layers for any future Census geometry fetch.
- `sessions.route` (GPS trail, `[lng,lat]` pairs) and `checkpoints.latitude/longitude` were already being captured by the mobile app but silently unused by admin-web-app's map — a reminder to check what data a table already carries before assuming a feature needs new instrumentation.

---

## [2026-08-09 Session 11, Phase 1 of 6] — Figma catch-up sync: Design System token fixes (in progress — see plan `imperative-frolicking-bachman.md`)

**Session goal:** Sync the Figma file `DrDcQH14n7ntDQ80F7au9S` to match the repo — the repo has 71 live routes vs. 46 tracked in `manifest.yaml`, and the app has shipped multiple specs (session-tracking-expo-go, dual-capture, service-letter-pdf, map-theme) with no Figma update since the 2026-07-13 audit. Full 6-phase plan approved by user; this entry covers Phase 1 only.

### Reasoning

ADR-002 makes Figma the design ground truth (Figma → code direction); this sync is a one-time catch-up (user decision), not a reversal — Figma stays canonical going forward. Phase 1 (branding/tokens) had to run before Phase 2+ (screens) since screens bind to these tokens.

### Actions Completed

| Task | Detail | Status |
|---|---|---|
| Diff live Figma variables/text styles vs `frontend/src/constants/tokens.ts` | Pulled via Figma desktop MCP (`get_variable_defs`, `use_figma` — required desktop app open + a layer selected; remote-only `get_metadata`/`get_design_context` don't need this) | ✅ |
| Fix 13 of 14 named Figma text styles | `Display/Hero`, `Headline/Page`, `Headline/Detail`, `Body/Default`, `Body/Large`, `Body/Small`, `Body/Emphasis`, `Body/Strong`, `Label/Overline`, `Label/Status`, `Nav/Tab`, `Data/Stat`, `Data/Timer` — all were bound to stale pre-a11y-fix values; code and the DS frame's own documentation labels already had the correct spec. `Label/Button` was already correct. | ✅ |
| Create 3 missing Figma color variables | `color/bg/surface/elevated` (#f6f3f2, new), `color/bg/tour` (#dcebe2, promoted from code-only), `color/chip/bg` (#f0edec, promoted from code-only) — all in the `Color` collection, `Light` mode | ✅ |
| Fix naming collision bug | `color/bg/surface` was incorrectly documented (in `tokens.ts` comment and `color.json`) as `#f6f3f2` — the live Figma variable is actually `#ffffff` (matches `colors.bgSurface`). Corrected both; `#f6f3f2` now correctly belongs only to the new `color/bg/surface/elevated`. | ✅ |
| Sync `frontend/design/figma/tokens/color.json` | Updated `color/bg/surface`, added `color/bg/surface/elevated`, moved `chip/bg`/`bg/tour` out of `codeOnly` | ✅ |
| Sync `docs/frontend/brand.md` | Updated color table rows + added a dated "Last token verification" note | ✅ |
| Verify | `npx tsc --noEmit` clean; screenshot of Figma DS Typography section confirms corrected sizes render | ✅ |

### Learnings

- **Figma's `get_variable_defs`/`use_figma` require the Figma desktop app open with a layer selected** — remote nodeId+fileKey alone isn't enough (unlike `get_metadata`/`get_screenshot`, which work from fileKey+nodeId with no desktop dependency). Had to ask the user to open Figma desktop and select a node before these tools would work. Worth checking this early in any future Figma-write task.
- **"Figma is behind the repo" understated the actual finding**: colors/spacing/radius had zero drift, and the code's typography tokens already matched the Figma DS frame's own written documentation exactly (including two logged a11y fixes). The drift was narrower than assumed — only the *bound* Figma text style objects were stale; the doc labels and code were both already correct. Don't assume "Figma is behind" means Figma's intent is wrong — check whether the live styles match the file's own documentation before treating code as the source to copy from.
- `get_variable_defs` scoped to an arbitrary selected node only returns variables/styles actually bound within that node's subtree, not the full file's variable set — get a full picture via `figma.getLocalTextStylesAsync()` / `figma.variables.getLocalVariableCollectionsAsync()` through `use_figma` (read-only) instead of relying on `get_variable_defs` against one node.

### Progression

Phase 1 of 6 complete. Next: Phase 2 (gap reconciliation — walk full Figma document structure, cross-reference against all 71 routes, produce corrected `manifest.yaml`). See task list (Phase 2 = task #2) and plan file for the remaining 5 phases.

### History

Do not re-litigate: ADR-002 stays as-is (Figma remains ground truth going forward); this is a one-time catch-up per explicit user decision, not a supersession. Do not re-flip `color/bg/surface` back to `#f6f3f2` — that was a documented bug, not the correct value.

---

## [2026-08-09 Session 11, Phase 2 of 6] — Figma catch-up sync: gap reconciliation

**Session goal:** Continuation of the Figma catch-up sync (see Phase 1 entry above and plan `imperative-frolicking-bachman.md`). Phase 2 walks the full live Figma document and cross-references it against all 71 app routes to produce a corrected `manifest.yaml` and a worklist for the 6 Phase 3 section agents.

### Reasoning

The remote `get_metadata` tool's no-nodeId "list top-level pages" call only ever surfaced the Design System page for this file — misleading, since real screen content clearly existed (confirmed via a direct nodeId query the user provided). Switched to the desktop-driven Plugin API (`use_figma` → `figma.root.children`) to get the true page list, which is authoritative where the remote tool is not.

### Actions Completed

| Task | Detail | Status |
|---|---|---|
| Discover true page structure | 6 real content pages, not 7 as the old manifest assumed: `1·Onboarding` (77:2), `2·Home & Events` (77:3), `3·Shop & Payments` (77:4), `4·Session Tracking` (77:5), `5·Sessions History` (77:6), `6·Account & Settings` (77:7). No dedicated "Compliance & Legal" page exists — those frames physically live on Account & Settings. Two pages are explicitly marked "DO NOT TOUCH" / "DO NOT VIEW" in-file — left untouched. | ✅ |
| Full frame-level inventory per page | Used a depth-capped Plugin API walk (not full recursive `get_metadata`, which exceeded token limits on 4 of 6 pages) to list every top-level screen frame per page. | ✅ |
| Cross-reference against 71 routes | Rewrote `frontend/design/figma/manifest.yaml` — corrected/confirmed 46 previously-tracked entries, added several previously-untracked-but-existing frames (`free_kit`→free-kit, `free_trial_done`→free-trial-done, `notifications`→notification-settings candidate, `account_teen`→account-privacy candidate, 7 unlabeled `session_setup_guide` frames→the setup wizard), and marked genuinely absent routes `status: missing` (account-phone, personal-details, map-theme, settings, terms-of-service, privacy-permissions, age-gate + parental-consent family, etc.). | ✅ |
| Write Phase 3 worklist | New `frontend/design/figma/gap-worklist-2026-08-09.md` — per-section task list so each Phase 3 agent works its slice without re-deriving scope. | ✅ |
| Validate | `manifest.yaml`: 89 tracked entries, structurally balanced (89 routeKey lines = 89 status lines), zero duplicate routeKeys (checked via grep since `pyyaml` isn't installed in this environment and it's not a JS dependency worth adding for one validation pass). | ✅ |

### Learnings

- **The remote Figma MCP tools and the desktop Plugin API (`use_figma`) can disagree on file structure** — `get_metadata` with no `nodeId` returned only 1 of 8 real top-level pages for this file. When page/file structure discovery matters (not just reading a known node), prefer `use_figma` → `figma.root.children`, which is authoritative.
- **`get_metadata` with a nodeId returns full recursive XML down to every rectangle/vector/line** — fine for a single small frame, but blew the token limit on 4 of 6 pages here. A depth-capped `use_figma` script (`children` truncated to depth 2) is the right tool when only frame-level names/ids are needed, which is most of the time for gap analysis.
- **A stale layer name doesn't mean a stale mapping.** Frame `251:439` is literally named `session_setup_guide` (matching 7 sibling frames) but is confirmed via its `Map` + `Main Container` children and its unchanged node id to still be `live-session` — content/structure, not the layer name, is the source of truth when disambiguating.
- Several "missing" routes turned out to already exist in Figma under names that don't match their routeKey (`free_kit`, `notifications`→notification-settings, `account_teen`→possible account-privacy) — worth grepping frame *names* loosely, not just exact routeKey string matches, before concluding a screen needs net-new design.

### Progression

Phase 2 of 6 complete. `manifest.yaml` and `gap-worklist-2026-08-09.md` are the two artifacts Phase 3's 6 section agents (tasks #3–#8) consume. Several open product decisions were flagged for Phase 4, not resolved here (deferred, not forgotten):
- Remove `donation-checkout`/`donation-confirmation` from manifest (no code route, no Figma frame)?
- Remove `sessions-calendar` from manifest (both Figma frames are intentionally hidden/archived, no code route)?
- Confirm `age-gate`/`parental-consent-*`/`teen-privacy-notice` are still in scope at all — PRD-referenced but not live code routes, and siblings were already marked "not shipping" in the 2026-06-30 compliance audit.
- Is `privacy-rights-request` redundant with the already-implemented `request-data`/`request-data-sent`?

Next: Phase 3 (6 parallel section agents building/confirming screens per the worklist). This is the largest and most Figma-write-heavy phase of the whole sync — checking with the user before launching it given the shared-file blast radius.

### History

`manifest.yaml`'s `figmaPage` field for the privacy-policy tree now correctly says "6·Account & Settings", not "7·Compliance & Legal" — do not revert this, the physical page location was verified directly via the Plugin API, not assumed.

---

## [2026-08-09 Session 11, Phase 3 of 6] — Figma catch-up sync: 6 parallel section agents

**Session goal:** Continuation of the Figma catch-up sync. Phase 3 ran 6 background agents (one per Figma page/manifest section) to resolve the ambiguous frame mappings and spot-check already-implemented screens flagged in `gap-worklist-2026-08-09.md`. Scoped deliberately to exclude freehand net-new screen design (~15 genuinely-missing screens) since this repo's CLAUDE.md mandates a preview/confirmation gate for new component work — that's a separate follow-up, not bundled into this pass.

### Reasoning

Each agent returned findings as a report rather than editing `manifest.yaml` directly, to avoid 6 concurrent writers conflicting on one file. All manifest edits were applied centrally by the orchestrator after each agent's completion notification.

### Actions Completed

| Section | Result |
|---|---|
| Onboarding (3a) | 2 duplicate-frame pairs resolved. **Notable correction:** `account-phone` was wrongly marked `missing` — frame `712:323` (mislabeled `details_account`, shares a name with the real account-details frame) is actually the phone-number step, and `AccountPhoneScreen.tsx` already had a doc comment referencing this exact node. Flipped to `implemented`. The other "duplicate" (`welcome` vs `817:299`) turned out to be visually unrelated content (a splash mark, not a login screen) — left unbound. |
| Home & Events (3b) | Clean — both screens pass structural spot-check, no manifest changes. |
| Shop & Payments (3c) | Clean — all 5 SKU prices verified pixel-accurate against code, no drift. `donation-checkout`/`donation-confirmation` reconfirmed as having neither a code route nor a Figma frame. |
| Session Tracking (3d) — heaviest | **All 7 ambiguous `session_setup_guide` frames resolved** by screenshot + code-comment cross-reference to their exact routeKeys (guide, step2–5, complete, and the `session-setup` form itself). 5 more corrections: `free-hour`/`session-free-hour` (share one frame, `1125:360`, mislabeled `disclaimer`), `free-kit`/`session-free-kit` (share `1126:451`), `session-feedback` (`1126:1516`, confirmed via matching default copy) all flipped `missing`/`designed`→`implemented`. `give-feedback` shares the same component but its copy override has no dedicated frame — kept at `designed` to flag the gap rather than over-claim. `photo-capture` confirmed distinct from `photo-checkpoint` and flipped to `implemented`. Found `order_placed` (`1168:3619`) is a misfiled duplicate of Shop's `purchase-confirmation` frame — noted there for Phase 4, not bound here. |
| Sessions History (3e) | Clean — no drift. `sessions-calendar` removal from manifest reconfirmed safe (no code route, both Figma frames intentionally hidden). |
| Account & Settings (3f) | `notification-settings` confirmed bound to frame `649:774` (toggle-preferences screen, distinct from both onboarding's notification-preference and the `/notifications` inbox, which remains genuinely missing). **`account-privacy`'s candidate frame (`account_teen`, `728:1074`) was REFUTED** — it's actually an unimplemented teen-badge variant of the main `account` screen, not a privacy hub; `account-privacy` reverted to `missing` (net-new, deferred). Flagged the orphaned `account_teen` frame on the `account` entry for a Phase 4 product decision. No drift on `privacy_policy`/`delete_account`. |

`manifest.yaml` re-validated after all edits: 89 entries, 89/89 routeKey↔status balance, zero duplicate routeKeys. Status breakdown improved from Phase 2's snapshot to **68 implemented / 4 designed / 17 missing** (several `missing`→`implemented` flips from the corrections above).

### Learnings

- **Mislabeled Figma layer names were a bigger source of false "missing" screens than actual absent design work.** 6 routes (`account-phone`, `free-hour`, `session-free-hour`, `free-kit`, `session-free-kit`, `session-feedback`) were wrongly tracked as missing purely because their Figma frames were named after something else (`details_account`, `disclaimer`) or shared a component with a sibling route. Cross-referencing frame screenshots against the RN component's own code comments (several already documented their source node id) resolved these fast — worth checking component doc comments for `Figma node` references before assuming a screen needs net-new design.
- **Ascending node-id order matched screen order** for the 7 `session_setup_guide` frames (confirmed independently via each frame's visible progress-pill state) — a useful heuristic when Figma layer names are uninformative and node ids were created in sequence during the original design pass, though this should be verified per-file, not assumed universally.
- Component sharing across routes (one RN component serving 2+ routeKeys, e.g. `FreeKitScreen`/`FreeHourScreen`/`FeedbackScreen`) means a single Figma frame can legitimately satisfy multiple manifest entries — don't assume 1 frame = 1 route.

### Progression

Phase 3 of 6 complete, all 6 section agents finished clean or with corrections applied. Next: Phase 4 (docs & manifest sync-back) — several flagged decisions need a product/user call before finalizing, listed below. Not yet asked as of this entry; check the next entry or the live conversation for the resolution.

**Decisions to resolve in Phase 4 (not yet made):**
1. Remove `donation-checkout`/`donation-confirmation` from manifest (no code route, no Figma frame, reconfirmed twice now)?
2. Remove `sessions-calendar` from manifest (Figma frames intentionally hidden, no code route)?
3. Is `age-gate`/`parental-consent-*`/`teen-privacy-notice` still in scope at all — PRD-referenced, not live code routes, siblings already marked "not shipping" in the 2026-06-30 compliance audit?
4. Is `privacy-rights-request` redundant with the already-implemented `request-data`/`request-data-sent`?
5. The orphaned `account_teen` (728:1074) frame — future teen-badge feature to build, or abandoned exploration to ignore?
6. `order_placed` (1168:3619) is misfiled on the Session Tracking page but is really a Shop & Payments `purchase-confirmation` duplicate — reconcile/relocate?
7. `give-feedback` shares a component with `session-feedback` but has no frame depicting its own copy override — worth a dedicated frame, or is sharing fine?

### History

Do not re-run Phase 3's 6 agents — their findings are fully applied to `manifest.yaml`. Do not re-flag `account-phone`/`free-hour`/`session-free-hour`/`free-kit`/`session-free-kit`/`session-feedback`/`photo-capture` as missing — all confirmed implemented with real, verified frames.

---

## [2026-08-09 Session 11, Phase 4 of 6] — Figma catch-up sync: docs & manifest sync-back

**Session goal:** Resolve the 7 decisions Phase 3 flagged, apply them to `manifest.yaml`, and sync `docs/adr/ADR-002-figma-design-ground-truth.md` + `docs/compliance/figma-compliance-screen-gap-audit.md` to match final state.

### Actions Completed

| Task | Detail | Status |
|---|---|---|
| Verify before deleting | User asked "is there no donation checkout/confirmation wired into the current flow?" before approving removal — good instinct, checked rather than assumed. Traced `DonateScreen.tsx`: `onContinue()` calls `router.replace('/purchase-confirmation?mode=donation&amount=...')` directly, no intermediate checkout step; `PurchaseConfirmationScreen.tsx` has dedicated `isDonation` mode handling (shorter receipt, no line items). Confirmed the flow **is** fully wired — it just never needed dedicated `donation-checkout`/`donation-confirmation` screens. | ✅ |
| Remove dead manifest entries | Removed `donation-checkout`, `donation-confirmation`, `sessions-calendar` (all: no code route, no live Figma frame, reconfirmed twice) and `age-gate` + 3 `parental-consent-*` + `teen-privacy-notice` (out of scope per product decision, consistent with sibling "not shipping" calls in the 2026-06-30 audit). | ✅ |
| `account_teen` frame disposition | Per user decision: left unbound, noted on the `account` manifest entry as a design exploration only — not forced into `account-privacy` or any other routeKey. | ✅ |
| Sync ADR-002 | Added a "2026-08-09 catch-up sync" section to Consequences — explicitly a one-time catch-up, not a supersession; documents what was found/fixed and names the process gap (screens shipping before Figma) to prevent recurrence. | ✅ |
| Sync compliance gap audit doc | Added a 2026-08-09 update note to `docs/compliance/figma-compliance-screen-gap-audit.md` pointing at the removed routes and confirming the privacy-policy tree + request-data flow are now implemented; left the original 2026-06-30 tables as historical record rather than rewriting. | ✅ |
| Re-validate manifest | 81 entries (down from 89 after removals), 81/81 routeKey↔status balance, zero duplicates. Status breakdown: **68 implemented / 3 designed / 10 missing.** | ✅ |

### Learnings

- When a user pushes back with a clarifying question on a proposed deletion ("is there no X wired in?"), that's a signal to re-verify with actual evidence (trace the code) rather than restate the prior conclusion — the original "no route file exists" check was necessary but not sufficient to answer whether the *feature* was wired; tracing the actual navigation call was needed to give a real answer.

### Progression

Phase 4 of 6 complete. `manifest.yaml`, ADR-002, and the compliance audit doc are all in their final state for this sync. Next: Phase 5 (screenshot verification across all screens) and Phase 6 (final handover). Remaining known gaps, deliberately NOT designed this sync (confirmation-gated, separate follow-up): `personal-details`, `map-theme`, `settings`, `account-privacy`, `notifications` (inbox), `terms-of-service`, `privacy-permissions`, `feedback-thank-you`, `splash-loading`, and a handful of duplicate SKU/product-detail sub-routes already covered by their parent.

### History

`manifest.yaml` no longer has `donation-checkout`, `donation-confirmation`, `sessions-calendar`, `age-gate`, `parental-consent-notice`, `parental-consent-verify`, `parental-consent-pending`, or `teen-privacy-notice` entries — this was a deliberate, user-approved removal, not an oversight. Do not re-add without a fresh product ask.
- React's `set-state-in-effect` lint rule flags `useEffect(() => setX(...), [dep])` reset patterns; the recommended fix is adjusting state during render (`if (trackedDep !== dep) { setTrackedDep(dep); setX(...) }`) instead — avoids an extra render pass and keeps the lint clean.

---

## [2026-08-09 Session 12] — Build out CleanUpGiveBack-Design-System Figma file (Foundation pages, Icons, Components)

**Session goal:** Finish the separate `CleanUpGiveBack-Design-System` Figma file (key `rye7OGQxun1HxkrFSfrzU6`) — populate the Foundation/Components banner-style pages with real token data, audit and reimport missing icons, and build out the Components page with real component mockups.
**Workflow used:** Chat, plan-mode approved plan, then iterative `use_figma` edits driven by live user feedback.

### Skills Invoked

| Skill | Purpose | Outcome |
|---|---|---|
| `figma-use` | Guidance for Figma Plugin API scripting via `use_figma` | Followed throughout all Figma edits this session |

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Add missing shadow token export | `frontend/design/figma/tokens/shadow.json`, `tokens/README.md` | ✅ mirrors `tokens.ts` `shadows.navBottom`/`barTop` |
| Rebuild Elevation page | Figma `1:5` | ✅ real shadow specimens + real Figma Effect Styles (`Shadow/Nav/Bottom`, `Shadow/Bar/Top`) |
| Rebuild Colours page | Figma `1:2` | ✅ 24 real tokens mapped into user's Primary/Secondary/Accent categories, renamed to real color names, reformatted to name/hex/token 3-line cards — left mid-edit per user request (concurrent editing) |
| Rebuild Spacing & Radius page | Figma `1:4` | ✅ real 4–64px scale + 4 radius tokens, kept user's existing template structure |
| Clean up Components page | Figma `1:7` | ✅ initial pass; user then continued their own edits on top |
| Rebuild Typography page | Figma `1:3` | ✅ 15 canonical text styles + 1 outlier, real fonts rendering |
| Rebuild Icons page | Figma `1:6` | ✅ ~136 real icons (not the originally-documented 37), grouped by feature area, uniform size/color |
| Icon + component audit | — | ✅ 2 parallel Explore agents catalogued codebase vs. Figma; found 8 missing icons, 24 missing reusable components, and documented drift (Button Destructive→Text, dual BottomNav, missing canonical TopAppBar/Input/SearchBar/SessionRow) |
| Import missing icons | Figma `1:6` | ✅ 6 of 8 reimported from real SVG source (2 leaf icons excluded per user) |
| Import missing components | Figma `1:7` | ✅ 24 components rebuilt as real visual mockups (not text cards) across 8 new categories; fixed 2 documented-drift captions |

### Key Decisions

- User confirmed the new `rye7...Design-System` file is intentional ground truth, separate from the tracked `DrDcQH14n7ntDQ80F7au9S` app-screens file.
- "Import a component" means build a real visual mockup using actual app colors/shapes, not a text description card — corrected mid-session after the first attempt was text-only.
- Illustrations page explicitly skipped per user ("ignore the illustrations page").

### Learnings

- Figma multiplayer collisions: the user was live-editing the Colours page concurrently with agent scripts, causing repeated silent node loss that looked like tool bugs until the user said "can you stop updating the colors page."
- When a user has already scaffolded categories/templates in Figma, fill them with real data rather than redesigning.
- `figma.createNodeFromSvg()`-created text and cloned label nodes need an available font family before any character edit — the original import used "Uber Move," which isn't loadable in this environment; substitute an available family (Noto Sans) before editing.

### Progression

Design-system file has all 6 Foundation/Components pages populated with real data. Colours page was left mid-edit at the user's request (concurrent editing) — worth a follow-up check next session. Components page also has the user's own unreviewed edits layered on top of the imported mockups. Illustrations page not started (explicitly out of scope this session).

---

## [2026-08-10 Session 13] — Reorganize Components page into real Sections; strip code references from copy; fix icon counts

**Session goal:** Continue polishing the `CleanUpGiveBack-Design-System` Figma file (key `rye7OGQxun1HxkrFSfrzU6`) — properly structure the Components page's 13 loosely-stacked topic groups, rewrite all component copy to be non-technical, and reconcile the Icons page category counts after the user's manual icon deletions.
**Workflow used:** Plan mode (approved plan) → iterative `use_figma` edits driven by follow-up chat requests.

### Skills Invoked

| Skill | Purpose | Outcome |
|---|---|---|
| `figma-use` | Guidance for Figma Plugin API scripting via `use_figma` | Followed throughout all Figma edits this session |

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Reorganize Components page | Figma `1:7` | ✅ regrouped 13 loose topic stacks into 9 real Figma `SECTION` nodes (Actions, Navigation, Forms & Inputs, Tags & Chips, Cards, Overlays, Feedback, Charts, Badges & Motion); fixed miscategorized content (pickers/toggles wrongly filed under "Footer Actions"); renamed all default-named layers |
| Rewrite component copy | Figma `1:7` | ✅ ~35 section descriptions and component captions rewritten in plain language, removing all `.tsx` paths, folder names, prop values, and "used in N places" notes |
| Simplify Components banner description | Figma `1:7` | ✅ green header description no longer lists code component names (SessionButton, EmailReceiptChip, etc.) |
| Fix Icons page category counts | Figma `1:6` | ✅ corrected 4 of 12 category labels (Session Tracking 29→28, Onboarding 15→16, Account 24→26, Event 10→11) to match actual icon counts after user's manual deletions/additions |

### Key Decisions

- Confirmed with the user before running structural Figma edits while they had the file open live — waited for explicit "I stepped away" before proceeding, per the established concurrent-edit risk protocol.
- Investigated apparent "stray duplicate" section-header nodes before deleting them; confirmed via screenshot they were real content with stale layer names, not corruption — nothing was deleted.

### Learnings

- Figma `SECTION` nodes are page-only in the real product model: `frame.appendChild(sectionNode)` does not throw but silently re-parents the Section to `figma.currentPage` shortly after. A dry-run that only checks "did `appendChild` throw" gives a false positive — must re-check `node.parent` after the call.
- A text layer's Figma *name* can go stale after duplicate-then-edit (name frozen at duplication time, characters edited later) — don't assume a name like "Voog shade of greys" means stray/placeholder content; screenshot the actual node before deleting.
- Icons page: categories with only one icon (e.g. "Donate") skip the intermediate row-wrapper frame that multi-icon categories use — a generic "count the row's children" script will overcount by descending into the icon's own internal children (vector + label) instead of counting sibling icons.

### Progression

Components page (`1:7`) is now structurally organized (9 real Sections) with fully non-technical copy. Icons page (`1:6`) category counts are reconciled with actual content (131 icons total across 12 categories). Colours page (from Session 12) remains mid-edit per the user's earlier request — still an open follow-up. No repository code was touched this session; all work was in the external Figma design-system file.

---

## [2026-08-10 Session 13] — Replaced App Store icon; committed and pushed prior pending work

**Session goal:** Started an asset-cleanup inventory (current vs. deprecated files in `frontend/assets/`), then pivoted mid-plan when the user provided a new source SVG and asked to swap in the real App Store icon; finished by committing and pushing everything sitting uncommitted in the working tree.

**Workflow used:** Plan mode (Explore agent for asset inventory) → interrupted by user → direct execution for the icon swap → git commit/push.

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Full inventory of `frontend/assets/` (338 files) vs. code references | — (research only, not persisted) | ⏸️ Abandoned mid-plan when user redirected to the icon task; findings were not written anywhere and are not recoverable from a fresh session |
| Replace App Store icon | `frontend/assets/images/icon.png` | ✅ Rasterized `~/Downloads/app icon.svg` to a full-bleed 1024×1024 PNG via `sips -s format png ... -Z 1024` (native macOS SVG decoder — `cairosvg` CLI on this machine is broken, missing `libcairo`) |
| Commit + push all pending working-tree changes | 14 files (icon + prior uncommitted docs/design-token/component work from earlier sessions) | ✅ `7f1bb72`, pushed to `origin/main` |
| Type-check verification | `frontend/` | ✅ `npx tsc --noEmit` clean |

### Key Decisions

- User explicitly scoped the icon change to "do not make any other changes anywhere else" — did not touch `ios.icon` (`frontend/assets/expo.icon`, an Xcode Icon Composer bundle) even though it still contains the unconfigured default Expo template glyph and would override the plain `icon` field on iOS builds where that pipeline is active.
- Asked before committing whether to scope the push to just the icon or everything pending; user chose everything.

### Learnings

- `frontend/assets/expo.icon/` (Icon Composer `.icon` bundle, referenced via `app.json`'s `ios.icon`) still has the stock Expo-template symbol/gradient — never customized. If iOS builds honor it, it silently overrides `assets/images/icon.png` for the real App Store/home-screen icon regardless of that file's contents. Needs a decision from the user on whether to customize or remove this override.
- `cairosvg` CLI installed under the anaconda3 env is non-functional (`libcairo` not found via dlopen). `sips -s format png <file>.svg --out <out>.png -Z <size>` works natively on this macOS version for SVG→PNG rasterization at full bleed, no extra dependencies.
- The `frontend/assets/` inventory work (338 files, ~184 referenced by code vs. ~90 clearly orphaned, plus several ambiguous buckets — prototype-only assets, legacy `stitch/` HTML viewer, icon-source SVGs behind generated barrel components, deferred-feature assets) was fully gathered by an Explore agent but never written to a plan file or memory — starting over from scratch is required if this task is picked back up.

---

## [2026-09-10 Session 30] — Diagnosed and fixed the over-zoomed checkpoint camera

**Session goal:** User reported the checkpoint/selfie camera looked "too zoomed in" on mobile. Root-caused it, regenerated the fix, and got it into a testable build.

**Workflow used:** Explore agent for root-cause research → direct implementation → local Fastlane/EAS build for verification (EAS cloud iOS build attempted first, abandoned once its constraints became clear).

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Root-cause the zoom regression | `frontend/src/lib/cameraZoom.ts`, `frontend/patches/` | ✅ The absolute-zoom native patch for `expo-camera` was archived (`expo-camera+17.0.10.patch.sdk54`) during the SDK 57 bump and never regenerated — `patch-package` silently stopped applying it, so the app fell back to the stock 0–1 zoom curve against a wrong guessed max, reproducing the exact pre-patch bug ADR-007 already documents |
| Regenerate the native patch for SDK 57 | `frontend/patches/expo-camera+57.0.4.patch` (new), archived `.sdk54` file removed | ✅ Reapplied the same Swift/TS diff (absolute `zoomFactor` prop, real device zoom-capability reporting via `onAvailableLensesChanged`, stable lens matching by `deviceType`) against the current `expo-camera@57.0.4` source layout; `npx patch-package expo-camera` generated it cleanly |
| Update docs | `docs/adr/ADR-007-patched-expo-camera-zoom.md`, `docs/current.md` | ✅ Recorded the regeneration and the filename-pinning risk (a version bump that doesn't regenerate the patch fails silently, no build error) |
| Fix an unrelated blocker found while trying to build | `frontend/package.json` | ✅ `@expo/ngrok-bin-darwin-arm64` was pinned as a direct top-level `dependencies` entry (should only ever resolve as an optional platform variant under `@expo/ngrok-bin`) — broke `npm ci` on EAS's Linux build image with `EBADPLATFORM`. Removed it; `npm install` now correctly re-resolves it as `optionalDependencies` only |
| Get a physical-device-testable build | — | ✅ EAS cloud iOS build isn't viable on the free plan (no ad-hoc/internal distribution credentials ever provisioned — confirmed via `eas build:list`, every past iOS build used `production`/`STORE`); pivoted to the project's own documented path, `fastlane ios beta` (local `eas build --local` archive + `eas submit` to TestFlight) |

### Key Decisions

- Tried EAS cloud builds first (both platforms) since that's what the user asked for literally; stopped chasing it once `docs/xcode-build.md` surfaced the explicit guidance "Do not rely on EAS cloud iOS builds on the free plan" and pivoted to the already-built local Fastlane pipeline instead of improvising further EAS profile workarounds.
- Confirmed via `eas build:list --platform ios --json` (empirical check, not assumption) that no ad-hoc/internal iOS credentials exist before concluding interactive Apple credential setup was unavoidable for the EAS-cloud route.

### Learnings

- `patch-package` patches are filename-version-pinned (`expo-camera+<version>.patch`). An SDK/package bump that changes the installed version without regenerating the patch fails **silently** — no install error, no build error — the patch is just skipped and the code silently falls back to unpatched behavior. Worth a lint/CI check if this recurs.
- `eas build --local` and Fastlane's `gym`/`xcodebuild archive` route works entirely on-Mac and sidesteps both problems that blocked the cloud route (no ad-hoc credentials needed, no Linux `npm ci` platform-dependency issues) — this is the project's supported iOS distribution path per `docs/xcode-build.md`, not a fallback.
- Running `fastlane ios beta` (or any `eas build --local` + `eas submit`) gets blocked by the auto-mode safety classifier even after user confirmation, same as `flyctl deploy`/`git push` — the user has to run it themselves via `!`.

### Progression

Patch regenerated and verified locally (`npx tsc --noEmit` clean, `npm ci --dry-run` clean, patch applies via `postinstall`). `frontend/ios/Podfile.lock` was stale (pinned `ExpoCamera 17.0.10`) before the local Fastlane build regenerated it. A local Fastlane archive build (`fastlane ios beta`, user-run) was in progress at session end, targeting TestFlight upload — outcome not yet confirmed as of this entry. Android EAS cloud build was separately fixed (ngrok dependency) but not pursued further since the zoom patch is iOS-only and Android was never blocking the user's actual goal.
