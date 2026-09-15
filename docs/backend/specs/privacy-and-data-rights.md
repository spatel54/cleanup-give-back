# Backend spec: Privacy and data rights

**Date:** 2026-06-30  
**Status:** Draft — engineering requirements  
**Parent:** [privacy-and-data-protection.md](../../compliance/privacy-and-data-protection.md)  
**Launch board:** [launch-checklist.md](../../compliance/launch-checklist.md)  
**ADR:** [ADR-003](../../adr/ADR-003-minor-data-protection-baseline.md)

## Overview

Supabase (Postgres, Auth, Storage) must support privacy compliance from day one: minor protection flags, user data rights, secure storage, retention, and cascade deletion.

## Acceptance criteria

### AC-1: Profile privacy fields

- [ ] `profiles` table includes: `date_of_birth_month`, `date_of_birth_year`, `age_verified_at` (and age-eligibility flag as needed)
- [ ] Users under 13 must not have persisted profiles or auth accounts — signup blocked client-side with immediate PII wipe; server must reject under-13 registration when auth ships

### AC-2: Row-level security

- [ ] Users can read/write only their own profile, sessions, and evidence
- [ ] Admin role can read submissions for approval; access logged
- [ ] Storage buckets: user-scoped paths; signed URLs with short TTL for photos

### AC-3: Cascade deletion

- [x] `DELETE /users/me` triggers:
  - Supabase Auth user deletion (or anonymize + ban when court records must stay)
  - Session rows deletion except court-ordered holds
  - Storage objects deletion (photos, except retained court evidence)
- [x] Court-ordered retention exception: flagged records retained; user notified in delete flow

### AC-4: Data export (portability)

- [ ] Endpoint returns user profile, sessions, and metadata in JSON (photos as signed URLs or separate download)
- [ ] Aligns with `export-service-record` and `privacy-rights-request` frontend flows

### AC-5: Retention jobs

- [ ] Scheduled job purges GPS path points after verification window (default: session verified + 90 days — counsel to finalize)
- [ ] Soft-delete grace period: 30 days before hard purge of deleted accounts

### AC-6: Parental consent (deferred)

- [ ] Not in current product — under-13 blocked with no retention. Re-open with counsel if parental-consent path replaces block.

### AC-7: App Store age signals

- [ ] Accept ephemeral age signal from client; apply restrictions in session
- [ ] **Do not persist** raw App Store age-verification payload to database
- [ ] Log enforcement action only (e.g., `age_signal_enforced_at`)

### AC-8: Audit logging

- [ ] Log admin access to user evidence
- [ ] Log data-rights requests (access, deletion) with timestamp and outcome

### AC-9: Third-party DPAs

- [ ] Supabase, Stripe, Fly.io, Resend, and map-tile vendor (CARTO / Esri) DPAs executed before production
- [ ] Documented in operator runbook (not included in this sample)

## Schema sketch

```sql
-- profiles extension (additive to planned schema)
alter table profiles add column date_of_birth_month smallint;
alter table profiles add column date_of_birth_year smallint;
alter table profiles add column age_verified_at timestamptz;
-- No privacy_tier / parental_consent columns in current product (under-13 = block, universal defaults for 13+)
```

## API endpoints (planned)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/privacy/rights-request` | Submit access/deletion request |
| GET | `/privacy/export` | Full data export (CCPA) |
| DELETE | `/users/me` | Account deletion with cascade |
| POST | `/parental-consent/notice` | Send parent notice email |
| POST | `/parental-consent/verify` | Complete verification |

## Security

- Passwords: Supabase Auth defaults (min length, breach check if available)
- Admin dashboard: separate auth; MFA recommended
- Secrets: environment variables only; never in repo

## Out of scope (this spec)

- Final legal retention periods
- COPPA verification vendor selection
- Admin UI implementation
