# Figma Compliance Screen Gap Audit

**Date:** 2026-06-30 (original audit) · **updated 2026-08-09** (Figma catch-up sync, see ADR-002 consequences)  
**Figma file:** `DrDcQH14n7ntDQ80F7au9S`  
**Baseline inventory:** 33 screens in [manifest.yaml](../../frontend/design/figma/manifest.yaml)  
**Target inventory:** 46 screens (+13 new routeKeys) — superseded 2026-08-09, manifest now tracks 81 entries against 71 live routes

> **2026-08-09 update:** `age-gate`, all 3 `parental-consent-*` routeKeys, and `teen-privacy-notice` were removed from `manifest.yaml` entirely per product decision — out of scope, consistent with this audit's own "Not shipping" calls below for their siblings. The `account-privacy` hub and `privacy-permissions` remain tracked as `missing` (net-new design, not yet built). The privacy-policy screen tree (`privacy-policy` + 4 sub-pages) and `request-data`/`request-data-sent` are confirmed **implemented** as of 2026-08-09 — see manifest for current node ids. This audit's original tables below are left as historical record of the 2026-06-30 planning pass; treat `manifest.yaml` as the current source of truth for what's actually built.

---

## Executive summary

| Status | Count |
|--------|-------|
| Existing screens (unchanged) | 33 |
| **New screens to design** | 0 (13 designed 2026-06-30) |
| Existing screens needing updates | 7 (pending approval) |

---

## Existing coverage vs gaps

| Compliance area | Existing screen | Gap |
|-----------------|-----------------|-----|
| Age verification | `account-details` + native `/under-age` | Pre-auth age-gate not shipped; under-13 blocked with PII wipe (`age < 13`) |
| Parental consent | — | **Not shipping** — under-13 block + wipe instead |
| Account privacy hub | `account` → Privacy row → `privacy-security` | No dedicated `account-privacy` hub |
| Privacy policy viewer | `settings` no-op link | No `privacy-policy` screen |
| Terms viewer | `settings` no-op link | No `terms-of-service` screen |
| OS permissions | `privacy-security` (mixed) | Should be `privacy-permissions` (§6.27 only) |
| CCPA rights | `export-service-record` only | No access/deletion request form |
| Account deletion | `settings` / `account` → welcome | No confirmation + re-auth |
| GPS indicator | `live-session` coachmark only | No persistent indicator spec |
| Signup legal acceptance | `create-account` | No checkbox |

---

## New screens to design

### Page 6 · Account & Settings (2 new)

| routeKey | PRD § | Priority | Entry | Acceptance criteria |
|----------|-------|----------|-------|---------------------|
| `account-privacy` | 6.37 | P0 | Account → Preferences → **Privacy** | Hub with: data summary, Privacy Policy + ToS links, rights rows (request data, deletion, export), permissions shortcut, do-not-sell line |
| `privacy-permissions` | 6.27 | P1 | `account-privacy` → App permissions | OS permissions only: Location, Camera, Notifications status + "Open Device Settings" |

### Page 7 · Compliance & Legal (11 new)

| routeKey | PRD § | Priority | Entry | Acceptance criteria |
|----------|-------|----------|-------|---------------------|
| `age-gate` | 6.0a | P0 | App first launch | Month + year pickers only; neutral copy; no other fields; Continue disabled until valid |
| `parental-consent-notice` | 6.0b | — | **Not shipping** (under-13 block + wipe) | — |
| `parental-consent-verify` | 6.0c | — | **Not shipping** | — |
| `parental-consent-pending` | 6.0d | — | Native `/under-age` for under-13 block | — |
| `teen-privacy-notice` | 6.0e | — | **Not shipping** — universal privacy defaults | — |
| `privacy-policy` | 6.31 | P0 | Hub, signup, Settings | Scrollable policy; last-updated date; accessible headings |
| `terms-of-service` | 6.32 | P0 | Hub, signup, Settings | Scrollable ToS |
| `privacy-rights-request` | 6.33 | P1 | Hub → Request my data / deletion | Form: request type, confirmation, SLA copy |
| `delete-account-confirm` | 6.35 | P0 | Delete Account buttons | Re-auth; retention exceptions; destructive confirm |
| `permission-location` | 6.10 | P1 | Pre-session | OS location permission explainer before session |
| `permission-camera` | 6.10 | P1 | Pre-checkpoint | OS camera permission explainer |

### P2 (future — not in manifest yet)

| routeKey | Notes |
|----------|-------|
| `app-store-age-restricted` | Apple/Google age API signal handling |
| `parental-consent-teen` | FL/UT under-18 consent if social features added |

### Component (not a full screen)

| Component | Parent screen | Requirement |
|-----------|---------------|-------------|
| `LocationTrackingIndicator` | `live-session` | Persistent banner/badge: "Location tracking active" for entire session |

---

## Target navigation

### Onboarding (compliance-first)

```text
account-details (birthday)
  ├── age < 13 → clear onboarding PII → /under-age
  └── age ≥ 13 → location-permission → …

(Future: pre-auth age-gate before PII — PRD §6.0a)
welcome → create-account → account-details → ...
```

### Account privacy hub

```text
Account tab (account)
  └── Preferences → Privacy
        └── account-privacy
              ├── privacy-policy
              ├── terms-of-service
              ├── privacy-rights-request
              ├── export-service-record (existing)
              ├── privacy-permissions
              └── delete-account-confirm
```

---

## `account-privacy` hub wireframe (design spec)

```text
┌─────────────────────────────────────┐
│ ← Privacy                           │
│                                     │
│ Your data                           │
│ ┌───────────────────────────────┐  │
│ │ We collect photos, location    │  │
│ │ during sessions, and account   │  │
│ │ info to verify service hours.  │  │
│ │ Learn more →                   │  │
│ └───────────────────────────────┘  │
│                                     │
│ Legal                               │
│ Privacy Policy                   >  │
│ Terms of Service                 >  │
│                                     │
│ Your rights                         │
│ Request my data                  >  │
│ Request deletion                 >  │
│ Export service record            >  │
│                                     │
│ Controls                            │
│ App permissions                  >  │
│                                     │
│ We do not sell your personal        │
│ information.                        │
└─────────────────────────────────────┘
```

---

## Existing screens — pending approval {#existing-screens-pending-approval}

> **Do not modify these files until product approves.** Listed for design/engineering planning.

| routeKey | File(s) | Proposed change |
|----------|---------|-----------------|
| `welcome` | `welcome___standardized_progress.html`, Figma frame | Only reachable after age-gate; optional Privacy Policy footer |
| `create-account` | `create_account___standardized_progress.html` | Add required ToS + Privacy checkbox with links |
| `account-details` | `account_details___standardized_progress.html` | Remove age field; optionally add address/phone |
| `account` | `account.html` | Wire Privacy row → `account-privacy` (currently → `privacy-security`) |
| `settings` | `settings.html` | Wire policy links to viewers; Delete Account → `delete-account-confirm` |
| `privacy-security` | `privacy_security.html` | Deprecate or split — auth/analytics to hub/Settings; permissions to `privacy-permissions` |
| `live-session` | Figma + PRD §6.11 | Add persistent location-tracking indicator component |

---

## PRD vs Stitch divergence

| PRD §6.27 | Stitch `privacy_security.html` |
|-----------|-------------------------------|
| OS permissions only | + email/password, 2FA, location history toggle, usage analytics, connected accounts |

**Decision:** New `account-privacy` hub for compliance; new `privacy-permissions` for §6.27; auth/analytics on hub (analytics) and Settings (auth). Full record: [privacy-screen-split-decision.md](privacy-screen-split-decision.md).

---

## Accessibility notes

- Age-gate pickers: labeled month/year; screen reader announces purpose
- Policy viewers: heading hierarchy, scrollable, sufficient contrast (see [a11y-audit](../a11y-audit-2026-06-30.md))
- Delete confirmation: focus trap, destructive action clearly labeled
- Location indicator: `accessibilityLiveRegion` when tracking starts/stops
