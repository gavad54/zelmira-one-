# VAYRO production reconciliation and recovery plan

**Date:** 2026-11-18  
**Scope:** Evidence-based preparation only. This document does not authorize production DDL, grants, role creation, migration baselining, data writes, public deployment, or spending.

## 1. Latest independently observed production database state

Supabase project `VAYRO-CORE` (`wdqhdnhpgxhmmfeyxwxr`) was reported ACTIVE_HEALTHY on PostgreSQL 17.11 in `eu-central-1`.

A fresh Supabase table inventory and advisor read found:

- 11 existing `public` tables; each reports RLS enabled.
- All 11 tables report zero rows at the time of the inventory. This is a point-in-time observation, not a guarantee that they will remain empty.
- Security Advisor: 11 `rls_enabled_no_policy` findings; no policies were listed for those tables.
- Supabase migration history returned an empty list; `public._prisma_migrations` is absent.
- Live Session columns are only `id`, `tokenHash`, `userId`, `expiresAt`, and `createdAt`.
- Live tables do not include Prisma models `AiGeneration`, `AuthChallenge`, `MfaRecoveryCode`, and `UserMfa`.
- Expected Session columns `revokedAt`, `lastSeenAt`, `assurance`, and `mfaAuthenticatedAt` are absent.
- The observed FK inventory contains tenant references for Membership and License; `AuditEvent.tenantId` has no FK to Tenant.
- Dedicated roles `vayro_app`, `vayro_auth`, `vayro_platform`, and `vayro_platform_bootstrap` were absent in the earlier read-only role inventory. Supabase `service_role` has BYPASSRLS and is not an acceptable ordinary tenant runtime role.
- Performance Advisor lists 10 unused indexes. With an empty database and no meaningful production workload, these are observations only; do not drop them.

All observations above came from read-only inventory/catalog/advisor calls. No production schema, role, grants, policy, or row was changed.

## 2. Security interpretation

RLS enabled with no policies is default-deny for ordinary roles subject to RLS, but it is not a complete security design. It does not prove the intended server runtime has correct privileges, nor protect against privileged roles that bypass RLS. The production database must not be connected to the app through a broad `service_role` credential as its normal tenant identity.

Required target boundaries:

- Browser/public roles: no direct table privileges unless a separately reviewed public-data use case explicitly requires them.
- Tenant runtime: dedicated non-owner, non-superuser, non-BYPASSRLS identity; explicit transaction-scoped tenant context; deny-by-default policies and negative cross-tenant tests.
- Authentication runtime: separate narrow role limited to the authentication/session/token tables and operations it actually needs.
- Platform/owner runtime: separate narrow role and explicit owner authorization; never use it for tenant request handling.
- Bootstrap: one-time, tightly constrained owner bootstrap, disabled/removed after successful owner establishment.
- Migration role: used only by a controlled migration job, never by request-serving application code.

Do not add generic policies such as `USING (true)` to make Supabase Advisor green. Every policy must be justified by an access matrix and tested for both allowed and denied cases.

## 3. Schema reconciliation sequence

Do not run `prisma migrate deploy` against the current production project yet. The live schema was provisioned without a migration ledger, so applying the initial create-table migration directly is likely to conflict with already existing objects.

Required sequence, in order:

1. Preserve a verified encrypted offsite backup and prove decryption and restore on a different PostgreSQL 17 host.
2. Capture a full catalog snapshot: tables, columns, types, defaults, constraints, indexes, functions, triggers, extensions, ownership, grants, RLS flags, policies and role memberships.
3. Compare that snapshot with `prisma/schema.prisma` and every ordered SQL migration. Produce a reviewed diff for every object; do not infer that a matching table name means matching structure.
4. Confirm the four missing model tables, four missing Session fields and AuditEvent tenant FK are intended for the live environment. Validate nullability, defaults, uniqueness, FK delete behavior, indexes, and data migration semantics.
5. Determine whether any production data or external clients exist. The current table inventory showed zero rows, but this must be rechecked inside the approved change window.
6. Design a baseline procedure that records the existing schema as the starting point without replaying initial CREATE statements over existing tables. Test that procedure on a disposable clone of the backup.
7. Apply the forward migrations to the clone, run Prisma validation, auth/MFA/session tests, owner/platform tests, tenant read/write isolation tests, and application integration tests.
8. Test rollback or documented forward-recovery for every migration. For non-transactional changes, define compensating actions.
9. Only after all prior steps pass may a separately authorized production change window be prepared. No automatic production apply is permitted from this plan.

## 4. RLS and tenant policy design deliverable

Before writing production policies, create a table-by-table matrix with these columns:

- Table and data classification
- Owning product/service
- Tenant key and how it is derived
- Read roles and row predicate
- Insert roles and WITH CHECK predicate
- Update roles and old/new row predicates
- Delete roles and explicit retention rule
- Owner/platform access path
- Authentication/bootstrap access path
- Whether FORCE ROW LEVEL SECURITY is required
- Cross-tenant negative test
- Audit event and retention requirement

At minimum, the matrix must separately cover User, Tenant, Membership, Session, Product, License, AuditEvent, EmailContact, EmailContactVerificationToken, AuthActionToken, AuthRateLimit, UserMfa, MfaRecoveryCode, AuthChallenge and AiGeneration. The live project currently lacks the final four tables. Table access must be denied unless a named service boundary needs it. Tenant context must be derived from the verified session and membership, not trusted from a caller-supplied tenant ID.

## 5. Backup and restore configuration required by the existing workflows

The repository already contains:

- `.github/workflows/vayro-db-backup.yml`
- `.github/workflows/vayro-db-restore-drill.yml`

The backup workflow requires GitHub Environment `vayro-backup`:

**Environment secrets**
- `VAYRO_BACKUP_DATABASE_URL`
- `VAYRO_B2_KEY_ID`
- `VAYRO_B2_APPLICATION_KEY`

**Environment variables**
- `VAYRO_BACKUP_AGE_RECIPIENT`
- `VAYRO_B2_BUCKET`
- `VAYRO_B2_S3_ENDPOINT`
- `VAYRO_B2_REGION`

The restore drill requires GitHub Environment `vayro-restore`:

**Environment secrets**
- `VAYRO_BACKUP_DATABASE_URL`
- `VAYRO_ISOLATED_RESTORE_DATABASE_URL`
- `VAYRO_BACKUP_AGE_IDENTITY`
- `VAYRO_B2_KEY_ID`
- `VAYRO_B2_APPLICATION_KEY`

**Environment variables**
- `VAYRO_B2_BUCKET`
- `VAYRO_B2_S3_ENDPOINT`
- `VAYRO_B2_REGION`

The backup job creates a PostgreSQL custom-format dump, encrypts it with age, uploads the encrypted object and checksum to B2, then verifies remote object sizes. The restore job verifies the checksum, decrypts the archive, requires a separate PostgreSQL 17 target host and empty target database, restores with `pg_restore --exit-on-error`, and reports relation count. Application-level row-count and invariant checks are still required after the workflow completes.

No values should be placed in source control, issue comments, pull-request bodies or chat. Do not use guessed credentials, personal accounts, or a production database as the restore target. The currently available integrations do not expose GitHub Environment secret/variable creation or a B2 account provisioning action. Therefore these protected values and the external storage account cannot be truthfully created by this engineering session.

## 6. Dependency audit finding

Latest CI run `44319284985` on prior PR head `e4f7786ebb0b10ce48cec3599d382b7a6954cf96` completed:

- Unit tests, Prisma generation and validation: passed.
- Isolated PostgreSQL migration, auth/platform/tenant role and RLS checks: passed.
- Lint, typecheck, production build, Docker build and PostgreSQL/HTTP integration tests: passed.
- Full dependency audit: failed with 13 High findings in the picomatch dependency chain.

The lockfile shows the affected picomatch/tinyglobby paths are development dependencies, not production dependencies. The GitHub advisory `GHSA-fc5q-39xc-vjpf` (CVE-2026-112366) currently rates this High and describes affected picomatch versions through 4.0.7; it does not identify a patched version. The CI now separately runs `npm audit --omit=dev --audit-level=moderate` before the still-blocking full audit. The production-only result must be read from the new run; it has not yet been verified.

Do not use `npm audit fix --force`, downgrade the Next.js lint configuration to an incompatible major, suppress the advisory, or lower the audit threshold. Until a patched upstream release or a reviewed replacement of the affected development-tooling dependency chain is available and tested, the full dependency gate remains open.

## 7. Current CI evidence

On PR head `e4f7786ebb0b10ce48cec3599d382b7a6954cf96`:

- CI run `44319284985`: all validation/build/integration steps passed; the final full dependency audit failed.
- CodeQL run `44319285028`: completed successfully.

A subsequent workflow-only change adds a distinct production dependency audit while preserving the full audit as blocking. Fresh CI/CodeQL evidence is required for the new head.

## 8. Non-database release dependencies

- Independent VAYRO hosting is not established. Do not reuse ARIA or LEADORA services, volumes, credentials or database.
- Production email provider, verified sender and delivery tests are not evidenced.
- Payment provider, signed/idempotent webhooks, refunds, reconciliation and legal readiness are not evidenced.
- NAMA publishing, NEGAH durable asset/render pipeline, PAYAM official social publishing and analytics require end-to-end acceptance evidence.
- Android build, signing, real-device UAT, monitoring, rollback and customer UAT are not evidenced.

## 9. Stop conditions

Keep deployment and customer data collection disabled if any of the following is true:

- No independently verified offsite backup and restore.
- Any unexplained live-schema difference or unbaselined migration history.
- Any production runtime identity with unreviewed BYPASSRLS or excessive table privileges.
- Any missing or overly broad RLS policy.
- Any cross-tenant negative test failure.
- Any blocking dependency or CodeQL finding without an approved, evidence-based disposition.
- No independent VAYRO hosting and rollback evidence.

**Decision:** Engineering can continue in isolated CI and documentation. Production reconciliation, migration, role/policy changes, deployment and commercial activation remain blocked until the above evidence exists.
