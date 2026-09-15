# Decisions

Consequential UX and product decisions live in the project's ADR system. Do not duplicate full rationale here — link and index.

**Canonical location:** [`docs/adr/overview.md`](../docs/adr/overview.md)

| ADR | UX-relevant summary |
|-----|---------------------|
| [ADR-001](../docs/adr/ADR-001-monorepo-layout.md) | Monorepo: `frontend/`, `admin-web-app/`, `backend/`, `docs/` |
| [ADR-002](../docs/adr/ADR-002-figma-design-ground-truth.md) | Figma is design ground truth; Stitch pipeline frozen |
| [ADR-003](../docs/adr/ADR-003-minor-data-protection-baseline.md) | Under-13 block + wipe; strictest-baseline nationwide |
| [ADR-004](../docs/adr/ADR-004-sessions-backend-supabase-fly.md) | Sessions API on Fly + Supabase |
| [ADR-005](../docs/adr/ADR-005-expo-go-webview-map.md) | Expo Go map via WebView; MapLibre in native builds |

**Also see:**
- Cross-cutting product decisions: [`docs/frontend/context/project.md`](../docs/frontend/context/project.md) → Decisions
- Privacy UI split: [`docs/compliance/privacy-screen-split-decision.md`](../docs/compliance/privacy-screen-split-decision.md)
- Shipping Phase 1 (Pirate Ship manual) vs Phase 2 (Shippo): [`docs/research/shipping-integration-2026-08.md`](../docs/research/shipping-integration-2026-08.md)
- Operator preferences (Admin flows, email compose, admin copy): root `AGENTS.md` Learned User Preferences

**When recording new UX decisions:** Add an ADR if architectural; otherwise append to the relevant `docs/frontend/context/*.md` Decisions section.
