# System architecture

Mermaid overview of the Clean Up - Give Back monorepo: Expo app, Fly sessions API, Supabase, admin portal, client-only integrations, and deferred scaffolds.

**Scope:** There is one live backend HTTP service (`backend/sessions` on Fly). Maps and weather are client-side. `backend/maps` and `backend/payments` are scaffolds only. Admin is a separate Next.js app that talks mainly to Supabase.

Related: [current.md](current.md), [supabase.md](supabase.md), [backend/specs/sessions-api.md](backend/specs/sessions-api.md), [adr/ADR-004-sessions-backend-supabase-fly.md](adr/ADR-004-sessions-backend-supabase-fly.md), [adr/overview.md](adr/overview.md).

---

## Legend

| Style | Meaning |
|-------|---------|
| Solid edges | Live integration in production / test phase |
| Dotted edges | Optional, UI-only, or not fully wired |
| Deferred / scaffold | Directory or product surface exists; no runtime backend yet |

| Layer | Reality |
|-------|---------|
| Backend runtime | One service: Fastify in [`backend/sessions/`](../backend/sessions/) |
| Auth | Supabase volunteer JWT (email / Apple / Google); API verifies via JWKS |
| Photos | Client → Storage; API stores paths only |
| Maps / weather | No backend; MapLibre + Carto/Esri + Open-Meteo |
| Payments | Stripe Checkout on [`backend/sessions/`](../backend/sessions/) (`/payments/*`, `/webhooks/stripe`); tracker mock |
| Email | Resend live (`cleanupgiveback.org` verified); admin local + Fly secrets |
| Shipping | Shippo labels from Fly (`/shipping/*`, `/webhooks/shippo`); admin Buy label |
| Env | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_*`; Fly: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL` (+ optional `ADMIN_API_KEY` / service role) |

---

## 1. System context (all integrations)

```mermaid
flowchart TB
  subgraph clients [Clients]
    Expo["Expo app\nfrontend/"]
    Admin["Admin portal\nadmin/ Next.js :3001"]
  end

  subgraph fly [Fly.io example-sessions :8080]
    API["Fastify + Prisma\nbackend/sessions"]
  end

  subgraph supabase [Supabase]
    Auth["Auth\nvolunteer JWT"]
    PG[("Postgres\nsessions / checkpoints")]
    Store[("Storage\nsession-photos")]
    JWKS["JWKS\nES256 verify"]
  end

  subgraph clientOnly [Client-only SaaS / CDNs]
    OpenMeteo["Open-Meteo\nweather + reverse geocode"]
    Carto["Carto basemaps\nVoyager / Dark Matter"]
    Esri["Esri ArcGIS tiles\nsatellite / hybrid"]
    MapLibreCDN["unpkg MapLibre GL JS\nExpo Go WebView"]
    ExtMaps["Apple / Google Maps\ndeep links"]
  end

  subgraph external [Server integrations]
    Resend["Resend\ntransactional email"]
    Stripe["Stripe Checkout"]
    Shippo["Shippo USPS labels"]
  end

  subgraph deferred [Deferred / scaffold]
    MapsSvc["backend/maps/\nno runtime"]
    PaySvc["backend/sessions/payments\nStripe Checkout"]
    StripeUI["Shop/Donate UI\nhosted Checkout"]
  end

  Expo -->|"Bearer JWT"| API
  Expo --> Auth
  Expo -->|"upload + signed URLs"| Store
  Expo --> OpenMeteo
  Expo --> Carto
  Expo --> Esri
  Expo --> MapLibreCDN
  Expo --> ExtMaps
  Expo -->|"Bearer JWT checkout"| PaySvc
  Expo -.-> StripeUI

  Admin -->|"service role / table access"| PG
  Admin -->|"signed photo URLs"| Store
  Admin -.->|"optional X-Admin-Key"| API

  API --> JWKS
  API --> PG
  API --> Resend
  API --> Stripe
  API --> Shippo
```

---

## 2. Frontend internal structure

```mermaid
flowchart TB
  subgraph entry [Entry]
    Router["Expo Router\nsrc/app/"]
    Layout["_layout.tsx\nAuthProvider + gates"]
  end

  subgraph features [Features]
    ST["session-tracking\nliveSessionStore / maps / weather"]
    Figma["figma-screens\nhome shop account sessions"]
    Onb["onboarding\nonboardingStore"]
  end

  subgraph libs [Clients]
    Api["lib/api.ts\napiFetch"]
    SessApi["lib/sessionsApi.ts"]
    EmailApi["lib/emailsApi.ts"]
    Sb["lib/supabase.ts"]
    Upload["uploadCheckpointPhotos"]
  end

  subgraph native [Device]
    Loc["expo-location\n+ TaskManager BG GPS"]
    Cam["expo-camera"]
    Notif["expo-notifications"]
    Cal["expo-calendar"]
  end

  Router --> Layout
  Layout --> ST
  Layout --> Figma
  Layout --> Onb
  ST --> Loc
  ST --> Cam
  ST --> Notif
  Figma --> Cal
  ST --> SessApi
  ST --> Upload
  Figma --> EmailApi
  SessApi --> Api
  EmailApi --> Api
  Layout --> Sb
  Upload --> Sb
```

---

## 3. Sessions API surface

Base URL (prod): `https://sessions.example.com`. Auth: `Authorization: Bearer <supabase_access_token>` except `GET /health`.

```mermaid
flowchart LR
  Client["Expo / Admin"]

  subgraph routes [sessions.example.com]
    H["GET /health"]
    C["POST /sessions"]
    CP["POST /sessions/:id/checkpoints"]
    F["PATCH /sessions/:id/finalize"]
    L["GET /sessions"]
    G["GET /sessions/:id"]
    A["PATCH /sessions/:id/approval\n+ X-Admin-Key"]
    D["DELETE /sessions/:id"]
    ER["POST /emails/event-registration"]
    ECR["POST /emails/email-change/request"]
    ECC["POST /emails/email-change/confirm"]
  end

  Client --> H
  Client --> C
  Client --> CP
  Client --> F
  Client --> L
  Client --> G
  Client --> A
  Client --> D
  Client --> ER
  Client --> ECR
  Client --> ECC
```

Full contract: [backend/specs/sessions-api.md](backend/specs/sessions-api.md).

---

## 4. Live session data flow

```mermaid
sequenceDiagram
  participant App as Expo app
  participant SbAuth as Supabase Auth
  participant Fly as Fly sessions API
  participant PG as Supabase Postgres
  participant Stor as Supabase Storage
  participant OM as Open-Meteo
  participant Map as MapLibre tiles

  App->>SbAuth: signInWithPassword / Apple / Google
  SbAuth-->>App: access_token
  App->>Fly: POST /sessions Bearer JWT
  Fly->>PG: insert session active
  App->>Map: render trail basemap
  App->>OM: forecast + reverse geocode
  loop GPS fixes
    App->>App: Kalman + route append local
  end
  App->>Stor: upload selfie + progress
  App->>Fly: POST /checkpoints paths
  Fly->>PG: insert checkpoint
  App->>Fly: PATCH /finalize route + miles
  Fly->>PG: status under_review
```

GPS is client-owned mid-session; the finalized polyline is persisted on `PATCH /sessions/:id/finalize`.
