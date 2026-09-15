# Backend Plan (June 10 – July 15): Phased Roadmap

A clear backend roadmap for two developers, focusing on completing all PRD features for user testing in July and handoff to a non-profit. 

---

## Objective

- Deliver all backend features required for July user testing & smooth non-profit handoff.

## Timeline

- **4–5 weeks:** June 10 – July 15

---

## Legend

- 💚 **Free/No Payment** (local dev & free tiers)
- 💳 **Payment Required** (billing necessary, still affordable)
- ⚠️ **Billing May Be Enabled, $0 Possible** (e.g., Google Maps free tiers)

## Assumed Tech Stack
_Fastify • Prisma • Supabase (Postgres/Auth/Storage) • Railway (API hosting) • Stripe • EAS/Expo (native builds)_

---

# Phase Plan Overview

---

## Phase 0 — Foundation Setup  
**When:** Week 1 (June 10–16)   💚

- **Goals**
    - Both devs can run backend, DB, and see a shared API contract.
- **Backend Tasks**
    - Set up Supabase (with org email)
    - Draft Prisma schema
    - Implement Fastify skeleton with `/health` endpoint
    - Draft initial API spec (`docs/backend/specs/sessions-api.md`)
    - Establish local/Docker/Supabase DB connection
- **Frontend Tasks**
    - Configure `app.json` plugins (location, camera)
    - Integrate Auth UI (screens 1–6) with Supabase
    - Set up API client module + environment config
    - Decide on EAS dev build path
- **Notes**
    - Infra only, no user features
    - 💚 All free—create org accounts ASAP

---

## Phase 1 — Sessions Service & Database  
**When:** Week 1–2   💚

- **Goals**
    - Complete session logic via API (create, start, end, duration fetch)
- **Backend Tasks**
    - Implement `sessions` table
    - Add create → start → end logic (per PRD timing rules)
    - Status enums: draft → active → completed → under_review → approved/not_approved/invalid
- **Frontend Tasks**
    - Implement session setup & permissions (screens 9–11)
    - Integrate API calls for creation and start
- **Done When**
    - Sessions can be created/started/ended and queried via API
    - 💚 Using Supabase Postgres free tier

---

## Phase 2 — GPS & Maps  
**When:** Week 2 (June 17–23)   ⚠️💳

- **Goals**
    - Real-time GPS tracking & route persistence
- **Backend Tasks**
    - Add `track_points` table
    - Ingest batches of GPS points, calculate distance/polyline at end, associate to session
    - Handle photo uploads to Supabase Storage (metadata: timestamp, GPS)
    - Enforce checkpoint schedule: every 30 min; missed = `invalid`; block submit on invalid
- **Frontend Tasks**
    - Use `expo-location` for sampling
    - Implement live polyline & stopwatch (`started_at`)
    - Build Live Session screen (12)
    - Add photo checkpoints popup (13), camera capture, missed checkpoint/restart flows (14)
- **Done When**
    - Active session: photo checks enforced; missing window invalidates session; valid photos show up in review
    - 💚 Supabase Storage free tier should suffice for testers

---

## Phase 3 — Photos (see Phase 2 details)
_Photo upload, checkpoint, and validation logic is described within Phase 2 above._

---

## Phase 4 — Review, Submit, List, Admin Approval  
**When:** Week 3 (June 24–30)   💚

- **Goals**
    - Full post-session lifecycle after tracking completes
- **Backend Tasks**
    - Implement review endpoint (`GET /sessions/:id` with route/photos/times)
    - Implement submission (`POST /sessions/:id/submit`) → moves to `under_review`, locks record
    - Admin approval (`PATCH /sessions/:id/approval`): changes status, possibly via role/admin JWT
    - Listing + status filtering; home screen hours aggregation
- **Frontend Tasks**
    - Session Review (15), Submission Confirmation (16), Sessions List (17), Calendar (18), Detail (19)
- **Done When**
    - User can submit and see under review, admin can approve, status updates everywhere
    - 💚 Simple web admin/API tool for testing; no paid admin product needed

---

## Phase 5 — Shop, Donate, Stripe  
**When:** Week 3–4 (June 27 – July 4)   💳

- **Goals**
    - Commerce flows ready for user testing (PRD §6.19–6.24, 6.28–6.29)
- **Backend Tasks**
    - In `backend/payments/`: Set up Stripe Payment Intents
    - Add products/cart, donation workflows, Stripe webhooks, orders, and donation models
- **Frontend Tasks**
    - Build Shop home (20), Donate (21), Product Detail (22), Cart (23), Checkout (24)
    - Confirmation screens (25), Order/Donation History (29–30)
- **Done When**
    - Test purchase/donation completes; histories visible; Stripe email receipts if required
- **Payment Notes**
    - 💚 Use Stripe test mode (fake cards) for most July user testing
    - 💳 Live mode only for real payments (2.9% + $0.30/charge, no monthly fees)
    - Org must own Stripe account before handoff

---

## Phase 6 — Home, Account, Export, Polish  
**When:** Week 4 (July 1–7)   💚

- **Goals**
    - Wire up all remaining screens to real data
- **Backend Tasks**
    - Home stats (hours, impact metrics)
    - Export service record (PDF/CSV for approved sessions)
    - Persist notification preferences (optionally just a simple table)
- **Frontend Tasks**
    - Home (7), Event Detail (8), Account (26), Notification Settings (27), Privacy & Permissions (28), Export (31), bottom nav
    - Replace prototype HTML with native where needed
- **Done When**
    - All 31 screens in [screen-map.md](docs/frontend/screen-map.md) connected to live API
    - 💚 PDF gen on Railway is very low cost

---

## Phase 7 — Deploy & July User Testing  
**When:** Week 4–5 (July 7–15)   💳

- **Goals**
    - Production-ready environment, ready for testing & handoff
- **Key Tasks**

    | Task                                                            | Owner     |
    |---------------------------------------------------------------  |---------- |
    | Deploy API (Railway/Fly)                                        | Backend   |
    | Production Supabase environment (prod keys, same project)        | Backend   |
    | EAS preview/prod build, TestFlight, Play internal track         | Frontend  |
    | Complete `docs/accounts-and-access.md`: org owns all accounts   | Both      |
    | End-to-end test script for all critical flows                   | Both      |

- **User Testing Checklist**
    1. Sign up → onboarding → home
    2. Start session → GPS live → enforce photos → end → review → submit
    3. Missed checkpoint → invalid → restart flow
    4. Admin approves → visible in list/calendar/export
    5. Shop purchase & donate (test/live Stripe)
    6. View order/donation history & export service record

- **Payment & Costs Table (For User Testing):**

    | Item                  | Required?                      | Cost                          |
    |-----------------------|-------------------------------|-------------------------------|
    | Supabase              | Prod DB/auth/storage           | 💚 likely free tier           |
    | Railway/Fly           | API hosting                    | 💳 ~$5–$25/month              |
    | Apple Developer       | iOS TestFlight                 | 💳 $99/year (waiver possible) |
    | Google Play           | Android internal testing        | 💳 $25 one-time               |
    | EAS                   | Builds                         | 💚 free tier or $29/month     |
    | Google Maps           | Live maps                      | ⚠️ billing, often $0 in test  |
    | Stripe                | Checkout                       | 💚 test or 💳 live per charge  |

---

## Timeline at a Glance

```text
Jun 10–16   Phase 0–1   Foundation & Session API   💚
Jun 17–23   Phase 2     GPS/Maps                   ⚠️💳
Jun 20–27   Phase 3     Photos                     💚
Jun 24–30   Phase 4     Submit, Approval, Lists    💚
Jun 27–Jul4 Phase 5     Shop/Donate (Stripe)       💚/💳
Jul 1–7     Phase 6     Home, Account, Export      💚
Jul 7–15    Phase 7     Deploy, User Testing       💳
```
> _Note: Phases 2–5 intentionally overlap. Begin store accounts & EAS dev build in Week 1._

---

## Pre-July Purchases / Setup

**To buy & set up _before_ user testing:**
1. **Apple Developer** ($99) — required for iOS testers (real GPS/camera)
2. **Google Play** ($25) — Android testers
3. **Railway/Fly** ($5+) — hosted API
4. **GCP billing enabled** for Google Maps — often still $0 in test
5. **Stripe Account** — Free; remain in test mode until organization chooses to transact real funds

_All other infra should remain on free tiers for user testing unless testing volume becomes very high (dozens, not hundreds, is fine)._

---

## Handoff to Non-Profit: What Org Should Own

By end of July:
- Supabase project
- Railway hosting
- Expo/EAS account
- Apple Developer & Google Play accounts
- Google (GCP) for Maps
- Stripe account
- Documentation/runbook in `docs/` describing key rotation & billing (no secrets in repo).

---

## Risks / Guidance

> **All 31 screens, GPS, checkpoints/photos, Stripe, approval, in 5 weeks with 2 devs is ambitious.** If testing slips, cut polish/motion—not sessions, GPS/photos, approval, or shop.
>
> **Treat Phases 1–5 as immovable.** Begin setup of store accounts/EAS dev build in Week 1, not Week 4.
>
> Need repo-level breakdown? Switch to Agent mode for a concrete task-list (specs, Prisma schema, folder structure, etc).