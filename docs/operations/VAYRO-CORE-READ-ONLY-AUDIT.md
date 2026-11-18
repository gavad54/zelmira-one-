# VAYRO-CORE read-only schema diagnostic

## Purpose
This diagnostic compares the Prisma model contract with the live `public` schema and reports table presence, missing expected columns, RLS/FORCE RLS, policy inventory, table owners, runtime-role flags, tenant-related foreign keys, and whether the Prisma migration ledger exists.

## Safety properties
- The script starts a PostgreSQL `READ ONLY` transaction and ends with `ROLLBACK`.
- It executes SELECT statements only.
- It does not read customer row contents, credential values, MFA secrets, token values, or backup secrets.
- It does not create/alter/drop objects, change grants, write data, or execute migrations.
- It is a diagnostic, not a migration or remediation script.

## How to run
1. Open the VAYRO-CORE project in Supabase.
2. Open SQL Editor.
3. Paste the complete contents of `docs/operations/vayro-core-read-only-audit.sql`.
4. Run it and export/save each result grid as the audit evidence.
5. Share the result grids with the engineering review; redact project identifiers if posting publicly.

Use a read-only database role if available. Do not run migration files, baseline commands, GRANT/REVOKE statements, or SQL copied from an unreviewed source in the production SQL editor.

## Interpretation
- Any `MISSING` table or column is schema drift and must be reconciled before application deployment.
- Every table exposed to an application role must have a reviewed RLS policy set; merely enabling RLS is not proof of tenant isolation.
- `FORCE RLS` should be enabled for tables where table-owner bypass would violate the intended data boundary.
- The normal tenant runtime role must be non-superuser, NOLOGIN as a group role, and NOBYPASSRLS; the dedicated login should inherit only the intended capability role.
- `service_role` is expected to bypass RLS in Supabase and must not be used as the ordinary tenant-scoped application connection.
- An absent Prisma migration ledger means the production schema is not reconciled to Prisma migration history. Do not run `migrate deploy` until an approved baseline and restore plan exist.

## Release decision
A clean diagnostic is necessary but not sufficient. Production changes still require a verified encrypted offsite backup, a successful isolated restore, reviewed table-by-table policy semantics, and a separately approved production change window.


## Latest live diagnostic result — 2026-11-18

The diagnostic queries were executed against the VAYRO-CORE catalog using read-only SELECT statements. The live schema currently reports:

- 11 of 15 expected Prisma tables present.
- Missing: `AiGeneration`, `AuthChallenge`, `MfaRecoveryCode`, and `UserMfa`.
- Four missing session columns: `revokedAt`, `lastSeenAt`, `assurance`, and `mfaAuthenticatedAt`.
- All 11 existing tables: RLS enabled, zero policies, FORCE RLS disabled, owner `postgres`.
- The four dedicated VAYRO application roles are absent; Supabase `service_role` exists with BYPASSRLS.
- Prisma migration ledger absent.
- Tenant FK evidence exists for `License` and `Membership`; `AuditEvent.tenantId` FK was not found.

No schema, data, permissions, or production configuration was changed by this diagnostic. The findings are a release blocker, not a reason to apply the migration files directly.


## Script execution verification

The complete committed SQL diagnostic was executed through the connected Supabase SQL interface against VAYRO-CORE. It completed without SQL errors. The execution returned the final result grid (`prisma_migration_ledger_status = MISSING`); the detailed table, column, RLS, policy, role and foreign-key result grids were also collected using equivalent individual read-only SELECTs and are recorded above and in the engineering checkpoint. The script ends with `ROLLBACK`; no production changes were made.
