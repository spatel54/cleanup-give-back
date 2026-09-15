# Sessions API

Fastify + Prisma sessions service for Clean Up - Give Back.

**Spec:** [docs/backend/specs/sessions-api.md](../../docs/backend/specs/sessions-api.md)  
**Setup:** [docs/supabase.md](../../docs/supabase.md)

## Local development

```bash
cd backend/sessions
cp .env.example .env   # fill DATABASE_URL + SUPABASE_URL
npm install
npx prisma db push
npm run dev
```

## Deploy to Fly.io

Production: `https://sessions.example.com`

```bash
export PATH="$HOME/.fly/bin:$PATH"
fly auth login

cd backend/sessions
fly launch --name example-sessions --region ord --copy-config --yes   # first time only

fly secrets set \
  SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
  DATABASE_URL="postgresql://postgres:...@db....supabase.co:5432/postgres"

fly deploy
```

Auth verifies Supabase JWTs via JWKS (`/auth/v1/.well-known/jwks.json`) — ES256 signing keys. Use **Supabase Postgres** for `DATABASE_URL`, not Fly Managed Postgres.

After deploy, set `EXPO_PUBLIC_API_URL=https://sessions.example.com` in `frontend/.env`.

## Endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | none |
| POST | `/sessions` | Bearer JWT |
| POST | `/sessions/:id/checkpoints` | Bearer JWT |
| PATCH | `/sessions/:id/finalize` | Bearer JWT |
| GET | `/sessions` | Bearer JWT |
| GET | `/sessions/:id` | Bearer JWT |
| PATCH | `/sessions/:id/approval` | `X-Admin-Key` header |
| POST | `/shipping/rates` | `X-Admin-Key` |
| POST | `/shipping/buy-label` | `X-Admin-Key` |
| POST | `/webhooks/shippo` | `?token=` = `SHIPPO_WEBHOOK_SECRET` |
