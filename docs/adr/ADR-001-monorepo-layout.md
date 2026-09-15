# ADR-001: Monorepo layout

- **Status:** Accepted
- **Date:** 2026-06-10

## Context

The project started as a flat Expo app at the repository root. As backend services (maps, payments, session tracking) and documentation grow, a single root-level app folder does not scale for agents or contributors.

## Decision

Organize the repository into three top-level areas:

1. **`frontend/`** — Expo app, design assets, prototype screens, and frontend scripts
2. **`backend/`** — Domain-scoped services: `maps/`, `payments/`, `sessions/`
3. **`docs/`** — Living documentation with `frontend/` and `backend/` subdivisions, plus `agents/`, `adr/`, and repo-wide indexes

**Stays at root:** `README.md`, `AGENTS.md` / `CLAUDE.md` (stubs), `LICENSE`, `.cursor/`, root `package.json` (convenience scripts).

Path aliases remain frontend-local: `@/*` → `frontend/src/*`.

## Consequences

- Run commands from `frontend/` or use root `npm start` / `npm run typecheck`
- Cursor rules and docs-backpressure reference `frontend/src/` and `docs/frontend/context/`
- Backend folders are scaffolds until services are implemented

## Alternatives considered

- **Keep flat root** — rejected; mixes app, docs, and future APIs
- **Separate repos** — deferred; monorepo sufficient for current team size
