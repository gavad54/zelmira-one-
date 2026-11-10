# VAYRO Endpoint Authorization Matrix

**Baseline commit:** 19f4834f601e793df7b33917f5e141155de2ba87  
**Scope:** `src/app/api/**/route.ts` only. This inventory distinguishes route files from HTTP operations.

## Inventory result

The current PR contains **33 API route files and 40 exported HTTP method handlers**. The inventory below reconciles those handlers plus the two existing baseline routes `/api/auth/me` and `/api/health`, for **42 HTTP operations**. The three previously omitted route operations and the password-change operation are now included. This is a source-level inventory; it is not proof that every negative/positive test has passed.

| ID | Method | Path | Authentication / current server control | Current role / scope | Sensitivity | Required negative/positive evidence |
|---|---|---|---|---|---|---|
| AUTH-01 | POST | /api/auth/login | Public; password verification, origin check, rate limits | Any enabled, verified account; creates session | Critical | invalid password, unknown account, disabled/unverified account, privileged user without MFA, valid login |
| AUTH-02 | POST | /api/auth/logout | Origin check; deletes session matching cookie hash; idempotent | Current session if present | Medium | absent cookie, malformed cookie, valid logout, replay after logout |
| AUTH-03 | GET | /api/auth/me | Session cookie resolved from DB; no-store | Current active session | High | absent, malformed, expired, revoked, valid session |
| AUTH-04 | POST | /api/auth/register | Public; origin check, strict input, owner bootstrap prerequisite, rate limits | New USER only; role not client-selectable | High | role injection, duplicate email, cross-origin, valid registration |
| AUTH-05 | POST | /api/auth/forgot-password | Public; generic response, token issuance, rate limits | Account recovery by email | High | unknown/known account response parity, throttling, valid request |
| AUTH-06 | POST | /api/auth/resend-verification | Public; generic response, rate limits | Email verification by email | Medium | enumeration, throttling, valid resend |
| AUTH-07 | POST | /api/auth/reset-password | Public bearer action token; transactional single-use consume; deletes all user sessions | Password-reset token owner | Critical | invalid/expired/reused token, race, all sessions revoked |
| AUTH-08 | POST | /api/auth/verify-email | Public bearer action token; transactional single-use consume | Email-verification token owner | High | invalid/expired/reused token, race, valid verification |
| AUTH-09 | POST | /api/auth/mfa/enroll | Same-origin; short-lived hashed enrollment challenge; encrypted pending TOTP secret | Password-verified privileged account without active MFA | Critical | invalid/expired/reused challenge, repeated setup, missing encryption key |
| AUTH-10 | POST | /api/auth/mfa/enroll/confirm | Enrollment challenge + TOTP proof; transactional activation, recovery-code digest creation and MFA session | Owner/admin completing enrollment | Critical | invalid code, expiry, challenge exhaustion, replay, one-time recovery-code display |
| AUTH-11 | POST | /api/auth/mfa/verify | Login challenge + TOTP or unused recovery code; atomic replay/code consumption and MFA session issuance | Privileged account completing second factor | Critical | invalid/expired/reused challenge, TOTP replay, recovery-code reuse, concurrent requests |
| AUTH-12 | POST | /api/auth/mfa/disable | Recent MFA-assured session + current TOTP or unused recovery code; revoke all sessions | Authenticated account owner | Critical | password-only/stale session, invalid factor, all sessions revoked |
| AUTH-13 | POST | /api/auth/mfa/recovery-codes | Recent MFA-assured session + current factor; atomically invalidate old codes and issue new digests | MFA-enrolled account owner | Critical | stale session, invalid factor, previous codes invalidated, plaintext shown once |
| AUTH-14 | GET | /api/auth/sessions | Current active session; returns only the authenticated user's active session metadata, never token digests | Authenticated account owner | High | unauthenticated, idle-expired, no cross-user/session-token disclosure |
| AUTH-15 | POST | /api/auth/sessions/revoke | Same-origin + current session; target is constrained by authenticated user ID and audited | Authenticated account owner; own sessions only | High | cross-origin, unknown/foreign session ID, idempotent race, current-session cookie clearing |
| AUTH-16 | POST | /api/auth/sessions/revoke-all | Same-origin + current session; revokes all sessions belonging to authenticated user and clears cookie | Authenticated account owner | High | cross-origin, unauthenticated, cross-user isolation, audit record |
| AUTH-17 | POST | /api/auth/change-password | Active session + same-origin + IP/user rate limits + current-password verification; recent MFA assurance required for privileged or MFA-enabled users; transaction updates password, revokes all sessions and audits change | Authenticated user changing own password | Critical | absent/expired session, wrong current password, weak/new-equals-current password, missing/stale MFA, rate limit, concurrent password change, all sessions revoked |
| OPS-01 | GET | /api/health | Public liveness response | No user data | Low | response contains no secrets |
| OPS-02 | GET | /api/ready | Public readiness response; database readiness check | Operational metadata only | Medium | failure does not disclose credentials or connection details |
| OWNER-01 | POST | /api/owner/bootstrap | Public one-time deployment secret + origin check + rate limit + no prior owner/admin | Initial owner creation only | Critical | invalid secret, replay after owner exists, concurrent bootstrap, no session before email verification |
| OWNER-02 | GET | /api/owner/email-contacts | DB-backed OWNER session | Platform OWNER | High | unauthenticated, USER, PLATFORM_ADMIN distinction, valid OWNER |
| OWNER-03 | POST | /api/owner/email-contacts | OWNER session + origin + rate limit + strict schema | Platform OWNER | Critical | missing auth, non-owner, cross-origin, invalid fields, valid create |
| OWNER-04 | PATCH | /api/owner/email-contacts/{contactId} | OWNER session + origin + rate limit + transaction | Platform OWNER; contact ID must exist | Critical | non-owner, foreign/unknown ID, mass assignment, last-owner-contact invariant, valid update |
| OWNER-05 | DELETE | /api/owner/email-contacts/{contactId} | OWNER session + origin + rate limit + transaction | Platform OWNER; contact ID must exist | Critical | non-owner, unknown ID, last-owner-contact invariant, valid delete |
| OWNER-06 | POST | /api/owner/email-contacts/{contactId}/verify | OWNER session + origin + rate limit; sends verification link | Platform OWNER; contact ID | High | non-owner, disabled/already verified contact, throttle, delivery failure |
| OWNER-07 | POST | /api/owner/email-contacts/confirm | Public bearer verification token + origin; transactional single-use consume | Possession of valid contact-verification token | High | invalid/expired/reused token, disabled contact, valid confirmation |
| OWNER-08 | GET | /api/owner/products | DB-backed OWNER session | Platform OWNER; global product/tenant/license metrics | Critical | unauthenticated, non-owner, valid OWNER; response data minimization |
| OWNER-09 | POST | /api/owner/products | OWNER session + origin + rate limit + strict action schema | Platform OWNER; catalog initialization | Critical | non-owner, cross-origin, unsupported action, idempotent valid initialization |
| OWNER-10 | PATCH | /api/owner/products | OWNER session + origin + rate limit + strict schema + product configuration validation | Platform OWNER; product ID | Critical | non-owner, unknown ID, mass assignment, invalid URL/status, valid update |
| TENANT-01 | GET | /api/tenants | Active session + verified email; server-side membership query | All active memberships of authenticated user only | High | absent/expired session, unverified email, no cross-user leakage, valid list |
| TENANT-02 | POST | /api/tenants | Active session + verified email + origin + strict schema + rate limit | Creates tenant and OWNER membership for authenticated user | High | absent session, unverified email, role injection, valid create |
| TENANT-03 | GET | /api/tenants/{tenantId} | Server-side session + membership + active tenant authorization | Any active tenant member | High | unknown tenant, no membership, suspended/closed tenant, valid member |
| TENANT-04 | PATCH | /api/tenants/{tenantId} | Server-side membership authorization for tenant_manage + origin + strict schema + rate limit | Tenant OWNER/ADMIN | High | unauthenticated, MEMBER/VIEWER, cross-tenant, role injection, valid OWNER/ADMIN |
| TENANT-05 | DELETE | /api/tenants/{tenantId} | Server-side membership authorization for tenant_delete + origin + rate limit | Tenant OWNER only | Critical | ADMIN denial, other-tenant denial, closed tenant, valid OWNER |
| TENANT-06 | GET | /api/tenants/{tenantId}/access | Server-side membership authorization for tenant_read | Any active tenant member | Medium | absent/expired session, no membership, inactive tenant, valid member |
| TENANT-07 | GET | /api/tenants/{tenantId}/members | Server-side membership authorization for members_manage | Tenant OWNER/ADMIN | High | absent session, MEMBER/VIEWER denial, cross-tenant, credential non-disclosure |
| AI-01 | POST | /api/dana/generate | Verified active session + same-origin + tenant membership authorization before provider call + per-user rate limit; output stored in tenant transaction | Tenant OWNER/ADMIN/MANAGER/MEMBER | High | absent/unverified session, invalid tenant, cross-tenant denial, provider unavailable, rate limit, output persistence |
| AI-02 | POST | /api/negah/generate | Verified active session + same-origin + tenant membership authorization before provider call + per-user rate limit; generation metadata stored in tenant transaction | Tenant OWNER/ADMIN/MANAGER/MEMBER | High | absent/unverified session, invalid tenant, cross-tenant denial, provider unavailable, rate limit, metadata persistence |
| AI-03 | GET | /api/tenants/{tenantId}/ai-generations | Server-side tenant membership authorization + database RLS; members see own history, OWNER/ADMIN/MANAGER see tenant history | Active tenant OWNER/ADMIN/MANAGER/MEMBER | High | no membership, cross-tenant, MEMBER cannot read peer history, suspended tenant, missing RLS context |
| AI-04 | GET | /api/ai-business-suite/capabilities | Public read-only allowlisted capability catalogue; query parameters validated against known product and engine keys; public cache | Public catalogue metadata only; no tenant or account data | Low | invalid product, invalid engine, invalid includePlanned, response contains no tenant/user data |
| AI-05 | POST | /api/dana/prompt-studio | Same-origin + active session + strict schema; deterministic prompt template only, no provider call and no persistence | Any authenticated account; no tenant-scoped data | Medium | absent/expired session, cross-origin, malformed/unknown fields, valid template, confirm providerUsed=false and persisted=false |
| AI-06 | POST | /api/negah/creative-brief | Same-origin + active session + strict schema; deterministic creative-brief template only, no image provider and no persistence | Any authenticated account; no tenant-scoped data | Medium | absent/expired session, cross-origin, invalid format, malformed/unknown fields, valid brief, confirm providerUsed=false and persisted=false |

## Baseline role model (source-derived)

- Platform roles: `OWNER`, `PLATFORM_ADMIN`, `SUPPORT`, `USER`.
- Tenant membership roles: `OWNER`, `ADMIN`, `MANAGER`, `MEMBER`, `VIEWER`.
- The requested names `SUPER_ADMIN`, `STAFF`, `CUSTOMER`, and `SERVICE_ACCOUNT` are not present in the current Prisma enums and must not be added without a product/security requirement.
- Platform OWNER and tenant OWNER are distinct authorization domains.
- `/api/owner/email-contacts/confirm` is intentionally a bearer-link confirmation endpoint, not an authenticated owner-management endpoint. The token is the authorization capability and must remain single-use, short-lived, hashed at rest and rate-limited.
- `/api/owner/bootstrap` is intentionally a one-time bootstrap capability endpoint; it must be disabled operationally after owner creation.

## MFA baseline finding

At the baseline commit, no MFA fields, enrollment/challenge/recovery models, TOTP/WebAuthn handlers, or MFA enforcement were found. Consequently all authenticated routes currently lack MFA assurance metadata. MFA enforcement must be introduced centrally and then verified on every privileged path, not only at login.

## Verification status

This document is a source inventory and authorization expectation, **not proof that every listed negative and positive test has passed**. The 42-operation inventory is reconciled at source level. Exact source candidate b2b78f3a9171eeddd53c4f11d740b8c54abd6a7d passed CI 42777954484 and CodeQL 42777954612, including aggregate unit and PostgreSQL/production-HTTP integration suites. This does not prove every matrix row has individually mapped negative and positive tests. Per-operation traceability and independent review remain incomplete. Current status: `SOURCE_INVENTORY_RECONCILED — AGGREGATE_CI_PASS — ROW_LEVEL_EVIDENCE_INCOMPLETE`.


## AI generation data boundary (2026-11-09)

DANA text outputs and NEGAH generation records are stored in the new `AiGeneration` table. Each row is bound to both tenant and actor; database RLS enforces tenant context and actor ownership. Tenant OWNER/ADMIN/MANAGER can read the tenant history; MEMBER can read only their own records. VIEWER cannot generate or read this history.

**Asset limitation:** NEGAH stores the provider-returned image URL as metadata; it does not yet copy image bytes into VAYRO-controlled object storage. Provider URLs may expire. This is not durable image-file storage and must not be represented as such.
