# Context: assets

Static media and bundled prototype HTML.

## Layout

| Path | Contents |
|------|----------|
| `frontend/assets/figma/` | **Per-screen Figma assets** — see [`figma/README.md`](../../../frontend/assets/figma/README.md) inventory |
| `frontend/assets/figma/onboarding/` | Onboarding — `welcome-hero.png`, decorative SVGs (logo/burst/underline), social + notification glyph SVGs, `question-icon.svg` (ported to `QuestionIcon`), `success-check.svg` (Figma `137:36`, ported to `AccountCreatedCheck`), `location-permission-illustration.svg` / `camera-permission-illustration.svg` (ported to `LocationPermissionIllustration` / `CameraPermissionIllustration`) |
| `frontend/assets/figma/tour/` | Tour illustrations — `home-stats.png`, `shop-showcase.png` (Trash Cleanup Kit product PNG, mint blob + transparent corners for forest-green tour bg), `track-map.png` (live map screenshot), `session-list.png` (session list screenshot); star/replay SVGs ported to `TourIcons.tsx` |
| `frontend/assets/figma/home-screen/` | Home dashboard glyphs + `nav/` SVGs (sources for `navigation/icons/*.tsx`) |
| `frontend/assets/figma/event-detail/` | Event detail icons + header/organizer/map media; `header.png` also used as Upcoming Events card thumb for matching mock events |
| `frontend/assets/figma/shop/` | Shop home product PNGs; flow subfolders `cart/`, `checkout/`, `confirmation/`, `donate/` (`thank-you-bags.webp` shop donate-card hero + contribute `hero.webp`), `product-detail/` (tote carousel: `tote-bags-photo-flatlay.png` + `tote-bags-photo.png` + `tote-{green,blue}-{planet-b,earth-friendly}.png`; Earth-and-Ocean swatch `tote-earth-ocean-swatch.svg` from Figma `1344:169`; kit/vest flatlays: `kit-hero-flatlay.png`, `adult-vest-flatlay.png`, `child-vest-flatlay.png`); ported glyph originals in `_source/` |
| `frontend/assets/figma/session-setup/` | Session setup form SVGs (`calendar`, `info-circle`, `back-chevron`) |
| `frontend/assets/figma/live-session/` | Live tracker map controls + CTA SVGs; temporary Map Types thumbnails (`map-type-standard.png`, `map-type-satellite.png`, `map-type-hybrid.png`); `map-theme-light.svg` / `map-theme-dark.svg`; `weather/` subset from Figma Weather Icons (wi) |
| `frontend/assets/figma/sessions-list/` | Sessions list SVGs (search, sort chevron, expand, meta-dot) |
| `frontend/assets/figma/sessions-calendar/` | Sessions calendar glyphs (designed) |
| `frontend/assets/figma/session-detail/` | Session detail SVGs (back, share, hours, miles, photos) |
| `frontend/assets/figma/account/` | Account tab + settings SVG icons; profile hero leaves from Figma `569:917`/`569:918` as `leaf-large.svg` / `leaf-small.svg` (rotated −75° / −50° in `AccountScreen`); Give Feedback row is label + chevron only (`give-feedback.svg` retained in assets) |
| `frontend/assets/figma/feedback-screen/` | `FeedbackScreen` assets (Figma `1126:1516`) — rating glyphs `very-sad`/`sad`/`neutral`/`happy`/`excited.svg` shown L→R negative→positive (`fill="#BDCABA"`; `very-sad` hand-authored); header `chat.svg` + typing dots `big-bubble`/`medium-bubble`/`small-bubble.svg`; unused PNG exports (`chat-bubble.png`, `sparkle-*.png`) also live here |
| `frontend/assets/figma/shared/` | Cross-screen brand mark / leftover vectors |
| `frontend/assets/figma/{photo-checkpoint,photo-submitted,missed-checkpoint,submission-confirmation,permissions}/` | Pointers to raster/animation companions |
| `frontend/assets/images/logos/` | Org logos for letterhead/PDF — `logo-letterhead.png` (CUPGB lockup, forest green; regenerate with `backend/sessions/scripts/render-letterhead-logo.mjs`), `REMOVED` (canonical); copies deployed with Fly API in `backend/sessions/assets/` |
| `frontend/assets/images/` | App icons, product/scene images (`scenes/volunteers.png` + `screens/session-detail/photo-*.png` reused as Upcoming Events card thumbs); `tidy-man-statue.png` — reference photo of the physical Garbagio (green tidy-man trash-bag holder) |
| `frontend/assets/images/screens/<screen>/` | Per-flow rasters — `session-setup/`, `permissions/`, `photo-checkpoint/`, `photo-submitted/`, `missed-checkpoint/`, `submission-confirmation/`, `session-detail/` |
| `frontend/assets/animations/` | Motion exports — `garbagio.mp4` + `garbagio-poster.jpg` + `garbagio-end.jpg` (session-finalize loader: letterbox-only crop to 720×960 3:4, muted; top 75% `cover` with green linear blend; playback pauses 2s before EOS, then `VideoView` unmounts and `garbagio-end.jpg` replaces it so native rewind to frame 0 never shows; cream Sanchez label **Saving your session. Meet our mascot, Garbagio, in the meantime!**; Metro `assetExts` includes `mp4`), `photo-submitted.lottie` (Camera Pop-Up, repeater-baked for RN; Metro `assetExts` includes `lottie`), `missed-checkpoint.json`, `hourglass.json` (free-trial paywall), leftover `broom.svg` / `cloud.svg` / `tidy-man-preview.html` / `tidy-man.json` from the superseded broom-sweep loader, `shipping.json` / `shipping.svg` (order-email truck; transparent GIF is the email-safe render), plus alt JSON/GIF sources |
| `frontend/assets/sounds/` | Short UI alert clips — `photo-checkpoint-alert.wav` (played when the 30-min checkpoint popup appears) |
| `frontend/assets/stitch/` | Stitch HTML screens bundled into the app (**legacy — frozen**) |
| `frontend/assets/expo.icon/` | iOS app icon asset catalog |
| `frontend/design/` | Design-time artifacts (not all bundled into the app) |
| `frontend/design/figma/` | **Figma ground-truth workspace** — manifest, page notes, token exports |
| `frontend/design/figma/exports/library/` | Raw Figma assets-library dump (design-time only; not Metro-bundled) |
| `frontend/design/stitch_htmls/` | Stitch HTML source files (**legacy — frozen**) |
| `frontend/design/html_prototype/` | Processed HTML prototype copies (**legacy — frozen**) |
| `frontend/design/tokens/` | Tailwind token config (Stitch-era, superseded by Figma variables) |

## Patterns

- **Active (Figma-to-native path):** Figma cloud → `design/figma/manifest.yaml` → RN screen at `src/app/<routeKey>.tsx`
- **Per-screen assets:** icons/media for a screen live under `assets/figma/<screen>/` (and matching `images/screens/<screen>/` for rasters)
- **Legacy (frozen):** Stitch → `design/stitch_htmls/` → scripts → `assets/stitch/` → WebView prototype at `/prototype/[screen]`
- Prototype HTML consumed via `require('../../../assets/stitch/<name>.html')` from `src/app/prototype/` — do not add new entries
- Re-sync dump → folders: `python3 frontend/scripts/organize_screen_assets.py`

## Policies

- Do not commit generated secrets or credentials alongside assets
- Keep filenames stable when registered in `HTML_MAP` — renames break `require()` keys
- **Do not add new screens to `HTML_MAP`.** New screens are registered in `frontend/design/figma/manifest.yaml` and implemented as native RN
- The `.fig` Figma binary is never committed — the cloud file is canonical
- Large binary exports (PNG/SVG) go in `design/figma/exports/`; only commit when needed for offline review
- **Do not `require()` from `design/figma/exports/library/`** — copy into `assets/figma/<screen>/` first
- Prefer kebab-case asset filenames; port SVG glyphs to `react-native-svg` when Metro/`expo-image` cannot render raw SVG requires
