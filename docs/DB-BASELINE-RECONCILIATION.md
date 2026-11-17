# VAYRO-CORE Database Baseline Reconciliation

**Inspection date:** 2026-11-17  
**Method:** Supabase project/catalog/migration/advisor reads and read-only SQL only.  
**Production writes:** None.

## Live project snapshot

- Project: `VAYRO-CORE` (`wdqhdnhpgxhmmfeyxwxr`)
- Region: `eu-central-1`
- Status: `ACTIVE_HEALTHY`
- PostgreSQL: `17.11`
- Public application tables: 11
- Estimated public-table rows: 0
- Supabase migration history: empty
- Public RLS policies: 0
- Table grants to `anon`, `authenticated`, `service_role`: 0
- RLS: enabled on all 11 public application tables
- Schema usage: `anon`, `authenticated`, and `service_role` have USAGE; none have CREATE.

The public tables, enums, initial indexes and constraints observed in the catalog are consistent with the original 11-table initial schema migration at a structural inspection level. A normalized automated schema diff and independent baseline sign-off have not been completed; therefore the baseline must not yet be marked as applied.

## Critical differences from the current application schema

The live database is behind the repository's current Prisma schema/migration history:

- It does not contain `MfaCredential`, `MfaLoginChallenge`, or `MfaRecoveryCode`.
- The live `Session` table does not yet contain the later `assurance`, `mfaAuthenticatedAt`, `revokedAt`, or `lastSeenAt` columns.
- The repository now contains six migrations, while Supabase reports no applied migration history.

The database is empty, but emptiness does not make an unsafe migration acceptable. Running the initial create-table migration against existing tables would conflict. Do not run `prisma migrate deploy` against VAYRO-CORE until the baseline is reconciled and registered.

## RLS and database-role boundary

- The catalog query itself ran as database role `postgres`.
- That role has `rolbypassrls=true`; it is not evidence of the identity or effective permissions used by the VAYRO application runtime.
- Supabase's `service_role` also has BYPASSRLS semantics but was reported as non-login and had no table grants in the inspected ACLs.
- The current server-only architecture relies on the application server to enforce authorization. No browser-role table grants were found.
- The actual `DATABASE_URL` identity used by a deployed VAYRO application is not available for read-only verification. If it uses a superuser/owner/BYPASSRLS credential, database RLS is not a defense-in-depth boundary.

Before release, provision and verify a dedicated server-only runtime database role with only the privileges required by VAYRO. Do not grant browser roles table access or add broad RLS policies just to silence informational advisor notices.

## Security/performance advisor snapshot

- Security advisor: 11 informational `rls_enabled_no_policy` findings, matching the 11 RLS-enabled public tables with no policies.
- Performance advisor: 10 unused-index findings. The database is empty, so these are not grounds for index removal.

## Safe next sequence

1. Take and verify an independent encrypted backup before any production schema operation.
2. Compare every live table, column, default, enum, index, constraint, RLS flag, policy and ACL against the initial migration and Prisma schema.
3. Have the baseline diff reviewed and approved. If exact equivalence is proven, register the initial migration as already applied; do not execute its CREATE statements against existing tables.
4. Apply subsequent migrations only to an isolated clone first, then verify the forward path and rollback/recovery strategy.
5. Confirm the application runtime role and effective privileges using the actual protected runtime connection, without exposing credentials.
6. Obtain explicit owner approval before any production migration or role change.

No live schema, migration history, role, grant, policy, secret or data was changed during this inspection.
