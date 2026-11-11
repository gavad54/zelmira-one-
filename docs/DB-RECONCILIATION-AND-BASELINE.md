# VAYRO-CORE schema reconciliation and migration baseline gate

## Purpose

This is a controlled, evidence-first gate between the Prisma migration chain and the live VAYRO-CORE database. The companion SQL file at `prisma/diagnostics/vayro-live-schema-audit.sql` is read-only. It inventories schema objects, columns, owners, RLS/FORCE RLS, policies, role attributes and membership, grants, Prisma migration history, enums, extensions, constraints and indexes.

**Do not use this report as permission to change the live database.** No baseline, `prisma migrate resolve`, `db push`, DDL, role provisioning, policy creation, grants or data writes may be performed against production until the backup/restore gate is independently satisfied.

## Exact observed live state — 2026-11-11

Project: VAYRO-CORE (`wdqhdnhpgxhmmfeyxwxr`), PostgreSQL 17.11, project status `ACTIVE_HEALTHY`.

Read-only inventory returned 11 public tables and zero rows in each:
- `User`, `Tenant`, `Membership`, `Session`, `Product`, `License`, `AuditEvent`
- `EmailContact`, `EmailContactVerificationToken`, `AuthActionToken`, `AuthRateLimit`

The Prisma schema on main defines 15 models. The following four model tables were not present in the live inventory:
- `UserMfa`
- `MfaRecoveryCode`
- `AuthChallenge`
- `AiGeneration`

The live migration history API returned an empty list. The Supabase Security Advisor reported 11 findings: every inventoried public table has RLS enabled and no policy was found. A green CI run on isolated PostgreSQL does not prove that the live database has the same migration history, columns, grants, roles, or policies.

This evidence is a drift indicator, not a complete schema diff. The SQL audit must be run with a read-only identity and its complete output retained before a DBA signs off on a baseline.

## Mandatory sequence

1. Confirm an encrypted off-provider backup exists; record object version, checksum, encryption metadata and source timestamp.
2. Restore that exact backup into a disposable PostgreSQL 17 environment on a separate host. Do not restore over production.
3. Run the read-only audit SQL against both source (read-only) and restored clone. Retain complete output and compare.
4. Compare every live object against the full ordered Prisma migration chain on main, including columns, enum labels, defaults, indexes, constraints, functions, triggers, grants, role memberships and RLS policies.
5. Explain every difference. Identify whether the live database is a partial/manual deployment, an older baseline, or a divergent schema. Do not infer this from table names alone.
6. Rehearse the proposed baseline/forward migration on a fresh disposable clone. Verify both successful migration and a tested recovery path.
7. Have a database/security reviewer approve the exact baseline and migration plan.
8. Only then schedule a separately approved production change window with a verified rollback/recovery point.

## Hard STOP conditions

- No verified encrypted backup and isolated restore.
- `_prisma_migrations` absent, empty, or inconsistent with the actual migration chain.
- Any unexplained table/column/type/default/index/constraint/extension difference.
- Any role with unexpected LOGIN, SUPERUSER or BYPASSRLS attributes, or unexpected role inheritance.
- Any missing or overly broad policy/grant; RLS enabled without the intended role-specific policy.
- Any inability to prove tenant isolation with positive and negative tests.
- Any restore target that is not demonstrably isolated from production.

## Completion evidence required

- Timestamped source and clone audit outputs.
- Backup checksum, encryption metadata and object version.
- Restore logs and measured backup/restore duration.
- Signed schema-diff report with every discrepancy resolved.
- Reviewed migration baseline/forward plan and rehearsal results.
- Role/grant/RLS test results, including cross-tenant denial.
- Named reviewer approval and change record.

**Current decision: DATABASE BASELINE NOT APPROVED — PRODUCTION MIGRATIONS BLOCKED.** The next safe owner action is to complete the backup-provider and isolated-restore prerequisites in `docs/BACKUP-RESTORE-RUNBOOK.md`. Never paste database URLs, credentials, encryption identities or private keys into chat or source control.
