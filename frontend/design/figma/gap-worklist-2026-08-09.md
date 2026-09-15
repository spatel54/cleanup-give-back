# Figma Gap Worklist — 2026-08-09 Catch-Up Sync (Phase 2 output)

Source: full frame-level inventory of all 6 Figma content pages (via Plugin API `figma.root.children` walk, since the remote `get_metadata` top-level listing only surfaces the Design System page for this file) cross-referenced against all 71 routes in `frontend/src/app/`. See `manifest.yaml` for the authoritative per-route record — this doc is the actionable worklist derived from it, grouped by Phase 3 section agent.

**Do not re-derive scope.** Each Phase 3 agent should work its list below, not re-walk the whole file.

## Onboarding (Phase 3a)

| Task | routeKey(s) | Detail |
|---|---|---|
| Screenshot-compare duplicate frames | welcome | Frame `817:299` (also named `welcome`) is untracked — compare against canonical `112:6776`; if it's a newer iteration, retarget the manifest node; if older, mark legacy. |
| Screenshot-compare duplicate frames | account-details | Frame `712:323` (also named `details_account`) is untracked — same treatment as above vs. canonical `112:6882`. |
| Net-new design | account-phone | No frame anywhere in the file. Build from scratch against current `frontend/src/app/account-phone.tsx`. |
| Net-new design | personal-details | No frame anywhere in the file. Build from scratch against current `frontend/src/app/personal-details.tsx`. |
| Net-new design | splash-loading | Already flagged stale/missing since 2026-07-13; still absent. |

Everything else in Onboarding (14 routes) is confirmed `implemented` with unchanged node IDs — spot-check for visual drift only, don't rebuild.

## Home & Events (Phase 3b)

Both routes (`home`, `event-detail`) confirmed implemented with correct nodes. `home`'s status was corrected from `designed`→`implemented` in Phase 2 (it's the live router HomeScreen). No net-new work — spot-check for drift only.

## Shop & Payments (Phase 3c)

All 10 shop/checkout/donate routes confirmed implemented with correct nodes — spot-check for drift only.

| Task | Detail |
|---|---|
| Manifest cleanup decision | `donation-checkout` and `donation-confirmation` have no code route (not in the 71) and no Figma frame. Confirm with product whether to delete these two manifest entries or whether they represent unbuilt intent — do not silently delete without flagging in Phase 4. |

## Session Tracking (Phase 3d) — heaviest section

| Task | routeKey(s) | Detail |
|---|---|---|
| **Resolve 7 ambiguous frames** | `session-setup-guide`, `session-setup`, `session-setup-step2`, `-step3`, `-step4`, `-step5`, `session-setup-complete` | 7 Figma frames all literally named `session_setup_guide`: `229:189`, `229:272`, `229:351`, `249:369`, `249:387`, `251:405`, `260:1312`. Screenshot each (`get_screenshot`), compare against the running app screens for these 7 routes (use Expo Go/simulator), and bind each node id to its routeKey in `manifest.yaml`. Do NOT touch `251:439` — that one is confirmed `live-session` despite the same layer name (it has Map + Main Container children). |
| Confirm candidate | `photo-capture` | Frame `383:239` (named `photo_checkpoint`, children BottomSheet + Take Photo) is a plausible match — distinct from canonical `photo-checkpoint` at `364:115`. Screenshot-confirm before binding as `implemented`. |
| Confirm candidate | `free-kit` | Frame `1126:451` (`free_kit`) — strong name match, needs visual confirm only. |
| Confirm candidate | `free-trial-done` | Frame `1141:2178` (`free_trial_done`) — strong name match, needs visual confirm only. |
| Confirm candidate | `session-feedback` and/or `give-feedback` | Frame `1126:1516` (`feedback_screen`) — determine whether this single frame serves one or both routes (they may share a component with different entry points). |
| Investigate candidates | `free-hour`, `session-free-hour`, `session-free-kit` | Frames `disclaimer` (`1125:360`) and `order_placed` (`1168:3619`) exist nearby with unclear purpose — screenshot both and check against the 3 routes' actual RN implementations before assigning. `session-free-kit` may turn out to share the `free-kit` frame (1126:451) rather than needing its own. |
| Net-new design | `map-theme` | No candidate frame anywhere. Build from scratch against `docs/frontend/specs/map-theme-and-weather-icons.md` and current implementation. |

## Sessions History (Phase 3e)

| Task | Detail |
|---|---|
| Spot-check only | `sessions-list`, `session-detail` confirmed implemented with correct nodes. |
| Manifest cleanup decision | `sessions-calendar` — both candidate frames (`88:123`, `93:2`) are marked `hidden` in Figma (intentionally archived) and there is no live route for it in `frontend/src/app/`. Recommend removing from manifest in Phase 4 unless product wants the feature revived. |

## Account & Settings (Phase 3f)

| Task | routeKey(s) | Detail |
|---|---|---|
| Screenshot-confirm | `notification-settings` | Frame `notifications` (`649:774`, has "Notification Categories" child) is a strong match for the toggle-preferences screen — confirm before binding. |
| Investigate | `notifications` | The actual notification center/inbox route (distinct from `notification-settings` above) has no frame at all — confirm nothing else in the file matches before declaring net-new design needed. |
| Screenshot-confirm | `account-privacy` | Frame `account_teen` (`728:1074`) is nearby but the name doesn't obviously match "privacy hub" — could be a teen-specific variant instead. Compare against `frontend/src/app/account-privacy.tsx` before binding; if it doesn't match, this route still needs net-new design (it was previously "NODE RETIRED" as of the 2026-07-10 audit). |
| Cross-check | `teen-privacy-notice` | If `account_teen` (728:1074) turns out NOT to be `account-privacy`, check whether it's this instead (not shipping per product decision, but worth confirming the frame's actual purpose rather than leaving it fully unassigned). |
| Net-new design | `settings`, `privacy-permissions`, `terms-of-service`, `privacy-rights-request`, `age-gate`, `parental-consent-*` (3 routes), `feedback-thank-you` | Confirmed absent anywhere in the file. Note: `parental-consent-*` and `age-gate` are PRD-referenced but NOT live routes in `frontend/src/app/` — confirm with product whether these are still in scope before designing, since several sibling flows were explicitly marked "not shipping" in the 2026-06-30 compliance gap audit. |
| Reconcile | `privacy-rights-request` vs `request-data`/`request-data-sent` | `request-data` and `request-data-sent` are already implemented and may fully cover the intent of `privacy-rights-request` — Phase 4 to decide whether the latter is a redundant manifest entry. |

Privacy policy tree (`privacy-policy` + 4 sub-pages) confirmed implemented with correct nodes — **note the manifest `figmaPage` field was corrected**: these physically live on the Account & Settings page (`77:7`), not a separate "Compliance & Legal" page (that page no longer exists in the file — see manifest header note).

## Cross-cutting notes for all Phase 3 agents

- The file has exactly 6 content pages, not 7: `1·Onboarding` (`77:2`), `2·Home & Events` (`77:3`), `3·Shop & Payments` (`77:4`), `4·Session Tracking` (`77:5`), `5·Sessions History` (`77:6`), `6·Account & Settings` (`77:7`). Don't look for a 7th page.
- Two pages are explicitly off-limits: `1269:102` "App Store Screenshots (DO NOT TOUCH)" and `1:2` "Archived Design + Research (DO NOT VIEW)" — respect these in-file annotations, don't open or reference them.
- When screenshotting for comparison, use `get_screenshot` (remote, no desktop dependency) — reserve `use_figma` for actual writes.
- After binding a `NEEDS-VISUAL-VERIFICATION` node in `manifest.yaml`, replace the placeholder with the real node id and update `status` to `implemented` (or `designed` if the frame exists but isn't yet visually verified as final).
