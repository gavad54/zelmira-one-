# VAYRO database access matrix — migration-intended policy contract

**Date:** 2026-11-18  
**Source of truth for this matrix:** reviewed repository SQL migrations on `main`, especially:
- `20261108170000_tenant_rls_runtime_boundary`
- `20261109120000_auth_database_role_boundary`
- `20261109130000_platform_control_plane_role_boundary`
- `20261109150000_tenant_ai_generation_history`
- `20261109160000_platform_bootstrap_least_privilege`
- `20261109170000_platform_product_catalog_insert_privileges`

**Important:** This is the intended policy contract encoded by repository migrations, not a claim about the current live database. The current VAYRO-CORE project has 11 tables with RLS enabled and zero policies; the policies below are not present there. Do not run these migrations against production until backup, restore, schema reconciliation and a separately approved change window are complete.

| Table | Tenant runtime `vayro_app` | Auth runtime `vayro_auth` | Platform runtime `vayro_platform` | Bootstrap |
|---|---|---|---|---|
| User | Read self; OWNER/ADMIN can read members of current tenant. No passwordHash/platformRole column access. | Global identity CRUD per role grants and RLS policy. | Read owner identity projection; update emailVerifiedAt/updatedAt only. | One-time owner read/insert only. |
| Tenant | Read current tenant or tenants where authenticated user has membership; update current tenant name/status; insert only with transaction-bound tenant ID. No delete. | Read id/status only. | Owner-MFA-gated aggregate read. | No direct access. |
| Membership | Read current tenant memberships or own membership list; insert only own user as OWNER for transaction-bound tenant. No update/delete. | Global read for identity/session workflows. | No access. | No direct access. |
| Session | Read only own session whose tokenHash matches transaction context. | Global session CRUD for authentication lifecycle. | Read only actor's matching, unrevoked, unexpired MFA-assured session. | No direct access. |
| Product | Read global product catalogue. | No access. | Owner-MFA-gated read/insert/update; no delete. | No direct access. |
| License | Full tenant-scoped CRUD for current tenant. | No access. | Read aggregate fields only (id/productId/active/endsAt); no mutation through the platform runtime. | No direct access. |
| AuditEvent | Read current tenant events; insert only when tenantId and actorUserId match transaction context. | Insert and read identifier only. | Owner-authenticated audit insert/read identifier; separate token-confirmation audit path. | Insert bootstrap audit event only. |
| EmailContact | No access. | No access. | Owner-MFA-gated CRUD; separate narrow verification-token flow. | Insert only during bootstrap. |
| EmailContactVerificationToken | No access. | No access. | Owner-MFA-gated CRUD plus bearer-token hash-scoped read/update for verification. | No access. |
| AuthActionToken | No access. | Global auth-token CRUD, constrained by service boundary. | Explicitly revoked. | No access. |
| AuthRateLimit | No access. | Global auth rate-limit CRUD, constrained by service boundary. | Explicitly revoked. | No access. |
| UserMfa | No access. | MFA secret lifecycle CRUD, constrained by service boundary. | Explicitly revoked. | No access. |
| MfaRecoveryCode | No access. | Recovery-code lifecycle CRUD, constrained by service boundary. | Explicitly revoked. | No access. |
| AuthChallenge | No access. | Challenge lifecycle CRUD, constrained by service boundary. | Explicitly revoked. | No access. |
| AiGeneration | Read current tenant history; own records for regular members, broader tenant history for OWNER/ADMIN/MANAGER; insert only as current user within current tenant. No update/delete. | No access. | No access. | No access. |

## Required role invariants

- `vayro_app`, `vayro_auth`, `vayro_platform`, and `vayro_platform_bootstrap` are NOLOGIN group roles, non-superuser and NOBYPASSRLS; they must not own public tables.
- A tenant connection login may inherit only `vayro_app`; it must not inherit auth, platform or bootstrap roles.
- Auth, tenant, platform and bootstrap capabilities must not be combined in one connection identity.
- `vayro_platform_bootstrap` is NOLOGIN, non-inheriting, has no schema CREATE privilege after the tightening migration, and is used only as the SECURITY DEFINER owner of the one-time bootstrap function.
- Supabase `service_role` has BYPASSRLS and is not an ordinary application runtime identity.
- `app.user_id`, `app.tenant_id`, `app.user_role`, session hashes and platform actor/session context must be set transaction-locally after server-side verification. Never trust values supplied directly by the browser.

## FORCE RLS contract

The repository migration intent applies FORCE ROW LEVEL SECURITY to:
- User, Tenant, Membership, Session, Product, License, AuditEvent
- EmailContact and EmailContactVerificationToken
- AuthActionToken, AuthRateLimit, UserMfa, MfaRecoveryCode, AuthChallenge
- AiGeneration

The live project currently reports FORCE RLS disabled on all 11 existing tables.

## Explicit review risks before production adoption

1. **Auth role breadth:** the current `vayro_auth` policies use broad `USING (true)` / `WITH CHECK (true)` for identity, session and authentication-support tables. This is acceptable only as a dedicated, isolated auth-service boundary with strict application checks, narrow network exposure, no shared tenant/platform credentials, short-lived sessions, and audit monitoring. It is not equivalent to per-user database isolation. Review whether login lookup and token operations can be split into narrower capabilities before production.
2. **Tenant bootstrap path:** tenant creation and OWNER membership insertion rely on transaction-local verified user/tenant context. Test forged IDs, concurrent duplicate provisioning, retries and rollback.
3. **Platform verification path:** owner policies depend on a fresh, unrevoked, unexpired session with MFA assurance and a 12-hour freshness window. Verify that application code sets matching transaction-local actor/session hashes only after cookie/session verification.
4. **Email verification bearer path:** token-hash context intentionally exposes a narrow verification operation. Verify single-use consumption, expiry, replay denial, and that token hash values never appear in logs.
5. **Audit integrity:** tenant audit inserts bind actor and tenant to transaction context. Platform and bootstrap paths have distinct checks; verify that no alternate route can write arbitrary actor IDs or tenant IDs.
6. **RLS is not a substitute for grants:** every role needs least-privilege table/column grants. A correct policy cannot protect against superuser, table owner without FORCE RLS, or BYPASSRLS credentials.
7. **Policy tests must be negative as well as positive:** preserve CI coverage for cross-tenant SELECT/INSERT/UPDATE/DELETE, missing context, pooled-connection context leakage, auth/platform role separation, owner MFA freshness and bootstrap replay.

## Acceptance checklist

- [ ] Live catalog matches the intended migration objects exactly.
- [ ] Encrypted offsite backup exists and checksum/decryption are verified.
- [ ] Restore succeeds on a separate isolated PostgreSQL 17 host.
- [ ] Baseline is rehearsed on a disposable restored clone without replaying CREATE statements over existing tables.
- [ ] All group roles, logins, memberships, grants, RLS policies and FORCE RLS flags match this matrix.
- [ ] All negative tenant isolation and cross-role tests pass on the clone.
- [ ] Auth broad-policy risk receives explicit security review and compensating controls are tested.
- [ ] Rollback/forward-recovery plan is tested and approved.
- [ ] Production change window and owner authorization are recorded.

**Current state: matrix documented; production policies/roles not installed; release remains blocked.**
