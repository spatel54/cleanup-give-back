# Archived: legacy Next.js admin portal

**Archived:** 2026-07-30  
**Successor:** [`admin-web-app/`](../admin-web-app/) (Vercel: https://admin.example.com)

## Why

`admin-web-app/` is the live admin console (sessions, events, orders, feedback, insights, etc.), wired to the same Supabase project and sessions API. Keeping two Next admin apps invited drift; this tree is retained only as history and for SQL migrations.

## What agents / humans should do

1. **Build admin features in `admin-web-app/`**, not here.
2. **Run Supabase migrations** from `admin/db/*.sql` (path unchanged on purpose).
3. **Do not** redeploy this app to Vercel or treat `localhost:3001` as the product UI.
4. Ops runbooks that lived under `docs/admin/` remain valid for Resend / Fly / Supabase — they are not tied to running this Next app.

## Local leftover

If you still have `admin/node_modules` or `admin/.env.local`, they are unused for product work. Safe to delete locally; `.env.local` must not be committed.
