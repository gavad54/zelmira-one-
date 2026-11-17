# VAYRO Owner Operations Runbook — Infrastructure Gate

Date: 2026-11-17
Repository branch: `feature/vayro-real-dashboard`
Current verified commit: `c1053a955b6fc2f0b633f5be3f3cdd1348cd49d4`

## Current release gate

**BLOCKED — no production deployment or customer onboarding.**

The source branch passes the current CI, Dashboard Validation, and CodeQL workflows. The Railway project shell could not be created: Railway returned `Free plan resource provision limit exceeded. Please upgrade to provision more resources!`. The only visible workspace is `gavad54's Projects`; the only visible projects are ARIA Web and LEADORA. No VAYRO service or deployment was created.

Supabase VAYRO-CORE is active in `eu-central-1`, PostgreSQL 17. The existing database has 11 public application tables, all empty at the last inspection, and the Prisma migration history is empty. The six repository migrations are not applied. The first migration creates the existing 11 tables and therefore must not be replayed over the current schema.

## Hard safety rules

- Do not run `prisma migrate deploy` against the existing VAYRO-CORE database yet.
- Do not mark the initial migration as applied until every object, type, default, constraint, index, grant, RLS flag, and extension has been compared against the exact initial migration.
- Do not use `postgres`, `service_role`, or a `BYPASSRLS` principal as the web runtime identity.
- Do not create broad RLS policies to silence the no-policy advisor while the server-only access model and client grants are still being verified.
- Do not put production credentials in GitHub files, issues, commits, or chat.
- Do not deploy or expose a public hostname until runtime identity, email, MFA, backups, restore, monitoring, and rollback gates are verified.
- A CI backup/restore test is not a production backup/restore test.

## Gate A — Hosting

1. Resolve Railway workspace resource-limit/plan issue with the account owner. The Railway API rejected creation before any project was created.
2. Confirm the intended plan and any recurring cost before provisioning.
3. Create private project `VAYRO` with a non-production `staging` environment first.
4. Attach the GitHub repository and explicitly select `feature/vayro-real-dashboard` for staging. Do not deploy `main` or create a production environment until owner approval.
5. Use the repository Dockerfile and `railway.toml`; the health-check path is `/api/health`.
6. Configure environment variables only through the provider's secret/environment UI. Never commit them.
7. Confirm TLS, service health, deployment SHA, logs, restart behavior, and rollback before any production promotion.

## Gate B — Database backup and restore

Before touching the live schema:
1. Enable and verify provider-managed backups/PITR appropriate to the account plan.
2. Create a separately encrypted off-site logical backup. Store the encryption key separately from the backup object.
3. Restore the backup into a disposable PostgreSQL 17 database/project, not over the source.
4. Verify table/type/constraint/index counts and sample row counts; compare checksums for non-empty tables.
5. Record backup timestamp, restore timestamp, measured RPO and RTO, checksum, and operator.
6. Retain the last known-good backup until a second restore has passed.

No such independent production restore has been demonstrated.

## Gate C — Safe migration baseline

The live database already contains objects created manually or outside Prisma migration tracking. The initial migration creates those objects and cannot be blindly replayed.

Required procedure:
1. Export read-only catalog metadata for all public tables, columns, enum types, indexes, constraints, sequences, extensions, ownership, grants, default privileges, and RLS settings.
2. Compare that metadata with `prisma/schema.prisma` and the complete initial migration SQL.
3. Generate a reviewed baseline reconciliation report. Any drift must be resolved explicitly.
4. Test the exact baseline command and the remaining five migrations on a disposable clone restored from the verified backup.
5. Only after clone rehearsal, create the migration tracking baseline using the supported Prisma baseline procedure, with the initial migration marked applied only after proving the existing objects match.
6. Apply the remaining migrations to the clone and run the full integration suite.
7. Production execution requires separate owner approval and a fresh backup immediately before change.

## Gate D — Database identities

- Create a dedicated migration identity with DDL rights, used only by a controlled migration job.
- Create a separate runtime identity with only the minimum DML rights required by the application.
- Runtime identity must not be superuser, must not have `BYPASSRLS`, and must not be a Supabase service role.
- Test each role with positive and negative privilege assertions from a disposable database.
- Set the runtime connection string in the host secret store; never expose it to browser bundles.
- Re-run `/api/ready` from the actual deployed application and confirm database and schema checks.

The live SQL inspection currently executes as `postgres`; this is not evidence of the application's runtime identity.

## Gate E — Operational keys and integrations

Configure directly in the host's secret store:
- `VAYRO_MFA_ENCRYPTION_KEY`: cryptographically random 32-byte key encoded as 64 hex characters; store key version and recovery procedure separately.
- `DATABASE_URL`: runtime least-privilege principal only.
- Email provider credentials and a verified sender/domain. Send and receive a real test message and inspect provider delivery logs.
- `TRUSTED_PROXY_HOPS`: exact value for the actual proxy topology; do not guess.
- Session/signing secrets: confirm algorithm, length, versioning, rotation, revocation, and rollback.
- Backup encryption key: independent from database and backup storage credentials.
- Payment credentials and webhook signing secrets only when a provider and legal/compliance scope have been approved.
- Android signing material only in a protected signing workflow with owner-controlled recovery.

A syntactically valid variable is not proof that the underlying integration works. MFA must pass encrypt/decrypt and rotation tests; email must pass real delivery; backups must pass restore.

## Gate F — Release evidence

Before release, archive:
- exact production commit SHA and image digest;
- successful CI, Dashboard Validation, CodeQL, dependency audit and integration test results;
- DB baseline/migration report;
- runtime-role privilege test output;
- MFA enrollment/login/recovery/rotation evidence;
- email delivery evidence;
- encrypted backup and independent restore report with RPO/RTO;
- tenant-isolation and endpoint-authorization test results;
- TLS/security-header/CSP/CORS/rate-limit review;
- monitoring, alerting, incident and rollback runbooks;
- owner UAT sign-off and explicit production deployment approval.

## What has been verified now

- GitHub CI: success on current commit.
- Dashboard Validation: success on current commit.
- CodeQL: success on current commit.
- CI isolated PostgreSQL migration, backup and restore checks: success.
- Railway VAYRO project creation: blocked by free-plan resource provisioning limit.
- Supabase live schema: not baselined; six migrations not recorded as applied.
- Live DB runtime least-privilege identity: not established.
- Production secrets, email delivery, encrypted off-site backup, independent restore, production host, and DNS: not verified.

**No production mutation was performed by this runbook work.**
