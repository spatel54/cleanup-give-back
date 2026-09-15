# Spec: Event calendar export

**Date:** 2026-07-18  
**Status:** Implemented  
**Route:** `/event-detail` (`EventDetailScreen`)

## Summary

**Add to calendar** on event detail opens a platform action sheet: iOS offers Apple Calendar and Google Calendar; Android offers Google Calendar and device calendar via `expo-calendar`.

## Acceptance criteria

- [x] **AC-1:** Tapping **Add to calendar** shows destination options (not a placeholder alert).
- [x] **AC-2:** Apple Calendar creates an event with title, location, notes, and start/end from `calendarStartIso` / `calendarEndIso`.
- [x] **AC-3:** Google Calendar opens the Google Calendar template URL with the same metadata.
- [x] **AC-4:** Native calendar write calls `Calendar.requestCalendarPermissionsAsync()` before create; permission denial shows a readable error alert.

## Test plan

1. Open `/event-detail?id=ev-1` on iOS → Add to calendar → Apple Calendar → event appears.
2. Same on Android → Google Calendar or device calendar.
