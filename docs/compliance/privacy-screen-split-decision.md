# Decision: Privacy screen split

**Date:** 2026-06-30  
**Status:** Accepted  
**Related:** [ADR-003](../adr/ADR-003-minor-data-protection-baseline.md) · [figma-compliance-screen-gap-audit.md](figma-compliance-screen-gap-audit.md) · PRD §6.27, §6.31–6.37

## Problem

The Stitch prototype screen `privacy_security.html` (routeKey `privacy-security`) combines three concerns:

| Concern | Examples in legacy screen |
|---------|---------------------------|
| Compliance & legal | Privacy Policy, Terms links (implicit) |
| OS permissions | Location, Camera, Notifications status |
| Account security & analytics | Email/password, 2FA, location history toggle, usage analytics |

PRD §6.27 defines **OS permissions only**. CCPA and minor-protection requirements need a dedicated **Account-tab privacy hub** with policy links, data-rights rows, and do-not-sell affirmation.

## Decision

Split into three distinct destinations:

| Screen | routeKey | Entry point | Purpose |
|--------|----------|-------------|---------|
| **Account Privacy hub** | `account-privacy` | Account → Preferences → **Privacy** | Compliance landing: data summary, legal links, CCPA rights, permissions shortcut, do-not-sell |
| **OS permissions** | `privacy-permissions` | Hub → App permissions | PRD §6.27: Location, Camera, Notifications + Open Device Settings |
| **Policy viewers** | `privacy-policy`, `terms-of-service` | Hub, signup checkbox, Settings About | Scrollable legal text; last-updated date |

### Legacy `privacy-security`

- **Status:** Deprecated for new implementation.
- **Manifest:** Kept as `designed` until Figma frames are updated; `privacy-permissions` and `account-privacy` are `spec-only`.
- **Prototype:** `account.html` Privacy row and `settings.html` Privacy & Security row remain on legacy routes until product approves HTML/Figma updates.

### Auth & analytics controls (from legacy screen)

Relocate as follows:

| Legacy control | Target |
|----------------|--------|
| Email / password / 2FA | `settings` → Account section (or future dedicated security screen) |
| Usage analytics toggle | `account-privacy` → Controls subsection, or `settings` App Preferences |
| Location history toggle | Remove or defer — session-only GPS is the compliance baseline (ADR-003) |
| Connected accounts | `settings` → Account → Profile |

**Default (until product overrides):** Analytics toggle on `account-privacy` hub; auth management on `settings`.

### Settings vs hub duplication

Both **Settings → About** and **Account Privacy hub → Legal** link to the same policy viewers (§6.31–6.32). This is intentional:

- **Hub** — primary CCPA / minor-privacy prominent disclosure path
- **Settings About** — secondary entry for users who expect legal links under Settings

Do not remove Settings About links when the hub ships.

## Navigation (target)

```text
Account tab
  └── Preferences → Privacy → account-privacy
        ├── privacy-policy
        ├── terms-of-service
        ├── privacy-rights-request
        ├── export-service-record
        ├── privacy-permissions
        └── delete-account-confirm

Account tab
  └── Settings → settings
        ├── notification-settings
        ├── About → privacy-policy, terms-of-service
        └── Delete Account → delete-account-confirm
```

## Implementation order

1. Design Figma frames: `account-privacy`, `privacy-permissions`, Page 7 compliance screens
2. Update `account.html` Privacy row → `account-privacy`
3. Remove or redirect `settings.html` Privacy & Security → hub or `privacy-permissions`
4. Mark `privacy-security` deprecated in manifest; remove from native implementation path

## Open items (counsel / product)

- Policy hosting: in-app scroll vs WebView to hosted URL — affects viewer screen design only
- Whether auth management warrants a dedicated `account-security` screen vs Settings rows
