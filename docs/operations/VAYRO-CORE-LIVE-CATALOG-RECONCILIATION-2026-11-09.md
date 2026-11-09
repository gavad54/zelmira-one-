# VAYRO-CORE Live Catalog Reconciliation — Read-only Snapshot

**Observed:** 2026-11-09  
**Project:** `VAYRO-CORE` (`wdqhdnhpgxhmmfeyxwxr`)  
**Database:** PostgreSQL 17.11.0.018, region `eu-central-1`  
**Organization plan:** Free  
**Source branch reviewed:** `security/mfa-session-endpoint-gates`  
**Disposition:** READ-ONLY EVIDENCE — NO PRODUCTION DDL — NO BACKUP OR RESTORE CLAIMED

## 1. Evidence collection

The following checks were performed using read-only project metadata, verbose public table introspection, migration history, extension inventory, Security Advisor, and a read-only PostgreSQL catalog query.

The live project was reported `ACTIVE_HEALTHY`. The catalog query returned:

| Check | Live result |
|---|---:|
| Public base tables | 11 |
| Public tables with RLS enabled | 11 |
| Public RLS policies | 0 |
| Public tables with FORCE RLS | 0 |
| Roles named `vayro_*` | 0 |
| Public `_prisma_migrations` table | absent |
| Supabase migration history entries | 0 |
| Rows in each listed public table | 0 (as returned by verbose listing) |

The 11 current public tables are:

`AuditEvent`, `AuthActionToken`, `AuthRateLimit`, `EmailContact`, `EmailContactVerificationToken`, `License`, `Membership`, `Product`, `Session`, `Tenant`, `User`.

Security Advisor reports 11 `rls_enabled_no_policy` findings, one for each public table. Health Advisor returned no findings. RLS enabled without policies does not establish tenant isolation for the intended runtime roles.

## 2. Exact observed schema drift against the reviewed Prisma branch

### Missing tables

The current Prisma schema and migration chain include four tables not present in the live public catalog:

| Missing table | Owning migration |
|---|---|
| `UserMfa` | `20261108000000_mfa_session_foundation` |
| `MfaRecoveryCode` | `20261108000000_mfa_session_foundation` |
| `AuthChallenge` | `20261108000000_mfa_session_foundation` |
| `AiGeneration` | `20261109150000_tenant_ai_generation_history` |

### Missing Session lifecycle columns

The live `Session` table contains only:

`id`, `tokenHash`, `userId`, `expiresAt`, `createdAt`.

The Prisma schema and first MFA migration additionally require:

- `revokedAt`
- `lastSeenAt`
- `assurance` (enum `SessionAssurance`)
- `mfaAuthenticatedAt`

### Missing constraints and database security objects

- `AuditEvent.tenantId` column is present, but the expected `AuditEvent_tenantId_fkey` foreign-key constraint is absent.
- The tenant-boundary migration adds `vayro_app`, tenant policies, FORCE RLS on the tenant data-plane tables and the missing audit foreign key.
- The auth boundary migration adds `vayro_auth`, MFA/action-token/rate-limit policies and grants.
- The platform boundary migration adds `vayro_platform`, `vayro_platform_bootstrap`, owner/MFA-assurance policies and the controlled owner bootstrap function.
- The AI history migration adds `AiGeneration` with tenant-scoped RLS and indexes.

No migration history is recorded on the live project, so the repository migrations must not be marked applied merely because some base tables already exist.

## 3. Repository migration sequence reviewed

The following migration files exist on `security/mfa-session-endpoint-gates`:

1. `20261108000000_mfa_session_foundation/migration.sql`
2. `20261108170000_tenant_rls_runtime_boundary/migration.sql`
3. `20261109120000_auth_database_role_boundary/migration.sql`
4. `20261109130000_platform_control_plane_role_boundary/migration.sql`
5. `20261109150000_tenant_ai_generation_history/migration.sql`

The SQL source was inspected, but this report does not claim the sequence is safe to apply directly to the live catalog. In particular, the migration sequence assumes an existing schema baseline and must first be reconciled against the full catalog, including indexes, enum definitions, grants, function ownership, role membership, triggers, policies and extension state.

## 4. Required reconciliation work on a restored clone

Before any DDL:

1. Produce an independently stored encrypted logical export of the live database.
2. Record SHA-256, export timestamp, source project, PostgreSQL version and export method.
3. Restore into an isolated database/project that receives no production traffic.
4. Capture complete catalog inventories from both the restored clone and the exact repository baseline.
5. Generate a reviewed diff for tables, columns, defaults, nullability, enums, indexes, constraints, functions, triggers, extensions, grants, role attributes, role memberships, RLS and policies.
6. Build an explicit baseline/reconciliation migration for the observed state; do not assume the five listed migrations are a drop-in sequence for this pre-existing database.
7. Rehearse the baseline and all forward migrations on a disposable copy of the restored clone.
8. Test role boundaries and tenant isolation using the actual non-owner LOGIN identities, not the `postgres` or `service_role` principals.
9. Restore the original backup again and retain the repeatability evidence.

## 5. Backup and environment constraints

- The Supabase organization currently reports the **Free** plan.
- Supabase documentation recommends regular off-site exports for Free projects using the Supabase CLI `db dump` workflow.
- The connected project tools used for this audit do not expose a backup export/download action.
- No database connection credential was supplied to a controlled CLI environment in this session; no dump was produced.
- No independent target project or restored clone exists.
- No Supabase development branch exists. A development branch is not a substitute for an independent backup and, per the provider tool contract, does not carry production data.
- No project, branch, add-on or paid resource was created.

Official provider guidance: https://supabase.com/docs/guides/platform/backups  
CLI dump reference: https://supabase.com/docs/reference/cli/supabase-db-dump

## 6. Release-gate disposition

| Gate | Result |
|---|---|
| Read-only live catalog inventory | COMPLETE for the checks listed above |
| Repository migration source inspection | COMPLETE for the five files listed above |
| Full catalog-to-repository diff | NOT COMPLETE |
| Approved baseline/reconciliation migration | NOT CREATED |
| Independent encrypted backup | NOT AVAILABLE |
| Restore into isolated clone | NOT PERFORMED |
| Forward migration rehearsal | NOT PERFORMED |
| Repeat restore/recovery test | NOT PERFORMED |
| Production DDL, roles, grants, policies | NOT EXECUTED |

**Decision: DATABASE RECONCILIATION IN PROGRESS — PRODUCTION READ-ONLY — MIGRATION BLOCKED — DEPLOYMENT BLOCKED — NOT RELEASED.**
