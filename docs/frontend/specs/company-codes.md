# Company codes

## Goal

Single-use 10-digit company codes that unlock unlimited tracker access without Stripe. Codes never expire until redeemed; once used they show as inactive on the admin list.

## Acceptance criteria

- [x] Admin can generate codes at `/company-codes`
- [x] Generate success modal includes Admin tip: Volunteers search by name/email, or paste user ID after `/volunteers/` when only an ID is shown
- [x] Admin can see status (Active / Used), who used them, and delete codes (per-row Delete, or Select → row checkboxes with red Delete All (count) + gray Cancel; left search filters by code/email)
- [x] Mobile redeems via How it works + tracker paywall (`POST /company-codes/redeem`)
- [x] Redeem is atomic (second redeem fails)
- [x] Migration `admin/db/029_company_codes.sql` applied on production Supabase

## Implementation notes

- Table: `public.company_codes` (migration applied on production Supabase)
- Fly route: `backend/sessions/src/routes/companyCodes.ts` — deployed on `example-sessions`; requires Fly secret `SUPABASE_SERVICE_ROLE_KEY` (Node 22 image for supabase-js)
- Admin actions: `admin-web-app/src/actions/companyCodes.ts`
- Mobile client: `frontend/src/lib/companyCodesApi.ts` (local demo allowlist when `EXPO_PUBLIC_API_URL` is unset, or in `__DEV__` when there is no JWT — e.g. TEMP Welcome → How it works; demo codes `1234567890` / `9876543210` / `5555555555`). Confirm modal runs before redeem so Cancel does not burn a code. Production redeem requires a signed-in Supabase session (`apiFetch` Bearer token); Welcome **Sign up** must go through `/create-account` before how-it-works.
