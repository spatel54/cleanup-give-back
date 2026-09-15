# Figma Tokens

Variable exports from the Figma Design System page ([`1:3`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1-3)).

## Files in this folder

| File | Collection |
|------|------------|
| [`primitives.json`](primitives.json) | Primitives (raw hex) + code-only extras |
| [`color.json`](color.json) | Semantic Color (`Light`) |
| [`spacing.json`](spacing.json) | Spacing scale |
| [`radius.json`](radius.json) | Border radius scale |
| [`typography-primitives.json`](typography-primitives.json) | Font families, weights, sizes |
| [`typography.json`](typography.json) | 14 text styles |
| [`shadow.json`](shadow.json) | Shadow/elevation styles (structural chrome only) |

These JSON files are the **committed mirror** of the Figma DS. When Figma variables change, update the matching JSON and `docs/frontend/brand.md`, then confirm `frontend/src/constants/tokens.ts` still matches.

## Runtime (React Native)

| Module | Role |
|--------|------|
| [`frontend/src/constants/tokens.ts`](../../../src/constants/tokens.ts) | **Canonical RN tokens** — import this for new work |
| [`frontend/src/constants/theme.ts`](../../../src/constants/theme.ts) | Expo chrome hooks (`Colors`, `Fonts`, `Spacing`) wired to Figma tokens |
| `frontend/src/features/figma-screens/tokens.ts` | Re-export of canonical tokens (existing import paths) |
| `frontend/src/features/session-tracking/tokens.ts` | Re-export; `colors.bgSurface` = elevated `#f6f3f2` for that slice |

## Figma variable collections

| Collection | Modes | Description |
|-----------|-------|-------------|
| **Primitives** | `Value` | Raw hex values — hidden from pickers, aliased by Semantic Color |
| **Color** | `Light` | Semantic color aliases; CSS variable syntax (`--color-*`) |
| **Spacing** | `Value` | Spacing scale |
| **Radius** | `Value` | Border radius scale |
| **Typography Primitives** | `Value` | Raw font families, weights (`FONT_STYLE` strings), sizes |
| **Typography** | `Value` | Semantic aliases per text style × 3 properties (family, weight, size) |
| **Shadow** | `Value` | 2 structural-chrome effect styles (Nav/Bottom, Bar/Top) — see `shadow.json` |

Token count: **117 variables** (as of 2026-06-30; +13 `size/*` primitives added in text-token sweep for screen outliers: 9, 13, 15, 17, 19, 20, 24, 26, 30, 31, 32, 40, 50).

## How to re-export from Figma

1. Open the Figma file and go to the Design System page (`1:3`).
2. Use the Figma Variables plugin or the MCP `get_variable_defs` / `use_figma` skill to export collections.
3. Overwrite the JSON files in this folder (keep the same filenames).
4. Update `docs/frontend/brand.md` if any token values changed.
5. Update `frontend/src/constants/tokens.ts` to match.

## Code syntax

Variables in the Figma file have WEB, iOS, and Android code syntax applied:

| Platform | Pattern |
|----------|---------|
| WEB | `var(--color-primary)`, `var(--typography-body-default-size)` |
| iOS | `Color.primary`, `Typography.bodyDefault.size` |
| Android | `R.color.primary`, `sp_body_default_size` |
| React Native | `colors.primary`, `textStyles.bodyDefault` from `@/constants/tokens` |

## Surface token note

Figma semantic `color/bg/surface` is `#f6f3f2` (`colors.bgSurfaceElevated`). Many shipped screens use pure white cards — that remains `colors.bgSurface` / `colors.white` so we do not regress layouts. Prefer `bgSurfaceElevated` when matching Figma elevated fills exactly.
