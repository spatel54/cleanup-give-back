# Privacy & Compliance PRD Addendum

**Date:** 2026-06-30  
**Status:** Merged into main PRD (2026-06-30)  
**Extends:** [cleanup_giveback_redone_prd_full_layouts.md](cleanup_giveback_redone_prd_full_layouts.md) — §6.0a–6.37 now live in the main PRD  
**Framework:** [privacy-and-data-protection.md](../../compliance/privacy-and-data-protection.md)

> **Shipped native behavior (2026-07-23):** COPPA cutoff `age < 13` on account-details; under-age → immediate `clearOnboardingSignupData()` + `/under-age`. No teen privacy tier — universal highest-privacy defaults for all users 13+. Pre-auth age-gate, parental consent, and `teen-privacy-notice` remain designed but **not shipping** as described below unless product revisits.

---

## Updated onboarding flow (§5)

```text
age-gate (6.0a)
  ├── birth date → under 13
  │     → parental-consent-notice (6.0b)
  │     → parental-consent-verify (6.0c)
  │     → parental-consent-pending (6.0d) [until verified]
  │     → welcome (6.1) [after verified]
  ├── birth date → 13–17
  │     → teen-privacy-notice (6.0e)
  │     → welcome (6.1)
  └── birth date → 18+
        → welcome (6.1)

welcome → create-account → account-details → notification-preference → setup-complete → ...
```

---

## §6.0a Age Gate

### Purpose

Neutral age screening before any personal data collection or account creation.

### Required fields

- Month of birth (picker)
- Year of birth (picker)

### Rules

- No other fields on this screen.
- Continue disabled until both pickers have valid values.
- Do not use encouraging or discouraging language about age selection.

### Primary action

Continue → branch by age (see flow above).

---

## §6.0b Parental Consent — Notice

### Purpose

Provide direct notice to parent/guardian and collect contact for verifiable consent (COPPA).

### Required fields

- Parent/guardian email

### Content

Plain-language disclosure that the app will collect:

- Photos (selfies, trash-bag images)
- Precise GPS location during cleanup sessions

### Primary action

Send notice → parental-consent-verify

---

## §6.0c Parental Consent — Verify

### Purpose

Obtain verifiable parental consent (method TBD with counsel).

### Options (design placeholders)

- Credit card micro-charge verification
- Signed consent form upload
- Third-party COPPA service redirect

### Primary action

Complete verification → welcome (on success) or parental-consent-pending (on failure/wait)

---

## §6.0d Parental Consent — Pending

### Purpose

Block app use until parental consent is verified.

### Content

- Waiting state message
- Support contact
- Cannot access camera, GPS, or session features

---

## §6.0e Teen Privacy Notice

### Purpose

Inform users aged 13–17 of highest-privacy defaults (state teen-privacy laws).

### Content

- Highest privacy settings are on by default
- No dark patterns to reduce privacy
- Link to full Privacy Policy

### Primary action

I understand → welcome

---

## §6.31 Privacy Policy Viewer

### Purpose

Display the full Mobile App Privacy Policy in plain, teen-friendly language.

### Entry points

- `account-privacy` hub
- `create-account` legal checkbox link
- `settings` About section
- Optional home footer

### Layout requirements

- Scrollable content
- Last-updated date prominent
- Back navigation

---

## §6.32 Terms of Service Viewer

### Purpose

Display Terms of Service.

### Entry points

- Same as §6.31

---

## §6.33 Privacy Rights Request

### Purpose

Allow users to exercise CCPA rights: access, portability, deletion.

### Fields

- Request type (access / deletion / other)
- Confirmation checkbox
- Expected response time copy

### Primary action

Submit request → confirmation state

---

## §6.35 Delete Account Confirmation

### Purpose

Confirm destructive account deletion with re-authentication and retention disclosure.

### Content

- Re-enter password or biometric
- Explain what will be deleted
- Explain exceptions (court-ordered logs, legal retention)
- Non-discrimination reminder

### Primary actions

- Confirm deletion → account erased, navigate to welcome
- Cancel → back

---

## §6.37 Account Privacy Hub

### Purpose

Primary privacy destination under the Account tab. Compliance-first landing page for all privacy controls and disclosures.

### Entry point

**Account tab (§6.25) → Preferences → Privacy**

### Sections

| Section | Rows |
|---------|------|
| Your data | Plain-language summary + "Learn more" → privacy-policy |
| Legal | Privacy Policy, Terms of Service |
| Your rights | Request my data, Request deletion, Export service record |
| Controls | App permissions → privacy-permissions (§6.27) |
| Sharing | "We do not sell your personal information." |

(Historical PRD row for teen-only badge removed — universal privacy defaults for all users.)

### Layout

```text
┌─────────────────────────────────────┐
│ ← Privacy                           │
│                                     │
│ Your data                           │
│ [summary card]                      │
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

## Existing screen changes

> Merged into main PRD 2026-06-30. HTML/Figma prototype updates still pending — see [figma-compliance-screen-gap-audit.md](../../compliance/figma-compliance-screen-gap-audit.md).

| PRD § | Screen | Proposed change |
|-------|--------|-----------------|
| 6.1 | Welcome | Only after age-gate; optional Privacy Policy link |
| 6.2 | Create Account | Required ToS + Privacy checkbox; address + phone fields |
| 6.3 | Account Details | Remove age field |
| 6.11 | Live Session | Persistent location-tracking indicator |
| 6.25 | Account | Privacy row → account-privacy |
| 6.26 | Settings | Wire policy links; Delete → delete-account-confirm |
| 6.27 | Privacy & Permissions | Narrow to OS permissions; rename routeKey to privacy-permissions |
