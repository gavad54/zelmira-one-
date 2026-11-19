# VAYRO API Endpoint Authorization Matrix
**Audit date:** 2026-11-19  
**Repository:** `gavad54/zelmira-one-`  
**Branch:** `engineering/vayro-hardening-2026-11-18`  
**Audited tree:** `d8f2e762d2d744b10a8c0359de262eb75e06377d`  
**Scope:** All 38 route files under `src/app/api/**/route.ts`; each exported HTTP handler; auth/session/MFA/tenant/platform authorization helpers.  
**Production impact:** Engineering-branch application, test, and documentation changes only. No Production database, secret, migration, role, policy, data, or deployment was changed.

## 1. Interpretation and assurance levels

- **Public** means no user session is required; it does not mean the operation is harmless. Bearer capabilities, one-time bootstrap secrets, same-origin checks, rate limits, and generic responses still apply as stated.
- **Session** means a valid, unrevoked, unexpired, non-idle `vayro_session` cookie resolved by server code. The client cannot submit a role claim.
- **Verified email** means the authenticated account has `emailVerifiedAt`; tenant request authorization additionally requires an active tenant and a real membership loaded from the database.
- **MFA fresh** means `assurance = MFA`, a valid `mfaAuthenticatedAt` timestamp not in the future, and no more than 12 hours old.
- **Tenant roles:** `OWNER`, `ADMIN`, `MANAGER`, `MEMBER`, `VIEWER`. Tenant permissions are enforced by `src/lib/authorization.mjs`, then session, membership, tenant status, and role are revalidated by the tenant request transaction.
- **Platform owner** means platform `User.platformRole = OWNER`, verified email, active session, and fresh MFA. `PLATFORM_ADMIN` is not interchangeable with platform `OWNER` for the owner-only routes inspected.
- **N/A** means no tenant-scoped authorization is intended for that endpoint. **Not evidenced** means the route does not visibly enforce the control in its current handler/helper path; it is a gap, not an assumed permission.

## 2. Endpoint-by-endpoint matrix

| # | Method and endpoint | Access principal / role | Session requirement | MFA requirement | Tenant scope / authorization | Audit conclusion |
|---:|---|---|---|---|---|---|
| 1 | GET `/api/ai-business-suite/capabilities` | Public, read-only catalogue | None | None | N/A | Public metadata; input filters validated. |
| 2 | POST `/api/auth/change-password` | Authenticated account owner; any platform role | Active own session | Fresh MFA if platform OWNER/PLATFORM_ADMIN, active tenant OWNER/ADMIN, or account has MFA enabled; otherwise password re-verification | Own account only; no tenant mutation | Appropriate account-bound operation; rechecks active session in transaction and revokes sessions after change. |
| 3 | POST `/api/auth/forgot-password` | Public; email identity | None | None | N/A | Generic response and rate-limited recovery flow; bearer token required to complete reset. |
| 4 | POST `/api/auth/login` | Public credentials; server derives account role and MFA enrollment | No session before challenge; issues PASSWORD session only for accounts without MFA and without privileged-role enrollment requirement | Any enrolled MFA factor must be proven; privileged accounts must enroll before first session | Privilege detection checks platform OWNER/PLATFORM_ADMIN and active tenant OWNER/ADMIN membership | Current source includes the enrolled-MFA check for non-privileged accounts. Regression coverage added; see CI evidence. |
| 5 | POST `/api/auth/logout` | Session-cookie holder; idempotent if absent | Cookie token is looked up; no separate authorization requirement to clear local cookie | None | Deletes only the session identified by supplied cookie hash | Same-origin protected; audit event when a session exists. |
| 6 | GET `/api/auth/me` | Authenticated account | Active own session | No additional MFA freshness gate | Own identity only | No-store response; absent/invalid session returns 401. |
| 7 | POST `/api/auth/mfa/disable` | Authenticated account | Active own session | Fresh MFA plus a valid TOTP or unused recovery code | Own MFA enrollment only | Disabling MFA revokes all active sessions and consumes/clears recovery state. |
| 8 | POST `/api/auth/mfa/enroll/confirm` | Holder of a valid enrollment challenge | No general session before proof | TOTP from pending enrollment secret | Challenge is bound server-side to the account and MFA_ENROLLMENT purpose | On success enables MFA, issues MFA-assured session, and returns recovery codes once. |
| 9 | POST `/api/auth/mfa/enroll` | Holder of a valid enrollment challenge | No general session | Enrollment challenge; TOTP confirmation required in next step | Challenge bound to account and MFA_ENROLLMENT purpose | Creates pending encrypted secret; short-lived challenge and pending enrollment. |
| 10 | POST `/api/auth/mfa/recovery-codes` | Authenticated account | Active own session | Fresh MFA plus valid TOTP or unused recovery code | Own recovery-code set only | Rotates codes; rate-limited; old codes deleted. |
| 11 | POST `/api/auth/mfa/verify` | Holder of a valid login challenge | No general session before proof | TOTP or unused recovery code for LOGIN_MFA challenge | Challenge bound server-side to account and purpose | Issues MFA-assured session after successful proof; challenge attempts capped. |
| 12 | POST `/api/auth/register` | Public; registration is gated on initial platform owner existing | None | None | Creates only the registering account; does not accept client role | Same-origin, schema validation, rate limits, generic accepted response, email verification. |
| 13 | POST `/api/auth/resend-verification` | Public; email identity | None | None | Own email verification capability issued to account mailbox | Generic accepted response and rate limiting reduce account enumeration. |
| 14 | POST `/api/auth/reset-password` | Public bearer reset-token holder | None | None | Token identifies one account; sessions for that account are deleted on success | Same-origin, rate-limited, single-use/expiry checked by token transaction. |
| 15 | POST `/api/auth/sessions/revoke-all` | Authenticated account | Active own session | Fresh MFA for platform OWNER/PLATFORM_ADMIN and any session carrying MFA assurance | Revokes only sessions belonging to current user | Same-origin, audit logged; stale/invalid MFA returns 403 without revocation. Ordinary non-privileged PASSWORD-only users retain self-service. |
| 16 | POST `/api/auth/sessions/revoke` | Authenticated account | Active own session | Fresh MFA for platform OWNER/PLATFORM_ADMIN and any session carrying MFA assurance | Target session is queried and revoked with `userId = current user` | Cross-account session ID cannot be revoked; stale/invalid MFA returns 403 without revocation. Ordinary non-privileged PASSWORD-only users retain self-service. |
| 17 | GET `/api/auth/sessions` | Authenticated account | Active own session | No additional fresh-MFA gate visible | Lists only current user's sessions | Session inventory includes assurance and MFA timestamp. |
| 18 | POST `/api/auth/verify-email` | Public bearer email-verification token holder | None | None | Token identifies one account and purpose | Same-origin; token hash and expiry/consumption checked. |
| 19 | POST `/api/dana/generate` | Verified account with tenant membership role OWNER/ADMIN/MANAGER/MEMBER | Active own session | Fresh MFA for tenant OWNER/ADMIN; no MFA gate for MANAGER/MEMBER | Active tenant + matching membership; `ai_generate`; tenant transaction revalidates context | Rate-limited; provider call and persistence fail closed with `billing_not_configured` until credit ledger, idempotent charging and usage reconciliation exist. |
| 20 | POST `/api/dana/prompt-studio` | Verified active tenant member with OWNER/ADMIN/MANAGER/MEMBER role | Active own session | Fresh MFA for tenant OWNER/ADMIN | Exact active tenant membership; `ai_generate`; DANA is internal capability, no separate product license | Per-user rate limit (30/min); template only, no provider call or persistence. |
| 21 | GET `/api/health` | Public liveness probe | None | None | N/A | Public liveness only; should not return secrets or detailed infrastructure diagnostics. |
| 22 | POST `/api/negah/creative-brief` | Verified active tenant member with OWNER/ADMIN/MANAGER/MEMBER role | Active own session | Fresh MFA for tenant OWNER/ADMIN | Exact active tenant membership + `ai_generate` + active NEGAH product and valid tenant license | Per-user rate limit (20/min); brief template only, no image provider, rendering or persistence. |
| 23 | POST `/api/negah/generate` | Verified active tenant member with OWNER/ADMIN/MANAGER/MEMBER role | Active own session | Fresh MFA for tenant OWNER/ADMIN | Exact active tenant membership + `ai_generate` + active NEGAH product and valid tenant license | Rate-limited; provider call and persistence fail closed with `billing_not_configured` until credit ledger and usage reconciliation exist. |
| 24 | POST `/api/owner/bootstrap` | Public holder of one-time high-entropy `VAYRO_OWNER_BOOTSTRAP_TOKEN`; one-time bootstrap procedure | No session; no owner session issued | None at bootstrap; owner access remains unavailable until email verification and subsequent MFA enrollment | Creates the initial platform owner only through guarded database function | Same-origin, constant-time token comparison, shared rate limit, database role assertion; **critical bootstrap secret must be provisioned outside Git/chat**. |
| 25 | PATCH `/api/owner/email-contacts/[contactId]` | Platform OWNER only | Active own session | Fresh MFA (12h) | Platform-owner transaction; target contact belongs to platform settings | Prevents disabling/reassigning the last verified owner contact. |
| 26 | DELETE `/api/owner/email-contacts/[contactId]` | Platform OWNER only | Active own session | Fresh MFA (12h) | Platform-owner transaction; target contact belongs to platform settings | Same last-owner-contact guard and audit transaction. |
| 27 | POST `/api/owner/email-contacts/[contactId]/verify` | Platform OWNER only | Active own session | Fresh MFA (12h) | Platform-owner transaction for the selected contact | Owner session, same-origin, rate limits, token issuance and mail delivery. |
| 28 | POST `/api/owner/email-contacts/confirm` | Public bearer verification-token holder | No session | None | Narrow email-verification capability only; transaction installs token hash, not owner actor context | Hash-checked, expiring, single-use token; 20 attempts per trusted client IP per 15 minutes; fail-closed if trusted proxy identity is unavailable. |
| 29 | GET `/api/owner/email-contacts` | Platform OWNER only | Active own session | Fresh MFA (12h) | Platform-owner transaction | Lists platform owner email contacts only. |
| 30 | POST `/api/owner/email-contacts` | Platform OWNER only | Active own session | Fresh MFA (12h) | Platform-owner transaction | Same-origin, rate-limited; new contact remains unverified until bearer confirmation. |
| 31 | GET `/api/owner/future-lab` | Platform OWNER only | Active own session | Fresh MFA (12h) | Platform-level owner transaction | Reads owner proposals/decisions; no production execution implied. |
| 32 | POST `/api/owner/future-lab` | Platform OWNER only | Active own session | Fresh MFA (12h) | Platform-level owner transaction | Records proposal only; response explicitly says productionAccess=false. |
| 33 | PATCH `/api/owner/future-lab` | Platform OWNER only | Active own session | Fresh MFA (12h) | Platform-level owner transaction | Records owner decision only; response explicitly says executionAuthorized=false. |
| 34 | GET `/api/owner/licenses` | Platform OWNER only | Active own session | Fresh MFA (12h) | Platform-wide license and tenant/product listing | Owner-only transaction. |
| 35 | POST `/api/owner/licenses` | Platform OWNER only | Active own session | Fresh MFA (12h) | Owner can issue license only for existing active tenant and sellable product | Validates tenant/product/date and writes audit event in platform transaction. |
| 36 | PATCH `/api/owner/licenses` | Platform OWNER only | Active own session | Fresh MFA (12h) | Platform-wide license update | Owner transaction and rate limit. |
| 37 | GET `/api/owner/products` | Platform OWNER only | Active own session | Fresh MFA (12h) | Platform product catalogue and aggregate counts | Owner transaction; no public owner data. |
| 38 | POST `/api/owner/products` | Platform OWNER only | Active own session | Fresh MFA (12h) | Platform product catalogue initialization | Owner session checked twice (owner helper and transaction); rate-limited and audited. |
| 39 | PATCH `/api/owner/products` | Platform OWNER only | Active own session | Fresh MFA (12h) | Platform product configuration | Owner session checked; rate-limited and audited. |
| 40 | GET `/api/ready` | Public readiness probe | None | None | N/A; server internally checks auth/platform/tenant runtime database roles | **Review:** public endpoint exposes readiness state/check names; verify deployment ingress policy and response minimization. |
| 41 | GET `/api/tenants/[tenantId]/access` | Verified member; OWNER/ADMIN/MANAGER/MEMBER/VIEWER for tenant_read | Active own session | Fresh MFA for tenant OWNER/ADMIN | Exact active tenant membership; `tenant_read` | Uses dedicated tenant transaction and RLS context. |
| 42 | GET `/api/tenants/[tenantId]/ai-generations` | Verified member; OWNER/ADMIN/MANAGER/MEMBER; VIEWER denied | Active own session | Fresh MFA for tenant OWNER/ADMIN | Exact active tenant membership; `ai_read` | Tenant-scoped query in RLS transaction. |
| 43 | GET `/api/tenants/[tenantId]/members` | Verified tenant OWNER/ADMIN only | Active own session | Fresh MFA (12h) | `members_manage`; OWNER/ADMIN only | Helper permission and transaction enforce membership before listing. |
| 44 | GET `/api/tenants/[tenantId]/products` | Verified member; all five tenant roles | Active own session | Fresh MFA for tenant OWNER/ADMIN | Exact active tenant membership; `tenant_read` | Tenant-scoped read. |
| 45 | GET `/api/tenants/[tenantId]` | Verified member; all five tenant roles | Active own session | Fresh MFA for tenant OWNER/ADMIN | Exact active tenant membership; workspace read | Workspace helper resolves the requested tenant and role from server-side membership. |
| 46 | PATCH `/api/tenants/[tenantId]` | Verified tenant OWNER/ADMIN | Active own session | Fresh MFA (12h) | `tenant_manage`; exact active tenant membership | Same-origin, authorization precheck and revalidation inside transaction, rate-limited. |
| 47 | DELETE `/api/tenants/[tenantId]` | Verified tenant OWNER only | Active own session | Fresh MFA (12h) | `tenant_delete`; exact active tenant membership | Soft-closes tenant; does not physically delete tenant or memberships. |
| 48 | GET `/api/tenants` | Verified authenticated account; lists only its active memberships | Active own session | No additional fresh-MFA gate visible in collection handler | Own membership list; no client-supplied role | User transaction; verified email required. |
| 49 | POST `/api/tenants` | Verified authenticated account; any user may create a workspace | Active own session | No additional fresh-MFA gate visible | Creates tenant and assigns caller OWNER membership; caller cannot choose role | Same-origin, strict input, rate-limited; creation transaction and audit. |

**Count note:** 38 route files expose 49 HTTP handlers in this matrix. A file may expose multiple methods (for example owner contacts, products, licenses, and tenant workspace).

## 3. Canonical tenant permission matrix

| Action | OWNER | ADMIN | MANAGER | MEMBER | VIEWER | Fresh MFA |
|---|:---:|:---:|:---:|:---:|:---:|---|
| `tenant_read` | Allow | Allow | Allow | Allow | Allow | OWNER/ADMIN |
| `tenant_manage` | Allow | Allow | Deny | Deny | Deny | OWNER/ADMIN |
| `members_manage` | Allow | Allow | Deny | Deny | Deny | OWNER/ADMIN |
| `billing_manage` | Allow | Deny | Deny | Deny | Deny | OWNER/ADMIN condition currently applies at authorization helper level |
| `tenant_delete` | Allow | Deny | Deny | Deny | Deny | OWNER |
| `ai_generate` | Allow | Allow | Allow | Allow | Deny | OWNER/ADMIN |
| `ai_read` | Allow | Allow | Allow | Allow | Deny | OWNER/ADMIN |

**Important:** `billing_manage` exists in the central permission map but no billing-specific API route was found among the 38 current route files. This is not evidence that billing is implemented or usable.

## 4. Findings and required follow-up

### P0 — Production database authorization remains blocked
The separate read-only database audit recorded 11 public tables with RLS enabled but no policies, FORCE RLS disabled, empty migration history, missing Prisma objects/columns, and missing dedicated runtime roles. The API code's intended authorization model is therefore **not proof of Production enforcement**. Keep all Production schema/role/policy changes blocked until the independent encrypted backup and restore rehearsal, schema reconciliation, and controlled migration plan are evidenced.

### RESOLVED IN ENGINEERING BRANCH — Tenant role/MFA policy
The full OWNER/ADMIN/MANAGER/MEMBER/VIEWER × seven-action matrix is now exercised by unit and PostgreSQL-backed integration tests. OWNER/ADMIN password-only, stale and future-dated MFA cases are denied. See section 8 for exact coverage and passing CI evidence.

<!-- Historical finding heading retained below for audit traceability -->
### P1 — Tenant role/MFA policy needs explicit test expansion
The helper enforces OWNER/ADMIN fresh MFA and the central permission map restricts actions. Add negative and positive integration cases for every role across each action, including:
- VIEWER denied `ai_read`, `ai_generate`, `members_manage`, `tenant_manage`, `tenant_delete`.
- MEMBER/MANAGER denied member management, tenant rename and closure.
- ADMIN allowed rename/member management, denied tenant closure and billing management.
- OWNER allowed tenant closure; all tenant OWNER/ADMIN privileged actions rejected with PASSWORD assurance, stale MFA, future timestamp, revoked session, expired session, inactive tenant, or cross-tenant ID.
- Verify the central `billing_manage` permission is either connected to a real route with owner-only checks or explicitly marked unused.

### RESOLVED IN ENGINEERING BRANCH — DANA Prompt Studio and NEGAH Creative Brief
Both endpoints are now tenant-scoped and rate-limited. DANA requires `ai_generate` but no separate product license because it is an internal VAYRO capability. NEGAH additionally requires an active NEGAH product and valid tenant license. See section 8.

<!-- Historical finding heading retained below for audit traceability -->
### P1 — DANA Prompt Studio and NEGAH Creative Brief lack product/tenant authorization
These endpoints currently require only a valid session. They do not bind work to a tenant, check verified email, enforce product entitlement/license, or expose a rate limit in the route. Decide whether they are intentionally account-level, free template utilities; otherwise require tenant context, product entitlement and a server-side action permission. Do not describe these template endpoints as paid AI-provider generation: current DANA prompt-studio response says `aiProviderUsed=false` and `persisted=false`; NEGAH creative brief similarly returns a template engine marker.

### P1 — Readiness endpoint exposure
`/api/ready` is unauthenticated and reports component check states. Restrict it at the deployment ingress/network boundary or return only a minimal readiness status if public probing is required. Do not expose credentials or detailed exception strings.

### RESOLVED IN ENGINEERING BRANCH — Email contact confirmation abuse controls
The public confirmation endpoint now applies a database-backed 20-attempt / 15-minute trusted-IP throttle before bearer-token parsing. Missing or invalid trusted-proxy configuration fails closed. See section 8.

<!-- Historical finding heading retained below for audit traceability -->
### P2 — Email contact confirmation abuse controls
The email contact confirmation endpoint uses a narrowly scoped, high-entropy, expiring, single-use bearer capability and a dedicated RLS transaction. Add an IP-level or token-hash failure budget and audit failed attempts without leaking whether a contact exists.

### PARTIALLY RESOLVED IN ENGINEERING BRANCH — Session revocation step-up
Fresh MFA is enforced for platform OWNER/PLATFORM_ADMIN and sessions already carrying MFA assurance. Non-privileged PASSWORD-only users without MFA retain self-service revocation; this is an explicit usability/security trade-off and should be revisited if policy requires universal reauthentication. See section 8.

<!-- Historical finding heading retained below for audit traceability -->
### P2 — Session revocation step-up
Session listing/revocation and revoke-all currently require a valid session but no fresh MFA gate is visible. Consider requiring fresh MFA for revoke-all and for revoking sessions other than the current device, especially for platform OWNER/ADMIN accounts.

### P2 — Consistent route-level hardening
Several authenticated template endpoints do not visibly use the same rate-limit and verified-email checks as generation endpoints. Define and test a consistent policy for request-size limits, rate limits, no-store headers, same-origin mutation protection, audit logging, and error normalization.

## 5. Tests and evidence

- Repository tree inspection found 38 API route files and 49 exported HTTP handlers.
- Existing integration tests cover authentication lifecycle, MFA enrollment/login/recovery, session lifecycle, owner email/product routes, tenant authorization/RLS, cross-origin mutation rejection, and AI route unauthenticated rejection.
- A regression test was added to `tests/auth-endpoints.integration.mjs` asserting that a non-privileged account with MFA enabled receives a LOGIN_MFA challenge and no PASSWORD session. The current login implementation now checks `privileged || mfa?.enabledAt`.
- Latest observed branch head during re-audit: `d8f2e762d2d744b10a8c0359de262eb75e06377d`.
- CI run `44453921133`: **success** on the exact current branch head; unit tests, Prisma schema validation, isolated role/RLS checks, lint, typecheck, production build, Docker build, PostgreSQL/production HTTP integration tests, production dependency audit and full locked dependency audit all passed.
- CodeQL run `44453921226`: **success** on the exact current branch head; JavaScript/TypeScript analysis completed successfully.
- PR #39 remains open and unmerged at the observed head. No Production deployment was performed.

## 6. Release and implementation guardrails

1. Do not create permissive/allow-all RLS policies to make endpoints pass.
2. Do not run Production DDL, grants, migrations, or data rewrites from this audit.
3. Keep auth, platform, and tenant runtime database identities distinct and least-privileged; no runtime role may inherit superuser/BYPASSRLS or own protected tables.
4. Every tenant mutation must authorize from the session cookie + database membership + active tenant, then revalidate within the same transaction/RLS context.
5. Every platform owner operation must require platform OWNER + verified email + active session + fresh MFA and revalidate through the platform transaction.
6. Keep bootstrap secret, database URLs, email credentials, and encryption keys outside repository/chat; owner-controlled secrets are not available to this audit.
7. No PR merge, public release, production deployment, paid provider activation, or billing launch is authorized by this document.

## 7. Status

- Endpoint inventory: **COMPLETE** for current route tree.
- Source-based access matrix: **COMPLETE** for current route tree; method/role/session/MFA/tenant scope documented.
- Integration evidence: **PASS** on the cited CI head.
- Production authorization assurance: **BLOCKED** by the previously observed Production RLS/schema/runtime-role drift.
- Commercial readiness: **NOT VERIFIED**.


---

## 8. Engineering re-audit and hardening addendum — 2026-11-19

This addendum supersedes the earlier source observations in this document for the routes listed below. It records code changes on the engineering branch; it does **not** claim CI or Production verification for these new commits.

### Tenant role/action matrix

The authorization test suite now enumerates all five tenant roles against all seven declared actions:

| Role | tenant_read | tenant_manage | members_manage | billing_manage | tenant_delete | ai_generate | ai_read |
|---|---:|---:|---:|---:|---:|---:|---:|
| OWNER | Allow | Allow | Allow | Allow | Allow | Allow | Allow |
| ADMIN | Allow | Allow | Allow | Deny | Deny | Allow | Allow |
| MANAGER | Allow | Deny | Deny | Deny | Deny | Allow | Allow |
| MEMBER | Allow | Deny | Deny | Deny | Deny | Allow | Allow |
| VIEWER | Allow | Deny | Deny | Deny | Deny | Deny | Deny |

- Unit coverage exercises the full matrix through both the pure permission evaluator and the DB-backed request authorization boundary.
- PostgreSQL integration coverage now exercises every role/action pair, plus OWNER/ADMIN password-only, stale-MFA and future-dated-MFA denials.
- Cross-tenant, expired, revoked, disabled-user and inactive-tenant denial cases remain covered by the existing integration suite.
- OWNER and ADMIN require a valid MFA assurance timestamp no more than 12 hours old for tenant requests; MANAGER, MEMBER and VIEWER do not receive that privileged step-up requirement.

### DANA and NEGAH template endpoints

- POST /api/dana/prompt-studio now requires tenantId, a verified active session, active tenant membership, and ai_generate permission. OWNER/ADMIN are subject to the existing fresh-MFA gate. It is rate-limited to 30 requests per user per minute. DANA is an internal VAYRO capability, so no separate DANA product license is required. It remains a template-only operation: no external AI provider call and no persistence.
- POST /api/negah/creative-brief now requires the same tenant authorization and ai_generate permission, plus an active NEGAH product and a currently valid license for that tenant. It is rate-limited to 20 requests per user per minute. The endpoint remains a brief/template operation, not image generation, asset rendering or persistence.
- Both routes reject cross-origin writes and return no-store responses. Tenant context is removed from the prompt-builder input after authorization so it is not copied into generated prompt text.
- tests/ai-template-endpoints.integration.mjs exercises own-tenant success, cross-tenant denial, VIEWER denial, NEGAH unlicensed denial, licensed NEGAH success, and cross-origin rejection.

### Owner email confirmation

- POST /api/owner/email-contacts/confirm now applies a database-backed IP throttle before parsing or looking up a bearer token: 20 attempts per trusted client IP per 15 minutes.
- Missing/untrusted proxy identity fails closed. Production must set TRUSTED_PROXY_HOPS to the exact trusted proxy chain; do not trust arbitrary client-supplied forwarding headers.
- Responses for invalid tokens, rate limits and service failures are non-cacheable.
- tests/owner-email-endpoints.integration.mjs now checks that the 21st attempt from one trusted test IP is throttled.

### Session revocation

- POST /api/auth/sessions/revoke and POST /api/auth/sessions/revoke-all now require fresh MFA for platform OWNER/PLATFORM_ADMIN sessions and for sessions carrying MFA assurance.
- A stale or invalid MFA timestamp returns HTTP 403 mfa_required without revoking any session.
- Ordinary PASSWORD-only sessions for non-privileged users retain self-service revocation; platform privileged roles cannot use PASSWORD-only sessions.
- tests/session-lifecycle.integration.mjs verifies stale-MFA denial for both single-session and revoke-all operations and confirms target sessions remain active.


### Platform-owner authorization re-audit

- The owner session helper accepts only a canonical session token resolving to an active, unexpired, non-revoked session for `platformRole=OWNER`, a verified and non-disabled account, and fresh MFA (`assurance=MFA`, timestamp not in the future and within 12 hours). Idle sessions older than 30 minutes are revoked; activity is persisted at most once per five minutes.
- Platform-owner transactions independently revalidate the same OWNER account and exact session inside the platform database transaction/RLS context. `PLATFORM_ADMIN` is not accepted as a substitute for OWNER on owner-only operations.
- Owner email-contact, product, license and future-lab handlers are gated by the owner transaction, same-origin protection on mutations, per-owner rate limits where applicable, and audit events. Email-contact changes preserve at least one enabled, verified OWNER contact and use serializable transactions for concurrent disable/delete protection.
- License issuance accepts only an existing ACTIVE tenant and ACTIVE/sellable product, validates date ranges, and records an audit event. Future-lab entries and decisions remain proposals/decisions only; they do not grant production execution authority.
- No dedicated payment/credit ledger or billing API is implemented; `billing_manage` remains a declared permission without a billing endpoint. Do not treat license issuance as payment collection or recurring billing.

### Paid DANA / NEGAH provider routes

- POST /api/dana/generate and POST /api/negah/generate remain tenant-authorized and rate-limited, but provider execution is now fail-closed while the credit ledger, idempotent charging and provider-usage reconciliation do not exist.
- Both routes return HTTP 503 billing_not_configured before invoking an external provider or writing an AiGeneration record.
- NEGAH image generation additionally requires an active NEGAH product and a valid license for the selected tenant. DANA remains an internal capability and does not require a separate DANA product license.
- The production HTTP integration test asserts that unlicensed NEGAH generation is denied and that both provider routes remain blocked without provider calls or generation persistence. The DANA and NEGAH UI pages explain this state to the user.

### Verification state

- Changes are committed to `engineering/vayro-hardening-2026-11-18` at exact audited head `d8f2e762d2d744b10a8c0359de262eb75e06377d`.
- CI run `44453921133` and CodeQL run `44453921226` both completed successfully on this exact head. The CI job confirms unit tests, Prisma generation/validation, isolated PostgreSQL migration and role/RLS checks, lint, typecheck, production build, Docker build, HTTP/PostgreSQL integration tests, production-only dependency audit and full dependency audit all passed.
- No Production DDL, migration, role grant, RLS policy, data write, merge, deployment, payment activation or paid provider activation was performed.
