# Page 1 · Onboarding

**Figma page:** `1·Onboarding`  
**Figma node:** [`627:29`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=627-29)  
**Token binding status:** ✅ All text nodes bound — color variables + typography primitives (verified 2026-06-30 text-token sweep; 139 text layers).

## Screens (11+)

| Route key | PRD § | Figma node | Legacy HTML key | Status |
|-----------|-------|------------|----------------|--------|
| `splash-loading` | — | ~~`827:111`~~ *(stale — node missing; native uses `color/primary`)* | — | implemented |
| `parent-permission-confirmation` | 6.0d | [`728:901`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=728-901) | — | implemented (`/under-age`) |
| `parent-permission-learn-why` | 6.0d | [`833:314`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=833-314) | — | implemented (`/under-age-learn-why`) |
| `welcome` | 6.1 | [`112:6776`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=112-6776) | `welcome___standardized_progress` | implemented |
| `create-account` | 6.2 | [`105:2`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=105-2) | `create_account___standardized_progress` | implemented |
| `creating-account` | 6.2 | [`137:73`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=137-73) | — | implemented |
| `account-details` | 6.3 | [`112:6882`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=112-6882) | `account_details___standardized_progress` | implemented |
| `location-permission` | 6.3 | [`725:553`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=725-553) | — | implemented |
| `camera-permission` | 6.3 | [`725:613`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=725-613) | — | implemented |
| `notification-preference` | 6.4 | [`112:7130`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=112-7130) | `notification_preference___standardized_redo` | implemented |
| `setup-complete` | 6.5 | [`133:93`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=133-93) | `setup_complete` | implemented |
| `home-tour` | 6.6 | [`137:527`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=137-527) | `coachmark_tutorial` | implemented |
| `shop-tour` | 6.6 | [`137:115`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=137-115) | — | implemented |
| `track-tour` | 6.6 | [`137:431`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=137-431) | — | implemented |
| `session-tour` | 6.6 | [`137:173`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=137-173) | — | implemented |
| `set-tour` | 6.6 | [`112:7170`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=112-7170) | — | implemented |

## Minor permission gate

| Screen | Node | Flow |
|--------|------|------|
| `parent-permission-confirmation` | [`728:901`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=728-901) | Native `/under-age` — Contact Admin + **Learn why** → `/under-age-learn-why` |
| `parent-permission-learn-why` | [`833:314`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=833-314) | Native `/under-age-learn-why`; Contact Admin mailto |

## Splash loading screen

Disney+-inspired cinematic splash on page **1 · Onboarding**. Historical Figma node `827:111` is **stale / missing** from the file (verified 2026-07-13); native `AppSplashScreen` uses design-system `color/primary` (`#009540`) + cream brand mark/title — not a separate dark cinematic green.

- Native `AppSplashScreen` on app entry (`index.tsx`) then `router.replace('/welcome')` until onboarding is marked complete
- Primary green fill + brand mark + full “Clean Up - Give Back” title (no clipping); soft horizontal shimmer while fonts load, then fade out

## Flow

```
splash-loading → welcome
welcome
  → Log In → home (`/`) [marks onboarding complete]
  → create-account (Create an Account)
    → creating-account (progress + rotating facts)
      → account-phone → account-details
        → under-age if birthday < 18
          → under-age-learn-why (Learn why)
        → location-permission → camera-permission
          → notification-preference
            → setup-complete (Enable / Not now)
              → home-tour → shop-tour → track-tour → session-tour → set-tour
                → Go Home → `/`  |  Start Tracking → `/session-setup-guide`  |  Replay → home-tour
```

## Notes

- `creating_account` (137:73) plays after Create Account CTAs: linear progress bar (~4.2s) with rotating Did-you-know facts, then replaces to account-phone.
- Progress pills (5-step): create-account (1) → account-phone / account-details (2) → location-permission (3) → camera-permission (4) → notification-preference (5). Enable/Not now on permissions advance; Previous uses `router.back()`.
- Coachmark tutorial is the native 5-screen tour (`home_tour` → `set_tour`); setup-complete Continue starts the tour and marks onboarding complete.
- Token binding was performed in the 2026-06-30 session; see `PROGRESS.md` for details.
- `welcome.html` (no suffix) is the retired Stitch original — do not implement.
