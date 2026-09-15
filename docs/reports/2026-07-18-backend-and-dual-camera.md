# Report: Backend overview & dual-camera production stance

**Date:** 2026-07-18  
**Source:** Chat session (backend structure Q&A → Fastify/Prisma/Fly → dual-cam crash → App Store recommendation)  
**Status:** Guidance recorded; **code now defaults to sequential** (2026-07-18 Session 181). DualCapture remains in file but is not mounted.

---

## 1. Backend structure (current)

The monorepo splits backend work by domain under `backend/`. Matching living docs live in `docs/backend/context/`.

| Folder | Status | Role |
|--------|--------|------|
| `backend/sessions/` | **Implemented** | Session lifecycle, checkpoints, approval API |
| `backend/maps/` | Scaffold only | Planned maps service; v1 GPS stays on the client |
| `backend/payments/` | Scaffold only | Planned shop / donations |

### Sessions service (the live API)

- **Stack:** Fastify + Prisma + Supabase Postgres  
- **Host:** Fly.io (`https://sessions.example.com`)  
- **Code:** `backend/sessions/src/` (`server.ts`, `auth.ts`, `prisma.ts`, `routes/sessions.ts`)  
- **Schema:** `Session` + `Checkpoint` in `prisma/schema.prisma`  
- **Auth:** Supabase JWT (JWKS / ES256) for user routes; admin approval via `X-Admin-Key`  
- **Photos:** Client uploads to Supabase Storage; API stores paths only  

**Note:** Root `backend/README.md` updated 2026-07-18 — sessions service marked live; maps/payments remain scaffold.

### Maps & payments

- **Maps:** Client-owned GPS (`liveSessionStore` + MapLibre). Sessions API persists finalized route polyline on finalize — no separate maps microservice for v1.  
- **Payments:** Empty scaffold; provider TBD.

---

## 2. Fastify, Prisma, Fly.io (roles)

| Piece | Job in this project |
|-------|---------------------|
| **Fastify** | HTTP API framework — routes, CORS, `/health`, session handlers |
| **Prisma** | Typed DB access to Supabase Postgres from `schema.prisma` |
| **Fly.io** | Runs the Fastify container in production; secrets hold `DATABASE_URL` / `SUPABASE_URL` |

Mental model: Fastify serves the API → Prisma reads/writes the DB → Fly keeps the process online.

---

## 3. Dual-camera capture — do all phones support it?

**No.** Simultaneous front + back capture is a **hardware/OS** capability, not a software guarantee.

### What the app means by “dual”

VisionCamera v5 multi-cam session (`createCameraSession(true)`), which maps to iOS `AVCaptureMultiCamSession` (and Android equivalents where available). That is **not** the same as a phone having multiple back lenses (wide + ultra-wide).

### Support gate in code

`frontend/src/utils/checkMultiCamSupport.ts` requires:

1. Camera permission  
2. `VisionCamera.supportsMultiCamSessions === true`  
3. A front + back pair in `supportedMultiCamDeviceCombinations`  

Rough expectations:

- **iPhone:** typically A12+ (XS / XR and newer) for multi-cam sessions; older devices fail the check.  
- **Android:** fragmented — many devices unsupported or flaky.  

### Current UX path (`PhotoCaptureScreen`) — updated 2026-07-18

1. **Always mount `SequentialCapture`** (front selfie → back progress); shutter gated on camera ready; capture errors Alert + inline.  
2. **`DualCapture`** remains in the file (8s readiness timeout + JS error → sequential) but is **not rendered** until Fabric/Nitro HybridObject serialization is fixed.  
3. Do **not** treat “try dual, catch in JS” as App Store-safe — native SIGABRT bypasses the fallback.

### Observed issue (dev build)

Development build **crashes when tapping the shutter** on the dual path. Preview can appear fine; native failure during simultaneous photo capture is consistent with known VisionCamera / AVFoundation multi-cam fragility.

**Critical limitation:** JS `try/catch` and the sequential fallback **do not** run if the process dies from a **native** crash (SIGABRT / assert). App Store crash metrics would count those as hard failures.

---

## 4. App Store / production recommendation

**Ship sequential capture as the production default.** Dual simultaneous capture is optional polish, not the core product loop.

### Why

| Factor | Implication |
|--------|-------------|
| Crash risk | Native multi-cam photo crashes cannot be caught in JS |
| Device coverage | Dual is unavailable or unreliable on many phones |
| Product value | Checkpoint needs selfie + cleanup evidence, not same-millisecond dual shutter |
| Review / ratings | Crash-free users matter more than PiP dual UX for v1 |

### Recommended policy

1. **Default to `SequentialCapture` in production builds.**  
2. Re-enable dual only behind a **strict** gate *and* preferably a **remote / build flag**, after smoke tests on older (A12/A13) and recent Pro devices.  
3. Do **not** rely on “try dual, fall back on error” as the sole safety net for App Store stability.  
4. After any dual re-enable, watch crash free users for PhotoCapture / VisionCamera symbols.

### Framing for users

Sequential (clear two-step coachmarks, or auto-advance after selfie) is an acceptable App Store v1 experience. Users care that checkpoint photos save.

---

## 5. Related code & docs

| Path | Relevance |
|------|-----------|
| `frontend/src/screens/PhotoCaptureScreen.tsx` | `DualCapture` / `SequentialCapture` |
| `frontend/src/utils/checkMultiCamSupport.ts` | Pre-flight multi-cam check |
| `docs/frontend/context/app.md` | `/photo-capture` — sequential default documented |
| `docs/frontend/specs/photo-checkpoint-dual-capture.md` | Spec aligned to sequential-first |
| `docs/backend/context/sessions.md` | Live sessions API surface |
| `backend/sessions/README.md` | Local + Fly deploy |

---

## 6. Recommended follow-up

- [x] Change production default to sequential (always mount `SequentialCapture`).  
- [x] Update `docs/frontend/context/app.md` `/photo-capture` row to match.  
- [ ] Optional: remote kill-switch if dual is re-enabled after release.  
- [x] Refresh outdated “scaffold only” wording in `backend/README.md`.

---

## 7. Session also covered (ops)

During the same timeframe, commits were pushed to `main` for Vision Camera v5 migration notes / iOS user-script sandboxing (`docs/progress.md`, `frontend/app.json`, later `withUserScriptSandboxingDisabled` Expo config plugin). Those are orthogonal to the dual-cam production stance above.
