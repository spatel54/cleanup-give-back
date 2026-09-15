# Figma Design — Ground Truth

This folder is the local workspace that connects the Figma cloud file to the native React Native implementation. It holds the screen manifest, per-flow notes, component documentation, and export placeholders.

**Figma file:** [CleanUpGiveBack](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack)
**File key:** `DrDcQH14n7ntDQ80F7au9S`
**Design System page:** [`1:3`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1-3)

---

## Folder layout

```
figma/
├── README.md          ← this file
├── design.md          ← complete Figma design system reference
├── manifest.yaml      ← screen inventory (Figma page → node → routeKey)
├── pages/             ← per-flow notes for each Figma page (7 pages)
├── tokens/            ← Figma variable JSON mirrors (committed) + README
├── exports/           ← PNG/SVG screen exports (when committed)
│   └── library/       ← raw Figma assets-library dump (design-time; not Metro-bundled)
└── components/        ← Design System component documentation
```

**Runtime tokens:** import from [`frontend/src/constants/tokens.ts`](../../src/constants/tokens.ts). Feature `tokens.ts` files re-export that module.

---

## Policies

1. **Figma cloud is canonical.** The `.fig` binary is never committed to git. The live file at the URL above is the single source of design truth.
2. **`manifest.yaml` is the migration index.** Every screen — designed or implemented — must have an entry here. Do not add new screens to `HTML_MAP` in `[screen].tsx`; register them in `manifest.yaml` first.
3. **Legacy HTML keys are reference-only.** `legacyHtmlKey` fields in the manifest exist to aid migration. They point at frozen Stitch HTML files and will be removed once a screen reaches `status: implemented`.
4. **New routes go under `frontend/src/app/`.** Once a screen is implemented as a native RN component it lives at `src/app/<route>.tsx` following Expo Router file-based conventions.
5. **Exports are optional.** PNG/SVG exports go in `exports/`; only commit them when needed for offline review or CI visual snapshots. Do not commit large binaries otherwise.
6. **Token exports go in `tokens/`.** JSON variable exports from Figma (WEB/iOS/Android syntax) are committed when they diverge from `docs/frontend/brand.md`. See `tokens/README.md`.

---

## Migration status values

| Status | Meaning |
|--------|---------|
| `designed` | Screen exists in Figma but not yet built as native RN |
| `bound` | Design tokens fully applied in Figma; ready for RN implementation |
| `implemented` | Native RN screen shipped in `src/app/`; legacy HTML route can be removed |
| `spec-only` | Documented in manifest; Figma frame not yet designed |

---

## Figma pages (7)

| # | Page name | Figma link | Flow notes |
|---|-----------|-----------|------------|
| 1 | Onboarding | [node 627:29](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=627-29) | [pages/01-onboarding.md](pages/01-onboarding.md) |
| 2 | Home & Events | — | [pages/02-home-events.md](pages/02-home-events.md) |
| 3 | Shop & Payments | — | [pages/03-shop-payments.md](pages/03-shop-payments.md) |
| 4 | Session Tracking | — | [pages/04-session-tracking.md](pages/04-session-tracking.md) |
| 5 | Sessions History | — | [pages/05-sessions-history.md](pages/05-sessions-history.md) |
| 6 | Account & Settings | [node 627:373](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=627-373) | [pages/06-account-settings.md](pages/06-account-settings.md) |
| 7 | Compliance & Legal | [node 718:236](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=718-236) | [pages/07-compliance-legal.md](pages/07-compliance-legal.md) |

> Page 7 + `account-privacy` / `privacy-permissions` designed 2026-06-30 (13 frames). See [compliance gap audit](../../../docs/compliance/figma-compliance-screen-gap-audit.md).

---

## Related docs

- [`design.md`](design.md) — complete Figma design system reference (colors, type, spacing, radius, elevation, components, motion)
- [`docs/frontend/brand.md`](../../../docs/frontend/brand.md) — design tokens (colors, typography)
- [`docs/frontend/screen-map.md`](../../../docs/frontend/screen-map.md) — PRD → Figma → code mapping
- [`docs/frontend/specs/figma-to-native-handoff.md`](../../../docs/frontend/specs/figma-to-native-handoff.md) — migration spec and acceptance criteria
- [`docs/adr/ADR-002-figma-design-ground-truth.md`](../../../docs/adr/ADR-002-figma-design-ground-truth.md) — architecture decision
- [`docs/compliance/figma-compliance-screen-gap-audit.md`](../../../docs/compliance/figma-compliance-screen-gap-audit.md) — privacy screen gap audit
