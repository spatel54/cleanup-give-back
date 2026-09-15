# Clean Up - Give Back — Compliance & Launch Checklist

**Date:** 2026-08-13  
**Status:** Living engineering + product checklist — **not legal advice**; counsel must review before public traffic  
**Audience:** Product, engineering, operations, counsel  
**Parent:** [privacy-and-data-protection.md](privacy-and-data-protection.md)

This is the launch board for *this* app (location tracking, selfie evidence, court-service hours, 501(c)(3)). It is not a generic SaaS + ads + LLM + subscriptions list. Items that do not apply are listed under [Out of scope](#10-explicitly-out-of-scope).

In-app draft copy lives in [`frontend/src/features/figma-screens/content/privacyPolicyContent.ts`](../../frontend/src/features/figma-screens/content/privacyPolicyContent.ts). Outline: [mobile-app-privacy-policy-outline.md](mobile-app-privacy-policy-outline.md). Backend rights: [privacy-and-data-rights.md](../backend/specs/privacy-and-data-rights.md).

## Status legend

| Tag | Meaning |
|-----|---------|
| **done** | Shipped and matches current product |
| **partial** | Started; not launch-ready |
| **not started** | No implementation |
| **policy-only** | Claimed in the draft policy, not built |
| **when shipped** | Do this when that feature goes live (do not block launch on it today) |
| **ops** | Confirm in dashboards / DNS / hosting, not only in code |

Suggested work order is at the [bottom](#suggested-order-of-work).

---

## Related documents

| Document | Purpose |
|----------|---------|
| [privacy-and-data-protection.md](privacy-and-data-protection.md) | Nationwide privacy framework |
| [mobile-app-privacy-policy-outline.md](mobile-app-privacy-policy-outline.md) | Draft policy outline for counsel |
| [privacy-and-data-rights.md](../backend/specs/privacy-and-data-rights.md) | Cascade delete, export, retention jobs |
| [ADR-003](../adr/ADR-003-minor-data-protection-baseline.md) | Strictest-baseline architecture |
| [SECURITY.md](../../SECURITY.md) | No secrets in this sample |
| [implementation-plan.md](../implementation-plan.md) | Privacy & compliance milestone list |

---

## 0. Counsel & publication (do this first)

- [ ] **Legal review:** Counsel reviews Privacy Policy, Terms, retention, court-sharing, COPPA/AADC, and Illinois BIPA posture before public traffic. *(not started — this folder already requires it)*
- [ ] **Publish Privacy Policy** on a stable HTTPS URL (e.g. `example.org/privacy`), not only in-app. *(partial — in-app draft only)*
- [ ] **Publish Terms of Service** on a stable HTTPS URL and wire the in-app Terms row (`AccountPrivacyScreen` is currently `onPress={() => {}}`). *(not started)*
- [ ] **Fill the mailing address** (street + ZIP) on both documents. *(policy-only placeholder)*
- [ ] **Effective / last-updated dates** match the hosted + in-app copies.
- [ ] **Scope statement:** Policy covers mobile app, `example.org`, and admin console — or say what it does *not* cover.
- [ ] **Signup acceptance:** Required checkbox for Privacy + Terms before account creation. *(not started / incomplete)*
- [ ] App Store **Privacy Nutrition Labels** and Google Play **Data Safety** match the published policy (precise location, photos, contacts, identifiers, diagnostics). *(not started)*
- [ ] iOS **PrivacyInfo.xcprivacy** / Android Data Safety declarations complete.

---

## 1. Privacy Policy — make the draft accurate

### Remove or qualify over-claims

- [x] Remove **“transactional email is not utilized in this version”** (Resend is live). *(already gone from the draft before this pass)*
- [x] Qualify **Stripe / card / mailing address** as *when Shop, Donate, or program fees are used* — mailing address only when the volunteer chooses **USPS ship** (pickup/local drop-off store no street address). *(2026-08-15: qualified in-draft; checkout is explicitly marked as still being built)*
- [x] Qualify **hashed password** until email/password auth ships (mobile is anonymous auth today). *(2026-08-15: removed the password claim; **2026-09-01:** email/password + Apple/Google/Facebook shipped — privacy copy updated)*
- [x] Fix **local session drafts / interrupted-session recovery** (live-session resume was removed 2026-08-12). Disclose what *is* stored on-device: preferences, map theme, session notes, cached sessions, unlock flag, deleted-session ids. *(2026-08-15)*
- [x] Do not promise **Account → Privacy** deletion/export until those screens hit a backend. *(2026-08-15: reworded — PDF export is real; full data-export/deletion now says team-reviewed, not instant)*
- [x] Do not publish **90-day GPS / 1-year photo** retention unless jobs enforce it — or say “while the account is active, and as required by law/court programs.” *(2026-08-15: reworded as targets, notes automated jobs are not built yet)*
- [x] Treat **MapLibre** as on-device software, not a cloud processor. *(already correct in the draft)*

### Disclose data actually collected

- [x] Volunteer **feedback** (rating + comment → `volunteer_feedback`) *(2026-08-15)*
- [x] **Service type:** Court Ordered / Volunteering / School / Other (`user_metadata.service_type`) *(2026-08-15)*
- [x] **Session notes** (on-device) *(2026-08-15)*
- [ ] **Calendar** permission when adding events (`expo-calendar`)
- [x] **Checkpoint lat/long** (in addition to the walking route) *(2026-08-15)*
- [x] Session metadata: timestamps, duration, distance, checkpoint misses, map layer, approval status, admin hours adjustments, admin notes, decline reasons *(2026-08-15)*
- [x] **Event registration** records *(2026-08-15)*
- [x] **Email log** (`email_log`) — draft now discloses a message log; **admin audit log** still not separately disclosed
- [x] **Court-order** records (admin-managed) *(2026-08-15)*
- [x] **Company codes** *(2026-08-15)*
- [x] Push **notification contents** (not only tokens) *(2026-08-15)*
- [x] **IP / network metadata** via hosts and tile/weather APIs *(2026-08-15)*
- [x] Whether **digital signature** images are stored and printed on PDFs *(2026-08-15)*
- [x] Approximate coordinates sent to **Open-Meteo** *(was already disclosed)*

### Disclose recipients / processors actually used

- [x] Supabase (Auth, Postgres, Storage) — in draft
- [x] Fly.io (sessions API, US) — in draft
- [x] Resend — real message types now listed (registration/approve/decline, hours reminder, OTP, forgot-password, shop order) *(2026-08-15)*
- [x] Expo (push + EAS) — in draft
- [x] Apple / Google — in draft
- [x] CARTO / Esri (map tiles) — in draft
- [x] Open-Meteo — in draft
- [x] **Vercel** (admin console processes volunteer PII) *(2026-08-15)*
- [x] **OpenStreetMap** (service-letter static maps) *(2026-08-15)*
- [x] **Photon (Komoot), Nominatim, US Census**, optional **Google Places** (admin geocoding / place search) *(2026-08-15)*
- [x] **Authorized reviewers** (Admin / program staff) — in draft; still too vague for courts
- [x] **Courts, probation, schools, employers** as categories of people who may receive service-letter PDFs (name, hours, maps, photos) *(2026-08-15)*
- [x] Explicit **no ads / no sale / no remarketing / no ad SDKs** — in draft; keep

### Add legal sections the draft lacks

- [ ] **Controller identity** + complete contact — needs counsel input, not drafted here
- [x] **Background / Always location** — session-only, prominent indicator, stops on finalize/cancel *(keep; align with `app.json` purpose strings)*
- [x] **Sharing for official verification** — added a "Courts, probation offices, schools, and employers" recipient entry describing PDF contents and that court-mandated logs may not be deletable *(2026-08-15)*
- [ ] **Teens 13–17** — GPS + selfies still collected; same high defaults; no under-13 accounts *(still the same partial "Children and teens" section — not expanded into its own legal section)*
- [ ] **Illinois BIPA** assessment: photos for human review vs face templates — needs counsel, not drafted here
- [ ] **Sensitive PI:** precise geolocation + face photos — needs counsel framing
- [ ] **International transfers / storage region** (US: Supabase, Fly, Vercel) — needs counsel
- [ ] **Breach notification** (Illinois PIPA + applicable state law) — needs counsel
- [x] **Grace period length** after account closure — picked **30 days**, now consistent everywhere in the draft *(2026-08-15)*
- [ ] **Cookies** for the admin website (mobile has none)
- [ ] **CCPA language:** “we honor these rights for all users” — do not claim you are a CCPA “business” unless counsel says so
- [ ] **GDPR:** US-only + store geo, *or* real legal-bases / SCC section
- [ ] **Incident reporting** contact and “notify as required by law”
- [ ] Processor **DPAs** executed and listed (Supabase, Fly, Resend, Vercel, map/geocode vendors; Stripe when live)

**Note (2026-08-15):** The in-app draft copy is now factually accurate to the current build (verified against code, not assumed). It is still a *draft* — the unchecked items above above are counsel-judgment calls (BIPA, GDPR, CCPA, breach notice, controller identity) or backend work (retention jobs, admin audit log disclosure, calendar permission copy), not remaining copy edits.

---

## 2. Terms of Service (missing entirely)

- [ ] Acceptable use (no fake GPS, no recycled/stolen photos, no under-13 use)
- [ ] Hours verification is **program evidence**, not a court ruling or legal advice
- [ ] Nighttime / session rules the app enforces
- [ ] Photo and location consent for verification and reviewer access
- [ ] Account suspension / termination
- [ ] Intellectual property
- [ ] Limitation of liability / indemnity appropriate for a 501(c)(3)
- [ ] Governing law: Illinois
- [ ] **Refund rules:** merchandise vs donations vs program/tracker fees (different)
- [ ] When Stripe ships: payment terms, failed payment, no silent access via client redirect *(when shipped)*

---

## 3. Data rights (must match the policy)

- [x] **Delete My Account** permanently removes Auth user, profile, sessions, checkpoints, photos, feedback, local caches — except court-mandated holds. *(`/delete-account-confirm` → Fly `DELETE /users/me`; court sessions + `court_orders` kept, Auth user anonymized)*
- [x] Delete flow **tells the user** if court logs will be retained (confirm screen copy + post-delete alert when holds exist).
- [ ] **Access / download** returns profile + sessions + metadata (JSON); photos as signed URLs or archive. *(not started — `/request-data` is a fake success screen)*
- [x] **Export service record PDF** for approved sessions only where that is the product rule. *(Sessions / Account **Download Service Record** + session-detail PDF; privacy “full export” / Request Data still a fake success screen)*
- [ ] **Correction** of name, email, phone in-app (email OTP already in personal-details). *(partial)*
- [ ] Log every access/deletion request (who, when, outcome).
- [ ] Retention jobs: GPS after verification window; photos after stated period; 30-day grace then hard purge — **or change the policy**. *(not started)*
- [ ] Under-13: keep client wipe; **server must reject** under-13 registration when email auth ships. *(partial — client wipe only)*
- [ ] Age-gate **before** name/email/phone (compliance spec / PRD §6.0a). *(not started)*

---

## 4. Core security & authentication

- [x] Secrets only in env / Fly / Vercel in current workflow — never in client bundles. *(ops — still scan git history)*
- [ ] **Scan git history** for keys (`gitleaks` / `trufflehog`) and rotate anything found. *(not started)*
- [x] Anon/public keys on mobile + admin browser; **service role** only on server, cookie-free for admin list reads.
- [ ] Move admin role to **`app_metadata`** (not client-writable `user_metadata.role`). *(known hole — deferred)*
- [ ] `BYPASS_AUTH=false` on Vercel production. *(ops)*
- [ ] **MFA** on admin (Admin) accounts.
- [ ] RLS: volunteers read/write only their rows; admins via explicit policies; storage path-scoped. *(partial)*
- [ ] Confirm `session-photos` is **private**; signed URLs short TTL. *(partial — design yes, audit TTL)*
- [ ] `event-photos` may stay public for heroes; never put evidence there.
- [ ] Prisma / parameterized queries only; no string-built SQL. *(partial)*
- [ ] Validate types/schemas on Fly routes and admin actions; escape volunteer text in PDFs and HTML email. *(partial — email HTML sanitized)*
- [ ] Server-side JWT/session checks on every protected route. *(partial)*
- [ ] Volunteers cannot set `status`, hours, admin notes, `is_admin`, or other users’ `user_id`.
- [ ] Trim API JSON (no hashes, service keys, other users’ data, internal flags).
- [ ] Admin cookies: HttpOnly, Secure, SameSite (confirm `@supabase/ssr` production defaults). *(ops)*
- [ ] HTTPS on apex, www, Vercel admin, Fly API. *(ops)*
- [x] Passwords via **Supabase Auth only** when email auth ships — no custom hashing. *(2026-09-01)*
- [ ] **Email verification** on signup — dashboard Confirm email setting; app shows “check your email” if there is no session after `signUp`. *(ops)*
- [ ] Dependabot or `npm audit` in CI for `frontend/`, `admin-web-app/`, `backend/sessions/`. *(not started)*
- [ ] Security headers on admin: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy. *(not started — `admin-web-app/next.config.ts` has none)*

---

## 5. Storage, GPS, photos & abuse

- [ ] Upload allowlist: JPEG/PNG (or HEIC if accepted); reject other MIME types.
- [ ] Max file size on client **and** server/storage policies.
- [ ] Orphan / failed-upload cleanup.
- [x] Session-only GPS; no tracking after finalize/cancel; visible live indicator. *(keep tested on EAS Always-location)*
- [ ] Background location **only** while a session is active; App Store justification matches policy. *(partial — product behavior yes; store copy/review pending)*
- [ ] Rate limits: auth, password reset, photo upload, session ingest, PDF, email send. *(not started)*
- [ ] Bot protection on public signup / donate / contact **when those forms are live**. *(when shipped)*
- [ ] SPF + DKIM + **DMARC** on `example.org`. *(partial — Resend domain verified)*
- [ ] Resend env vars on **Vercel production** as well as Fly/local. *(ops)*

---

## 6. Payments *(when Stripe ships — do not block launch on this today)*

Shop, donate, and tracker checkout are UI mocks; `backend/payments/` is empty. See [SAMPLE_DATA.md](../SAMPLE_DATA.md).

- [ ] Stripe only on server; never store PAN; publishable key in client only. *(when shipped)*
- [ ] **Webhooks** (signed) update order/donation/unlock status — not the success URL. *(when shipped)*
- [ ] Failed payment / dunning rules if any paid feature gates access. *(when shipped)*
- [ ] Refund policy in Terms (shop vs donation vs program fee). *(when shipped — draft the shop/donation distinction in ToS now)*
- [ ] No recurring plans → no renewal-reminder or “symmetrical cancel” duty unless subscriptions are added.
- [ ] If IAP: Apple/Google billing rules; if web Stripe: don’t unlock IAP-gated features via web on iOS without store compliance. *(when shipped)*

---

## 7. Monitoring & reliability

- [ ] Error tracking (Sentry or similar) on mobile, admin, Fly. *(not started)*
- [ ] External uptime checks on `https://sessions.example.com/health` (or `/health/deep`) and the Vercel admin host. *(not started — in-app Production Readiness panel exists)*
- [ ] Confirm Supabase **automated backups** on; **test a restore once**. *(ops)*
- [x] No fake testimonials in the app. *(n/a in app today — keep true on `example.org`)*

---

## 8. Illinois, minors, courts (this product’s extra legal surface)

- [ ] COPPA: block under 13; no stored signup PII; no parental-consent flow unless product changes. *(partial — client-side wipe)*
- [ ] AADC-style defaults for **all** 13+ users (opt-in notifications, no dark patterns). *(partial)*
- [ ] Counsel sign-off on **teen selfies + precise GPS**.
- [ ] BIPA: written determination that stored checkpoint selfies are photographs for human review, not biometric identifiers — or add notice/consent if face matching / perceptual hash ships later.
- [ ] Written **court-retention schedule** vs user deletion.
- [ ] Service-letter sharing described in Privacy + Terms (who, what, why).
- [ ] DPIA completed and signed. *(outline only — see privacy-and-data-protection.md §8)*
- [ ] Incident-response plan (who calls counsel, who notifies users, Illinois timelines).

---

## 9. Store / platform specifics

- [x] Location purpose strings in `frontend/app.json` (When In Use vs Always).
- [x] Camera purpose string matches checkpoint use.
- [ ] Calendar purpose string if Add to Calendar stays. *(confirm iOS `NSCalendars*` / usage description)*
- [ ] Push: opt-in; no marketing as default. *(partial)*
- [x] No ATT / tracking prompt needed **unless** cross-app tracking is added (it should not be).
- [ ] Account deletion path that App Store reviewers can complete end-to-end. *(blocked on section 3)*

---

## 10. Explicitly out of scope

Do **not** put these on the launch board unless the product changes:

- Advertising / remarketing / ad-network disclosure
- AI spend caps, prompt-injection, LLM fallbacks (no model APIs in the app)
- Subscription renewal reminders and cancel-symmetry (no recurring plans today)
- GPC / do-not-sell **signal handling** until a website tracker exists (keep the policy sentence that we do not sell)
- COPPA Safe Harbor seals (kidSAFE, PRIVO, iKeepSafe, CARU, ESRB Privacy Certified) **unless** the product starts collecting from children under 13
- HIPAA (we do not handle protected health information)
- SOC 2 / ISO 27001 **as a launch blocker** (optional later if courts/schools/partners demand an attestation)

---

## 11. Frameworks, audits, certifications, and seals

There is **no single “this app is compliant” certificate**. Stores, Illinois, COPPA, and courts each care about different artifacts. Prefer **counsel + a real security report** over a paid website badge. This is not legal advice.

### Apply internally (no vendor required)

Use these as the engineering bar. They do not produce a public seal by themselves.

| Framework | What it covers | How we use it |
|-----------|----------------|---------------|
| **OWASP MASVS** + **MASTG** | Mobile client security (storage, crypto, auth, platform APIs). OWASP itself does **not** certify apps. | Spec for iOS/Android review; give this to a pen-test lab. GPS + selfie evidence → treat as **high-sensitivity** profile, not a toy app. |
| **OWASP ASVS** | Admin site + Fly API (authz, injection, session, headers). | Spec for `admin-web-app/` and `backend/sessions/`. |
| **NIST CSF** (or CIS Controls IG1) | Org security: backups, access, incident response — not just code. | Lightweight ISMS for a small nonprofit; matches [privacy-and-data-protection.md](privacy-and-data-protection.md) §6. |
| **Apple / Google store forms** | Privacy Nutrition Labels, Play Data Safety, `PrivacyInfo.xcprivacy`. | Required to ship. Not a certification, but the public “label” users see. |

- [ ] Adopt MASVS (mobile) + ASVS (admin/API) as the security requirements list for the next hardening pass.
- [ ] Complete store privacy labels so they match the published policy (section 0 / 9).

### Pay for (high value for this product)

Order these after Privacy/Terms are counsel-reviewed and deletion/export are real (or the policy no longer promises them).

| Artifact | Who | Why it matters here | Typical shape |
|----------|-----|---------------------|---------------|
| **Privacy / product counsel memo** | Illinois-aware privacy counsel | COPPA block, teens 13–17 + GPS/selfies, **BIPA** (photos vs face templates), court-letter sharing, retention vs deletion | Written opinion + redlined policy/ToS. Highest ROI. |
| **Data Protection Impact Assessment** | Counsel + engineering | Already outlined in privacy-and-data-protection.md §8; sign-off is unchecked | Internal DPIA, not a public seal |
| **Processor DPAs** | Supabase, Fly, Vercel, Resend, map/geocode vendors; Stripe when live | Contractual processing terms | Signed DPAs (not included in this sample) |
| **Application penetration test** | CREST / similar firm; **open-book** (source + staging + volunteer + admin roles) | Independent report Admin can show courts/schools; finds RLS/admin-role issues a badge will not | Report + retest of criticals. Scope: Expo app, Fly API, admin, Storage |
| **Google Play MASA (AL2)** | [App Defense Alliance](https://appdefensealliance.dev/masa) authorized lab | Only Play-visible **“Independent security review”** badge. Built on MASVS. Valid ~365 days. Does **not** certify Data Safety accuracy. | Lab test of the **store APK**. AL1 is self-scan only — no Play badge |

- [ ] Counsel memo on COPPA / AADC / BIPA / court sharing *(not started)*
- [ ] DPIA signed *(outline only)*
- [ ] DPAs executed for live processors *(not started)*
- [ ] External pen test of mobile + Fly + admin, with a written report *(not started)*
- [ ] **When Play-listed:** MASA AL2 if we want the Independent security review badge *(when shipped)*

Rough cost bands (USD, 2026, order-of-magnitude): counsel package often low-to-mid five figures; a scoped pen test similar; MASA AL2 is a lab engagement on top of that (ask authorized labs for a quote). Nonprofit discounts sometimes exist — ask.

### Pay for only if a partner asks

| Artifact | When it is worth it |
|----------|---------------------|
| **SOC 2 Type I then Type II** | A court program, school district, or insurer requires an attestation. Heavy (policies, evidence, auditor, 3–12 months). Tools like Vanta/Drata help collect evidence; they are **not** the certification. |
| **ISO 27001** | International partners; usually overkill for a US 501(c)(3) volunteer app. |
| **PCI DSS** | When Stripe ships: stay on Checkout / Payment Element so Stripe is the PCI merchant; our side is typically **SAQ A**. Do not store PAN. |
| **WCAG 2.1 AA** | Accessibility audit (admin already has an internal axe pass). Optional third-party a11y report; not a privacy seal. |

- [ ] SOC 2 / ISO **only** if a named partner requires it. *(deferred)*
- [ ] Stripe PCI posture (SAQ A) when payments go live. *(when shipped)*

### Usually skip (badge without the right coverage)

| Program | Why skip for us now |
|---------|---------------------|
| **COPPA Safe Harbor** (FTC-approved: CARU, ESRB Privacy Certified, iKeepSafe, kidSAFE, PRIVO, TRUSTe) | Useful if you **collect from under-13s** with parental consent. We **block** under 13. Joining can imply we are a kids’ app. Revisit only if product allows under-13 with consent. |
| **FERPA “school official” certs** (e.g. some iKeepSafe / 1EdTech products) | Only if a school district ingests student education records through us under a written agreement. Service type “School” alone is not FERPA. |
| Generic **privacy seals** sold as homepage trust marks | Easy to overclaim; do not substitute for counsel or a pen test. |

### Suggested sequence

1. Counsel + hosted policy/ToS (section 0) — **before any seal**
2. Build deletion/export/retention or stop promising them (section 3)
3. Internal MASVS/ASVS pass + pen test
4. Store labels; then MASA AL2 if we want a Play badge
5. SOC 2 only if a court/school/insurer writes it into a contract

---

## Suggested order of work

1. Counsel + hosted Privacy & Terms (sections 0–2)
2. Stop over-promising deletion/export/retention — then **build** them (section 3)
3. Admin role hardening, RLS/storage audit, headers, rate limits, git-secret scan (sections 4–5)
4. Sentry, uptime, backup restore (section 7)
5. Store labels + Always-location review (section 9)
6. Stripe block (section 6) only when payments actually ship
7. Pen test + optional MASA AL2 (section 11); SOC 2 only if a partner requires it
