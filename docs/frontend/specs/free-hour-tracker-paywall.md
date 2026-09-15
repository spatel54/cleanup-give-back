# Spec: Free-hour tracker paywall

## Summary

Unpaid volunteers get **one orientation hour** of live tracking (`FREE_TRIAL_DURATION_SECONDS` = 3600). The live tracker shows an orientation subtitle. There is **no Skip orientation** button. **End Session** (after session-end dual capture) logs a **full 1-hour approved free hour** even if they stop early, opens **session details**, and **consumes** the orientation trial. Hour expiry does **not** open a paywall — they keep tracking until End Session (still credited as 1 approved hour). **Pre-track `/tracker-paywall` is currently hidden** — Track / Start Tracking / Start Session go straight to session setup (`needsTrackerPaymentBeforeTrack` always returns false). The route + `FreeTrialModal` remain in the codebase for later re-enable.

## User stories

- As an unpaid volunteer, I want a clear orientation countdown on the live tracker, so I know when I must pay to redeem the hour.
- As an unpaid volunteer, I want End Session to log my free orientation hour as approved and open session details, so I do not wait for review or see a paywall mid-session.
- As a volunteer who already used orientation, I want Track to open session setup without a paywall (pre-track paywall hidden for now).

## Acceptance criteria

- [~] **AC-1 (removed):** Live tracker no longer shows the orientation countdown `MM:SS` or the amber **Orientation hour** callout pill under the timer — the orientation-hour clock still runs internally (`getFreeTrialSecondsRemaining`, `orientationTrialConsumed`), it is just not surfaced in the timer card. Timer card now always shows elapsed time + Distance only.
- [x] **AC-2:** Reaching `elapsedSeconds >= FREE_TRIAL_DURATION_SECONDS` does **not** open a paywall. The countdown stays at `00:00` until End Session.
- [x] **AC-3:** Hour expiry does not play a paywall alert or navigate away from the live tracker.
- [x] **AC-4:** **Pay now** on `/tracker-paywall` `replace`s → `/checkout?mode=tracker` (no `returnTo=live-session`).
- [x] **AC-5:** **Pay Later** (and hardware back / swipe dismiss) on `/tracker-paywall` `dismissTo('/')` / `replace('/')`. No session is created. Home’s bottom nav highlights **Home** (not the tab the volunteer left from — Home hardcodes `activeTab="home"` because `/` stays mounted under Account/Shop/Sessions).
- [x] **AC-6:** Session detail sticky footer: outlined **Share Feedback**, then **Delete session** (when non-approved), then filled tertiary **Go Home** (no stroke); back chevron also goes Home.
- [x] **AC-7:** Paid / company-code upgrade (`markTrackerPaid`) does not open the paywall. (Free-hour countdown UI is no longer shown for unpaid sessions either, per AC-1.)
- [x] **AC-8:** Dev QA may shorten the hour via `EXPO_PUBLIC_FREE_TRIAL_SECONDS` in `__DEV__` only; production default remains 1 hour.
- [x] **AC-9:** Live tracker has **no Skip orientation** button. Unpaid **End Session** (after session-end dual capture) finalizes with `skipOrientation: true`: status `approved`, duration **3600s**, then opens `/session-detail`.
- [x] **AC-10:** `orientationTrialConsumed` persists (`@cugb/orientationTrialConsumed`) and is set on unpaid **End Session**. Paid `finalizeLiveSession` is unchanged (`under_review`).
- [~] **AC-11 (paused):** Pre-track paywall hidden — `needsTrackerPaymentBeforeTrack()` always returns `false`, so Track goes to session setup. `/tracker-paywall` + `FreeTrialModal` kept but unused. Re-enable by restoring `return !hasPaid` (and optional `__DEV__` `EXPO_PUBLIC_BYPASS_SECOND_TRACK_PAYWALL` bypass).
- [x] **AC-12:** Tracker checkout includes the cleanup kit by default; volunteer can **Remove** the kit line or use **Add free cleanup kit** to opt back in (**$59.99** either way; removed → `includesKit: false`, fulfillment hidden).
- [~] **AC-14 (removed):** Session Setup intro no longer shows the unpaid orientation note ("Your first hour is orientation…").
- [x] **AC-15:** `FreeHourScreen` (`/session-free-hour`, `/free-hour`) says you get one free hour of orientation, and that redeeming it means completing another session after paying for tracking. The phone graphic sits **below** the title/subtitle so it does not overlap the copy.

## Out of scope

- Real Stripe charge for tracker access (checkout UI is mock until payments backend ships)
- Requiring final selfie/progress photos before Pay Later (Pay Later no longer finalizes a session)
- Changing photo-checkpoint interval (independent of free-hour clock)

## Dependencies

- `frontend/src/features/session-tracking/trackerPaymentStore.ts`
- `frontend/src/app/tracker-paywall.tsx` + `FreeTrialModal`
- `frontend/src/utils/ensureTrackerAccess.ts`
- `frontend/src/screens/LiveSessionScreen.tsx`
- `frontend/src/screens/PhotoCaptureScreen.tsx`
- `frontend/src/features/figma-screens/screens/SessionDetailScreen.tsx`
- Figma `free_trial_done` (`1141:2178`)

## Test plan

1. Unpaid account → start live session → timer card shows elapsed time + Distance only (no orientation countdown/pill). No Skip orientation button.
2. End Session (end photos) → session details, **approved** for **1 hour**; next unpaid Track opens session setup (no `/tracker-paywall`).
3. Let the hour countdown hit `00:00` — no paywall; End Session still logs the approved hour.
4. Pre-track **Pay Later** / back → Home, no session created; Home tab is highlighted.
5. Pre-track **Pay now** → checkout; kit toggle off → `$59.99`, `includesKit: false`.
6. Company code / paid flag → no orientation UI and no paywall.
7. Dev only: `EXPO_PUBLIC_FREE_TRIAL_SECONDS=10`.
8. Account → Membership **Pay $59.99** (unpaid) → checkout without starting a session; confirmation returns to Account.
