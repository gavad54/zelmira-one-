# VAYRO Authentication and API Security Review

**Review type:** Static source inspection of the VAYRO branch  
**Review date:** 2026-11-05  
**Status:** Preliminary engineering review — not a penetration test, certification, or release approval.

## Scope inspected

- `src/lib/auth-core.mjs`
- `src/lib/auth-service.ts`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/owner/bootstrap`
- `next.config.ts`

## Controls observed in source

- Passwords use Node.js scrypt with a random salt and parameterized encoding.
- Session tokens are 256-bit random values; only SHA-256 digests are persisted.
- Session cookies are HttpOnly, SameSite=Lax and Secure in production.
- State-changing authentication endpoints reject missing or cross-origin Origin values.
- Authentication action tokens are stored as hashes and checked for purpose, expiry and consumption.
- Password-reset tokens are consumed transactionally and all user sessions are revoked after a successful reset.
- Login, registration, recovery and bootstrap use database-backed attempt limits.
- Generic responses are used for registration and password-recovery flows to reduce account enumeration.
- Baseline response headers include no-sniff, frame denial, referrer policy and a restrictive subset of CSP directives.

## Release-blocking verification work

1. Add endpoint-level tests for every authentication route, including malformed JSON, wrong origin, expired/reused tokens, disabled users, unverified users, and unexpected database/email-provider failures.
2. Verify one-time owner bootstrap under concurrent requests and confirm the bootstrap secret is removed from protected hosting configuration immediately after successful bootstrap.
3. Review trusted-proxy configuration for `x-forwarded-for`. The current fingerprint helper uses the last forwarded address; this must be validated against the actual Railway/proxy topology and spoofing behavior.
4. Verify cookie behavior, session expiry, revocation, logout and disabled-account handling through HTTP integration tests.
5. Verify CSRF behavior with Origin and Sec-Fetch-Site combinations in supported browsers.
6. Review CSP against the actual Next.js production output. The current policy does not define a complete `default-src` / `script-src` policy; do not claim strict CSP enforcement until a compatible policy is tested.
7. Add endpoint-level authorization and tenant-isolation tests for every tenant-owned read, write, export and delete operation.
8. Conduct independent security review and dependency/container/secret scanning before production.

## Operational restrictions

- Do not enable customer onboarding, production data collection or real payments until the release gates pass.
- Do not deploy this branch against the existing ARIA database or reuse ARIA secrets.
- Keep owner bootstrap disabled after initial setup by removing its secret from the protected runtime configuration.
- Never put credentials, recovery tokens, signing keys or production customer data in GitHub issues, commits or chat.

## Evidence boundary

This document records source-level observations and required verification. It does not claim that endpoint tests, penetration testing, production email delivery, MFA, tenant-wide authorization coverage or production hardening have been completed.
