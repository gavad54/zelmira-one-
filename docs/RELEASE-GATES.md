# VAYRO release gates

The application must not be described as production-ready until every applicable gate has current, inspectable evidence.

## Repository verification

- PR #2 targets `main`, remains open and draft, and is not merged.
- Current branch and PR head: `c811b2b620dbca68c714ab038291ada42a099fd3`.
- This exact head passed VAYRO CI (PR run 42194051921) and CodeQL (PR run 42194051963), both completed successfully on 2026-11-06.
- The CI job on this exact head passed locked dependency installation, unit tests, Prisma client generation/schema validation, least-privilege role setup in isolated PostgreSQL, real Prisma migration history in isolated PostgreSQL, lint, typecheck, production build, and PostgreSQL/production HTTP integration tests.
- The dependency-audit step itself reported 6 moderate findings and is explicitly configured with `continue-on-error: true`; its green step/job status is not a passed dependency-security gate.
- Earlier verified CI evidence on `4103a532abaa738e563a6489a5e9927693716491` recorded 32/32 unit tests and 12/12 PostgreSQL/production HTTP integration tests passing.
- CI success on a disposable test database does not prove production DB readiness or release readiness.

## Dependency security — OPEN

- The audit on the current head reported **6 moderate-severity findings**, with no High or Critical findings reported in that run.
- The audit step is configured with `continue-on-error: true`; green CI therefore does **not** mean the dependency-security gate passed.
- The remaining finding is `minimatch` in the `@typescript-eslint/typescript-estree` dependency chain (GHSA-g3hv-75wg-m249 / CVE-2026-118764). The lockfile resolves `minimatch@10.2.6`; the advisory identifies versions before 11.0.1 as affected.
- The upstream `typescript-eslint` issue #13125 is still open. Its report says this consumer uses the basic `minimatch(filePath, pattern, { dot: true })` call retained by v11, but the upstream dependency range still requests `^10.2.2`. A targeted v11 override and regenerated lockfile require compatibility validation in this repository before adoption.
- Do not use `npm audit fix --force`, blindly override all minimatch copies, suppress advisories, or weaken CI assertions.
- Earlier audit on the prior lockfile reported 11 vulnerabilities (7 moderate, 4 high). This is an improvement, not closure.

## Outstanding release gates

- [ ] Dependency security: resolve or formally assess all remaining advisories; enforce the gate after remediation.
- [ ] Authentication: production HTTPS secure-cookie verification, expired/reused tokens, disabled/unverified users, DB/email-provider failures, privileged-user MFA and owner-bootstrap cleanup.
- [ ] Authorization: endpoint-by-endpoint review; protected operations must use server-verified sessions and database-derived membership.
- [ ] Tenant isolation: cross-tenant read denial is tested; write/export/delete coverage remains incomplete until those operations exist and are tested.
- [ ] Security/privacy: dependency and container scans, CSP, headers, CORS, input validation, abuse controls, privacy workflows and independent security review.
- [ ] Database: reconcile Prisma schema, live catalog and migration SQL; establish a safe migration baseline only after review. No production migration until independently backed up and verified.
- [ ] Backup: encrypted backup stored outside the hosting provider and independently controlled.
- [ ] Restore: independent restore completed in an isolated environment, with checksum and measured RPO/RTO evidence.
- [ ] Email: dedicated VAYRO environment, approved provider configured only in protected runtime secrets, verified sender identity, and end-to-end verification/password-recovery delivery.
- [ ] Licensing/billing: idempotent payment webhooks, invoice/refund/reconciliation and entitlement transitions tested; legal review completed before activation.
- [ ] Product integrations: versioned contracts, scoped service identities, health checks, failure handling and product-boundary tests verified.
- [ ] Hosting: dedicated VAYRO hosting project, database, protected variables, monitoring and rollback configured. Railway's free-plan resource limit previously prevented provisioning; do not repurpose ARIA resources or connect VAYRO to ARIA's database/volume.
- [ ] Mobile: Android project/build, signed release artifact and real-device acceptance test for the approved commit.
- [ ] UAT: owner and representative users approve critical workflows.
- [ ] Production: active deployment commit matches the approved release commit.
- [ ] Governance: privacy/legal review and explicit owner release approval recorded.

## Database and infrastructure notes

The last recorded read-only inspection of the separate VAYRO-CORE Supabase project found PostgreSQL 17, 11 initial tables with RLS enabled, no client-role table grants, and no migration-history baseline. This is a historical inspection record, not a fresh live-health check. Reconcile Prisma, migration SQL and the live catalog before any migration.

No ARIA database, Railway project, volume, credentials or data may be reused or modified for VAYRO. No production database mutation, public deployment or release is authorized by a passing repository CI run.

## Product scope and delivery status

The repository contains a public product directory and an engineering foundation for authentication, owner bootstrap, initial tenant authorization, PostgreSQL/Prisma schema, audit foundations, health/readiness checks and CI. The eight product-family entries (ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM and DANA) are currently a product catalogue, not eight completed, integrated operational systems.

There is no verified VAYRO production hosting deployment, Android application/release artifact, operational email delivery, independent backup/restore proof or UAT sign-off. Customer onboarding, live payments and production data collection must remain disabled until the relevant gates have evidence.

## Deployment safety status

**ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**

Latest PR head: `c811b2b620dbca68c714ab038291ada42a099fd3`. CI and CodeQL passed on this exact head; dependency-security and all other release gates remain open.

Do not merge, deploy, migrate production data or publish without the required gates and explicit owner approval.


## Verification addendum — 2026-11-07

This section supersedes older repository-head and dependency-audit statements above where they conflict.

- Latest verified security/dependency source head: `def0069fd81b66e030aab9f73725cfd021c771db`.
- PR CI [42328951513](https://github.com/gavad54/zelmira-one-/actions/runs/42328951513) and PR CodeQL [42328951531](https://github.com/gavad54/zelmira-one-/actions/runs/42328951531) completed successfully on that exact head.
- The enforced dependency audit reported **0 vulnerabilities**. The prior six-moderate minimatch finding was addressed by a targeted override for `@typescript-eslint/typescript-estree`; its nested lockfile resolution is `minimatch@11.0.5`. Do not continue to report the old six-finding audit as current.
- A CSS compatibility cleanup was committed afterward as `f909025ab407a8dde5de484c04cac86a3adc1a5e`; CI [42329383225](https://github.com/gavad54/zelmira-one-/actions/runs/42329383225) and CodeQL [42329383315](https://github.com/gavad54/zelmira-one-/actions/runs/42329383315) were pending at the time of this update. That newer commit is not yet a verified green release head.
- Dependency security is therefore **verified green on def0069**, with the latest CSS-only commit awaiting verification. This does not certify the whole product or close any non-dependency production gate.

All other gates remain as recorded above: production auth/MFA and endpoint authorization review, full tenant isolation, CSP and independent security review, live database reconciliation and migration safety, encrypted external backup plus isolated restore, dedicated hosting and email, billing/legal readiness, operational product integrations, Android release/device test, UAT, approved production commit and explicit owner release approval.

**Current release posture remains: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**


## Verification addendum — 2026-11-07 (latest verified code head)

- Latest verified code/test head: `0e5609e00b17c9f641d3f397bf08310526d27a03`.
- PR CI [42330032303](https://github.com/gavad54/zelmira-one-/actions/runs/42330032303) and PR CodeQL [42330032149](https://github.com/gavad54/zelmira-one-/actions/runs/42330032149) completed successfully on that exact head.
- Blocking dependency audit: **0 vulnerabilities**. Unit tests: **35/35 passed**. Production PostgreSQL/HTTP integration tests: **12/12 passed**. Prisma schema, isolated PostgreSQL migration, lint, typecheck and production build passed.
- Implemented and tested tenant rename by OWNER/ADMIN and tenant soft-close by OWNER only, with same-origin enforcement, DB-backed authorization, rate limiting and audit events. Soft close preserves data.
- This closes only the repository checks listed above and the specific tenant rename/closure behavior. It does not close complete tenant member invitations/removal/role changes, billing, MFA, production security review, CSP runtime validation, external backup/restore, live DB migration baseline, production hosting/email, Android, UAT, legal review or owner release approval.

**Release posture remains: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**


## Verification addendum — 2026-11-07 (verified current PR head)

This addendum supersedes prior repository-head and CI statements where they conflict.

- Current PR #2 head: `7e9ac65e45764fad6e5ec7084f9871129d6b1b38`.
- PR CI [42330270049](https://github.com/gavad54/zelmira-one-/actions/runs/42330270049) completed successfully on this exact head.
- PR CodeQL [42330270038](https://github.com/gavad54/zelmira-one-/actions/runs/42330270038) completed successfully on this exact head.
- The same head's push CI [42330266291](https://github.com/gavad54/zelmira-one-/actions/runs/42330266291) and push CodeQL [42330266327](https://github.com/gavad54/zelmira-one-/actions/runs/42330266327) also completed successfully.
- Enforced `npm audit --audit-level=moderate`: **0 vulnerabilities**.
- Unit tests: **35 passed, 0 failed**.
- PostgreSQL and production HTTP integration tests: **12 passed, 0 failed**.
- Prisma client generation, schema validation, isolated PostgreSQL least-privilege role preparation, actual Prisma migration execution in the isolated CI database, lint, TypeScript checking and production build all passed.
- The tenant-management implementation includes DB-derived membership authorization; OWNER/ADMIN tenant rename; OWNER-only tenant soft-close; same-origin checks; rate limiting; and transactional audit events. Soft-close preserves tenant data. These checks do not yet constitute a full independent security review or complete tenant lifecycle.
- The latest commit `7e9ac65` changes responsive tenant administration CSS only; the tested tenant service/API changes are part of its ancestry.

## Remaining release blockers — reconfirmed

- No Android, Gradle, Capacitor, APK or AAB project/artifact exists in the current repository tree. Android delivery is not started.
- No VAYRO production hosting deployment exists. Railway workspace currently has no dedicated VAYRO project; the free-plan resource limit previously prevented provisioning. Do not repurpose ARIA or LEADORA infrastructure.
- The dedicated VAYRO-CORE Supabase project still requires a fresh read-only catalog comparison against Prisma schema and migration SQL. A safe migration baseline has not been independently verified; no live DDL or data changes are authorized.
- Independent encrypted backup outside the database/hosting provider and a successful isolated restore drill are not evidenced.
- Production email delivery, MFA for privileged accounts, endpoint-level negative authorization coverage, CSP runtime validation and independent penetration/security review remain open.
- Billing, payment webhook idempotency, refunds/reconciliation, license lifecycle, legal/privacy review, support operations and customer onboarding controls are not production-ready.
- The eight named products remain a catalogue, not eight completed operationally integrated products.
- Owner UAT, real-device Android acceptance, production monitoring/rollback, final production commit parity and explicit release approval remain open.

## CI maintenance note

The successful CI logs surfaced a GitHub Actions runtime deprecation warning: `actions/checkout@v4` and `actions/setup-node@v4` currently target Node.js 20 while GitHub is forcing Node.js 24. This is not a failed check, but the workflow action versions should be reviewed and upgraded to supported Node 24-compatible releases, then revalidated. Do not change action versions without reviewing their official release/security guidance.

**Current status: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**


## Verification addendum — 2026-11-07 (owner email-contact concurrency and live DB read-only review)

This addendum supersedes older repository-head and CI statements above where they conflict.

- Verified application/test head: `e6eab2bcc41a61632489211befe364dabe6f51b8`. The PR remains open, draft and unmerged.
- PR VAYRO CI [42354960852](https://github.com/gavad54/zelmira-one-/actions/runs/42354960852) and push VAYRO CI [42354955574](https://github.com/gavad54/zelmira-one-/actions/runs/42354955574) completed successfully on this exact head.
- PR CodeQL [42354960844](https://github.com/gavad54/zelmira-one-/actions/runs/42354960844) and push CodeQL [42354955814](https://github.com/gavad54/zelmira-one-/actions/runs/42354955814) completed successfully on this exact head. Lockfile validation [42354960859](https://github.com/gavad54/zelmira-one-/actions/runs/42354960859) also passed.
- The blocking `npm audit --audit-level=moderate` step reported **0 vulnerabilities**. The lockfile resolves `deepmerge-ts@8.0.2`, `postcss@8.5.32`, and the affected nested `@typescript-eslint/typescript-estree/minimatch@11.0.5`; the separate top-level `minimatch@3.1.5` is not reported by the current audit.
- CI on this exact head passed **41/41 unit tests** and **14/14 PostgreSQL/production HTTP integration tests**, Prisma generation/schema validation, isolated PostgreSQL migration, lint, TypeScript checking and production build.
- Security correction: owner email-contact PATCH and DELETE now check the last enabled, verified OWNER contact inside PostgreSQL SERIALIZABLE transactions. Serialization conflicts return HTTP 409 instead of allowing concurrent operations to remove every verified OWNER contact. The integration test concurrently disables two OWNER contacts and concurrently deletes two OWNER contacts; each race leaves exactly one verified OWNER contact, and subsequent attempts to remove the final contact are rejected. This was verified by the integration suite on the exact head above.
- The CI PostgreSQL log records serialization-conflict messages during the deliberately concurrent test. The test passed; these messages are expected evidence that PostgreSQL aborted one conflicting transaction, not a CI failure.

### Fresh read-only VAYRO-CORE inspection

- Supabase project `VAYRO-CORE` (`wdqhdnhpgxhmmfeyxwxr`) reported `ACTIVE_HEALTHY`, PostgreSQL 17.11.
- The live public schema contains 11 tables; all 11 have RLS enabled. The read-only catalog query found zero RLS policies and zero table grants to `anon`, `authenticated` or `service_role`. The table listing reported zero rows in every table.
- Supabase migration history returned no entries. The migration baseline is therefore still absent; the repository's initial migration must not be run against this existing schema until a reviewed baseline/reconciliation is completed.
- Security Advisor reports 11 informational `RLS enabled, no policy` findings. This matches the current server-only access design but remains dependent on strict protection and least privilege for the database connection used by the application. Performance Advisor reports 10 unused indexes; with an empty database there is no evidence to remove them.
- This inspection used read-only project, catalog and advisor operations. No SQL writes, DDL, grants, policies, migrations or data changes were executed.

### Still open — release blockers

- Trusted-proxy handling for `x-forwarded-for` is not validated against a deployed VAYRO proxy topology; rate-limit identity can therefore not be considered production-hardened.
- Privileged-user MFA, complete endpoint-level negative authorization coverage, full tenant member lifecycle and product entitlement enforcement remain incomplete.
- Production email credentials, sender verification and end-to-end delivery are not configured or proven.
- Independent encrypted backup and isolated restore evidence are absent; live DB migration baseline remains unresolved.
- No VAYRO production hosting/deployment, Android project/build/signing, billing/payment lifecycle, operational product integrations, UAT, independent penetration test or owner release approval is evidenced.
- The eight family products remain a catalogue. The owner UI explicitly states that changing a catalogue status to ACTIVE does not prove service health or public release.

**Status remains: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**


## Verification addendum — 2026-11-07 (deterministic integration harness)

This addendum supersedes the prior repository-head statements above where they conflict.

- Current verified application/test head: `b95ec76a25c4891e80d7e3384abe0cfdb479c972`. PR #2 remains open, draft and unmerged.
- PR VAYRO CI [42355312810](https://github.com/gavad54/zelmira-one-/actions/runs/42355312810) and push VAYRO CI [42355308766](https://github.com/gavad54/zelmira-one-/actions/runs/42355308766) completed successfully on this exact head.
- PR CodeQL [42355312887](https://github.com/gavad54/zelmira-one-/actions/runs/42355312887) and push CodeQL [42355308755](https://github.com/gavad54/zelmira-one-/actions/runs/42355308755) completed successfully. Lockfile validation [42355312852](https://github.com/gavad54/zelmira-one-/actions/runs/42355312852) also passed.
- Blocking `npm audit --audit-level=moderate`: **0 vulnerabilities**. Unit tests: **41/41 passed**. PostgreSQL/production HTTP integration tests: **14/14 passed**. Prisma generation/schema validation and isolated PostgreSQL migration, lint, TypeScript checking and production build all passed.
- The integration command now uses `node --test --test-concurrency=1 tests/*.integration.mjs`. The integration files share one PostgreSQL database; the owner-bootstrap test requires no existing OWNER, while the owner-email endpoint test creates a temporary OWNER. A push CI run on the preceding documentation-only head exposed a cross-file test-order race (the bootstrap test observed that temporary OWNER). Sequential file execution removes that shared-database race without weakening assertions. The owner-email integration test still sends its disable/delete HTTP requests concurrently with `Promise.all`, so the application-level concurrency invariant remains tested.
- The owner-contact protection change remains in place: last verified OWNER contact checks run inside SERIALIZABLE transactions; serialization conflicts return 409; concurrent disable/delete tests prove one verified OWNER contact remains and that the final contact cannot be removed. The isolated PostgreSQL log can show the expected serialization-abort message from the deliberately concurrent test; the test itself passed.

The current head is repository-verified only. Production email, proxy trust, MFA, live migration baseline, external backup/restore, hosting, Android, billing, operational product integrations, UAT and independent security review remain open.

**Status remains: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**
