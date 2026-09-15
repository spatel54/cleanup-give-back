# Backend

Backend services for Clean Up - Give Back. Each domain has its own folder and matching docs under `docs/backend/context/`.

| Service | Folder | Domain doc | Status |
|---------|--------|------------|--------|
| Sessions, photos, activity log | [`sessions/`](sessions/) | [sessions.md](../docs/backend/context/sessions.md) | **Live** on Fly (`https://sessions.example.com`) |
| Map & GPS tracking | [`maps/`](maps/) | [maps.md](../docs/backend/context/maps.md) | Scaffold — GPS is client-owned; route persisted on session finalize |
| Payments & donations | [`payments/`](payments/) | [payments.md](../docs/backend/context/payments.md) | Scaffold |

## Sessions API (live)

Fastify + Prisma against Supabase Postgres. Deploy from `backend/sessions/` — see [sessions-api.md](../docs/backend/specs/sessions-api.md) and [supabase.md](../docs/supabase.md).

List responses include `checkpointCount` / `photoCount` for Home dashboard hydration. Finalize accepts `status: under_review | invalid`.

## Next steps

1. Keep sessions API as the core product loop; deploy after schema/API changes
2. Payments service when Stripe is in scope
3. Maps microservice remains deferred (client GPS + finalize polyline is enough for v1)
