# Page 7 · Compliance & Legal

**Figma page:** `7·Compliance & Legal`  
**Figma section:** ~~`718:236`~~ **retired** — compliance frames live at file root (not grouped under a section node; audit 2026-07-10)  
**Status:** Designed — 11 frames (2026-06-30)

## Screens (11)

| Route key | PRD § | Figma node | Status |
|-----------|-------|------------|--------|
| `age-gate` | 6.0a | `722:51` | designed |
| `parental-consent-notice` | 6.0b | `723:307` | designed |
| `parental-consent-verify` | 6.0c | `723:317` | designed |
| `parental-consent-pending` | 6.0d | `723:332` | designed |
| `teen-privacy-notice` | 6.0e | `723:49` | designed |
| `privacy-policy` | 6.31 | `723:339` | designed |
| `terms-of-service` | 6.32 | `723:352` | designed |
| `privacy-rights-request` | 6.33 | `723:365` | designed |
| `delete-account-confirm` | 6.35 | `723:378` | designed |

> **Moved:** `permission-location` / `permission-camera` live on **Page 4 · Session Tracking** (`728:639`, `728:658`) — see [04-session-tracking.md](04-session-tracking.md).

## Flow

```text
App launch
  → age-gate
      ├── < 13  → parental-consent-notice → parental-consent-verify → parental-consent-pending
      ├── 13–17 → teen-privacy-notice → welcome
      └── 18+   → welcome

privacy-policy / terms-of-service
  ← account-privacy, create-account, settings

delete-account-confirm
  ← account, settings, account-privacy

permission-location / permission-camera
  → session-setup, live-session (pre-permission)
```

## Notes

- **Section structure:** The `718:236` Compliance & Legal Flow section node no longer exists; individual compliance frames (`722:51` through `723:378`) remain in the file. See [figma-token-fix-checklist-2026-07-10.md](../../../docs/frontend/figma-token-fix-checklist-2026-07-10.md).
- Pre-auth screens (age-gate through teen-privacy-notice) collect minimal data; age-gate collects **no PII** beyond month/year.
- Policy viewers may use WebView to hosted URL or in-app scroll — decision pending (see compliance framework §9).
- Full ACs: [figma-compliance-screen-gap-audit.md](../../../docs/compliance/figma-compliance-screen-gap-audit.md)
