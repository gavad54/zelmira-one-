# VAYRO live production catalog audit — 2026-11-09

**Target:** Supabase project `wdqhdnhpgxhmmfeyxwxr` (`VAYRO-CORE`)  
**Evidence mode:** read-only PostgreSQL catalog queries and Supabase project/advisor APIs  
**Repository branch reviewed:** `security/mfa-session-endpoint-gates`  
**PR:** #6, open / Draft / unmerged  
**PR head observed:** `76bad31f12635b5724a968ee3e21a2058392992f`  
**Decision:** production changes remain blocked.

## 1. Project and connection facts

- Project status: `ACTIVE_HEALTHY`.
- PostgreSQL: `17.11.0.018`, engine 17; region `eu-central-1`.
- Catalog query identity: `current_user=postgres`, `session_user=postgres`; `row_security=on`.
- The inspection used read-only SELECT/catalog queries only. No DDL, DML, grants, role changes, migrations, deployment, or secrets changes were made.

## 2. Live schema inventory

The public schema contains exactly 11 ordinary tables, all owned by `postgres`:

`AuditEvent`, `AuthActionToken`, `AuthRateLimit`, `EmailContact`, `EmailContactVerificationToken`, `License`, `Membership`, `Product`, `Session`, `Tenant`, `User`.

A statistics snapshot reported zero live tuples for each of the 11 tables. This is a point-in-time observation and does not waive backup/restore or migration controls.

RLS is enabled on all 11 tables; FORCE RLS is enabled on none. `pg_policies` contains zero policies in `public`. Supabase Security Advisor reports 11 `rls_enabled_no_policy` findings. Health Advisor returned no findings.

No public triggers, public functions, or public sequences were returned by the catalog inventory. The installed extensions are `pg_stat_statements`, `pgcrypto`, `plpgsql`, `supabase_vault`, and `uuid-ossp`.

The live public enum types are:
- `PlatformRole`: OWNER, PLATFORM_ADMIN, SUPPORT, USER
- `TenantStatus`: ACTIVE, SUSPENDED, CLOSED
- `MembershipRole`: OWNER, ADMIN, MANAGER, MEMBER, VIEWER
- `ProductStatus`: PLANNED, ACTIVE, MAINTENANCE, RETIRED
- `EmailPurpose`: OWNER, SUPPORT, BILLING, SECURITY, GENERAL
- `AuthTokenPurpose`: EMAIL_VERIFY, PASSWORD_RESET

The later repository enum types `SessionAssurance` and `AuthChallengePurpose` are absent from the live catalog.

## 3. Specific schema drift against the security branch

Absent tables:
- `UserMfa`
- `MfaRecoveryCode`
- `AuthChallenge`
- `AiGeneration`

Absent columns on `Session`:
- `revokedAt`
- `lastSeenAt`
- `assurance`
- `mfaAuthenticatedAt`

The `AuditEvent.tenantId` column and `AuditEvent_tenantId_createdAt_idx` index exist. The `AuditEvent_tenantId_fkey` foreign-key constraint is absent. The existing `AuditEvent.actorUserId` foreign key is present.

Supabase migration history is empty. The live database does not have a `public._prisma_migrations` table. The repository migration sequence has not been reconciled or applied to production.

## 4. Roles, grants and RLS boundary

- No role matching `vayro_%` exists.
- No membership involving a `vayro_%` role exists.
- `postgres`: LOGIN, superuser=false, BYPASSRLS=true, CREATEROLE=true, CREATEDB=true.
- `service_role`: LOGIN=false, superuser=false, BYPASSRLS=true.
- `anon` and `authenticated`: LOGIN=false, BYPASSRLS=false.
- No direct table grants to PUBLIC, anon, authenticated, or service_role were returned by the inspected `information_schema.role_table_grants` view. This does not prove the absence of all effective/inherited privileges for every possible identity.
- Public schema ACL shows USAGE to PUBLIC and several platform roles; CREATE is held by `pg_database_owner`. No VAYRO runtime role exists to test against.

The production connection itself used `postgres`, so this audit cannot establish the effective application runtime identity, tenant-context behavior, or negative cross-tenant isolation. A dedicated non-owner LOGIN role and real connection-path tests are still mandatory.

## 5. GitHub exact-head verification

For PR #6 head `76bad31f12635b5724a968ee3e21a2058392992f`:
- Combined status returned one external Railway context, `ARIA Web - VAYRO`, state `success`.
- The GitHub workflow-runs connector returned an empty list for this exact SHA.
- Therefore CI and CodeQL are **not verified for this exact head**. The Railway status is not a substitute for CI, CodeQL, or production acceptance.
- PR #6 remains open, Draft, and unmerged; the connector reported `mergeable=false`.
- No review submissions or inline review threads were returned.

Earlier green workflow results on other SHAs do not certify this exact head.

## 6. Repository findings requiring follow-up

The reviewed `src/lib/auth-service.ts` currently returns `true` from `allowIpAttempt()` when `TRUSTED_PROXY_HOPS` is absent or invalid, because no IP fingerprint is produced. This means IP-only throttling is skipped in that configuration; identity-based throttling is a separate control. The production proxy trust chain and configuration must be verified, and the fail-open behavior needs a reviewed remediation before release.

The new bootstrap least-privilege migration and SQL test exist on the security branch, but neither has been executed on production. They must be validated on a verified restore clone after the migration baseline and role prerequisites are reconciled.

## 7. Required next actions and release decision

1. Authorized database operator creates and verifies an encrypted logical backup outside Supabase and performs a successful isolated PostgreSQL 17 restore; record checksums and measured RPO/RTO.
2. Reconcile every live object against the exact Prisma schema and all migrations on the restored clone; create a reviewed baseline only if exact equivalence is proven.
3. Fix and test the trusted-proxy/IP throttling fail-open behavior, then verify real proxy configuration.
4. Validate role creation, role memberships, ownership, grants, policies, FORCE RLS, and tenant negative tests on the restored clone using dedicated non-owner LOGIN identities.
5. Obtain exact-head CI and CodeQL completion; run endpoint authorization, MFA/session, integration, build and device/UAT checks.
6. Provision dedicated VAYRO hosting and storage only after capacity/permissions are resolved; verify email, domain/TLS, monitoring, billing/licensing and operational controls.
7. Obtain independent security review and explicit owner approval for each production change and for release.

**Current status: REPOSITORY ENGINEERING IN PROGRESS — PRODUCTION SECURITY/INFRASTRUCTURE NOT VERIFIED — DEPLOYMENT BLOCKED — NOT RELEASED.**
