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

1. Endpoint-level coverage now includes cross-origin rejection across eight mutation routes, malformed login JSON, absent/malformed session cookies, idempotent logout with cookie expiry, and (added in commit `3c918ae`) a valid HTTP session returned by `/api/auth/me` followed by HTTP logout revocation and post-logout denial. The latter commit's CI is still pending at this review point. Still add HTTP tests for expired/reused tokens, disabled/unverified users and unexpected database/email-provider failures.
2. Verify one-time owner bootstrap under concurrent requests and confirm the bootstrap secret is removed from protected hosting configuration immediately after successful bootstrap.
3. Review trusted-proxy configuration for `x-forwarded-for`. The current fingerprint helper uses the last forwarded address; this must be validated against the actual Railway/proxy topology and spoofing behavior.
4. Verify secure-cookie behavior in HTTPS production and add HTTP coverage for expired sessions and disabled-account handling; valid-session lookup, logout revocation and post-logout denial are covered by the newly added test pending CI.
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


## Verification update — 2026-11-07

- The exact source head `def0069fd81b66e030aab9f73725cfd021c771db` passed PR CI [42328951513](https://github.com/gavad54/zelmira-one-/actions/runs/42328951513) and CodeQL [42328951531](https://github.com/gavad54/zelmira-one-/actions/runs/42328951531). CI included unit tests, PostgreSQL migration/integration tests, lint, typecheck, production build and a blocking npm audit that reported 0 vulnerabilities.
- These results establish only the checks implemented in the repository. They are not a penetration test, independent security review or production certification.
- Still release-blocking: privileged-user MFA; production trusted-proxy validation for rate-limit identity; full expired/reused token and database/email-failure endpoint coverage; full tenant read/write/export/delete authorization coverage; complete CSP policy validated against the actual Next.js runtime; production HTTPS cookie validation; independent security review and live abuse testing.
- The later CSS-only change and documentation refresh do not alter authentication source behavior. Their CI/CodeQL evidence must be checked on the latest branch head before treating that head as verified.


## Tenant management authorization update — 2026-11-07

- On code head `0e5609e00b17c9f641d3f397bf08310526d27a03`, PR CI [42330032303](https://github.com/gavad54/zelmira-one-/actions/runs/42330032303) and CodeQL [42330032149](https://github.com/gavad54/zelmira-one-/actions/runs/42330032149) passed.
- HTTP integration coverage now verifies same-origin rejection, strict request-body validation, ADMIN permission to rename, ADMIN denial for tenant closure, OWNER permission to soft-close, audit persistence, data retention and denial of access to a closed workspace.
- Tenant rename/closure uses the opaque server session, membership and role loaded from PostgreSQL. The API does not accept caller-supplied role or membership values.
- This is automated application-level coverage, not a penetration test. Privileged MFA, trusted-proxy identity validation, complete member/role lifecycle authorization, all tenant-scoped export/delete routes, CSP policy validation, HTTPS cookie verification on the production host, independent review and live abuse testing remain open.


## Trusted proxy and IP rate-limit boundary

IP-based throttling must not trust an arbitrary `X-Forwarded-For` value. The application now uses the first untrusted address from the right only when `TRUSTED_PROXY_HOPS` is explicitly configured to match the verified ingress chain. Until the hosting topology is selected and verified, IP-only throttles are skipped; account/email/token limits remain active. Do not set this variable by guesswork. Verify the host header behavior and proxy-hop count before enabling IP throttling in production.
