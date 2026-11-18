# VAYRO-CORE schema reconciliation — 2026-11-17

## Decision

**Do not run production migrations yet.** This reconciliation is based on read-only inspection of Supabase project `wdqhdnhpgxhmmfeyxwxr` and review of all six SQL migrations on branch `feature/vayro-real-dashboard`. No production DDL, DML, grants, policies, role changes, migration bookkeeping, secrets access, or deployment was performed.

## Evidence captured

- Live public schema: 11 application tables; all 11 have RLS enabled; all had zero rows during inspection.
- Supabase migration history: empty.
- Repository: six ordered migrations from `20261106055500_init_vayro_core` through `20261117080000_mfa_factor_replacement`.
- All live timestamp columns inspected use timestamp without time zone with precision 3, matching the migration declarations.
- Live enum labels match the six enums created by the initial migration.
- Initial schema primary keys, foreign keys and initial indexes are present in the live catalog.
- Security Advisor reports RLS enabled without policies on all 11 live tables.
- `postgres` is a login role with BYPASSRLS; `service_role` has BYPASSRLS but cannot log in. A dedicated least-privilege application role was not found in the inspected role set.

## Exact differences: live schema versus current repository migration chain

### Objects present in initial migration and live schema

The 11 tables created by the initial migration are present. Their inspected columns, data types, nullability, timestamp precision, enum labels, primary keys, foreign keys, and initial indexes correspond to the initial migration.

The initial migration's REVOKE statements and role grants still require a separate privilege-level verification before baseline acceptance; object-shape equivalence alone does not prove privilege equivalence.

### Missing objects from later migrations

| Migration | Expected object | Live result |
|---|---|---|
| `20261111080000_add_mfa_persistence` | `MfaCredential` | Missing |
| same | `MfaLoginChallenge` | Missing |
| same | `MfaRecoveryCode` | Missing |
| `20261114080000_session_mfa_assurance` | `Session.assurance`, `Session.mfaAuthenticatedAt`, enum `SessionAssurance` | Missing |
| `20261114090000_add_session_revocation` | `Session.revokedAt` | Missing |
| `20261116080000_add_session_idle_tracking` | `Session.lastSeenAt`, index `Session_userId_revokedAt_idx` | Missing |
| `20261117080000_mfa_factor_replacement` | five pending-factor columns and `MfaCredential_pending_factor_complete_check` | Missing with parent table |

The live `Session` table currently has only `id`, `tokenHash`, `userId`, `expiresAt`, and `createdAt`.

## Safe migration strategy

1. Preserve the current database unchanged. Obtain a provider-native backup and verify a restore into a separate disposable project/database. A backup job marked successful is not enough; the restore must be opened and checked.
2. Run the read-only inventory in `prisma/verification/live-schema-inventory.sql` and archive its output with the backup identifier and inspection timestamp.
3. Complete a privilege audit for table, sequence, schema, default privileges, ownership, and role membership. Confirm the effective application connection identity without exposing credentials.
4. Reconcile the initial migration object-by-object, including grants and ownership. Only if equivalence is fully proven may the initial migration be baselined using Prisma's documented resolve workflow. This must be tested against a restored disposable copy first.
5. Apply the five subsequent migrations in order to the disposable copy. Confirm the resulting schema matches `prisma/schema.prisma`, and exercise authentication/MFA flows against that copy.
6. Design a dedicated non-owner runtime role and server-side tenant-context mechanism. Keep direct `anon`/`authenticated` Data API access revoked unless a reviewed policy design explicitly requires it.
7. Test RLS with at least two tenants: legitimate same-tenant access must succeed; cross-tenant reads and writes must fail; missing/forged tenant context must fail closed. Also test owner/support administrative paths separately.
8. Have the owner review the exact migration diff, backup and restore evidence, role grants, RLS tests, rollback plan, and maintenance window. Only then may a separate, explicitly approved production migration be considered.

## Why no production SQL was applied

The migration history is empty while the initial migration's tables already exist. Blindly replaying the initial migration would collide with existing objects. Conversely, marking it applied without proving the initial schema and privilege state could conceal drift. The correct next action is a verified backup/restore and disposable-database rehearsal, not a speculative production patch.

## Verification boundaries

This report establishes a schema-object comparison for the observed catalog, not full production security certification. It does not establish that MFA is operational, tenant isolation is effective, the runtime role is least-privileged, or production recovery works.

**Release status: BLOCKED — NOT RELEASED.**
