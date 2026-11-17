# VAYRO Infrastructure and Operational Readiness Audit — 2026-11-17

## Scope and safety boundary

Read-only review of the VAYRO GitHub development branch, the connected Supabase project, Supabase advisors, and the visible Railway workspace. No production DDL, grants, policies, migrations, secrets, project creation, deploy, payment, or customer-data operation was performed.

## Verified infrastructure facts

### Supabase VAYRO-CORE

- Project ref: `wdqhdnhpgxhmmfeyxwxr`
- Region: `eu-central-1`
- Project state: `ACTIVE_HEALTHY`
- PostgreSQL engine: 17
- The public schema currently exposes 11 application tables, all reporting zero rows.
- RLS is enabled on all 11 existing application tables.
- No RLS policies were found on those 11 tables.
- No table grants were found for `anon`, `authenticated`, or `service_role`; this is consistent with a server-only access model, but the app role must be separately provisioned and verified.
- The Prisma migration history returned zero applied migrations.
- The current administrative SQL identity is `postgres`; it has `rolbypassrls=true` and `rolcanlogin=true`. It is not acceptable as the normal application runtime identity.
- The current schema is behind the repository Prisma schema: the three MFA tables are absent, and session assurance/revocation/activity columns are absent.
- The repository contains six migrations. The initial migration creates objects already present in the live database, so blindly replaying it would collide with existing objects.

### Supabase advisors

- Security advisor reports 11 informational `rls_enabled_no_policy` findings. Do not add broad policies merely to silence these findings while the design remains server-only and client grants remain revoked.
- Performance advisor reports 10 unused indexes on empty tables. Do not remove them based on zero-traffic observations.

### Hosting and external operations

- The inspected Railway workspace exposed ARIA Web and LEADORA projects; no independent VAYRO project was found.
- No production host, verified DNS/domain, transactional email delivery, payment provider, offsite encrypted backup, or independent restore drill was established by this audit.
- Production secrets and signing keys were not visible or copied. Their custody remains owner-controlled.

## Repository engineering changes

On `feature/vayro-real-dashboard`:

1. Extracted environment readiness checks into `src/lib/readiness-config.mjs`.
2. Corrected regular-expression escaping for trusted proxy hop validation and email sender validation.
3. Added focused tests in `tests/readiness-config.test.mjs` for MFA key shape, proxy hop range, Resend/Gmail configuration, malformed senders, and unknown providers.
4. Strengthened `/api/ready` to fail closed unless:
   - the runtime database identity can log in and is neither superuser nor `BYPASSRLS`;
   - all 14 expected application tables and required MFA/session columns exist;
   - the SessionAssurance enum exists;
   - the Prisma migration table exists;
   - all six expected migrations are successfully recorded and none are incomplete;
   - required MFA, proxy, and email environment settings are configured.
5. The readiness endpoint is read-only and does not run migrations or disclose role/schema metadata.

A syntactically present email credential is not proof of successful email delivery. A 64-character MFA key is not proof of secure custody, rotation, or recovery. These operational proofs remain separate gates.

## Required safe completion sequence

1. Confirm owner-controlled host account, region, pricing, and project ownership before creating services.
2. Obtain an independent encrypted backup and restore it into an isolated database; record checksum and measured RPO/RTO.
3. Reconcile all live PostgreSQL types, tables, columns, indexes, constraints, defaults, grants, RLS flags, and extensions against Prisma schema and all six migration files.
4. Test a reviewed baseline procedure against a disposable PostgreSQL 17 instance. Never replay the initial create-table migration over existing objects.
5. Create a dedicated non-login migration principal and a separate least-privilege runtime principal, with grants limited to the actual application operations. Verify the runtime identity from the application connection.
6. Apply schema changes only after rehearsal, backup/restore proof, and explicit owner approval.
7. Configure secrets directly in the provider secret manager; validate MFA encryption/decryption and rotation, email delivery, trusted proxy chain, and recovery procedures without exposing values.
8. Establish independent host, DNS, monitoring, rollback, and offsite backup.
9. Run full CI and independent security review; then obtain owner UAT and explicit merge/deploy approval.

## Release decision

**BLOCKED / NOT RELEASED.**

This audit is evidence of repository engineering and read-only discovery, not proof of production readiness. CI results for the latest commit must be checked after completion. No production mutation is authorized by this audit.
