# Contributing

Thanks for your interest in this project.

## Sample repository

This is a **read-only portfolio sample**. It is not wired to production services and device run scripts are intentionally disabled.

## What we welcome

- Documentation fixes and clarifications
- Typo and link corrections
- Sanitization issues (accidental PII, secrets, or identifiable org data)
- CI improvements that stay read-only (typecheck, lint — no deploy)

## What we generally do not merge

- Features that require production credentials or live service accounts
- Changes that re-introduce operator identity, real domains, or deploy workflows
- Large refactors unrelated to documentation or sample hygiene

## Before opening a PR

1. Do not include `.env` files or secrets.
2. Run typecheck and lint for touched packages:
   ```bash
   cd frontend && npx tsc --noEmit && npm run lint
   cd admin-web-app && npx tsc --noEmit && npm run lint
   ```
3. Keep commits focused; one logical change per PR.

## Code of conduct

Be respectful and constructive. This sample exists to demonstrate engineering work — not to debate the underlying nonprofit’s operations.
