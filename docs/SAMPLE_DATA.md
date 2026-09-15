# Sample data and placeholders

This document lists what is **mocked or sanitized** in the portfolio copy vs what would connect to live services in a full deployment.

---

## Sanitized identifiers

| Item | In this repo |
|------|----------------|
| Org email domain | `@example.org` |
| Public website | No live link (sample only) |
| Admin host | `admin.example.com` (placeholder) |
| Sessions API | `sessions.example.com` (placeholder) |
| iOS bundle ID | `com.example.cleanupgiveback` |
| OAuth callback scheme | `nonprofitmobileapp://auth/callback` (generic) |
| Letterhead / ship-from address | Example City, IL — fictional street |
| Tax ID in PDFs | `00-0000000` placeholder |

---

## Mobile mocks

| Location | What is mocked |
|----------|----------------|
| `frontend/src/features/figma-screens/mocks/` | Home user first name (`Alex`), session feed previews |
| `frontend/src/features/session-tracking/mocks/` | Dashboard stats when no live sessions |
| `frontend/src/features/notifications/sampleVolunteerNotifications.ts` | Inbox rows for empty/offline states |
| `frontend/design/stitch_htmls/` | Static HTML prototypes (not runtime) |

---

## Admin mocks

| Location | What is mocked |
|----------|----------------|
| `admin-web-app/src/lib/mock-data.ts` | Orders, volunteers when Supabase is empty (`MOCK_ORDERS`, etc.) |
| `admin/lib/orders-data.ts` | Legacy archived admin fixtures (same fictional data) |
| `admin-web-app/src/lib/volunteers.ts` | `MOCK_EMAIL_DOMAIN = no-email.example.internal` for users without email |

Fictional shipping addresses use **Example City, IL** and sample street names — not real locations.

---

## What would be live in production (not in this sample)

- Supabase Auth, Postgres, Storage, Realtime
- Fly.io sessions API with Prisma
- Resend transactional email
- Stripe Checkout and webhooks
- Shippo label purchase (admin)
- Vercel-hosted admin console
- EAS / TestFlight iOS builds

Environment variable names are documented in [`supabase.md`](supabase.md) and `*.example` files — values are **not** included.

---

## HTML design prototypes

[`frontend/design/stitch_htmls/`](../frontend/design/stitch_htmls/) contains static mockups for major mobile flows. They are reference art, not executed by the native app. Open locally:

```bash
open frontend/design/stitch_htmls/welcome___standardized_progress.html
```

---

## Related

- [start-here.md](start-here.md) — product walkthrough  
- [screens/README.md](screens/README.md) — route → component index  
- [SECURITY.md](../SECURITY.md) — no production credentials in this sample
