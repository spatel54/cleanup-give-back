# Admin portal — ARCHIVED

**Status:** Archived 2026-07-30. Do not deploy or extend this app.

Production admin UI is **`admin-web-app/`** → https://admin.example.com  
(`cd admin-web-app && npm run dev` locally; `vercel --prod` to deploy).

| Still use from this folder | Do not use |
|----------------------------|------------|
| `admin/db/*.sql` — shared Supabase migrations (SQL Editor) | `npm run dev` / Vercel for this Next app |
| Historical reference for ports into `admin-web-app/` | New features, auth, or hosting |

The former Vercel project `example-admin` was deleted when `admin-web-app` took over.

See [ARCHIVED.md](./ARCHIVED.md) for details.
