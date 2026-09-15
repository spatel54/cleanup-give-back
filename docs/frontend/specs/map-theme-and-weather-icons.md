# Spec: Standard map light/dark theme + weather icons

## Summary

Live tracker Standard basemap supports light (Carto Voyager) and dark (Carto Dark Matter). Theme defaults to **time of day** (dark 7:00 PM–5:59 AM local). Users can toggle on the map (turns off auto) or use Account → Preferences → **Map theme follows time of day**. Weather pill icon reflects Open-Meteo `weather_code` (+ `is_day`) via Weather Icons (`react-icons/wi`, same set as Figma node `2:78993`), all scaled to Figma-style `0 0 24 24`.

## User stories

- As a volunteer, I want the Standard map to go dark at night so evening cleanups are easier on the eyes.
- As a volunteer, I want a sun/moon control on the live map so I can override light/dark quickly.
- As a volunteer, I want Account settings to choose whether the map follows time of day.
- As a volunteer, I want the temperature glyph to match current conditions (sunny, cloudy, rain, etc.).

## Acceptance criteria

- [x] **AC-1:** Standard basemap switches Voyager ↔ Dark Matter; Satellite/Hybrid unchanged by theme
- [x] **AC-2:** Default: theme follows local time (dark 19:00–05:59); persists via AsyncStorage
- [x] **AC-3:** Live map tool toggles theme (moon when dark / sun when light — icon matches active theme); pressed + active states use brand mint/primary
- [x] **AC-4:** Manual toggle sets `followTimeOfDay` false and persists `manualTheme`
- [x] **AC-5:** Account Preferences toggle restores/disables time-of-day follow
- [x] **AC-6:** Weather pill uses condition icon from Open-Meteo WMO code (+ `is_day` for day/night glyphs)
- [x] **AC-7:** Works on Expo Go WebView and native MapLibre paths
- [x] **AC-8:** Dark Matter parks, nature reserves, and green landcover (wood/grass/recreation ground) are repainted a legible dark green — upstream Dark Matter renders them the same near-black as the background
- [x] **AC-9:** Named local parks (e.g. Devonshire Park; `class == "park"` in Carto's `park` source-layer) render as a shaded fill in dark mode, not just a point label — upstream style (both themes) only ships a fill layer for `national_park`/`nature_reserve` classes
- [x] **AC-10:** Live tracker overlay chrome (timer card, location pill, compass, map tools, checkpoint card, CTAs, Map Types sheet) follows the same effective map theme as the basemap — dark mode uses near-black surfaces + light type (intentional brand deviation for night contrast)
- [x] **AC-11:** All live weather glyphs from Weather Icons (`react-icons/wi`), scaled to Figma-style `0 0 24 24`; day/night + hail/sleet; pill uses `WeatherConditionIcon` + Open-Meteo WMO / `is_day`

## Out of scope

- App-wide chrome dark mode (outside the live tracker)
- Custom sunrise/sunset by coordinates
- Full ~220 Weather Icons catalog (moon phases, directions, etc.)

## Dependencies

- Carto Dark Matter GL style, vendored locally at `frontend/src/features/session-tracking/utils/cartoDarkMatterStyle.json` (sources/sprite/glyphs still point at Carto's CDN; only `layers` styling is local) so `park_national_park`, `park_nature_reserve`, `landcover` (wood/grass/recreation_ground), and the `poi_park` label can be repainted, and a synthetic `park_local` fill layer can be inserted to cover named local parks that the stock style never fills (any `park` source-layer feature that isn't `national_park`/`nature_reserve`) — see `buildCartoDarkMatterStyle()` in `mapStyles.ts`. Carto Voyager (light) still loads by URL and keeps the upstream gap (no fill for local parks) since only dark mode was reported as hard to read.
- Open-Meteo `current=temperature_2m,weather_code,is_day`
- Weather Icons paths in `frontend/src/features/session-tracking/utils/weatherIconPaths.ts` (react-icons@5.5.0 `/wi`, scaled to viewBox `0 0 24 24` to match prior Figma extract presentation) — same library as Figma [Weather Icons node 2:78993](https://www.figma.com/design/QJZGbrXDPi86smOSecdF7s/Ultimate-React-Icons-Library-for-Figma-%E2%80%93-21-000--Icons-from-20--Popular-Libraries---Community-?node-id=2-78993)
