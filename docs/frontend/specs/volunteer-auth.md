# Spec: Volunteer email + Apple / Google / Facebook auth

## Summary

Replace anonymous Supabase bootstrap with real volunteer accounts. Welcome **Log In** is email/password only. Create Account **Create Account** / **Continue with Apple|Google|Facebook** talk to Supabase Auth. Home requires a registered (non-anonymous) session. Account **Log Out** ends that session.

## User stories

- As a returning volunteer, I want to sign in with email/password on Welcome, so my hours stay on my account.
- As a new volunteer, I want Create Account to collect my details and only create a Supabase user after I pass the under-13 age gate.
- As a volunteer, I want Log Out to return me to Welcome without silently creating another anonymous user.
- As a volunteer on Create Account, I want a Log In option so I can return to Welcome without finishing signup.

## Acceptance criteria

- [x] **AC-1:** Welcome **Log In** calls `signInWithPassword`. Empty or invalid credentials stay on Welcome with an error. Onboarded users go Home. Incomplete onboarding: missing phone/birthday/service type → `/account-phone`; unpaid → `/how-it-works`; paid → `/device-permissions`.
- [x] **AC-2:** Create Account **Create Account** validates and stashes a draft (no `signUp` yet), then continues to `/account-phone`. Supabase `signUp` runs only after account-details age ≥ 13.
- [x] **AC-3:** **Continue with Apple / Google / Facebook** on Welcome and Create Account run OAuth immediately. If phone, birthday, or service type is missing, go to `/account-phone` (name/email prefilled when the provider sent them). Returning onboarded users go Home. Cancel is a no-op.
- [x] **AC-4:** Email Create Account still defers `signUp` until after the age gate. Social does **not** skip A few details. After age ≥ 13, an existing social session syncs profile metadata then always `/creating-account`.
- [x] **AC-5:** After age-gated account creation: `/creating-account` → `/how-it-works`; onboarded (`user_metadata.onboarding_complete` or local gate) → Home. Incomplete paid sessions resume at `/device-permissions`; unpaid at `/how-it-works`; missing details at `/account-phone`. Under-13 after social: delete or sign out, then `/under-age`.
- [x] **AC-6:** App launch does **not** call `signInAnonymously`. Leftover `is_anonymous` sessions are signed out. Fly API JWTs are the registered user.
- [x] **AC-7:** Account **Log Out** signs out, clears the onboarding gate, and `replace('/welcome')`. Keep the filled tertiary Log Out styling.
- [x] **AC-8:** **Forgot Password?** calls `resetPasswordForEmail` when the Welcome email field is filled.
- [x] **AC-9:** Create Account shows **Already have an account? Log In**. It pops back to Welcome when that screen is on the stack, otherwise `replace('/welcome')`.

## Out of scope

- Native Google SDK
- Email-confirm interstitial (if Supabase Confirm email is on, signup tells the volunteer to confirm then log in)
- In-app password-recovery screen (email link only)
- Account deletion backend changes

## Dependencies

- Supabase Dashboard: enable Email, Apple, Google, Facebook. Disable Anonymous. Add redirect `nonprofitmobileapp://auth/callback` (and the Expo Go `exp://…/--/auth/callback` URL used in local dev).
- `expo-apple-authentication`, `expo-auth-session`, `expo-crypto`, `expo-web-browser`
- `app.json`: `ios.usesAppleSignIn` + `expo-apple-authentication` plugin
- **New iOS EAS build** required for the Sign in with Apple entitlement. Email/password works in Expo Go; native Apple works in Expo Go on a device but the entitlement is required for store/dev-client builds.

## Test plan

- Unit: callback URL parsing, registered vs anonymous session, new-user heuristic, post-auth destinations, auth error copy
- Manual: email sign-up / sign-in / wrong password / forgot password; Create Account **Log In** returns to Welcome; Apple cancel vs success (device); Google and Facebook OAuth still show A few details; Log Out returns to Welcome and Home stays gated
