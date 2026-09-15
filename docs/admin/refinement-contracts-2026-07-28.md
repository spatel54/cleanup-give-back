# Admin refinement contracts — 2026-07-28

Architecture decisions for the full admin refinement batch. App code uses `user.user_metadata.role === 'admin'`. RLS policies should check the same claim path (`auth.jwt() -> 'user_metadata' ->> 'role'`), not a top-level JWT `role`.

## Side effects

| Flow | Trigger | Side effect | Failure mode |
|------|---------|-------------|--------------|
| G9 Admin inbound | Fly finalize → `under_review` | Resend to `ADMIN_NOTIFY_EMAIL` | Log; do not fail finalize |
| G10 volunteer email | Admin approve/decline | Resend; include `decline_reason` when set | Log; do not roll back status |
| G10 volunteer push | Same | Expo Push via `user_metadata.push_token` | Log; skip if no token |
| Feedback | Mobile submit | `POST /feedback` → `volunteer_feedback` | Toast; allow thank-you nav |
| Court upsert | Admin form | `court_orders` upsert on `user_id` UNIQUE | Toast error |
| Order update | Admin form | `shop_orders` status/tracking/carrier + audit | Toast error |
| Letterhead | PDF generate success | Set `letterhead_generated_at` | Soft; show toast if stamp fails |

## Schema (additive)

- `sessions.decline_reason text` — volunteer-facing; keep `admin_notes` private
- `court_orders.user_id UNIQUE`
- Optional: `event_volunteer_notices(event_id, user_id, notified_at)` for notify-at-risk history

## Auth claim

- Middleware + layout + actions: `user_metadata.role === 'admin'`
- `BYPASS_AUTH=true` skips cookie auth for local demos only
