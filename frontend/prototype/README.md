# CleanUpGiveBack — Prototype

> ⚠️ **ROUGH DRAFT. NOTHING HERE IS FINAL.**

This directory is a throwaway prototype iteration. Its purpose is to give visual shape to the PRD, map existing Stitch screens to code, and identify gaps. It is not production code.

**What is locked:** Nothing.
**What may change:** Everything — routing, tokens, layouts, components, fonts, motion.
**What is not included:** Business logic, API calls, real auth, real payments, real GPS, real camera.

---

## How to run

The prototype shares the root `node_modules`. From the repo root:

```bash
# Point Expo at the prototype entry (temporary swap)
EXPO_USE_METRO_WORKSPACE_ROOT=1 npx expo start --entry prototype/App.tsx
```

Or import individual screen components into the main app for review.

---

## Font setup

This prototype requires three fonts not yet loaded in the main app:

| Role | Font |
|---|---|
| Headlines | Sanchez |
| Body | Noto Sans |
| Labels / Buttons / Nav | IBM Plex Sans |
| Timer / Session data | JetBrains Mono |

Install via expo-google-fonts when graduating to production:
```bash
npx expo install @expo-google-fonts/sanchez @expo-google-fonts/noto-sans @expo-google-fonts/ibm-plex-sans
```

Until then, the prototype falls back to system fonts with matching weight/size.

---

## Screen inventory

30 screens across 5 flows. See `SCREEN_MAP.md` at the repo root for full PRD → Stitch → code mapping.

| Flow | Screens |
|---|---|
| Auth + Onboarding | Welcome, CreateAccount, AccountDetails, NotificationPreference, SetupComplete, Coachmark |
| Home + Events | Home, EventDetail |
| Track | SessionSetup, Permissions, LiveSession, PhotoCheckpoint, MissedCheckpoint, SessionReview, SubmissionConfirmation |
| Sessions | SessionsList, SessionsCalendar, SessionDetail |
| Shop + Account | ShopHome, Donate, ProductDetail, Cart, Checkout, PurchaseConfirmation, Account, NotificationSettings, PrivacyPermissions, OrderHistory, DonationHistory, ExportServiceRecord |
