# Backend spec: password-reset email

**Date:** 2026-08-13  
**Status:** HTML implemented; send path **not wired**.  
**Design:** [Figma Forgot Password `1311:449`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1311-449)

## Summary

Code-owned table HTML for the Forgot Password email (`buildPasswordResetEmailHtml` in `admin-web-app/src/lib/password-reset-email-html.ts`). Same 600px shell on **cream `#fcf9f8`** (`cream/50` / `color/bg/app`, not white), logo size (32×42), CTA (18px / `16px 37px`), support line, and a **full-width** sage footer (`width/min-width: 100%`, `height: 100%` so leftover preview height is `#bdcaba`). No drop shadow (Gmail mangles CSS and sliced-image shadows).

**All copy is live HTML** — not rasterized type PNGs. Hosted `@font-face` (Sanchez + Noto Sans) is included for clients that load webfonts (Apple Mail). Gmail strips webfonts and falls back to Georgia (headline/CTA) and Trebuchet MS (body/footer; Arial last). The only image is forest-green `logo-mark-green.png` (filled CUPGB mark on transparent; white `logo-mark.png` is for the green order-email header).

| Face | Copy | HTML stack |
|------|------|------------|
| Sanchez | Headline `Forgot Password?` (24px, **bold** `#009540` primary); **Reset Password** CTA (18px) — primary `#009540` fill, 2px `#004d21` stroke, white label | `'Sanchez', Georgia, 'Times New Roman', serif` |
| Noto Sans | Body (16px laptop / 18px phone via `@media`), support line, footer links, nonprofit line (14px) | `'Noto Sans', 'Trebuchet MS', Tahoma, Arial, Helvetica, sans-serif` |

**Reset Password** is primary `#009540` with a 2px `#004d21` stroke and white label in light and dark mode (no lime/amber overrides). Support contact is `support@example.org` — do not name Admin. Meta `color-scheme` / `supported-color-schemes` are `light only`, same as order and hours-reminder, so Apple Mail does not invert the dark headline/body on the cream card. All copy uses **`letter-spacing: 0.02em`** (head `<style>` plus inline on every text cell/link) so tracking matches order and hours-reminder.

`resetUrl` is required. Preview/test scripts pass `https://example.org/reset-password` until a Supabase recovery link is available.

Figma typo `messsage` is corrected to `message`. Off-canvas leftover copy in the Figma frame (inactive-hours nudge) is not in this email.

Shared footer type PNGs (`forgot-password-support.png`, etc.) remain on Vercel unused by the branded templates (Forgot Password, order, hours-reminder all use live HTML footers).

## Hosted assets (production)

- `logo-mark-green.png`
- Fonts: `/email/fonts/Sanchez-Regular.ttf`, `NotoSans-Regular.ttf`, `NotoSans-Bold.ttf`

## API contract

None yet. Test send only:

```bash
cd admin-web-app && npx tsx scripts/send-test-password-reset-email.mts --to=<inbox>
```

## Data model

No migration. Do not add `password_reset` to `email_templates` / `email_log` until a production send site exists.

## Acceptance criteria

- [x] AC-1: Layout matches the order-shipped 600px shell (logo 32×42, 24px headline in bold primary `#009540`, 16px body on laptop / 18px on phone, 18px CTA — primary `#009540` + `#004d21` stroke + white label, support `support@example.org`, sage footer) — cream `#fcf9f8` card, no drop shadow
- [x] AC-2: CTA href is the caller-supplied `resetUrl`
- [x] AC-3: HTML interpolations are escaped
- [x] AC-5: All copy is live HTML (headline/CTA/body/support/footer); only the logo is a PNG; tracking is `letter-spacing: 0.02em` (same as order and hours-reminder)
- [x] AC-6: `logo-mark-green.png` loads from production Vercel
- [ ] AC-4: Welcome Forgot Password sends this email with a real recovery link (out of scope)

## Security & privacy

- `resetUrl` is escaped as an HTML attribute
- Live send is a manual test script; recipient comes from `--to=` / `TEST_EMAIL_TO` / `ADMIN_NOTIFY_EMAIL`, not a user-supplied relay on a public endpoint

## Test plan

1. `cd admin-web-app && npx tsx scripts/preview-password-reset-email.mts` — writes `tmp/password-reset-email.html` and asserts copy (no type PNGs)
2. `cd admin-web-app && npx tsx scripts/send-test-password-reset-email.mts --to=<inbox>` — live Resend (no CID attachments)
3. `cd admin-web-app && npx tsc --noEmit`
