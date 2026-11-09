# VAYRO Database Access Path Audit

**Audit scope:** repository source at the security branch head immediately after runbook commit `fc24fc1f3f7a7e295420aabeb380d66f51642715`.  
**Status:** code-path review completed for the current database clients, tenant API group, authentication/MFA services, and owner control-plane endpoints.  
**Production status:** BLOCKED. No production database was queried or changed during this source audit.

## Executive conclusion

The dedicated tenant data-plane boundary is present in the repository and current tenant API routes use it for tenant-owned reads/writes. This does **not** certify the entire application database boundary.

The application currently has two Prisma connection paths:

1. `DATABASE_URL` — default Prisma client used by authentication, sessions, MFA, rate limits, email verification, owner bootstrap, owner email administration, owner product administration, and pre-authorization membership/session lookups.
2. `TENANT_DATABASE_URL` — dedicated Prisma client used by tenant list/create/workspace/rename/close/access/member endpoints. The transaction helper checks the effective role and applies transaction-local actor/tenant/session context before protected work.

The actual production identity behind `DATABASE_URL` remains unknown. Therefore the broad auth and owner paths cannot be certified as least-privilege, and the cross-tenant platform-owner paths do not yet have a separately proven database authorization boundary.

## 1. Connection and role inventory

| Connection | Current code use | Required status |
|---|---|---|
| `DATABASE_URL` | Default `prisma` client in `src/lib/prisma.ts`; auth, session, MFA, rate limits, bootstrap, owner APIs | Actual production role/privileges unknown; not certified |
| `TENANT_DATABASE_URL` | Lazy `tenantPrisma` client in `src/lib/tenant-prisma.ts` | Must be dedicated LOGIN role, member of `vayro_app`, NOBYPASSRLS, non-owner, no elevated memberships |
| Migration connection | `prisma migrate deploy` currently resolves through Prisma datasource URL | Must be explicitly separated from runtime identity; repository configuration updated to use `MIGRATION_DATABASE_URL` as Prisma `directUrl` |
| Platform control-plane connection | No separate client exists | Required design/implementation gate for cross-tenant owner operations |

## 2. Auth and identity data paths using the default Prisma client

The following services/routes import `@/lib/prisma` directly or call a service that does:

- `src/lib/auth-service.ts`: user action tokens; session create/read/update; persistent `AuthRateLimit`; session idle expiry/activity refresh; cookie lifecycle.
- `src/lib/mfa-service.ts`: `AuthChallenge`, `UserMfa`, `MfaRecoveryCode`, `Session`, `User`, and `AuditEvent` operations for MFA enrollment, verification, recovery-code use/rotation and session issuance/revocation.
- Authentication routes: login, registration, logout, current identity, email verification/resend, forgot/reset password, password change, and session listing/revocation.
- Owner bootstrap: `User`, `EmailContact`, `AuthActionToken`, and `AuditEvent`.
- Owner email-contact endpoints: `EmailContact`, `EmailContactVerificationToken`, `User`, `Session`, and `AuditEvent`.
- Tenant endpoints use this client only for preflight authentication/membership checks and rate limiting; actual tenant data operations are delegated to the dedicated tenant transaction.

This is a material privilege surface. It is not sufficient to say that tenant routes use RLS while leaving the default connection identity unverified.

## 3. Tenant data-plane paths

The following API paths call `getTenantPrisma()` and execute protected work through the transaction helper:

- `GET/POST /api/tenants`: user-scoped tenant listing and self-provisioning.
- `GET/PATCH/DELETE /api/tenants/[tenantId]`: workspace read, rename and soft-close.
- `GET /api/tenants/[tenantId]/access`: access proof.
- `GET /api/tenants/[tenantId]/members`: OWNER/ADMIN-only member directory.

The helper in `src/lib/tenant-request-transaction.mjs`:
- checks the runtime role for superuser, BYPASSRLS, `vayro_app` membership and protected-table ownership/elevated memberships;
- validates the cookie/session and membership before the tenant transaction;
- sets transaction-local actor, tenant, session hash and role context;
- revalidates session, user, membership, tenant state and action within the RLS transaction;
- fails closed when authorization or role checks fail.

The corresponding SQL migration grants only selected columns/tables to `vayro_app`, creates policies for the current core tenant/identity tables, and enables FORCE RLS on those tables. The isolated two-tenant SQL and integration tests are repository evidence only; production policy/role state has not been verified.

## 4. Platform-wide owner paths — known cross-tenant exception

`src/app/api/owner/products/route.ts` uses the default Prisma client after checking an OWNER session with recent MFA. It performs:

- cross-tenant aggregate reads of `Tenant` and `License`;
- global `Product` catalog reads;
- catalog initialization and product configuration writes;
- `AuditEvent` inserts.

Owner email-contact administration also uses the default client and can read/write `EmailContact`, verification tokens, and related audit/user records.

These operations are intentionally platform-wide; they must not be routed through ordinary tenant RLS as though they belonged to one tenant. However, the current repository has no separate platform database client or separately verified platform database role/policy boundary. Session/MFA authorization is an application control, not proof that the DB role is least-privilege.

**Required design:** introduce a separately configured platform control-plane connection and explicit transaction-scoped platform actor context. Grant only the exact operations required by each platform endpoint. Define and test policies for platform product catalog, aggregate tenant/license metrics, owner email administration and audit writes. Do not grant unrestricted access to every tenant business table. Public email-confirmation token redemption should have a separate narrowly scoped capability rather than inheriting the entire owner role.

## 5. RLS coverage gaps observed in repository migrations

The initial migration enables RLS on its initial tables and revokes Data API roles. The later tenant-boundary migration creates policies and FORCE RLS for the current seven protected tables: `Tenant`, `Membership`, `License`, `Product`, `AuditEvent`, `User`, and `Session`.

The MFA migration creates `UserMfa`, `MfaRecoveryCode`, and `AuthChallenge` with RLS enabled, but that migration contains no policies and does not FORCE RLS for these tables. The default Prisma client is the current access path for these tables. Since the production default connection role is unknown, the result is ambiguous:
- a non-owner, non-BYPASSRLS role with no policy is denied access;
- a table owner or BYPASSRLS role can bypass ordinary RLS and may have excessive access.

Do not “fix” this by granting broad table-owner or BYPASSRLS access. Define the intended auth data-plane role, actor scoping, policies, FORCE RLS compatibility, and migration grants, then test the real role in isolated PostgreSQL.

The current `vayro_app` tenant role deliberately receives no access to MFA, auth-challenge, recovery-code, rate-limit, or owner-email tables. Preserve that separation.

## 6. Additional security observations

- `allowIpAttempt()` returns `true` when `TRUSTED_PROXY_HOPS` is not configured or the trusted client address cannot be derived. This is documented as skipping IP-only throttling, but means the IP-based abuse control is inactive until the trusted proxy chain is configured. Identity-keyed limits still apply in the reviewed routes. Production abuse-control acceptance requires a verified proxy configuration or a different trusted client-IP source.
- The tenant migration protects current core tables only. There are no product-family business tables yet; future tables, storage objects, exports, background jobs, queues, cache keys, webhooks and search indexes need explicit tenant scoping.
- The owner product route's global aggregate access is an explicit platform exception, not a tenant-scoped route. Its database least-privilege proof is outstanding.
- The migration baseline cannot be inferred from an empty migration history. Live catalog equivalence must be established against the initial migration and all subsequent migrations on an independent restored clone.

## 7. Repository changes in this audit

- Prisma schema now distinguishes runtime `DATABASE_URL` from migration `MIGRATION_DATABASE_URL` through `directUrl`.
- CI supplies a disposable migration URL and runs Prisma migration deployment against that isolated CI database.
- `.env.example` documents the distinct runtime, tenant runtime and migration connection variables without real credentials.
- This does not create or provision any production role and does not prove any production URL's effective role.

## 8. Required next engineering gates

1. Implement a dedicated authentication data-plane role and policies for User, Session, action tokens, MFA tables, rate limits and the narrowly required audit writes. Verify every query/mutation in the auth and MFA services under that role.
2. Implement a separate platform control-plane role/client for owner products and owner email administration, with transaction-bound platform actor context and narrow policies/grants.
3. Add negative integration tests proving ordinary auth users cannot perform owner operations, platform operations cannot read/write tenant business rows outside their explicit allowlist, and the tenant role cannot access auth/MFA/platform tables.
4. Configure a verified trusted proxy chain or an alternative trusted IP mechanism; prove IP throttling is active in production-like tests.
5. Run the full CI suite on the exact resulting commit and preserve run IDs.
6. Separately obtain read-only production role/catalog evidence, independent backup/restore proof, migration baseline reconciliation, and explicit authorization before any production change.

## Decision

- Current tenant API boundary in repository: implemented; isolated tests previously passed on the verified code commit.
- Whole-application DB least-privilege boundary: **NOT VERIFIED / BLOCKED**.
- Production role, baseline and migration: **NOT EXECUTED**.
- Production release: **DEPLOYMENT BLOCKED — NOT RELEASED**.


## 9. Authentication data-plane implementation update — 2026-11-09

The security branch now contains a dedicated authentication database role and client. This section supersedes the earlier statement that all authentication/MFA work still uses the default Prisma client, but it does not certify production configuration.

- New NOLOGIN group role: `vayro_auth`, required to remain non-superuser, NOBYPASSRLS, non-owner, and separate from `vayro_app`.
- New runtime client: `src/lib/auth-prisma.ts`, configured by `AUTH_DATABASE_URL`. Production refuses to fall back to `DATABASE_URL` when this variable is absent.
- The client performs a fail-closed effective-role check: group membership, superuser/BYPASSRLS, elevated membership and public-table ownership.
- Auth services, MFA services, authentication routes and owner-session verification paths now use the dedicated auth client.
- Grants are limited to identity/session/MFA/challenge/action-token/rate-limit operations, membership and tenant-status reads, and narrowly returned audit-event identifiers. Product, license and owner-email tables are explicitly denied.
- The migration enables/FORCEs RLS for auth-support tables and adds explicit policies for the dedicated auth role. The tenant role is explicitly tested for denial of MFA, recovery-code, challenge, action-token and rate-limit access.
- New isolated SQL proof: `tests/sql/auth-db-role-boundary.sql`. CI provisions a disposable login member of `vayro_auth` and runs the real HTTP integration suite using `AUTH_DATABASE_URL`.

**Evidence boundary:** these are repository changes and isolated-CI tests only. The migration has not been applied to VAYRO-CORE production; no production login role or secret has been provisioned or inspected. Do not mark the production auth boundary VERIFIED until read-only catalog evidence confirms the role attributes, membership, grants, RLS policies and effective `AUTH_DATABASE_URL` identity.

**Still open:** platform control-plane isolation remains unimplemented. Owner product and email-contact mutations still use the default client after session validation; a separate platform client/role, narrow grants, actor-bound authorization and negative tests are the next branch-only engineering task.


## 10. Fresh VAYRO-CORE production read-only inspection — 2026-11-09

This section records a fresh read-only inspection of Supabase project `VAYRO-CORE` (`wdqhdnhpgxhmmfeyxwxr`, PostgreSQL 17.11, project status ACTIVE_HEALTHY). No SQL mutation, migration, role creation, grant, policy change or data write was performed.

### Observed live catalog

- The public schema contains 11 tables: `User`, `Tenant`, `Membership`, `Session`, `Product`, `License`, `AuditEvent`, `EmailContact`, `EmailContactVerificationToken`, `AuthActionToken`, and `AuthRateLimit`.
- All 11 tables report RLS enabled; all 11 have **zero policies** according to `pg_policies` and the Supabase security advisor.
- All 11 tables report `FORCE ROW LEVEL SECURITY = false`.
- Supabase migration history is empty (`list_migrations` returned no entries).
- The table inventory reports zero rows for all 11 tables.
- The only table-level grants returned by `information_schema.role_table_grants` were grants to `postgres`; no grants were returned for `anon`, `authenticated`, `service_role`, or any `vayro_*` runtime role.
- Roles observed: `postgres` is LOGIN and BYPASSRLS; `service_role` is BYPASSRLS; `anon` and `authenticated` are NOBYPASSRLS. No `vayro_app`, `vayro_auth`, or `vayro_platform` role was present in the inspected role list.
- Security advisor reports 11 INFO findings `rls_enabled_no_policy`, one for each public table. Health advisor returned no lints.

### Security decision

**Production database boundary: BLOCKED.** RLS being enabled without policies and without FORCE RLS does not establish safe tenant isolation. The absence of application-role grants/roles means the repository's intended runtime-role design is not provisioned in this live database. A runtime connection using `postgres` or `service_role` would have BYPASSRLS risk; the effective identity of every deployed `DATABASE_URL`, `AUTH_DATABASE_URL`, `TENANT_DATABASE_URL` and platform connection remains unverified.

Do not apply the current migration chain directly to this database. Empty migration history is not proof that the existing schema is disposable or identical to the Prisma baseline. First obtain an independent backup and prove restore into an isolated project; compare the live schema/catalog against Prisma and the complete migration chain; rehearse baseline and forward migration on the restored clone; verify the intended runtime roles, grants, policies and negative access tests there. Only after review and a separate explicit authorization for the exact production change may production DDL be considered.

This read-only inspection does not alter the previously approved boundary: production remains read-only, and no production write is authorized.


## Superseding source verification — 2026-11-09 (source commit `47792d4a891795d60a4b65c11c4a4ffb8cab2f74`)

This section supersedes the earlier connection-path conclusions in sections 1–5 where they state that auth/platform clients or their database boundaries are absent. The earlier findings accurately describe an earlier source state, not this commit.

- `src/lib/auth-prisma.ts` now provides a dedicated lazy `AUTH_DATABASE_URL` client. In production it fails closed if the variable is missing; it does not fall back to `DATABASE_URL`. `assertAuthRuntimeRole()` verifies the effective login is non-superuser, NOBYPASSRLS, a member of `vayro_auth`, has no other/elevated role memberships and owns no public tables.
- `src/lib/platform-prisma.ts` now provides a dedicated lazy `PLATFORM_DATABASE_URL` client. In production it fails closed if missing. `assertPlatformRuntimeRole()` verifies LOGIN, non-superuser, NOBYPASSRLS, membership only in `vayro_platform`, and no public-table ownership.
- `src/lib/platform-request-transaction.ts` now validates the owner session through the auth data plane, then revalidates OWNER identity and a current MFA-assured session inside a platform transaction. Public email confirmation uses a separate token-hash transaction capability.
- `prisma/schema.prisma` configures `MIGRATION_DATABASE_URL` as `directUrl`, separating Prisma migration connectivity from the normal runtime URL.
- Migration `20261109120000_auth_database_role_boundary` defines the `vayro_auth` privilege group, narrowly scoped table/column grants, RLS policies and FORCE RLS for auth tables. Migration `20261109130000_platform_control_plane_role_boundary` defines platform and bootstrap groups, owner/MFA-scoped policies and limited platform grants.
- CI includes dedicated auth/platform/tenant SQL role-boundary checks after applying the complete migration chain in disposable PostgreSQL. On source commit `47792d4`, those checks and all other CI steps completed successfully.

**Remaining qualification:** these are source and disposable-CI proofs only. The production LOGIN identities, their effective memberships/grants, production RLS policies/FORCE RLS, trusted proxy chain and database URLs have not been verified. The live VAYRO-CORE schema still has no recorded migration history; do not baseline or migrate production until independent backup/restore and object-by-object reconciliation pass.
