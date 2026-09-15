# Privacy and Data Protection Framework

**Date:** 2026-06-30  
**Status:** Engineering requirements — **requires qualified legal counsel review before launch**  
**Audience:** Product, engineering, design, operations

> This document is not legal advice. It translates product and engineering requirements for nationwide privacy compliance. Final policy text, consent mechanisms, and retention periods must be approved by counsel.

## Related documents

| Document | Purpose |
|----------|---------|
| [launch-checklist.md](launch-checklist.md) | Launch board (privacy, security, rights, store) + §11 frameworks/audits/seals |
| [mobile-app-privacy-policy-outline.md](mobile-app-privacy-policy-outline.md) | Teen-friendly policy outline (not final legal text) |
| [figma-compliance-screen-gap-audit.md](figma-compliance-screen-gap-audit.md) | Figma audit + new screen specs |
| [../backend/specs/privacy-and-data-rights.md](../backend/specs/privacy-and-data-rights.md) | Supabase deletion, export, retention |
| [../adr/ADR-003-minor-data-protection-baseline.md](../adr/ADR-003-minor-data-protection-baseline.md) | Architecture decision: strictest-baseline approach |
| [../frontend/specs/privacy-compliance-prd-addendum.md](../frontend/specs/privacy-compliance-prd-addendum.md) | New PRD sections (§6.0a–6.37) |

---

## 1. Scope

Clean Up - Give Back collects highly sensitive personal information to verify community service hours, including for court-ordered participants. Our target audience includes school and youth groups. We must comply with federal law (COPPA), state minor-privacy laws (CA AADC, CT, MD, NJ, and others), consumer privacy laws (CCPA/CPRA and equivalents), and emerging App Store age-verification requirements (TX, UT, LA).

**Strategy:** Adopt the **strictest baseline nationwide** — one app build, one policy posture, no state-specific forks unless counsel requires otherwise.

501(c)(3) status does **not** exempt us when we distribute via commercial app stores, use third-party processors, or operate in states with minor data laws.

---

## 2. Data inventory

### 2.1 Categories collected

| Category | Examples | Legal sensitivity |
|----------|----------|-------------------|
| **Identifiers** | Legal name, email, phone, street address, unique participant ID | High |
| **Account credentials** | Password (hashed), auth tokens | High |
| **Sensory / visual** | Live selfies (safety vest), hourly selfies (court-ordered), trash-bag photos | High — COPPA personal information |
| **Precise geolocation** | GPS walking path during active sessions (client `expo-location`; MapLibre / Carto / Esri tiles for display) | High — COPPA personal information |
| **Service metadata** | Session duration, court-ordered flag, approval status | Medium |
| **Payment** | Stripe checkout for $49.99 app payment, shop, donations | High — PCI via Stripe |

### 2.2 Business purposes

| Purpose | Data used |
|---------|-----------|
| Verify community service hours | GPS path, photos, session timestamps |
| Fraud prevention | Identity fields, evidence photos, geolocation consistency |
| Court-ordered compliance | Hourly selfies, extended retention where legally required |
| Account management | Registration data, auth |
| Payments | Stripe-processed transaction data |

### 2.3 Third-party processors

| Processor | Data shared | Purpose |
|-----------|-------------|---------|
| **Supabase** | Auth, profiles, session records, photo storage | Backend, database, file storage |
| **MapLibre + Carto / Esri** | Map tiles only (no personal data to tile vendors beyond IP for CDN) | Route display during / after sessions |
| **Open-Meteo** | Approximate coordinates for weather / reverse geocode during live session | Live session location pill |
| **Stripe** | Payment identifiers, transaction metadata | App payment, shop, donations |
| **Apple / Google** | Age-verification signals (ephemeral) | App Store compliance — **do not persist beyond session need** |
| **Expo / EAS** | Build metadata, crash logs (if enabled) | App distribution |

All processors must be bound by agreements requiring appropriate security controls and confidentiality (DPAs / BAAs as applicable).

---

## 3. Minor protection

### 3.1 Children under 13 (COPPA)

Under COPPA, photos containing a child's image and precise geolocation are **personal information**. **Shipped product behavior:**

- Minimum age **13** (COPPA “under 13” standard: block when `age < 13`).
- Users who are under 13 cannot create an account. The app shows `/under-age` and **immediately clears** signup/onboarding PII from client memory (name, email, phone, birthday, service type).
- **No parental-consent collection flow** in the current app (deferred; counsel if product revisits).

When backend auth exists, under-13 attempts must not persist profile rows or auth users.

### 3.2 Teens 13–17 (state laws)

States including California (AADC), Connecticut, Maryland, and New Jersey require privacy by design and plain-language notices for minors. We meet teen-law **default-settings** expectations by applying **the same highest-privacy defaults to every user age 13+** — not a separate teen tier:

- **Privacy by design** — highest privacy settings by default for all accounts.
- **No dark patterns** — no manipulative UI encouraging users to give up privacy (app-wide, all ages).
- **Plain-language notices** — policies readable by teenagers.

There is **no** `privacy_tier = teen` in the product; analytics/marketing toggles are opt-in for everyone.

**Session photos:** volunteers aged 13–17 can track GPS and hours, but start / checkpoint / end camera is off (`canUseSessionPhotos()`). Only 18+ use checkpoint photos. Account profile photo is not gated. Spec: [minor-session-photos.md](../frontend/specs/minor-session-photos.md).

### 3.3 App Store age-verification APIs

Emerging laws (TX, UT, LA) require integration with Apple Declared Age Range API and Google Play age signals. When the store informs us a user is a minor:

- Ingest the age signal for enforcement.
- Apply age restrictions immediately.
- **Delete age-verification payload** after use — do not store long-term.

---

## 4. Nationwide compliance controls

### 4.1 Age check (signup)

Today (native onboarding):

- Birthday month/year on **account-details** (after name, email, phone in current flow).
- **Under 13** → clear onboarding PII immediately → `/under-age` (halt).
- **13+** → continue permissions and signup.

**Future:** neutral pre-auth month/year screen before any other PII (PRD §6.0a).

### 4.2 Parental consent flow (deferred)

Not shipped. Under-13 users are blocked with data wipe rather than held for parent verification.

### 4.3 Session-only geolocation

- Track location **only during active cleanup sessions**.
- **No background tracking** when session is inactive. During an **active** cleanup session, Always location may be used so the route continues when the screen is locked; tracking stops on finalize/cancel.
- Display an **obvious visual indicator** for the entire duration of location collection (banner/badge on live session screen).

### 4.4 Highest privacy defaults

All profiles use the same highest privacy level (notification categories default **off**; user opts in). No teen-only tier or badge.

### 4.5 Account-tab privacy hub

Users access privacy controls from **Account → Preferences → Privacy** → `account-privacy` hub (PRD §6.37). See [figma-compliance-screen-gap-audit.md](figma-compliance-screen-gap-audit.md).

---

## 5. General compliance (all users)

### 5.1 CCPA / CPRA baseline rights

Afford all users:

| Right | Implementation |
|-------|----------------|
| **Access & portability** | `privacy-rights-request` + `export-service-record` |
| **Deletion** | `delete-account-confirm` + backend cascade delete |
| **Do not sell** | Policy states we do not sell PI; hub displays affirmation |
| **Non-discrimination** | No service denial for exercising rights |

Deletion may retain data where necessary to complete transactions, detect security incidents, or comply with legal obligations (e.g., court-ordered service logs).

### 5.2 Data minimization

Collect and retain only what is necessary. Purge GPS path points after verification window (duration TBD with counsel).

### 5.3 Mobile App Privacy Policy

A teen-friendly privacy policy must be:

- Linked on the app home screen (optional footer).
- Linked at account creation (required checkbox).
- Accessible from Account → Privacy hub and Settings → About.

Outline: [mobile-app-privacy-policy-outline.md](mobile-app-privacy-policy-outline.md).

---

## 6. Information security (ISMS)

### 6.1 Technical safeguards

| Control | Requirement |
|---------|-------------|
| **Access controls** | Restrict backend/admin dashboards; role-based access |
| **Authentication** | Secure log-on; quality password requirements via Supabase Auth |
| **Encryption** | TLS in transit; encrypted storage at rest (Supabase default) |
| **Third-party security** | DPAs with Supabase, Stripe, Google |
| **Retention & disposal** | Written retention policy; secure deletion on account erasure |

### 6.2 Backend day-one

See [../backend/specs/privacy-and-data-rights.md](../backend/specs/privacy-and-data-rights.md).

---

## 7. Retention schedule (draft — counsel to finalize)

| Data type | Draft retention | Notes |
|-----------|-----------------|-------|
| GPS path points | Until session verified + 90 days | Purge after verification window |
| Session photos | Until session approved + 1 year | Court-ordered may require longer |
| Account profile | Life of account + 30 days post-deletion | Grace period for recovery |
| Court-ordered logs | Per court/legal requirement | May override deletion requests |
| Payment records | 7 years | Tax/accounting — via Stripe |
| Age-verification signals | Session only | Never persist |

---

## 8. Data Protection Impact Assessment (DPIA) outline

### 8.1 Risks to children

| Risk | Mitigation |
|------|------------|
| Physical tracking of minors | Session-only GPS; visible Live indicator; background GPS only while session active |
| Photos of minors stored insecurely | Supabase Storage RLS; encrypted at rest; access logging |
| Unauthorized access to child data | Parental consent gate; RLS; admin access controls |
| Dark patterns reducing privacy | Highest defaults; no manipulative consent UI |
| Data breach | ISMS controls; incident response plan; notification procedures |

### 8.2 Sign-off checklist

- [ ] DPIA document completed
- [ ] Engineering mitigations implemented
- [ ] Legal review of policy and consent flows
- [ ] App Store privacy nutrition labels accurate
- [ ] Counsel sign-off before public launch

---

## 9. Open product decisions

| # | Decision | Owner |
|---|----------|-------|
| 1 | Court-ordered users under 13 — allowed with parental consent + court docs? | Product + counsel |
| 2 | Parental consent verification method (card / form / third-party COPPA service) | Counsel |
| 3 | Registration fields — confirm address + phone in signup scope | Product |
| 4 | `privacy-security` split — auth/analytics placement | **Resolved** — see [privacy-screen-split-decision.md](privacy-screen-split-decision.md) |
| 5 | Policy hosting — in-app WebView vs hosted URL | Product + counsel |
| 6 | Settings About vs hub — duplicate Privacy Policy / ToS links? | **Resolved** — keep both entry points |

---

## 10. Existing screens — changes pending approval

The following **existing** screens require updates. **Do not modify until product approves.** Details in [figma-compliance-screen-gap-audit.md](figma-compliance-screen-gap-audit.md#existing-screens-pending-approval).

| Screen | Proposed change |
|--------|-----------------|
| `welcome` | Entry only after age-gate; optional Privacy Policy link |
| `create-account` | Legal acceptance checkbox |
| `account-details` | Remove age field (moved to age-gate) |
| `account` | Privacy row → `account-privacy` hub |
| `settings` | Wire policy links; Delete → confirm flow |
| `privacy-security` | Split into hub + `privacy-permissions` |
| `live-session` | Persistent location-tracking indicator |
