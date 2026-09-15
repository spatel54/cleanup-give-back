# Clean Up Give Back — Figma Design System

> **This document describes the design system as it exists in Figma today.**
> It does not describe what is currently implemented in the repo.
> It is the ground truth for all new native RN screens.
>
> Figma file: [CleanUpGiveBack](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack)
> Design System page: [`1:3`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1-3)
> Accessibility audit: [`docs/a11y-audit-2026-06-30.md`](../../../docs/a11y-audit-2026-06-30.md)
> Current repo design doc: [`docs/frontend/design.md`](../../../docs/frontend/design.md) ← stale Stitch-era doc, do not use for new work

---

## 1. Product Identity

| Field | Value |
|-------|-------|
| **Product name** | Clean Up - Give Back |
| **Tagline** | *Service tracking, simplified.* |
| **Core goal** | Automate tracking of community service hours with location and activity verification |
| **Target platform** | iOS and Android (React Native / Expo) |
| **Canvas size** | 390 × 844 (iPhone 14 / standard 390w) |

---

## 2. Design Philosophy

### Feel

| Quality | Meaning |
|---------|---------|
| Calm | No urgency, no overwhelming density |
| Clear | One obvious action per screen |
| Trustworthy | Verification status always visible |
| Modern | Informed by Linear, Raycast, Strava, Forest |
| Focused | Content before containers |
| Purpose-driven | Every screen earns its place |

### Visual influence (Emil Kowalski)

Informed by Emil Kowalski's product design approach (see also §10 Motion):

- Strong typography and generous whitespace
- Minimal surfaces, clear hierarchy, simple layouts
- **Subtle, useful motion** — purposeful, spring-based, never decorative
- One obvious action per screen

References: Linear, Raycast, Strava, Forest.

### Guiding principles

1. **One primary action per screen.** Every screen has a single next step (e.g. Setup Complete → Start Tracking, Cart → Checkout).
2. **Content before containers.** Use typography, spacing, and hierarchy before reaching for cards. Cards only when they separate meaningful content.
3. **Trust through transparency.** GPS status, camera access, checkpoint state, and approval status are always visible.
4. **Progressive disclosure.** Show only what matters in the moment; secondary details go lower.

### Avoid

- Dashboard clutter
- Decorative illustrations (except brand vegetation motif in specific screens)
- Heavy shadows
- Cards inside cards
- Government-form aesthetics
- Overly playful UI
- Dense administrative layouts
- Glassmorphism

---

## 3. Navigation Model

The app uses a persistent **bottom navigation** with 3 tabs (prototype) / 5 tabs (full PRD target):

| Item | Icon | Behavior |
|------|------|---------|
| Home | `home` | Impact dashboard and recent activity |
| Track (FAB) | `add` / `add_circle` | Center action — opens Session Setup; returns to Live Session if active |
| Sessions | `history` / `event_note` | Past logs, search, filters, calendar |
| Shop *(full nav)* | `shopping_bag` | Products, donations, cart, checkout |
| Account *(full nav)* | `person` | Profile, settings, records |

The Track button sits in the center and is visually emphasized with a green filled circle (`color/primary` background, `color/text/on-primary` icon).

**Icons:** Material Symbols Outlined (weight 400, optical size 24, grade 0).

---

## 4. Color System

### 4.1 Primitives collection

Mode: `Value` · 15 variables · Hidden from pickers — aliased only.

| Variable | Hex | Description |
|----------|-----|-------------|
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
| `amber/100` | `#ffddb5` | Pending status chip background |
| `amber/700` | `#835400` | Pending status chip text |
| `amber/500` | `#fcab29` | Pending status chip border |
| `red/50` | `#ffd9de` | Declined/error chip background |
| `red/600` | `#ba1a1a` | Declined chip text, validation errors, destructive actions |

Shadow-specific primitive variables (scope: `EFFECT_COLOR`):

| Variable | Value | Used by |
|----------|-------|---------|
| `black/alpha-2` | `rgba(0,0,0,0.02)` | `Shadow/Nav/Bottom` |
| `black/alpha-15` | `rgba(0,0,0,0.15)` | `Shadow/Bar/Top` |

### 4.2 Semantic Color collection

Mode: `Light` · 18 variables · Code syntax: `var(--color-*)` (WEB), `Color.*` (iOS), `R.color.*` (Android).

| Variable | Alias → Primitive | Hex | Role |
|----------|-------------------|-----|------|
| `color/primary` | → `green/500` | `#009540` | CTAs, brand fills, strokes |
| `color/bg/app` | → `cream/50` | `#fcf9f8` | App background |
| `color/bg/surface` | → *(f6f3f2)* | `#f6f3f2` | Card / input fill |
| `color/text/primary` | → `gray/900` | `#1c1b1b` | Body text |
| `color/text/tertiary` | → `gray/700` | `#3e4a3d` | Sole de-emphasized text — captions, hints, metadata, nav inactive labels |
| `color/text/on-primary` | → `white` | `#ffffff` | Text on green buttons |
| `color/border/outline` | → `gray/300` | `#bdcaba` | Input / card borders |
| `color/border/chip-selected` | → `gray/200` | `#e5e2e1` | Selected filter chip ring |
| `color/accent/lime` | → `lime/500` | `#c2d832` | Lime accent fill |
| `color/status/approved/bg` | → `green/50` | `#f7fff1` | Approved chip background |
| `color/status/approved/text` | → `green/500` | `#009540` | Approved chip text |
| `color/status/approved/border` | → `green/500` | `#009540` | Approved chip border |
| `color/status/pending/bg` | → `amber/100` | `#ffddb5` | Pending chip background |
| `color/status/pending/text` | → `amber/700` | `#835400` | Pending chip text |
| `color/status/pending/border` | → `amber/500` | `#fcab29` | Pending chip border |
| `color/status/declined/bg` | → `red/50` | `#ffd9de` | Declined chip background |
| `color/status/declined/text` | → `red/600` | `#ba1a1a` | Declined chip text |
| `color/status/declined/border` | → `red/600` | `#ba1a1a` | Declined chip border |

Semantic shadow aliases (scope: `EFFECT_COLOR`):

| Variable | Alias → Primitive | Role |
|----------|-------------------|------|
| `color/shadow/strong` | → `black/alpha-15` | TopAppBar header separator |

### 4.4 Accessibility color remediation (planned)

> **Status:** Planned in Figma per [`docs/a11y-audit-2026-06-30.md`](../../../docs/a11y-audit-2026-06-30.md). Values below are **targets** — §4.2 table above reflects Figma **today** until remediation ships.

| Token | Current | Target | Reason |
|-------|---------|--------|--------|
| ~~`color/text/secondary`~~ | — | **Retired** | Migrated to `color/text/tertiary` (`#3e4a3d`, 8.90:1 on cream) — 2026-06-30 |
| `color/status/approved/text` | `#009540` | `#005a27` (`approved/text-dark`) | 3.82:1 on `green/50` — fails AA |
| `color/border/outline` | `#bdcaba` | `#6e7a6c` (`gray/500`) | 1.4.11 non-text contrast on inputs |
| `color/primary` as text | `#009540` | — (usage rule only) | Fill / stroke / large text (≥18px SemiBold) only — never normal-weight body text |

**Usage rules (add to Color Palette on DS page):**

- `green/500` (`#009540`): button fills, icons, borders, large UI text — **not** normal-weight text under 18px on light backgrounds
- `amber/500` (`#fcab29`): borders only — **never** as text or icon tint; use `amber/700` for text
- `lime/500` (`#c2d832`): fills with dark text only — never as foreground on white/cream
- Retire rogue `#758080`, `#f9a826`, `#0fca7a` — bind to semantic tokens

### 4.3 Scopes

| Variable group | Figma scope |
|----------------|------------|
| `color/primary` | `FRAME_FILL, SHAPE_FILL, STROKE_COLOR` |
| `color/bg/*`, `color/text/*`, `color/border/*`, `color/status/*`, `color/accent/*` | `ALL_FILLS` |
| `lime/500` (primitive) | `[]` — hidden primitive, no scope |
| `color/accent/lime` | `FRAME_FILL, SHAPE_FILL` |
| `color/shadow/strong`, `black/alpha-2`, `black/alpha-15` | `EFFECT_COLOR` |
| Spacing variables | `WIDTH_HEIGHT, GAP` |

---

## 5. Typography System

### 5.1 Fonts

| Role | Family | Notes |
|------|--------|-------|
| Display / headings | **Sanchez** | Serif; used for hero titles, screen headlines |
| Body / UI text | **Noto Sans** | Sans-serif; body copy, labels, buttons |
| Labels / data / navigation | **IBM Plex Sans** | Monospace-adjacent sans; used for all label, nav, stat, timer, and button roles |

**Load order for Expo:** Sanchez (Regular), Noto Sans (Regular, Medium, Bold), IBM Plex Sans (Regular, Medium, SemiBold). All three must be loaded via `expo-font` before any screen renders.

### 5.2 Typography Primitives collection

Mode: `Value` · 16 variables · Raw families, weights, and sizes — aliased only.

**Font families (3):**

| Variable | Value |
|----------|-------|
| `font/family/display` | `Sanchez` |
| `font/family/body` | `Noto Sans` |
| `font/family/label` | `IBM Plex Sans` |

**Font weights (4, as Figma `FONT_STYLE` strings):**

| Variable | Value |
|----------|-------|
| `font/weight/regular` | `Regular` |
| `font/weight/medium` | `Medium` |
| `font/weight/semibold` | `SemiBold` |
| `font/weight/bold` | `Bold` |

**Font sizes (9):** cover the full range of the 14 text styles.

| Variable | px | Used by |
|----------|----|---------|
| `font/size/xs` | 11px | Nav/Tab |
| `font/size/sm` | 12px | Label/Overline, Label/Status |
| `font/size/base` | 14px | Body/Small |
| `font/size/md` | 16px | Body/Default, Body/Emphasis, Body/Strong, Label/Button |
| `font/size/lg` | 18px | Body/Large |
| `font/size/xl` | 20px | Headline/Detail |
| `font/size/2xl` | 24px | (section titles) |
| `font/size/3xl` | 28px | Headline/Page, Data/Stat |
| `font/size/display` | 40px | Display/Hero, Data/Timer |

> Variable names above are inferred from the 9 sizes described in PROGRESS.md. Verify exact names in the Figma file before implementing.

### 5.3 Typography semantic collection

Mode: `Value` · 42 variables · One alias per text style × 3 properties (family, weight, size).
Code syntax: `var(--typography-{style-slug}-{family|weight|size})`.

### 5.4 Text styles (14)

| Style | Family | Weight | Size | Line height | Use |
|-------|--------|--------|------|-------------|-----|
| `Display/Hero` | Sanchez | Regular | 40px | 48px | Hero tour titles, major stats |
| `Headline/Page` | Sanchez | Regular | 28px | 36px | Primary screen title |
| `Headline/Detail` | Sanchez | Regular | 20px | 28px | Section header |
| `Body/Default` | Noto Sans | Regular | 16px | 24px | General body copy, form fields |
| `Body/Large` | Noto Sans | Regular | 18px | 26px | Introductory / emphasis paragraphs |
| `Body/Small` | Noto Sans | Regular | 14px | 20px | Supporting copy, timestamps |
| `Body/Emphasis` | Noto Sans | Medium | 16px | 24px | Inline emphasis |
| `Body/Strong` | Noto Sans | Bold | 16px | 24px | Bold body, card labels |
| `Label/Overline` | IBM Plex Sans | Medium | 12px | 18px | Uppercase section labels; `letterSpacing: 0.08em` |
| `Label/Status` | IBM Plex Sans | Medium | 12px | 16px | Status chip text |
| `Label/Button` | IBM Plex Sans | SemiBold | 16px | 20px | CTA buttons, action labels |
| `Nav/Tab` | IBM Plex Sans | SemiBold | 12px | 18px | Bottom nav tab label *(planned: was 11px Medium)* |
| `Data/Stat` | IBM Plex Sans | SemiBold | 28px | 36px | Impact stats, session totals |
| `Data/Timer` | IBM Plex Sans | Medium | 40px | 48px | Live session timer display |

> Line heights are estimates from PRD / Figma convention. Verify in the Figma file.

### 5.5 Known typography outliers (hybrid rule, intentionally left unbound)

These nodes exist in the Figma file with correct font families but sizes that fall outside the 14 canonical text styles. Do not force a text style on them; they are intentional design choices.

| Font + size | Occurrence | Note |
|-------------|-----------|------|
| Sanchez Regular 40px | 4 nodes (Onboarding tour hero titles) | Maps to code `textStyles.displayHero` |
| IBM Plex Sans SemiBold 18px | ~19 nodes (large action buttons post-form) | Maps to code `textStyles.labelButtonLarge` |
| Noto Sans SemiBold/Medium 16px | ~21 nodes | SemiBold maps to code `textStyles.bodySemiBold` |
| Sanchez Regular 18px | TopAppBar / section chrome | Maps to code `textStyles.headlineTopBar` |
| IBM Plex Sans SemiBold 40px | iOS Live Activity hero timer | Maps to code `textStyles.dataTimerLiveActivity` — distinct from in-app `Data/Timer` Medium 40 |

Code also documents `minimizedStatValue` (Noto SemiBold 24, Figma `622:176`). Prefer these tokens over inventing new one-offs.

---

## 6. Spacing System

Mode: `Value` · 8 variables · Scope: `WIDTH_HEIGHT, GAP`.
Code syntax: `var(--spacing-{name})` (WEB), `Spacing.{name}` (iOS).

| Variable | Value | Typical use |
|----------|-------|-------------|
| `spacing/xs` | 4px | Tight internal gaps |
| `spacing/sm` | 8px | Component padding, icon gaps |
| `spacing/md` | 16px | Standard internal padding, stack gaps |
| `spacing/lg` | 24px | Section padding, card gaps |
| `spacing/xl` | 32px | Between major sections |
| `spacing/2xl` | 40px | Hero padding, screen-top margin |
| `spacing/3xl` | 48px | Large vertical whitespace |
| `spacing/4xl` | 64px | Full-screen-height buffers |

> Variable names and exact values are inferred from the 8-variable count, PRD §11.5 (8/16/24/40/64px), and common Figma conventions. Verify in the Figma file before implementing.

**Horizontal padding rule (from PRD):** 20px minimum, 24px preferred. Use `spacing/lg` (24px) as the default horizontal screen margin.

---

## 7. Border Radius

Mode: `Value` · 4 variables.
Code syntax: `var(--radius-{name})` (WEB), `Radius.{name}` (iOS).

| Variable | Value | Used for |
|----------|-------|---------|
| `radius/sm` | 8px | Inputs, inline / dense-row buttons |
| `radius/md` | 16px | Product cards, session cards, event cards, full-width CTAs |
| `radius/search` | 22px | Search bars (dedicated token) |
| `radius/full` | 9999px | Chips (filters, status tags, role tags), pill buttons, FAB, avatar chips, circular icon buttons |

**Binding rule used in Figma:** exact `cornerRadius` match for sm/md/search (±0 tolerance); any value ≥ 900px → `radius/full`.

**App implementation preference:** status/filter/role chips and circular FABs bind to `radius/full` (not `sm`); full-width CTAs bind to `radius/md`. See [`docs/frontend/brand.md`](../../../docs/frontend/brand.md).

**Unbound values (no token, left as manual):** 3, 6, 10, 12, 14, 20, 24px (scaled vectors / images). 88px, 100px (design-specific one-offs).

---

## 8. Elevation System

Minimal shadows per PRD §11.7 — **structural chrome only**; all other surfaces use border contrast. Two effect styles are defined on the Design System page ([Foundations/Elevation `708:48`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=708-48)).

| Effect style | `box-shadow` equivalent | Applied to |
|---|---|---|
| `Shadow/Nav/Bottom` | `0 -4px 5px rgba(0,0,0,0.02)` | BottomNav top-edge separator |
| `Shadow/Bar/Top` | `0 4px 5px rgba(0,0,0,0.15)` | TopAppBar sticky header separator |

**Do not shadow:** cards, buttons, images, containers, backgrounds, dividers, chip/badge fills, map tiles, search bars, decorative vectors.

**Total shadow coverage:** 45 nodes (19 `Shadow/Nav/Bottom` + 26 `Shadow/Bar/Top`) across flow pages 1–6 + DS components.

---

## 9. Components

Design System page: [`1:3`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1-3)

### Production vs. Interactive States

Figma flow pages (1–6) are **static compositions**. Interactive behavior is spec'd separately:

| Layer | DS page section | On flow screens? | Variants |
|-------|-----------------|------------------|----------|
| **Production components** | §9 Components | **Yes** — resting state only | `Default`, persistent `Selected`/`Active`, `Error`, `Disabled` |
| **Interactive States** | §10 Interactive States | **No** — reference specimens | `Default · Pressed · Focus · Disabled` |

Mobile touch app — **no Hover variants**. Pressed is primary touch feedback; Focus uses `A11y/FocusRing` for keyboard/VoiceOver. See §12 Interactive States and §11 Implementation Notes.

### 9.1 BottomNav

Figma node: [`536:2046`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=536-2046)

- 3-item prototype layout: **Home** · **Track (FAB)** · **Sessions**
- Full PRD has 5 items: Home · Shop · Track · Sessions · Account
- Track button: 56×56 green circle, `color/primary` fill (no shadow — flat FAB)
- Inactive labels: `Nav/Tab` text style, `color/text/tertiary`
- Active tab: `color/primary` label + **3px top underline bar** (non-color indicator; planned a11y fix)
- Shadow: `Shadow/Nav/Bottom` on the nav bar top edge
- Interactive States: `BottomNav/Tab · States` in §10

### 9.2 Input

Figma node: [`675:125`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=675-125)

Component set with 3 variants: `State = Default | Focus | Error`

| State | Border color | Notes |
|-------|-------------|-------|
| Default | `color/border/outline` (`#bdcaba`) | Resting state |
| Focus | `color/primary` (`#009540`) | Active / cursor in field |
| Error | `color/status/declined/text` (`#ba1a1a`) | Validation failure |

Figma node: [`675:125`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=675-125)

Production component set — **resting variants for screen composition:** `State = Default | Error | Disabled`

| State | Border color | Notes |
|-------|-------------|-------|
| Default | `color/border/outline` | Target: `#6e7a6c` after a11y remediation (§4.4) |
| Error | `color/status/declined/text` (`#ba1a1a`) | Add error icon; `"(required)"` text alongside asterisk |
| Disabled | — | Planned 3rd production variant |

**Focus** border and focus ring → `Input · States` in §10 only (`Interaction=Focus`, `Error+Focus`).

- Radius: `radius/sm` (8px) on inputs; some form containers use `radius/md` (16px)
- Label: `Label/Button` or `Body/Default` text style
- Value text: center-aligned per DS decision
- Placeholder: `color/border/outline` color

### 9.3 Other production components (planned / promote to DS)

| Component | Notes | Interactive States set |
|-----------|-------|------------------------|
| `Button/Primary` | 56px height; white on green passes AA Large | `Button/Primary · States` |
| `Button/Secondary` | Match primary height | `Button/Secondary · States` |
| `Button/Destructive` | Hint annotation for destructive action | `Button/Destructive · States` |
| `FilterChip` | min 44×44; checkmark or ring when selected | `FilterChip · States` |
| `SearchBar` | min height 48px | `SearchBar · States` |
| `TopAppBar` / `IconButton` | 44×44 touch frame around 24px icon | `IconButton · States` |
| `StatusTag` | Text label always visible; approved text → `approved/text-dark` | — |
| `SessionRow` | Composite a11y label (title + status + date) | `SessionRow · States` |
| `SelectField` | Chevron decorative | `SelectField · States` |
| `ServiceHoursChart` | Pattern fills or bar labels; `@a11y role=image` summary | — |
| `A11y/FocusRing` | 2px `#009540`, 2px offset; Rect / Pill / Circle | §10.1 primitive |

---

## 10. Motion Principles (Emil Kowalski)

Informed by Emil Kowalski's approach: **purposeful, spring-based, never decorative**. Mobile-native — press feedback over pointer hover.

### 10.1 Rules (`@emil` tags)

| Rule | `@emil` tag | Implementation |
|------|-------------|----------------|
| Purposeful only | `@emil decorative=false loops=false` | No ambient, looping, or celebratory motion |
| Transform + opacity only | `@emil animate=transform,opacity-only` | Never animate layout (width, height, flex) |
| Spring on press | `@emil press=spring scale=0.97` | Reanimated spring on all `Pressable`; see §12 `Pressed` variants |
| Instant by default | `@emil default=instant` | Screens not in Motion Inventory use `@motion none` |
| Reduced motion | `@motion reducedMotion=skip` | `useReducedMotion()` → skip all entering animations |
| One primary action | `@emil primaryAction="{label}"` | Optional per-screen tag in `_impl-notes` |

### 10.2 Approved motion patterns (`@motion` tags)

| Pattern | `@motion` tag | Where |
|---------|---------------|-------|
| Primary button press | `@emil press=spring scale=0.97` | All touchables via §12 · States |
| Screen enter | `@motion enter=opacity+translateY(8) duration=220ms easing=easeOut` | Motion Inventory screens only |
| Coachmark step | `@motion coachmark=fade+scale(0.95→1) duration=200ms` | `coachmark-tutorial` |
| Modal / bottom sheet | `@motion modal=slideUp spring damping=20` | `photo-checkpoint` |
| List stagger | `@motion stagger=50ms` | `setup-complete`, `event-detail` |
| No motion | `@motion none` | **All other screens** (e.g. `home`, `sessions-list`) |

### 10.3 Motion Inventory

Screens with explicit motion — all others are instant (`@motion none`):

| `routeKey` | Motion tags |
|------------|-------------|
| `setup-complete` | `enter` + `stagger=50ms` |
| `coachmark-tutorial` | `coachmark` per step |
| `event-detail` | `enter` + `stagger=50ms` |
| `photo-checkpoint` | `modal=slideUp spring damping=20` |
| `submission-confirmation` | `enter` |
| All primary buttons | `press=spring scale=0.97` (component-level, not per-screen) |

Source: [`docs/frontend/screen-map.md`](../../../docs/frontend/screen-map.md) Motion Inventory.

### 10.4 Legacy WebView note

The Stitch HTML prototype used `active:scale-[0.97]` (Tailwind) as a web touch guard. Native RN uses Reanimated spring per §12 `Pressed` variants. Do not add Hover states in Figma or RN.

---

## 11. Implementation Notes in Figma

Structured dev notes so agents implementing Figma screens as native RN routes discover a11y + motion without re-reading the full audit. Documented in Figma **and** mirrored in [`manifest.yaml`](manifest.yaml) as `implNotes`.

### 11.1 Surfaces

| Surface | Where | Agent discovery |
|---------|-------|-----------------|
| **Node description** | Screen frame + interactive components (Properties → Description) | Figma MCP `get_design_context` |
| **`_impl-notes` layer** | Collapsed group on each screen frame | Layer tree in `get_design_context` / `get_metadata` |
| **Figma Comments** | Screen root (human QA) | Mirror critical tags in description |
| **`manifest.yaml`** | `implNotes` per screen | Repo fallback — always readable |

### 11.2 `_impl-notes` layer structure

```
ScreenFrame
├── … UI layers …
└── _impl-notes
    ├── _route       @route {routeKey}
    ├── _a11y        screen-level @a11y tags
    ├── _motion      @motion + @emil tags
    ├── _emil        optional rationale
    └── _components  per-component overrides
```

### 11.3 Tag vocabulary (summary)

Full reference lives on Figma DS page **§11 Accessibility foundations** (`_tag-reference` frame). This doc: §11 Implementation Notes.

```
@route {routeKey}
@a11y role={role} label="…" hint="…"
@a11y decorative=true | required=true | hideFromAT=true
@states {Component} · States
@pressed scale=0.97 spring
@focus ring=A11y/FocusRing offset=2px stroke=2px color=--color-primary
@emil purposeful=true decorative=false animate=transform,opacity-only
@motion enter=… | stagger=… | modal=… | coachmark=… | none
@motion reducedMotion=skip
@nav push={route} | backLabel="…"
```

**Agent workflow:** `manifest.yaml` → `get_design_context` → parse `_impl-notes` + descriptions → `get_motion_context` if `@motion` present → validate against `@emil` → load §12 · States → implement RN.

Advance `manifest.yaml` status to `bound` only when `_impl-notes` and description tags are complete.

---

## 12. Interactive States library

Section on DS page (`1:3`) **§10 Interactive States** — reference specimens only; never placed on flow pages 1–6.

### 12.1 Layout (within DS page)

```
§10 Interactive States
├── 10.1 Focus Ring primitives     A11y/FocusRing (Rect · Pill · Circle)
├── 10.2 Buttons
├── 10.3 Form controls
├── 10.4 Navigation
├── 10.5 Lists & rows
└── 10.6 Chips & tags
```

### 12.2 `Interaction` property (all `· States` sets)

| Value | Priority | Visual |
|-------|----------|--------|
| `Default` | — | Matches §9 production component |
| `Pressed` | **Primary** | `scale(0.97)` spring |
| `Focus` | Secondary | `A11y/FocusRing` + primary border where applicable |
| `Disabled` | — | Reduced opacity; no ring |

Specimen row order: **Default · Pressed · Focus · Disabled**.

### 12.3 `A11y/FocusRing` primitive

- 2px solid `color/primary` (`#009540`)
- 2px offset
- Shapes: `Rect` · `Pill` · `Circle`
- Nest on `Focus` variants only — not on `Pressed`

### 12.4 Mirrored component sets

| Production (§9) | States set (§10) |
|-----------------|------------------|
| `Button/Primary` | `Button/Primary · States` |
| `Button/Secondary` | `Button/Secondary · States` |
| `Button/Destructive` | `Button/Destructive · States` |
| `Input` | `Input · States` |
| `SearchBar` | `SearchBar · States` |
| `FilterChip` | `FilterChip · States` |
| `SelectField` | `SelectField · States` |
| `TopAppBar/IconButton` | `IconButton · States` |
| `TopAppBar/BackButton` | `BackButton · States` |
| `BottomNav/Tab` | `BottomNav/Tab · States` |
| `SessionRow` | `SessionRow · States` |
| `Switch` | `Switch · States` |

Production component descriptions link to their `· States` set via component description field.

---

## 13. Token Implementation Guide (React Native)

### Using colors in RN (Expo / React Native)

Map Figma semantic token names to `frontend/src/constants/theme.ts` constants.

| Figma token | RN usage pattern |
|-------------|-----------------|
| `color/primary` → `#009540` | `useThemeColor({ light: '#009540' }, 'primary')` |
| `color/bg/app` → `#fcf9f8` | `style={{ backgroundColor: colors.background }}` |
| `color/bg/surface` → `#f6f3f2` | `style={{ backgroundColor: colors.surface }}` |
| `color/text/primary` → `#1c1b1b` | `<ThemedText style={{ color: colors.textPrimary }}>` |
| `color/text/tertiary` → `#3e4a3d` | `style={{ color: colors.textTertiary }}` |
| `color/text/on-primary` → `#ffffff` | Text on green CTAs |

### Using text styles in RN

Each of the 14 text styles maps to a specific `fontFamily` + `fontWeight` + `fontSize` combination:

```ts
// Example: Headline/Page
{ fontFamily: 'Sanchez_400Regular', fontSize: 28, lineHeight: 36 }

// Example: Label/Button
{ fontFamily: 'IBMPlexSans_600SemiBold', fontSize: 16, lineHeight: 20 }

// Example: Body/Default
{ fontFamily: 'NotoSans_400Regular', fontSize: 16, lineHeight: 24 }

// Example: Data/Timer
{ fontFamily: 'IBMPlexSans_500Medium', fontSize: 40, lineHeight: 48 }
```

Font loading (`app/_layout.tsx`):

```ts
import {
  Sanchez_400Regular,
} from '@expo-google-fonts/sanchez';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
```

### Using shadows in RN

React Native uses `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius` (iOS) or `elevation` (Android). Map the two effect styles:

```ts
// Shadow/Nav/Bottom
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.02,
  shadowRadius: 5,
  elevation: 2,
}

// Shadow/Bar/Top
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 5,
  elevation: 4,
}
```

---

## 14. Figma Token Binding Status

**Text token sweep (2026-06-30):** All **980** text layers across pages 1–6 have semantic **color** variables on fills and **typography primitive** bindings (`family/*`, `size/*`, `weight/*`) or canonical `textStyleId`. Zero unbound text remains on flow pages 1–6.

| Page | Text layers | Color unbound | Typography unbound |
|------|-------------|---------------|-------------------|
| 1 · Onboarding | 139 | 0 | 0 |
| 2 · Home & Events | 92 | 0 | 0 |
| 3 · Shop & Payments | 160 | 0 | 0 |
| 4 · Session Tracking | 210 | 0 | 0 |
| 5 · Sessions History | 153 | 0 | 0 |
| 6 · Account & Settings | 226 | 0 | 0 |
| **Total** | **980** | **0** | **0** |

Prior pass totals (fills/radius/shadows on all node types):

| Page | Color nodes bound | Font fixes | Text styles applied | Radius nodes bound |
|------|-------------------|-----------|---------------------|-------------------|
| DS components | — | — | — | — |
| 1 · Onboarding | 238 | 22 | 28 | 69 |
| 2 · Home & Events | 238 | 0 | 28 | 23 |
| 3 · Shop & Payments | 362 | 2 | 75 | 71 |
| 4 · Session Tracking | 584 | 6 | 33 | 113 |
| 5 · Sessions History | 273 | 2 | 118 | 36 |
| 6 · Account & Settings | 131 | 0 | 29 | 15 |
| **Total** | **~2,200+** | **48** | **311** | **327** |

Shadow effect styles: **45 nodes** — only `Shadow/Nav/Bottom` and `Shadow/Bar/Top` (9 unused styles removed 2026-07-01).

---

## 15. Known Design Gaps

Colors present in Figma screens that have no semantic token and remain hardcoded:

| Color | Count | Note |
|-------|-------|------|
| `#000000` | ~170 | Map elements, icon outlines — intentional |
| `#f0edec` | 15 | Off-white surface not matching `color/bg/surface` (`#f6f3f2`) |
| `#334e68` | 12 | Navy/blue decorative — no token |
| `#d9d9d9` | 8 | Placeholder/skeleton fills |
| `#d1d5db` | 4 | Gray toggle inactive — no token |
| `#c2f9dd` | 3 | Approved badge on green bg — would conflict with `color/status/approved/text` |
| `#66de7f` | 5 | Decorative grass illustration |
| `#85d5eb`, `#13a9ff` | 6 | Decorative / map tint |
| `#758080` | 0 | **Retired** — all instances migrated to `color/text/tertiary` (2026-06-30) |
| `#f9a826` | — | Untokenized warm accent — **retire**; use `amber/700` for text |

**Accessibility gaps (see §4.4 and a11y audit):** approved badge text contrast, input border non-text contrast, no focus ring system designed, lime/amber misuse on 7+ screens.

Radius values with no token (left as manual overrides): 3, 6, 10, 12, 14, 20, 24, 88, 100px.

---

## 16. Design System Page Layout

The Design System page (`1:3`) is organized in a single vertical **`DS / Root`** frame ([`672:269`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=672-269)). All sections scroll top-to-bottom in this order (reorganized 2026-06-30):

| § | Section | Figma frame | Contents |
|---|---------|-------------|----------|
| — | **Cover** | `672:270` | Project identity, v1.1 subtitle (WCAG 2.1 AA) |
| 2 | **Getting Started** | `672:459` | Variables, text styles, component usage, `_impl-notes` handoff |
| 3 | **Color Palette** | `672:276` | Semantic swatches + **Color Usage Rules** (`742:361`) — a11y contrast rules from §4.4 |
| 4 | **Typography** | `672:331` | 14 text style specimens; labels note planned a11y fixes (Overline 12px, Nav/Tab SemiBold 12px) |
| 5 | **Spacing & Radius** | `672:366` | Variable-bound spacing bars + radius samples |
| 6 | **Elevation** | `708:48` | 2 shadow swatches — Nav/Bottom + Bar/Top only |
| 7 | **Known Inconsistencies** | `672:462` | Resolved + planned remediation from a11y audit |
| 8 | **Components** | `672:427` | Production resting-state specimens (BottomNav, Input, Button, …) — doc §9 |
| 9 | **Interactive States** | `742:364` | Interaction property spec, `A11y/FocusRing` Rect/Pill/Circle specimens, component mapping — doc §12 |
| 10 | **Accessibility foundations** | `742:382` | Touch targets, color contrast, focus visible, semantic roles, `_impl-notes` tag reference, motion |

**Component source nodes** live in **`DS / Component Library`** ([`743:58`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=743-58)) — positioned to the right of `DS / Root` at x=1200. Grouped: Buttons · Form controls · Navigation · Lists & status. §8 on `DS / Root` uses **instances** of these masters only.

| Master | Node | Group |
|--------|------|-------|
| Button (Primary set) | `672:419` | Buttons |
| Button/Secondary | `672:415` | Buttons |
| Button/Destructive | `672:417` | Buttons |
| Input | `675:125` | Form controls |
| SearchBar | `672:425` | Form controls |
| FilterChip | `672:424` | Form controls |
| FilterChip/True | `672:420` | Form controls |
| BottomNav | `675:57` | Navigation |
| TopAppBar | `672:469` | Navigation |
| SessionRow | `672:487` | Lists & status |
| StatusTag | `672:412` | Lists & status |

> §9 Interactive States documents the `· States` component sets (planned/promote). §10 Accessibility mirrors [`docs/a11y-audit-2026-06-30.md`](../../../docs/a11y-audit-2026-06-30.md) for designer-facing reference.
