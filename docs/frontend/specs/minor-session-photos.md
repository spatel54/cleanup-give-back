# Spec: Session photos only for volunteers 18+

## Summary

Users under 13 stay blocked from the app (COPPA). Volunteers aged 13–17 can track GPS and hours, but cannot take session photos. Checkpoint camera (start, mid-session, end) is for **18 and older** only.

## User stories

- As a volunteer under 18, I want to log cleanup hours without taking pictures, so the app stays safer for minors.
- As a volunteer 18 or older, I want the full checkpoint photo flow, so sessions can be verified with selfie and progress photos.
- As Admin, I want teen sessions to still show a GPS route and duration, so hours can be reviewed without photo evidence.

## Acceptance criteria

- [x] **AC-1:** Age under 13 still blocks signup (`MINIMUM_APP_AGE`).
- [x] **AC-2:** Session photos (start / checkpoint / end) run only when birthday age is **≥ 18**.
- [x] **AC-3:** Under-18 **Start Session** skips `/photo-capture` and opens the live tracker.
- [x] **AC-4:** Under-18 live tracker hides checkpoint photo UI, Take Photo, and photo due alerts/notifications.
- [x] **AC-5:** Under-18 **End Session** finalizes without camera (same save overlay / confirmation as adults).
- [x] **AC-6:** Under-18 onboarding skips the camera-permission screen. Session setup does not require the Camera toggle.
- [x] **AC-7:** Birth month/year persist in `user_metadata` (`birth_month`, `birth_year`) and local onboarding store so the gate works after login.
- [x] **AC-8:** Missing birthday (legacy accounts) does **not** lock photos — only a known age under 18 disables them.

## Out of scope

- Changing the COPPA under-13 block
- Parental-consent photo unlock
- Disabling Account profile photo
- Facebook auth
- Admin UI for “teen / no photos” badge (GPS-only sessions still submit as today)

## Dependencies

- Onboarding birthday (MM/YYYY) on `/account-details`
- `liveSessionStore` photo checkpoints
- Supabase `user_metadata`

## Test plan

- Unit: age ≥ 18 eligible; age 13–17 ineligible; null birthday eligible
- Manual: 17-year-old signup → track without camera; 18-year-old keeps full photo flow
