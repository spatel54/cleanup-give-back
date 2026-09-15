# Design system

## Sources

| Source | Location |
|--------|----------|
| Figma (ground truth) | [CleanUpGiveBack Design System](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1-3) |
| Local Figma workspace | `frontend/design/figma/` · `manifest.yaml` |
| Brand tokens doc | `docs/frontend/brand.md` |
| Code tokens | `frontend/src/constants/` (colors, typography) |
| Component inventory | `docs/frontend/context/components.md` |
| Screen routes | `docs/frontend/context/app.md` · `docs/frontend/screen-map.md` |
| Admin UI | `admin-web-app/src/components/ui/` (shadcn-style); prefer `react-icons` for new icons |

## Source of truth

1. **Visual design + tokens:** Figma Design System page (ADR-002). Code and docs were corrected when Figma drifted (2026-08-09 token verification).
2. **Component behavior:** Implemented components in `frontend/src/components/` and feature folders; docs in `docs/frontend/context/components.md`.
3. **Admin patterns:** `admin-web-app/` conventions + `docs/admin-web-app.md`.
4. **Stitch/HTML pipeline:** Frozen — do not revive without new ADR.

## Working rules

**Reuse before invent:**
- Default to `ThemedView`, `ThemedText`, `Collapsible`, shared `EmptyState`, `BrandLoadingView`
- Colors/fonts from brand doc: Forest Green `#009540`, Sanchez (display), Noto Sans (body)
- Shadows only on structural chrome (nav bars) — cards use border contrast, not elevation shadows
- Match existing radius/spacing patterns (e.g. `radius.md` 16px on cards and primary CTAs)

**Mobile vs admin:**
- Volunteer-facing: brand green CTAs with stroke on email buttons; no Admin name in copy
- Admin: operator language for Admin; period bar Today/Month/Year/All/Custom

**Maps & media:**
- Square rounded photo thumbnails on admin walking-path maps (lightbox, not circular pins)
- Checkpoint photos persist lat/long for map pins

**Contribution path:**
- New shared UI → `frontend/src/components/` + update `docs/frontend/context/components.md`
- Token changes → Figma first, then `brand.md` + code constants
- Architectural UI choices → ADR + `docs/frontend/context/project.md` Decisions

## Known gaps

- Shop catalog/cart largely client-side; checkout shipping is formula-based (25% subtotal), not live carrier rates yet
- Some screens still use mock/prototype paths alongside production flows (see session-tracking README)
- Admin and mobile design systems are related by brand but not a single shared component package
