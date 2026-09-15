# Backend spec: hours-reminder email

**Date:** 2026-08-13  
**Status:** Implemented. Live HTML copy (logo + bell GIF only as images). Apply [`admin/db/021_hours_reminder_figma.sql`](../../../admin/db/021_hours_reminder_figma.sql) on Supabase if that stub body is not already on the `hours_reminder` row.  
**Design:** [Figma Nudge `1311:432`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1311-432)

## Summary

Daily Vercel cron (`GET /api/cron/send-hours-reminders`) nudges court-ordered volunteers who have not logged a session in 7–10 days. HTML is **code-owned** (`buildHoursReminderEmailHtml`) — the Emails-tab sanitizer strips tables/images. The DB row stores **subject** only (body is a stub).

**Placeholder-first:** Figma sample copy is the default (`Volunteer`, `XXX`). Real volunteer first name and completed hours replace a placeholder only when that field is present.

Lottie JSON does not play in Gmail/Outlook/Apple Mail. The Figma bell is a CUPGB-recolored `Bell.json` exported as an animated GIF with a **transparent** background (`https://admin.example.com/email/nudge-bell.gif`) so the header shows through in light and dark mode. Outlook typically shows the first frame.

**All copy is live HTML.** Hosted `@font-face` (Sanchez + Noto Sans) for Apple Mail; Gmail falls back to Georgia (body/CTA) and Trebuchet MS (hours/footer). Raster images are the white logo, bell GIF, and an 8×8 `#009540` header pixel. Body 16px laptop / 18px phone, white `#ffffff` on the green header. Support strip sits on cream `#fcf9f8` (`cream/50` / `color/bg/app`, not white). The header cell tiles `header-pixel.png` as `background` so Apple Mail does not invert that copy to dark-on-green; `color-scheme` / `supported-color-schemes` are `light only` for the same reason. Current hours is Noto Bold **white `#ffffff`** on a deep-green band (`#004d21`). **Open App** is primary `#009540` with a 2px `#004d21` stroke and white label (no lime/amber, including dark-mode overrides). Support contact is `support@example.org` — do not name Admin. Sends CID-inline the logo, header pixel, and bell GIF so Gmail shows them without “Display images.” Copy stays live HTML.

**Open App** href is `HOURS_REMINDER_OPEN_APP_URL` (`https://cleanupgiveback.org/` until an App Store URL exists). Sage footer is a full-width `#bdcaba` **row in the same outer table** as the card (`width/min-width: 100%`, `height: 100%` so leftover preview height is sage). Not a sibling table — Gmail hides a trailing signature table behind “…”. Hidden hours-line token. All copy uses **`letter-spacing: 0.02em`** (head `<style>` plus inline on every text cell/link), same token as Forgot Password and order emails.

## Trigger

Existing cron in [`admin-web-app/src/lib/hours-reminders.ts`](../../../admin-web-app/src/lib/hours-reminders.ts):

- Court-ordered volunteers only (`court_orders.user_id`)
- Idle 7–10 days since last non-active session (no session on record counts as idle)
- Dedup: skip if `email_log` already has `hours_reminder` in the last 7 days
- Skip mock / missing emails (`isMockAddress`)
- Push notification still fires independently when a push token exists, gated by `notification_preferences.sessionReviews` (explicit false skips inbox+push; email still sends). Cron also inserts a `volunteer_notifications` row (`type: hours_reminder`) before push. Apply [`admin/db/025_volunteer_notifications.sql`](../../../admin/db/025_volunteer_notifications.sql).

## Data model

No new columns. Completed hours match volunteer-profile `courtCompletedHours`: sum of `approved` + `court_ordered` session hours (`adjusted_hours` else `duration_seconds / 3600`) dated after `court_orders.hours_reset_at`.

## Acceptance criteria

- [x] AC-1: Cron still sends `hours_reminder` on the 7–10 day idle window with 7-day dedup
- [x] AC-2: Layout matches Figma structure (green header + bell + body + hours + Open App, support line, sage footer). Body and Open App are Sanchez (Georgia fallback); hours is Noto Sans Bold white `#ffffff` on a deep-green band (`#004d21`). CTA is primary `#009540` + `#004d21` stroke + white label. Support is `support@example.org`. All copy is live HTML with `letter-spacing: 0.02em`.
- [x] AC-3: Name and hours show Figma placeholders (`Volunteer`, `XXX`) when real data is missing
- [x] AC-4: Real first name and completed hours replace placeholders per-field when present
- [x] AC-5: Open App uses `HOURS_REMINDER_OPEN_APP_URL` (swap-later placeholder)
- [x] AC-6: Bell is a hosted GIF (not Lottie JSON) with CUPGB amber fills
- [x] AC-7: Hours reminder is not editable in the Emails tab (sanitizer would flatten the layout)

## Security & privacy

- Recipient is the volunteer directory email, never a client-supplied `to`
- HTML interpolations are escaped in `buildHoursReminderEmailHtml`
- Mock / missing emails skip send

## Test plan

1. `cd admin-web-app && npx tsx scripts/preview-hours-reminder-email.mts` — writes `tmp/hours-reminder-email.html` and asserts copy (no type PNGs)
2. `cd admin-web-app && npx tsx scripts/send-test-hours-reminder-email.mts --to=<inbox>` — live Resend (CID-inlines logo + header pixel + bell GIF)
3. `cd admin-web-app && npx tsc --noEmit`
4. Apply `admin/db/021_hours_reminder_figma.sql` on Supabase
5. Production asset: `https://admin.example.com/email/nudge-bell.gif` returns 200
