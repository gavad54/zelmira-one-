# VAYRO-CORE live schema and RLS reconciliation

**Observed:** 2026-11-23 (read-only inspection)  
**Project:** `wdqhdnhpgxhmmfeyxwxr`  
**Scope:** catalog, migration history, RLS flags, policies, and effective table privileges.  
**Safety:** No DDL, DML, grants, policy changes, migrations, or secret reads were performed.

## Live database facts

The live `public` schema contains 11 tables:

`AuditEvent`, `AuthActionToken`, `AuthRateLimit`, `EmailContact`, `EmailContactVerificationToken`, `License`, `Membership`, `Product`, `Session`, `Tenant`, and `User`.

For all 11 tables, the read-only catalog query observed:

- Row Level Security enabled.
- `FORCE ROW LEVEL SECURITY` disabled.
- Table owner is `postgres`.
- Zero RLS policies.
- Effective `SELECT` and `INSERT` privileges are false for both `anon` and `authenticated`.

The inspected role catalog contained `anon`, `authenticated`, and `service_role`. The `service_role` has `BYPASSRLS`, as expected for a privileged server-side role. The expected application-specific roles `vayro_app`, `vayro_auth`, `vayro_platform`, `vayro_platform_bootstrap`, and `vayro_task_worker` were not present in the inspected role result.

The Supabase migration history returned zero applied migrations. The live table inventory reports zero rows in each of the 11 tables.

## Interpretation — do not overstate the finding

The Supabase advisor reports 11 `rls_enabled_no_policy` findings. This is a real configuration gap and must be reconciled, but it is **not by itself proof that anonymous or authenticated API users can read the tables**: the inspected effective `SELECT` and `INSERT` privileges for those roles are false.

This inspection did not prove every possible privilege path. It did not audit every column-level grant, function execution privilege, view, storage policy, external connection identity, or production runtime credential. It therefore does not certify the database as secure.

The lack of `FORCE ROW LEVEL SECURITY` is not automatically a bypass for the observed `postgres`-owned tables; however, the actual application connection roles must be established and proven not to own protected tables, be superusers, or inherit `BYPASSRLS`.

## Schema drift and release blockers

The repository Prisma schema includes models that are absent from the live 11-table inventory, including MFA records, recovery codes, authentication challenges, AI generation records, and engineering task queue tables. The live migration history is empty, so the live database is not yet reconciled to the repository migration history.

Do not apply repository migrations, create policies, grant privileges, or alter the live schema until all of the following are completed:

1. Establish the exact runtime database identity used by each server-side application path without exposing credentials.
2. Reconcile the provisioned live schema with the Prisma schema and repository migration history.
3. Produce an encrypted backup artifact outside the database/hosting provider and verify its checksum and metadata.
4. Restore that artifact into an isolated database and pass schema/data invariants.
5. Test the intended role matrix and cross-tenant positive/negative cases against the isolated schema.
6. Review the migration baseline and forward/rollback plan before any separately authorized production change.

## Existing isolated evidence

The repository CI contains `tests/sql/tenant-rls-isolation.sql` and `tests/tenant-rls.integration.mjs`. These exercise the richer repository schema and dedicated tenant role in disposable PostgreSQL. They are useful isolated evidence, but they do not reconcile or secure the currently provisioned VAYRO-CORE database.

## Next safe engineering action

Keep the live database read-only. Add a catalog reconciliation gate to CI that compares required Prisma models, migration objects, RLS flags, policy presence, table ownership, and runtime-role privileges in disposable PostgreSQL. Only after that gate passes should a separately reviewed isolated policy matrix be considered.
