# Security policy

This repository is a **sanitized source sample**. It does not include production credentials, operator identity, or deploy keys.

## Reporting vulnerabilities

If you believe you found a security issue in code patterns shown here, open a private GitHub security advisory on this repo or contact the repository owner through GitHub.

Do **not** open public issues with exploit details.

## What this sample excludes

- `.env`, `.env.local`, and other secret files (only `*.example` templates exist)
- Apple team IDs, EAS project IDs, App Store Connect keys
- Production Supabase, Fly, Vercel, Stripe, Resend, or Shippo credentials
- Real volunteer PII, operator names, or org email domains

## Safe browsing

- Treat all `@example.org` addresses and placeholder URLs (`example.com`, `sessions.example.com`) as fictitious.
- Mock data in admin order/volunteer fixtures uses fictional names and addresses — see [docs/SAMPLE_DATA.md](docs/SAMPLE_DATA.md).

## If you fork or run locally

- Never commit secrets. Use environment variables only.
- Rotate any key that was ever pasted into a chat, screenshot, or commit.
- This sample is not configured for production deployment.
