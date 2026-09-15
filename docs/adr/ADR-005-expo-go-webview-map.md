# ADR-005: Live map in Expo Go via WebView

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

Live session tracking shows a full-bleed map with a GPS route polyline on `/live-session` and read-only route previews on submission confirmation / session detail.

- **Native MapLibre** (`@maplibre/maplibre-react-native`) is configured in `app.json` and used in EAS dev-client builds via `LiveSessionMapNative.tsx`.
- **Expo Go** cannot load MapLibre — it is a native module not bundled in the Expo Go client. `LiveSessionMap.tsx` already detects `Constants.executionEnvironment === ExecutionEnvironment.StoreClient` and renders a static placeholder with GPS status text.
- **Web** uses a Metro `.web.tsx` stub; MapLibre native components crash `react-native-web` at import time.
- Test phase targets **Expo Go on a physical device** — no EAS build required yet. Testers need a **visible map with live route**, not only "GPS active · X.X mi tracked" text.

`react-native-webview` is already a dependency (`frontend/package.json`) and works in Expo Go.

## Decision

Add a **third map tier** for Expo Go:

| Runtime | Map implementation |
|---------|-------------------|
| Expo Go (iOS/Android) | `LiveSessionMapWebView` — WebView hosting MapLibre GL JS v4 from CDN, Carto Positron style |
| EAS dev-client / production native | Existing `LiveSessionMapNative` (MapLibre RN) — unchanged |
| Web | Existing placeholder (`ExpoGoMapFallback`) — unchanged |

### WebView map contract

- **Style:** `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json` — same as native `defaultStyles.light` in `frontend/src/components/ui/map.tsx`.
- **Polyline color:** `colors.primary` (`#009540`) from session-tracking tokens.
- **Coordinates:** `[longitude, latitude]` — matches `RouteCoordinate` in `liveSessionStore` / `utils/geo.ts`; no axis flip.
- **Updates:** React Native pushes route + current position via `WebView.injectJavaScript` on `routeCoordinates`, `currentCoordinate`, and `mapRecenterToken` changes from `useLiveSession()`.
- **Read-only variant:** `SessionRouteMapPreviewWebView` for submission confirmation / session detail — `fitBounds` to recorded polyline, no live marker.
- **Event detail variant (2026-07-17):** `EventLocationMapWebView` — non-interactive Carto Voyager pin preview on `/event-detail`; tap overlay opens Apple Maps (iOS) or Google Maps (Android) via `openLocationInMaps`.

### Integration point

In `LiveSessionMap.tsx` and `SessionRouteMapPreview.tsx`, replace the single Expo Go fallback with:

```
isExpoGo → WebView map
Platform.OS === 'web' → placeholder
else → native MapLibre (lazy require)
```

## Consequences

- **Positive:** Real map tiles + live route in Expo Go without EAS build or Apple Developer account.
- **Positive:** Visual parity with native MapLibre (same Carto style and brand polyline).
- **Positive:** GPS tracking logic unchanged — only the rendering layer differs.
- **Negative:** Requires network for CDN (MapLibre GL JS) and Carto tiles — not offline-capable.
- **Negative:** Slight latency on `injectJavaScript` route updates; mitigated by existing `MIN_ROUTE_SAMPLE_METERS` throttling in `liveSessionStore`.
- **Follow-up:** Bundle MapLibre GL JS as a local asset if CDN reliability is a concern; native MapLibre remains the production path after EAS builds.
- **Follow-up (2026-07-15):** Once EAS dev-client builds are the norm for testing, evaluate retiring this WebView map tier (`LiveSessionMapWebView.tsx`, `SessionRouteMapPreviewWebView.tsx`, `webViewMapHelpers.ts`) entirely in favor of the native `mapcn-react-native` path already used by `LiveSessionMapNative.tsx` (`frontend/src/components/ui/map.tsx`). Not pursuing a rewrite to web `mapcn` ([mapcn.dev](https://www.mapcn.dev/)) for the WebView tier now — that library targets bundled React DOM apps, not this WebView's hand-rolled HTML string, and doesn't address basemap tile/style choices.

## Amendment (2026-07-18) — basemap styles in production use

The original decision referenced **Carto Positron** as the Standard style. Live tracking now uses:

| Layer / theme | Style |
|---------------|--------|
| Standard light | Carto **Voyager** |
| Standard dark | Carto **Dark Matter** (with park/landcover paint overrides — see `mapStyles.ts` / [map-theme-and-weather-icons.md](../frontend/specs/map-theme-and-weather-icons.md)) |
| Satellite / Hybrid | Esri World Imagery (+ transportation/labels for Hybrid) |

The WebView tier decision (Expo Go via MapLibre GL JS) is unchanged; only the default Standard tileset evolved for richer street/park detail.

## Alternatives considered

- **Placeholder only in Expo Go** — rejected; testers cannot validate map UX.
- **Leaflet + OSM raster tiles** — simpler but uses `[lat, lng]` (coordinate flip) and different visual style from native MapLibre.
- **Google Maps WebView** — requires GCP API key; rejected per no-key map policy.
- **EAS dev-client build now** — valid long-term; deferred to reduce setup friction for Expo Go testing.
