# Brand

Visual identity for Clean Up - Give Back.

> **Design ground truth:** [Figma — CleanUpGiveBack](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1-3) (Design System page `1:3`).
> Local workspace: [`frontend/design/figma/`](../../frontend/design/figma/README.md) · Screen manifest: [`manifest.yaml`](../../frontend/design/figma/manifest.yaml).
>
> **Last token verification: 2026-08-09.** Live Figma text styles had drifted from this doc and `tokens.ts` (both were already correct; the bound Figma styles were stale) — 13 of 14 text styles were corrected in Figma to match. `color/bg/surface/elevated`, `color/bg/tour`, and `color/chip/bg` were promoted from code-only to real Figma variables. See ADR-002 consequences for the full catch-up note.

## Colors

Design tokens live in the Figma file ([Design System page](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1-3)) across two variable collections:

**Primitives** (hidden from pickers, single `Value` mode):

| Primitive | Hex | Description |
|---|---|---|
| `green/500` | `#009540` | Forest green brand hue; source for primary actions and approved status |
| `green/50` | `#f7fff1` | Light green tint; approved chip and success surfaces |
| `gray/900` | `#1c1b1b` | Near-black neutral; source for primary body text |
| `gray/700` | `#3e4a3d` | Dark green-gray; source for tertiary text (supporting copy, nav inactive labels) |
| `gray/500` | `#6e7a6c` | Mid green-gray; borders, input active states, non-text contrast (not a text token) |
| `gray/300` | `#bdcaba` | Light green-gray; borders, outlines, placeholders |
| `gray/200` | `#e5e2e1` | Pale gray; selected chip borders and subtle dividers |
| `white` | `#ffffff` | Pure white; text on primary fills |
| `cream/50` | `#fcf9f8` | Warm off-white app canvas background |
| `lime/500` | `#c2d832` | Bright lime accent; highlights and vegetation motif |
| `tour/mint` | `#dcebe2` | Onboarding home/track tour canvas (Figma `home_tour` / `track_tour`; code token `colors.bgTour`) |
| `amber/100` | `#ffddb5` | Pending status chip background |
| `amber/700` | `#835400` | Pending status chip text |
| `amber/500` | `#fcab29` | Pending status chip border |
| `red/50` | `#ffd9de` | Declined/error chip background |
| `red/600` | `#ba1a1a` | Declined chip text, validation errors, destructive actions |

**Semantic Color** (`Light` mode, aliases to primitives, CSS variable via `var(--color-*)` code syntax):

| Token | CSS var | Description |
|---|---|---|
| `color/primary` | `--color-primary` | Primary brand fill and stroke — CTAs, FAB, active indicators, focus rings |
| `color/bg/app` | `--color-bg-app` | Main screen background behind scrollable content |
| `color/bg/surface` | `--color-bg-surface` | Card/modal-sheet fill (white) — code: `colors.bgSurface` |
| `color/bg/surface/elevated` | `--color-bg-surface-elevated` | Elevated fill above `bg/app` for cards and inputs that sit above the surface layer — code: `colors.bgSurfaceElevated` |
| `color/text/primary` | `--color-text-primary` | Default body and heading text on app and surface backgrounds |
| `color/text/tertiary` | `--color-text-tertiary` | Sole de-emphasized text token — captions, hints, metadata, section labels, nav inactive tab labels on app bg, surface, and white (8.90:1 on cream) |
| `color/text/on-primary` | `--color-text-on-primary` | White text/icons on primary fills — form Continue CTAs and Track FAB |
| `color/text/on-primary-soft` | *(code: `textOnPrimarySoft`)* | Cream (`cream/50` / `bg-app`) label on primary fills where Figma uses bg-app — Welcome Log In, tour Continue on mint |
| `color/border/outline` | `--color-border-outline` | Default border for inputs, cards, and list rows |
| `color/border/chip-selected` | `--color-border-chip-selected` | Border ring for selected filter chips |
| `color/chip/bg` | `--color-chip-bg` | Neutral chip fill — onboarding notification preference rows (Figma `112:7130`); code: `colors.chipBg` |
| `color/accent/lime` | `--color-accent-lime` | Decorative lime accent; vegetation motif and emphasis highlights |
| `color/status/approved/*` | `--color-status-approved-{bg\|text\|border}` | Approved session chip colors |
| `color/status/pending/*` | `--color-status-pending-{bg\|text\|border}` | Pending / under-review chip colors |
| `color/status/declined/*` | `--color-status-declined-{bg\|text\|border}` | Declined / not-approved chip and error text |
| `overlayScrim` | *(code only)* | Brand modal dim: `rgba(28, 27, 27, 0.4)` |
| `overlayScrimStrong` | *(code only)* | Camera / photo chrome dim: `rgba(28, 27, 27, 0.55)` — not for Free Trial / account sheets |

### Intentional exceptions (do not “fix” to the nearest token)

| Color | Where | Why |
|---|---|---|
| `#007536` | Admin `--color-primary` | AA-safe CTA/text green; mobile keeps `#009540`. See [admin/brand-web.md](../admin/brand-web.md). |
| `#2F80ED` | Tote Ocean / Earth-and-Ocean product swatches | Product color (not UI brand). Prefer this hex over Tailwind `#3B82F6` in shop data. |
| `#1565c0` / vest greens | Shop catalog product chrome | Product/status swatches, not semantic UI. |
| `#f0ad1e` | iOS Live Activity checkpoint progress (70–90%) | Widget urgency ramp (green → this amber → declined red). Distinct from status pending border `#fcab29`. Spec: [live-session-lock-screen-widget.md](specs/live-session-lock-screen-widget.md). |
| Dark map chrome (`#0e0e0e`, etc.) | Live tracker night / Dark Matter | Night map theme, not cream-app UI. |
| Email CTA stroke `#004d21` | Order / hours / password-reset HTML | Darker green rim on brand-green buttons for email client contrast. |

Prefer tokens over local hex palettes. Cool grays (`#5c5c5c`, `#1a1a1a`, Material `#ffb4ab`) are off-brand — use green-gray neutrals and status declined tokens instead.

## Typography

**Fonts in use:**

| Role | Font |
|------|------|
| Display / headings | Sanchez |
| Body | Noto Sans |
| Label / data | IBM Plex Sans |

Typography variables live in two Figma collections — **Typography Primitives** (raw families, weights, sizes) and **Typography** (semantic aliases per text style). CSS variable pattern: `var(--typography-{style}-{family|weight|size})`.

**Text styles (14):** Display/Hero · Headline/Page · Headline/Section · Headline/Detail · Body/Default · Body/Large · Body/Small · Body/Emphasis · Body/Strong · Label/Overline · Label/Status · Label/Button · Nav/Tab · Data/Stat · Data/Timer

**Code:** Prefer `textStyles.*` or `AppText` (`frontend/src/components/ui/AppText.tsx`) over ad-hoc sizes. `ThemedText` is Expo-template chrome only.

### Intentional typography outliers (in `tokens.textStyles`)

| Token | Spec | Where |
|-------|------|-------|
| `labelButtonLarge` | IBM SemiBold 18 | Large onboarding / post-form CTAs (Figma §5.5) |
| `bodySemiBold` | Noto SemiBold 16 | Weight variant where Figma uses SemiBold |
| `headlineTopBar` | Sanchez 18 | TopAppBar + list chrome titles |
| `dataTimerLiveActivity` | IBM SemiBold 40 | Lock Screen Strava-style hero (in-app timer stays `dataTimer` Medium 40) |
| `minimizedStatValue` | Noto SemiBold 24 | MinimizedTrackerBar (Figma `622:176`) |
| `displayHero` | Sanchez 40 | Onboarding tour heroes |

Do **not** “fix” these to the nearest of the 14 alone — they are documented exceptions.

**Size collapse (2026-09-12):** Product UI no longer uses 13 / 15 / 22 / 30 px for text. Map hints to `bodySmall` (14), `bodyDefault`/`bodyEmphasis`/`bodySemiBold` (16), `headlineDetail` (20), `headlinePage` (28). Exempt: flag emoji sizing, legacy prototype folders.

## Elevation

Shadows are used **only for structural chrome** — navbar and section headers. All other surfaces (cards, buttons, images, containers, FABs, validation toasts) use border contrast, not shadows. This keeps the UI flat and clean per PRD §11.7.

**2 active `Shadow/*` styles (applied to screens):**

| Figma style | CSS `box-shadow` equivalent | Applied to |
|---|---|---|
| `Shadow/Nav/Bottom` | `0 -4px 5px rgba(0,0,0,0.02)` | BottomNav — top-edge separator from content |
| `Shadow/Bar/Top` | `0 4px 5px rgba(0,0,0,0.15)` | TopAppBar — bottom-edge separator from content |

**Allowed exceptions (not product chrome):**

| Surface | Value | Why |
|---|---|---|
| Map pins / location markers | `drop-shadow(0 2px 3px rgba(0,0,0,0.35))` (web) or matching RN shadow (`opacity 0.35`, offset `0/2`, radius `3`) | Contrast on basemap tiles — keep identical across mobile + admin |

Do **not** invent third elevation levels (`shadow-sm` / `shadow-md`, custom FAB lift, toast drop shadows). Import `shadows` from `@/constants/tokens` (or feature re-exports) instead of hardcoding chrome values.

**Shadow color variables** (scope `EFFECT_COLOR`):

| Variable | Value |
|---|---|
| `black/alpha-2` | `rgba(0,0,0,0.02)` |
| `black/alpha-15` | `rgba(0,0,0,0.15)` |
| `color/shadow/strong` | alias → `black/alpha-15` |

**Foundations/Elevation swatch grid** lives on the [Design System page](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1-3) (node `708:48`) for reference.

## Accessibility (design reference)

WCAG 2.1 AA is the primary standard. Designer-facing rules live on the Figma Design System page **§10 · Accessibility foundations** ([`742:382`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=742-382)) and in **§3 Color Usage Rules** ([`742:361`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=742-361)). Full audit: [`docs/a11y-audit-2026-06-30.md`](../a11y-audit-2026-06-30.md).

Key rules: 44×44px minimum touch targets · `color/text/tertiary` as sole de-emphasized text · `green/500` not for normal-weight body text · lime fill (`accentLime`) uses `textPrimary` (near-black), never `primary` green — Home weekly-hours pill is the reference · `A11y/FocusRing` (2px primary, 2px offset) on all interactive Focus variants.

## Components

Native Figma-aligned screens import shared tokens from **`frontend/src/constants/tokens.ts`** (`colors`, `radius`, `fontFamilies`, `textStyles`, `spacing`). Feature paths `figma-screens/tokens.ts` and `session-tracking/tokens.ts` re-export the same module for existing imports.

JSON mirrors of Figma collections live in [`frontend/design/figma/tokens/`](../../frontend/design/figma/tokens/). Prefer tokens over local hex palettes.

**Radius (implementation):** `radius/sm` 8px — inputs and inline / dense-row buttons; `radius/md` 16px — cards and full-width primary/secondary CTAs; `radius/full` — chips, pills, FABs, and circular icon buttons. See [`design.md`](../../frontend/design/figma/design.md) §7.

Use `ThemedView`, `ThemedText`, and shared theme hooks (`useColorScheme`, `useThemeColor`) for template/chrome surfaces — `frontend/src/constants/theme.ts` is wired to Figma brand tokens. See [context/components.md](context/components.md).

## Copy tone

- Clear, encouraging, community-focused
- Tagline: *Service tracking, simplified.*
