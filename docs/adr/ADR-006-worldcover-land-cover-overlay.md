# ADR-006: ESA WorldCover land-cover overlay (keep MapLibre basemaps)

- **Status:** Superseded
- **Date:** 2026-07-16
- **Superseded:** 2026-07-16 — feature removed; core product is hours + walking path, not thematic land classification

## Context

The live tracker already uses MapLibre with Carto Voyager (Standard) and Esri World Imagery (Satellite / Hybrid) per ADR-005. Product research compared Strava’s attribution stack (Mapbox, Maxar, OpenStreetMap, EarthEnv, ESA WorldCover). For Clean Up – Give Back, the highest-value *new* integration was thematic land cover for cleanup context — not a basemap platform swap.

## Decision (original)

1. **Keep** MapLibre + Carto + Esri basemaps (no Mapbox / Maxar / EarthEnv).
2. **Add** ESA WorldCover 2021 as an optional **overlay** toggled independently of basemap type.
3. Serve tiles from **Terrascope MapProxy** (free, no API key).
4. Re-apply the overlay after every basemap `setStyle` (WebView) so style swaps do not drop it.
5. Default off; do not persist on completed-session snapshots in v1.

## Superseding decision

Remove the land-cover overlay entirely. Average users need session hours and their walking path; Standard / Satellite / Hybrid already cover map context. The overlay added UI surface, Terrascope tile traffic, and maintenance without helping the primary job.

## Consequences

- **Positive (kept from original):** Basemaps remain MapLibre + Carto + Esri — no paid map SDK.
- **Positive (removal):** Simpler Map Types sheet; no third-party WorldCover dependency; less live-tracker state.
- **Negative (removal):** Volunteers lose optional vegetation / water / built-up classification under the route.

## Alternatives considered

- **Keep as optional default-off** — still costs code, docs, and tile dependency for low usage. Rejected.
- **Mapbox + Maxar satellite** — deferred (cost/keys); unrelated to this removal.
