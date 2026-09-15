# Accounts and access

Do **not** store secrets, API keys, or passwords in the repo.

Copy the committed `*.example` templates to local env files (gitignored) and fill in values from your own dashboards:

| App | Template |
|-----|----------|
| Mobile | `frontend/.env.example` → `frontend/.env` |
| Admin console | `admin-web-app/.env.local.example` → `admin-web-app/.env.local` |
| Sessions API | set Fly/host secrets from your own project, never commit them |

Services this codebase is built to use (bring your own projects):

- **Supabase** — Auth, Postgres, Storage
- **Sessions API host** — deploy `backend/sessions/`
- **Admin host** — deploy `admin-web-app/`
- **Resend** — transactional email (soft-skips when unset)
- **Stripe / Shippo** — payments and labels when those env vars are set
- **CARTO** — raster basemap key for map tiles

This sample does not include production credentials, operator identity, or App Store account details.
