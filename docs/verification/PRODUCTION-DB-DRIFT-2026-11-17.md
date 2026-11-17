# VAYRO-CORE live schema drift audit — 2026-11-17

## Scope and safety

Read-only inspection of the live Supabase project `wdqhdnhpgxhmmfeyxwxr` in `eu-central-1`.
No SQL DDL, grants, policies, migration, seed, data mutation, secret retrieval, or deployment was performed.
This report is a point-in-time observation, not a production-readiness certification.

## Observed live database state

- Eleven public application tables are present: `User`, `Tenant`, `Membership`, `Session`, `Product`, `License`, `AuditEvent`, `EmailContact`, `EmailContactVerificationToken`, `AuthActionToken`, and `AuthRateLimit`.
- All eleven tables had Row Level Security enabled.
- All eleven tables had zero rows at the time of inspection.
- Supabase migration history returned an empty list (zero recorded migrations).
- Security advisor reported eleven `rls_enabled_no_policy` findings: RLS is enabled but no table policies exist.
- Role inspection: `postgres` can log in and has `BYPASSRLS`; `service_role` has `BYPASSRLS` and cannot log in; `anon` and `authenticated` cannot log in and do not bypass RLS. No dedicated `vayro_app` role was present in the queried role set.

## Confirmed schema drift against current Prisma schema and repository migrations

The current repository Prisma schema and migration chain expect the following live objects, but the live database inspection did not find them:

- Tables: `MfaCredential`, `MfaLoginChallenge`, `MfaRecoveryCode`.
- `Session` columns: `revokedAt`, `lastSeenAt`, `assurance`, `mfaAuthenticatedAt`.
- `MfaCredential` pending-factor replacement columns and the `MfaCredential_pending_factor_complete_check` constraint are consequently also absent because the table itself is absent.

The live `Session` table currently exposes only `id`, `tokenHash`, `userId`, `expiresAt`, and `createdAt` in the inspected schema. The repository schema contains additional session-security fields and MFA relations.

## Interpretation

1. The live database is not reconciled with the current Prisma schema.
2. An empty migration history alongside pre-existing application tables means a blind replay of the initial migration is unsafe: it may collide with existing objects. A reviewed baseline/reconciliation plan is required.
3. RLS enabled without policies is not a completed tenant-isolation design. Do not add broad policies or grant client access as a quick fix.
4. The live `postgres` identity is unsuitable as the application runtime identity because it can log in and bypass RLS. A dedicated least-privilege role and a tested tenant-context strategy must be designed and validated in an isolated database first.
5. CI migration and backup/restore success is not evidence that the live database has been migrated or that production backup recovery has been tested.

## Required safe sequence before any production migration

1. Freeze the live schema as a read-only inventory and capture a verified backup with a documented restore point.
2. Produce a table/column/index/constraint/enum comparison between live PostgreSQL and the exact Prisma migration chain.
3. Design a baseline that records the already-existing schema without replaying conflicting create-table statements.
4. Validate baseline plus remaining migrations against a disposable database restored from a sanitized schema snapshot; include rollback/recovery rehearsal.
5. Design and test tenant-aware RLS policies and a dedicated runtime role with explicit minimum privileges; test both cross-tenant denial and legitimate access.
6. Review the exact SQL diff, backup evidence, restore result, and owner approval before any production change.
7. Apply only through a separately approved, versioned migration window, then re-run schema diff, security advisors, application integration tests, and restore checks.

## Release decision

**BLOCKED — NOT RELEASED.** Production schema migration, grants, RLS policies, runtime-role changes, and customer onboarding remain prohibited until the above gates are satisfied. The audit intentionally made no production changes.
