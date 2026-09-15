# ADR-002: Figma as Design Ground Truth

- **Status:** Accepted
- **Date:** 2026-06-30

## Context

The app initially used **Google Stitch** as the design-to-prototype pipeline: Stitch HTML screens were exported to `frontend/design/stitch_htmls/`, processed, and bundled into `frontend/assets/stitch/`. The Expo Router app loaded them in a WebView (`/prototype/[screen]`) with a JavaScript navigation bridge.

By mid-2026 all 39 screens had been exported from Stitch into the **CleanUpGiveBack Figma file** (`DrDcQH14n7ntDQ80F7au9S`) as real auto-layout frames across 6 flow pages. A Design System page (`1:3`) was built with 104 Figma variables, 14 text styles, and core components (BottomNav, Input). The Onboarding flow had full color and typography token binding applied.

The Stitch pipeline is now frozen. No new screens will be added to Stitch or to `HTML_MAP` in `[screen].tsx`.

## Decision

1. **Figma is the design ground truth** for all new and revised screens. The Figma cloud file is canonical; no `.fig` binary is committed to the repository.

2. **A local workspace at `frontend/design/figma/`** holds:
   - `manifest.yaml` — the screen inventory mapping Figma pages/nodes to future Expo Router `routeKey` values
   - `pages/` — per-flow notes for each of the 6 Figma pages
   - `tokens/` — Figma variable JSON exports when committed
   - `exports/` — PNG/SVG screen exports when committed
   - `components/` — Design System component documentation

3. **The HTML prototype remains runnable but is frozen.** The `[screen].tsx` route and all `HTML_MAP` entries continue to work for Expo Go demos until each screen is replaced by a native RN implementation. No new screens are added to `HTML_MAP`.

4. **The implementation path is Figma → RN per `manifest.yaml`.** Implementation is manual (engineer reads design in Figma, builds RN component against brand tokens). Figma-to-code automation (Code Connect, MCP code generation) is out of scope for v1 and can be introduced screen-by-screen.

5. **Migration is tracked via `status` in `manifest.yaml`**: `designed` → `bound` → `implemented`. The `/prototype/*` routes are deprecated for each screen once it reaches `implemented`.

## Consequences

- Implementers must consult `frontend/design/figma/manifest.yaml` and the Figma file before building any new screen.
- `docs/frontend/brand.md` remains the text-form token reference; it must stay in sync with Figma variables.
- The Stitch HTML pipeline docs (`frontend/design/stitch_htmls/`, `frontend/assets/stitch/`) are marked legacy. Existing files are not deleted — they support the running prototype.
- Future screens that have no Stitch counterpart (e.g. permission screens, session review) must be designed in Figma before being added to `manifest.yaml`.

## Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| Keep Stitch as design source | Stitch pipeline is unmaintained; Figma already has 39 screens + DS; moving back would discard DS work |
| Figma-to-code automation (Code Connect) immediately | Adds tooling complexity before any native screen exists; better as a follow-on once the DS is stable |
| Store Figma exports in `docs/` | `docs/` is for living text documentation; binary assets belong in `frontend/design/` per `assets.md` policy |

## 2026-08-09 catch-up sync (consequence, not a supersession)

By early August the codebase had outpaced Figma: the app grew to 71 live routes against 46 tracked in `manifest.yaml`, and several shipped specs (session-tracking-expo-go, photo-checkpoint-dual-capture, service-letter-pdf, map-theme-and-weather-icons) had no corresponding Figma update. A one-time **code → Figma catch-up sync** was run to close the gap. This is explicitly a one-time catch-up, not a reversal of this ADR's decision — **Figma remains the design ground truth going forward.**

What the sync found and fixed:
- Figma's own bound Design System text styles (13 of 14) had drifted from values the file's *own documentation labels* and the code already agreed on (including two already-shipped a11y fixes) — the styles were re-applied to match, not redesigned.
- Real page structure is 6 content pages, not the 7 this ADR's `manifest.yaml` originally assumed — there is no dedicated "Compliance & Legal" page; those frames live on the Account & Settings page. Corrected in the manifest.
- Several routes were wrongly tracked as missing designs purely because their Figma frames had mismatched/stale layer names (e.g. `account-phone` marked missing while a frame named `details_account` was actually its design, already referenced by node id in the component's own code comment). Cross-referencing frame content against code comments, not just layer names, resolved most of these.
- ~15 screens are confirmed genuinely absent from Figma (net-new design needed): `personal-details`, `map-theme`, `settings`, `account-privacy`, `notifications` (inbox), `terms-of-service`, `privacy-permissions`, `feedback-thank-you`, `splash-loading`, among others. These were deliberately **not** designed as part of this catch-up — this repo's confirmation-gate workflow for new component/screen work applies to them, and batch-generating ~15 screens without individual review would violate it.
- `age-gate`, the 3 `parental-consent-*` routes, and `teen-privacy-notice` were removed from the manifest entirely (2026-08-09 product decision) — out of scope, consistent with sibling compliance screens already marked "not shipping" in the 2026-06-30 compliance gap audit.

**Process gap identified, to prevent recurrence:** this catch-up was needed because new screens shipped in code before (or without) a corresponding Figma update, inverting the intended Figma-first flow for those specific screens. Going forward, new screens should land in Figma before or alongside the native implementation, per this ADR's original decision — not be retrofitted into Figma after the fact.
