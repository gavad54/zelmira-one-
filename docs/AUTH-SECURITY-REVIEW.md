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


## Verification update — trusted proxy rate-limit hardening (2026-11-07)

- Source head `bf015e124b8cd8b0a13ac5f4623691b9d2f9edfe` passed PR CI [42405241708](https://github.com/gavad54/zelmira-one-/actions/runs/42405241708), push CI [42405237548](https://github.com/gavad54/zelmira-one-/actions/runs/42405237548), PR CodeQL [42405241674](https://github.com/gavad54/zelmira-one-/actions/runs/42405241674), and push CodeQL [42405237546](https://github.com/gavad54/zelmira-one-/actions/runs/42405237546).
- Unit tests: 43 passed / 0 failed. PostgreSQL and production HTTP integration tests: 15 passed / 0 failed. The enforced npm audit reported 0 vulnerabilities; lint, typecheck, Prisma migration in isolated PostgreSQL and production build passed.
- IP-only throttling now requires an explicit `TRUSTED_PROXY_HOPS` setting and parses the first untrusted hop from the right. Until the real ingress chain is verified, IP-only throttles are skipped; account/email/token-specific throttles remain active. The variable is intentionally unset in the example environment.
- This change does not verify any live hosting proxy configuration and does not close production security review, MFA, tenant authorization coverage, or release gates.


## Verification update — MFA cryptographic core (2026-11-10)

- Added an isolated Node.js MFA cryptographic module using RFC 6238 TOTP (SHA-1, six digits, 30-second steps), a 160-bit random Base32 secret, bounded clock drift, constant-time code comparison and a caller-supplied monotonic replay watermark.
- TOTP secrets can be protected at rest with AES-256-GCM using a separately provisioned 32-byte hexadecimal `VAYRO_MFA_ENCRYPTION_KEY`; each encryption uses a fresh 96-bit IV and authenticated 128-bit tag. The module fails closed when the key is missing or malformed.
- Unit tests cover the RFC 6238 reference vector, drift and replay behavior, malformed inputs, encryption/decryption, authentication-tag tampering and authenticator URI encoding.
- **This is not end-to-end MFA.** The helper is not yet connected to the Prisma schema, login challenge, session lifecycle, enrollment/disable endpoints, recovery codes, rate limiting, audit events or owner-route enforcement. No MFA encryption key has been provisioned. Do not treat owner accounts as MFA-protected and do not deploy this helper as an active control.
- Next implementation slice: add versioned MFA credential/challenge/recovery-code persistence and transactional one-time verification, then integrate login and privileged-route enforcement with a tested owner recovery path. Production secret provisioning remains a separately authorized owner action.
