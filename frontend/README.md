# Frontend

Expo React Native app for Clean Up - Give Back.

## Setup

```bash
npm install
npm start          # default tunnel — Wi‑Fi, hotspot, or cellular on phone
npm run start:lan  # same Wi‑Fi only (fast LAN)
npm run start:device   # tunnel (alias)
npm run start:tunnel   # tunnel (alias)
```

Networking details: [docs/frontend/specs/expo-go-dev-networking.md](../docs/frontend/specs/expo-go-dev-networking.md).

From repo root: `npm start` (delegates here).

## Layout

| Path | Purpose |
|------|---------|
| `src/app/` | Expo Router routes (thin wrappers) |
| `src/screens/` | Onboarding + session-tracking screen components |
| `src/features/figma-screens/` | Shop, account, home, sessions, events screens + mocks |
| `src/features/session-tracking/` | Live session store, map, checkpoint flow |
| `src/features/onboarding/` | Onboarding feature helpers |
| `src/components/` | Shared UI (nav, motion, onboarding chrome, session-setup) |
| `src/hooks/`, `src/constants/`, `src/motion/`, `src/lib/` | Theme, tokens, motion helpers |
| `assets/figma/<screen>/` | **Per-screen** Figma icons/media — see [`assets/figma/README.md`](assets/figma/README.md) |
| `assets/images/screens/<screen>/` | Per-flow raster illustrations / backgrounds |
| `assets/animations/` | Lottie / GIF motion exports |
| `assets/stitch/` | Legacy Stitch HTML (**frozen**) |
| `design/figma/` | Manifest, page notes, tokens, exports |
| `design/figma/exports/library/` | Raw Figma library dump (design-time only) |
| `prototype/` | TypeScript prototype (`EXPO_PROTOTYPE=1`) |
| `scripts/` | Asset organize + legacy Stitch tooling |

## Docs

- [docs/frontend/](../docs/frontend/) — specs, brand, context
- [docs/current.md](../docs/current.md) — what runs today

## Typecheck

```bash
npx tsc --noEmit
```

Note: `prototype/` may report pre-existing NativeWind/className errors; the shipped app uses `src/app/`.
