# Spec: Mobile empty states

**Date:** 2026-08-16  
**Status:** Implemented  
**Routes:** `/`, `/approval-history`, `/session-detail`, `/event-detail`, `/export-service-record`, `/shop`, `/letters`

## Summary

Shared `EmptyState` cards cover first-time Home, empty lists, missing records, and export filters that match zero sessions. Tracking starts from the center Track button or a **Log session?** CTA to `/session-setup-guide`.

## User stories

- As a **new volunteer**, I want Home to explain how to start tracking, so I am not looking at a blank chart with no next step.
- As a **volunteer**, I want Approval History and export filters to say when nothing matches, so I know whether to log a session or widen filters.
- As a **volunteer**, I want a recovery path when a session or event cannot be loaded, so I am not stuck on a dead screen.

## Acceptance criteria

- [x] **AC-1:** Home Service Hours with **0 lifetime hours** shows “No service hours yet”, explains the center Track button, keeps the zero chart as a preview, and offers **Log session?**
- [x] **AC-2:** Home Your Impact photo feed uses `EmptyState` with **Log session?** when empty. Home does not show a Recent Sessions list.
- [x] **AC-3:** Home Upcoming Events stays visible when empty (does not hide the section) and uses `EmptyState`. Live Home no longer falls back to mock events when none are published.
- [x] **AC-4:** Approval History loads real sessions (API + local stats). Empty list shows `EmptyState` + **Log session?**
- [x] **AC-5:** Session detail errors and Event detail unknown/unpublished ids show `EmptyState` with a recovery CTA (sessions list / Home). Event detail does not substitute a default mock event.
- [x] **AC-6:** Download Service Record counts matching **approved** sessions for the date range; zero approved anywhere shows **No approved sessions to download.** (entry alert or empty state). Zero matches in the chosen range disables Download and offers **Reset filters**.
- [x] **AC-7:** Shop category-empty, Events View All catalog-empty, and session photos-empty use the shared `EmptyState` card.
- [x] **AC-8:** Letters empty library shows **No letters downloaded** with a Download a letter CTA. Search-no-match keeps **No letters match your search.**

## Out of scope

- Notification inbox (settings toggles only)
- Stacked approval-status Home chart (still deferred)

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `EmptyState` | Shared title / body / CTA card |
| `sessionStatsStore` | Lifetime hours + export match count |
| `listSessions` | Approval History live rows |

## Test plan

1. New account Home → Service Hours / Impact / Upcoming Events empty cards; **Log session?** opens the setup guide.
2. Approval History with no sessions → empty card; after a session, stats + cards appear.
3. Open `/session-detail?id=missing` and `/event-detail?id=missing` → recovery empty cards.
4. Export with no sessions or a date range that excludes them → Export disabled + CTA.
5. Shop filter with no products → **View all** resets to All.
