# Mobile App Privacy Policy — Outline

**Date:** 2026-07-23  
**Effective:** 2026-07-20  
**Status:** Draft product copy for counsel — **not final legal text**  
**Parent:** [privacy-and-data-protection.md](privacy-and-data-protection.md)  
**Launch board:** [launch-checklist.md](launch-checklist.md)  
**In-app source:** [`frontend/src/features/figma-screens/content/privacyPolicyContent.ts`](../../frontend/src/features/figma-screens/content/privacyPolicyContent.ts)

> Write in plain language a teenager can understand. Counsel must review and finalize before publication.

---

## Required sections

### 1. Who we are

- Clean Up - Give Back (501(c)(3) nonprofit), Example City, IL
- Contact: privacy@example.org
- Effective date: July 20, 2026; last updated: July 23, 2026 at 5:17 PM CDT

### 2. What this policy covers

- The mobile app (iOS and Android)
- Volunteers and court-ordered participants tracking/verifying community service hours
- Data minimization: only what is needed to operate the app and verify hours

### 3. Information we collect

#### 3.1 Account and service profile

- Legal name, email, phone, hashed password, anonymous/account user ID
- Court-ordered status, activity type, session descriptions, digital signatures
- Birth month and year only (age screening; no day of month)
- Mailing address when needed for shop / shipping

#### 3.2 Collected during active sessions

- **Precise location (GPS)** — route points only while a cleanup session is active
- Live selfies and proof-of-work photos (trash / completed work)

#### 3.3 Device, communications, and local data

- App version & OS; optional crash logs (Apple, Google, and/or Expo when enabled)
- Optional push notification tokens (Expo)
- Transactional email via Resend (registrations, email-change OTP, account notices)
- On-device session drafts, preferences, and cached records (not shared with third parties)

#### 3.4 Payment information

- Processed by Stripe — we do not store full card numbers

### 4. Why we collect it

| Data | Why |
|------|-----|
| Identity & account fields | Auth, account management, PDF service logs |
| Service profile & signatures | Program matching, fraud prevention, verification |
| Age month/year | COPPA eligibility (13+) |
| Selfies & photos | Verify physical presence and completed work |
| GPS path | Verify time, distance, route; fraud prevention |
| Payment / mailing | Shop, fees, donations |
| Diagnostics | Bugs and stability |
| Push / email | Opt-in alerts and operational notices |
| Local drafts | Offline use and interrupted-session recovery |

### 5. Who we share with

- **Supabase** — accounts, session metadata, photo storage
- **Fly.io** — Session API (sessions, finalized GPS routes, metadata) in the United States
- **Stripe** — payments and related AML checks
- **CARTO & Esri** — map tiles only (standard request metadata such as IP); not walking routes
- **MapLibre** — on-device open-source map rendering library
- **Open-Meteo** — approximate weather from starting coordinates; server logs purged within ~90 days
- **Resend** — transactional email
- **Expo** — app infrastructure and push token routing when enabled
- **Apple & Google** — OS permissions, store distribution, optional crash reporting
- **Authorized program/admin reviewers** — photos, routes, and logs for hour verification
- We **do not sell or rent** personal information
- Processors may use personal information only as needed to provide their services to Clean Up - Give Back — not to sell it or for their own advertising

### 6. Children and teens

#### Under 13

- App is not intended for children under 13
- Age screening uses birth month and year only
- Under 13 → account creation blocked; signup data purged from device; nothing stored on servers

#### Ages 13 and up

- Same high privacy defaults for all allowed users (non-essential features and notification categories are opt-in)
- No dark patterns to encourage oversharing; no segmented privacy tiers

### 7. How long we keep your data

| Data type | Standard retention |
|-----------|-------------------|
| GPS route paths | ~90 days after session verification |
| Photo evidence | ~1 year (unless law/court requires longer) |
| Payment records | Up to 7 years |
| Account information | Active account + standard grace period after closure |
| Court-ordered logs | As mandated by authorities / programs |

Also see [privacy-and-data-protection.md](privacy-and-data-protection.md) §7.

### 8. Your rights

- **Access & portability** — copy of personal data; export verified service history as PDF
- **Correction** — update inaccurate profile details
- **Deletion** — erase account/data subject to legal or court-mandated retention
- **Non-discrimination** — no degraded experience for exercising rights
- **Do not sell** — we do not sell or monetize personal information
- Exercise in-app: **Account → Preferences → Privacy**, or email privacy@example.org

### 9. Security

- TLS 1.2/1.3 in transit; encryption at rest
- Row-Level Security (RLS) so users access only their records
- Role-limited staff access for support, verification, security, or legal compliance
- No system is 100% secure — contact privacy@example.org if you suspect a problem

### 10. Location tracking

- Session-only: collection starts on explicit start (e.g. “Start Cleanup”); stops on finalize/cancel
- No tracking while idle or after session ends
- With Always location, route may continue while screen is locked **only** during an active session
- Prominent on-screen indicator whenever tracking is active
- MapLibre on-device; CARTO (standard) / Esri (satellite/hybrid) for tiles — not route storage

### 11. Changes to this policy

- Material updates (especially location or collection) via in-app notices or direct alerts

### 12. Contact us

- Email: privacy@example.org
- Mailing: Clean Up - Give Back, Example City, IL (full street address TBD)

---

## Placement in app

| Entry point | Requirement |
|-------------|-------------|
| Account → Privacy hub (`account-privacy`) | Prominent link |
| Account creation | Required checkbox before Continue |
| Settings → About | Link (may duplicate hub) |
| Home screen | Optional footer link |
| Policy viewers | `/privacy-policy` + four detail routes |

---

## Tone guidelines

- Short sentences
- Avoid legalese where plain words work
- Use "we" and "you"
- Define technical terms (GPS, selfie, session) on first use
- Age-appropriate reading level (target grade 8–10)
