# Figma Design System Components

Components on the Design System page ([`1:3`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1-3)):

- **Documentation + specimens:** [`DS / Root`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=672-269) (§8 shows component instances)
- **Master components:** [`DS / Component Library`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=743-58) (edit masters here — no longer floating on canvas)

## Shipped components (as of 2026-06-30)

| Component | Figma node | Variants | RN equivalent |
|-----------|-----------|---------|---------------|
| BottomNav | [`675:57`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=675-57) | — | `src/components/BottomNav` (planned) |
| Input | [`675:125`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=675-125) | `State=Default\|Focus\|Error` | `src/components/Input` (planned) |
| Button (Primary/Secondary/Destructive) | `672:419` etc. | `Style=Primary` | planned |
| StatusTag, FilterChip, SearchBar, TopAppBar, SessionRow | see §8 specimens | — | planned |

## Design System page sections

| § | Section | Node | Contents |
|---|---------|------|----------|
| 3 | Color Palette | `672:276` | Semantic swatches + **Color Usage Rules** (`742:361`) |
| 4 | Typography | `672:331` | 14 text styles |
| 5 | Spacing & Radius | `672:366` | Scale reference |
| 6 | Elevation | `708:48` | 2 shadow styles (Nav/Bottom, Bar/Top) |
| 7 | Known Inconsistencies | `672:462` | Resolved + planned remediation |
| 8 | Components | `672:427` | Production resting-state specimens |
| 9 | Interactive States | `742:364` | `· States` spec + `A11y/FocusRing` primitives |
| 10 | Accessibility | `742:382` | WCAG 2.1 AA rules, touch targets, `_impl-notes` tags |

Full layout: [`design.md`](../design.md) §16 · Audit: [`docs/a11y-audit-2026-06-30.md`](../../../../docs/a11y-audit-2026-06-30.md)

## Adding new components

1. Design the component in the Figma Design System page.
2. Bind all colors to semantic `Color` variables and all text to named text styles.
3. Add a row to the table above with the Figma node link.
4. When implementing in RN, map the component's properties 1-to-1 to `ThemedView`/`ThemedText` conventions (see [`docs/frontend/context/components.md`](../../../../docs/frontend/context/components.md)).
