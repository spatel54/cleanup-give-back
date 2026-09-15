# Legacy: Stitch HTML Source Files

This folder contains the Google Stitch source HTML files that powered the original prototype. It is **frozen** — no new files will be added here.

## Status

The Stitch pipeline has been superseded by **Figma** as the design ground truth.

| Old path | New path |
|----------|---------|
| `design/stitch_htmls/` | **`design/figma/`** ← active |
| `assets/stitch/` | Bundled prototype HTML (frozen; deleted per-screen when native RN ships) |

## What to do instead

- For new screens: add an entry to [`frontend/design/figma/manifest.yaml`](../figma/manifest.yaml).
- For design reference: open the [Figma file](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack).
- For token values: see [`docs/frontend/brand.md`](../../../docs/frontend/brand.md).

## Why these files still exist

The running HTML prototype (`frontend/src/app/prototype/[screen].tsx`) loads files from `frontend/assets/stitch/`. These Stitch sources remain as reference for the migration period. They will be archived once all screens reach `status: implemented` in `manifest.yaml`.
