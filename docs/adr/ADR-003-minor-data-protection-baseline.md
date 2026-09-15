# ADR-003: Minor data protection — strictest-baseline nationwide

- **Status:** Accepted (amended 2026-07-23, 2026-09-01)
- **Date:** 2026-06-30

## Context

Clean Up - Give Back collects photos and precise geolocation to verify community service hours. Our audience includes school and youth groups. Federal COPPA rules apply to users under 13; state teen-privacy laws (CA AADC, CT, MD, NJ, and others) apply to users 13–17; CCPA/CPRA and similar laws apply to all users. Emerging App Store age-verification laws (TX, UT, LA) will require ingesting platform age signals.

Building 50 state-specific app variants is not feasible. We need one compliance posture that satisfies the strictest applicable requirements.

## Decision

Adopt a **strictest-baseline nationwide** strategy:

1. **COPPA under-13 block** — Users must be at least **13** (`age < 13` is blocked). On block during signup, **all onboarding PII is cleared immediately** (no retention). Native `/under-age` UX; **no parental-consent flow** in the current product (may revisit with counsel).
2. **Universal highest-privacy defaults** — All allowed users (13+) get the same privacy posture: opt-in notifications, no dark patterns or nudges to share more data. **No separate “Teen Privacy Tier”** or `privacy_tier` split in the app.
3. **Pre-auth age-gate (future)** — Month/year-only screening before other PII remains the target onboarding shape; today age is checked on `account-details` after earlier steps (PII wipe on under-age mitigates retention).
4. **Session-only geolocation** with a persistent on-screen tracking indicator (Always permission may be used **only while a session is active** so the route continues when locked; tracking stops on finalize/cancel).
5. **Account-tab privacy hub** (`account-privacy`) as the primary in-app privacy destination.
6. **CCPA baseline rights** for all users (access, deletion, portability, do-not-sell, non-discrimination).
7. **App Store age signals** ingested for enforcement and discarded after use — never persisted long-term.
8. **Supabase backend** designed day-one for cascade deletion, RLS, and retention jobs.
9. **Session photos 18+ only** — Ages 13–17 may use the app (school/youth groups) but cannot take start / checkpoint / end session photos. Under-13 remains a hard block. Spec: [minor-session-photos.md](../frontend/specs/minor-session-photos.md).

Legal policy text and consent verification methods require counsel approval before launch.

## Consequences

### Positive

- Single app build for all US jurisdictions.
- Proactive protection for minors before feature launch.
- Clear engineering and design requirements documented in `docs/compliance/`.
- Backend privacy spec aligned with frontend flows from the start.

### Negative

- Additional onboarding screens (pre-auth age-gate, policy viewers) still planned in Figma.
- Existing screens (`account`, `create-account`, etc.) need updates — pending product approval.
- Moving age before PII collection reduces COPPA exposure further — not yet shipped.

## Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| Age field on account-details only | Does not meet COPPA pre-collection requirements; collects PII before age verification |
| Parental consent for under-13 (original ADR item) | Product chose block + immediate wipe instead; consent flow deferred |
| Teen-only privacy tier | Product chose one highest-privacy default for all ages 13+ |
| Block all users under 18 | Excludes school/youth groups — core audience |
| State-specific builds | Unmaintainable; error-prone |
| Defer compliance until post-launch | Legal exposure; App Store rejection risk |

## Related

- [privacy-and-data-protection.md](../compliance/privacy-and-data-protection.md)
- [privacy-screen-split-decision.md](../compliance/privacy-screen-split-decision.md)
- [privacy-compliance-prd-addendum.md](../frontend/specs/privacy-compliance-prd-addendum.md)
- [privacy-and-data-rights.md](../backend/specs/privacy-and-data-rights.md)
