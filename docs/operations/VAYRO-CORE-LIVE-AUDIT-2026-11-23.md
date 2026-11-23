# VAYRO-CORE Live Database Audit Snapshot — 2026-11-23

**Supersedes the historical 2026-11-09 snapshot in** `PRODUCTION-DB-ROLE-BASELINE-MIGRATION-RUNBOOK.md` **for current-state decisions.**  
**Project:** `wdqhdnhpgxhmmfeyxwxr` (`VAYRO-CORE`)  
**Inspection mode:** Read-only catalog and advisor inspection. No schema, role, grant, policy, migration, or data changes were made.

## Observed platform state

- Project status: `ACTIVE_HEALTHY`
- PostgreSQL: `17.11.0.018`
- Region: `eu-central-1`
- Supabase migration history: empty
- Prisma ledger: `public."_prisma_migrations"` absent
- Public tables observed: 11
- RLS enabled: 11 of 11
- FORCE RLS: 0 of 11
- Public-schema RLS policies: 0
- Roles matching `vayro_%`: 0
- Direct table grants to `anon`, `authenticated`, and `PUBLIC`: 0 observed
- Table ownership: all 11 public tables owned by `postgres`
- Security Advisor: 11 `rls_enabled_no_policy` findings
- Health Advisor: no findings

The 11 observed tables were: `User`, `Tenant`, `Membership`, `Session`, `Product`, `License`, `AuditEvent`, `EmailContact`, `EmailContactVerificationToken`, `AuthActionToken`, and `AuthRateLimit`.

## Confirmed drift against later repository migrations

Missing objects observed in the live database:

- Tables: `UserMfa`, `MfaRecoveryCode`, `AuthChallenge`, `AiGeneration`, `EngineeringTask`, `EngineeringTaskAttempt`, `EngineeringTaskDependency`
- `Session` columns: `revokedAt`, `lastSeenAt`, `assurance`, `mfaAuthenticatedAt`
- Enums: `SessionAssurance`, `AuthChallengePurpose`, `EngineeringTaskStatus`
- Foreign key: `AuditEvent_tenantId_fkey`
- Runtime capability roles and their role-scoped policies are not present.

## Interpretation and restrictions

- RLS enabled with zero policies does not establish tenant isolation. The application runtime's effective database identity and inherited privileges still require proof.
- No direct grants to Data API roles were observed in the inspected grant view; this is not a substitute for a complete effective-privilege analysis.
- The absence of a Prisma ledger while initial tables already exist makes an unreviewed `prisma migrate deploy` unsafe. Do not create or mark a baseline until exact object-by-object equivalence is proven on restored clones.
- A zero-row count from a compact table-list response is not accepted as proof that all application tables contain no data.
- No production data or schema was modified during this audit.

## Required next gates

1. Execute the independent backup procedure in `VAYRO-CORE-INDEPENDENT-BACKUP-RESTORE-DRILL.md`.
2. Store encrypted backup artifacts outside the Supabase/provider failure domain; verify SHA-256 after transfer.
3. Restore into a separate isolated PostgreSQL 17 target and verify schema, row counts, constraints, sequences, extensions, functions, triggers, policies, grants, ownership, and role memberships.
4. Re-run the live read-only inventory immediately before any proposed production change.
5. Reconcile every live object with the exact migration chain and test baseline equivalence on two independent restored clones.
6. Obtain separate approval for baseline recording, role provisioning, and each production migration execution.

**Decision:** `PRODUCTION DATABASE CHANGES BLOCKED` until independent backup and restore evidence, migration reconciliation, role review, and the required change-specific approvals are complete.

## Related implementation artifacts

- Read-only drift query: `prisma/diagnostics/vayro-live-migration-drift.sql`
- CI RLS policy gate: `tests/sql/rls-policy-coverage.sql`
- Production migration runbook: `docs/operations/PRODUCTION-DB-ROLE-BASELINE-MIGRATION-RUNBOOK.md`
- Independent backup/restore procedure: `docs/operations/VAYRO-CORE-INDEPENDENT-BACKUP-RESTORE-DRILL.md`
