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

## Dependency security — current verified status (2026-11-07)

- On source commit `55ca07919e733b9c40d013d7fa12651f3b22dee0`, PR CI [42398798971](https://github.com/gavad54/zelmira-one-/actions/runs/42398798971) completed successfully. The locked dependency audit reported **0 vulnerabilities**.
- The previous note about six moderate `minimatch` findings and the `continue-on-error` audit step is historical evidence from an older commit; it is superseded by the current passing audit on the commit above. Keep the audit enforced at `--audit-level=moderate`.
- CodeQL PR run [42398798972](https://github.com/gavad54/zelmira-one-/actions/runs/42398798972) and lockfile validation [42398798981](https://github.com/gavad54/zelmira-one-/actions/runs/42398798981) completed successfully on the same source commit. A successful scan does not by itself prove that every previously annotated alert record has been formally closed; verify alert disposition in GitHub Security before release.
- Do not use `npm audit fix --force`, broad overrides, or suppressed advisories.

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

## Verification addendum — 2026-11-07 (current engineering run)

This addendum supersedes older head and test-count statements above when they conflict.

- PR #2 remains open, Draft and unmerged; branch: `brand/vayro-name-only`.
- Verified PR head for this run: `be04cb0849ca762aee7874ceb2b621acc0de85ad`.
- VAYRO CI run [42386324059](https://github.com/gavad54/zelmira-one-/actions/runs/42386324059): completed successfully on this head. The exact job completed locked install, enforced dependency audit, unit tests, Prisma generation/validation, isolated PostgreSQL role setup, actual Prisma migration in the disposable CI database, lint, typecheck, production build and HTTP/PostgreSQL integration tests.
- CI log evidence on this head: `npm audit --audit-level=moderate` reported **0 vulnerabilities**; unit tests reported **41 passed, 0 failed**; PostgreSQL/production HTTP integration tests reported **14 passed, 0 failed**.
- CodeQL run [42386324052](https://github.com/gavad54/zelmira-one-/actions/runs/42386324052): completed successfully; analysis results upload completed. A successful workflow is not, by itself, proof that the repository has zero open code-scanning alerts.
- Lockfile validation run [42386324035](https://github.com/gavad54/zelmira-one-/actions/runs/42386324035): completed successfully, including package/lockfile synchronization and reproducible `npm ci`.
- Two historical CodeQL review annotations remain visible on PR #2 for the `js/bad-tag-filter` finding in `tests/auth-endpoints.integration.mjs`. The current source at this head uses case-insensitive `/gi` script-tag matching and includes an explicit uppercase `<SCRIPT>` regression assertion. The available run log confirms SARIF upload, but does not expose the current open/closed status of those alert records. Keep final alert closure as an open verification item; do not dismiss or mark fixed without confirming the Code Scanning alert state.
- Owner email-contact creation now has a DB-backed limit of 10 attempts per owner per hour, returning HTTP 429 and `Retry-After: 3600`; the integration test verifies the eleventh creation is rejected and the limiter count is 11. This change is included in this head and passed the integration suite.
- The successful disposable CI migration is not evidence that the live VAYRO-CORE database has a registered migration baseline or is safe to migrate.

## Remaining release gates — current run

- [ ] Confirm the two historical CodeQL alert records are closed/resolved on the current source; verify no new open alerts after the latest SARIF upload.
- [ ] Complete endpoint-by-endpoint authorization and abuse-control review, including owner operations, token lifecycle and all future tenant-scoped operations.
- [ ] Add and verify privileged-user MFA and owner bootstrap-secret removal/rotation procedure.
- [ ] Reconcile live VAYRO-CORE schema, Prisma schema and initial migration using read-only catalog inspection; do not apply DDL or baseline changes to the live database in this workflow.
- [ ] Prove encrypted external backup and isolated restore, with checksum and RPO/RTO evidence.
- [ ] Configure and end-to-end verify production transactional email using protected runtime secrets and an approved sender.
- [ ] Complete product licensing, payment/webhook idempotency, invoice/refund/reconciliation and entitlement enforcement before enabling paid access.
- [ ] Complete product integration contracts and operational health/failure behavior. The eight family products remain catalogue entries, not live services.
- [ ] Resolve dedicated VAYRO hosting without reusing ARIA/LEADORA infrastructure or creating paid resources.
- [ ] Implement Android project/build/release signing and real-device acceptance; no Android artifact is currently evidenced.
- [ ] Complete accessibility, Persian RTL/mobile review, privacy/legal review and owner/representative-user UAT.
- [ ] Verify production deployment commit matches approved release commit and obtain explicit owner release approval.

**Current posture: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**

## Verification addendum — 2026-11-07 (documentation commit head)

- Current PR #2 head: `2cbf3a0fea8f33bad3cc169715e6fe7bedf17ec9` on `brand/vayro-name-only`; PR remains open, Draft and unmerged.
- PR VAYRO CI [42386689242](https://github.com/gavad54/zelmira-one-/actions/runs/42386689242): **success** on this exact SHA. The job completed every step, including production build and PostgreSQL/HTTP integration tests.
- PR CodeQL [42386689309](https://github.com/gavad54/zelmira-one-/actions/runs/42386689309): **success** on this exact SHA; SARIF upload completed.
- PR lockfile validation [42386689282](https://github.com/gavad54/zelmira-one-/actions/runs/42386689282): **success** on this exact SHA.
- Exact PR CI logs: dependency audit **0 vulnerabilities**; unit suite **41 passed / 0 failed**; PostgreSQL and production HTTP integration suite **14 passed / 0 failed**; production build completed successfully.
- The only source change from the previously verified application head `be04cb0` is this release-gate documentation update. The app source and tests were not changed by this documentation commit.
- Push-triggered duplicate CI was still running at the time of this checkpoint; PR-triggered CI, CodeQL and lockfile workflows are the authoritative completed checks listed above.
- The CodeQL review annotations about uppercase script tags are attached to an earlier commit. Current branch source includes case-insensitive matching and an explicit uppercase-tag assertion, but current alert-record closure has not been independently confirmed. Keep it open until Code Scanning confirms closure.

**Release status remains: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**


## Fresh verification — 2026-11-07 (PR head `32a46f31c62076ccc64d54c13597ea6a66701b04`)

- PR #2 is open, Draft and unmerged on `brand/vayro-name-only`.
- PR CI [42386938662](https://github.com/gavad54/zelmira-one-/actions/runs/42386938662), CodeQL [42386938636](https://github.com/gavad54/zelmira-one-/actions/runs/42386938636), and lockfile validation [42386938619](https://github.com/gavad54/zelmira-one-/actions/runs/42386938619) all completed successfully on this exact head.
- Exact PR CI logs: `npm audit --audit-level=moderate` reported **0 vulnerabilities**; unit tests **41 passed / 0 failed**; PostgreSQL and production HTTP integration tests **14 passed / 0 failed**; Prisma generation/validation, isolated PostgreSQL migration, lint, typecheck and production build passed.
- CodeQL SARIF upload completed successfully. Two historical PR review annotations about uppercase `<SCRIPT>` matching remain visible. Current source contains case-insensitive matching and an uppercase-tag regression assertion, but the live Code Scanning alert-record state was not independently retrievable in this run; do not claim alert closure.
- Live read-only Supabase inspection: VAYRO-CORE (`wdqhdnhpgxhmmfeyxwxr`) is `ACTIVE_HEALTHY`, PostgreSQL 17.11, eu-central-1. Eleven public application tables exist, all have RLS enabled, and all report zero rows. Supabase reports no migration history.
- A read-only catalog query found no public-table SELECT/INSERT/UPDATE/DELETE privileges for `anon`, `authenticated` or `service_role`; `pg_policies` returned no public policies. Security Advisor reports 11 informational `rls_enabled_no_policy` notices. This can be consistent with server-only Prisma access, but only if the actual runtime credential is a tightly restricted server-only role. The runtime connection identity and effective privileges remain unverified and are a release blocker. Do not grant privileges or create policies merely to clear informational lints.
- Performance Advisor reports ten unused indexes. The database is empty, so no index removal is justified without representative workload evidence.
- The CI PostgreSQL log includes serialization-conflict messages from a concurrent transaction test; the integration job completed successfully and all 14 tests passed. These expected conflict messages are not a CI failure, but retry/transaction behavior should remain covered.
- No production DDL, data writes, grants, policies, migrations, secret changes, deployments or other repository integrations were performed in this run.

## Remaining release gates — reconfirmed

- [ ] Verify runtime Prisma database identity and effective privileges; use a dedicated least-privilege server role, not a superuser/owner credential, and never expose DB credentials to browser code.
- [ ] Reconcile the live schema with Prisma and migration SQL; migration history is empty. No live baseline, DDL or migration is authorized until independent backup/restore proof and an approved plan exist.
- [ ] Verify the two historical CodeQL alert records are closed/resolved in GitHub Code Scanning; successful SARIF upload alone is insufficient.
- [ ] Complete privileged-user MFA, owner-bootstrap secret removal, full endpoint authorization review and independent security testing.
- [ ] Prove encrypted external backup and isolated restore with checksum and measured RPO/RTO.
- [ ] Verify transactional email end-to-end after configuring protected runtime variables; ensure bootstrap failure recovery works as documented.
- [ ] Complete licensing, billing, idempotent payment events, invoice/refund/reconciliation, entitlement enforcement and legal review.
- [ ] Deliver the eight products as operational services and verify DANA tool boundaries; catalogue status is not live-service status.
- [ ] Complete Android source/build/signing and real-device UAT.
- [ ] Provision dedicated VAYRO hosting without reusing ARIA/LEADORA infrastructure; verify monitoring, rollback and commit parity.
- [ ] Complete Persian RTL/mobile/accessibility review, privacy/legal review, owner UAT and explicit release approval.

**Release posture: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**


## Verification addendum — 2026-11-08 (commit 383ab0d4)

This addendum supersedes earlier repository-head and CI statements where they conflict.

- Verified PR workflow head: `383ab0d4aa6b525db29250f15b3b3ead6fcbe333`.
- VAYRO CI run [42454837708](https://github.com/gavad54/zelmira-one-/actions/runs/42454837708): completed successfully.
- CodeQL run [42454837760](https://github.com/gavad54/zelmira-one-/actions/runs/42454837760): completed successfully.
- CI steps verified successful on this head: locked dependency installation and audit, unit tests, Prisma client generation and schema validation, least-privilege PostgreSQL role setup, real migration execution in isolated PostgreSQL, lint, TypeScript typecheck, production build, and PostgreSQL/production HTTP integration tests.
- Code change adds the missing `listTenantMembers` TypeScript declaration and two tenant-service tests for restricted member projection/stable ordering and invalid or missing inputs.
- The successful CI and CodeQL runs certify this commit's repository checks only. They do not establish production deployment readiness.

PR #2 remains open, draft, and unmerged. Production deployment remains blocked. All outstanding production gates listed above remain open, including production auth/MFA and endpoint authorization review, complete tenant isolation, independent security/privacy review, live database reconciliation and safe migration baseline, encrypted external backup and isolated restore, dedicated hosting and email, billing/legal readiness, operational product integrations, Android delivery/device acceptance, UAT, production commit verification, and explicit owner release approval.

**Current release posture: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**


## Brand and public UI implementation — 2026-11-08

- Added a reusable vector primary wordmark at `public/vayro-logo.svg`.
- Refined the app icon at `public/vayro-mark.svg` and aligned `public/favicon.svg`.
- Updated the public homepage header to use the VAYRO vector app mark.
- Implemented responsive RTL-first styling for the existing product directory, hero, product cards, independent product boundaries, vision section and footer. Added visible keyboard focus and reduced-motion handling.
- Added the full design specification at `docs/design/VAYRO-BRAND-AND-UI.md` and implementation plan at `docs/plans/2026-11-08-vayro-product-ui-brand.md`.
- These changes are a public brand and directory UI implementation. They do not make the eight specialist products operational, provision production infrastructure, or certify release readiness.
- CI and CodeQL for the final documentation-inclusive branch head must complete successfully before these UI changes are considered repository-verified.

**Release posture remains: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**


## Fresh verification — 2026-11-08 (PR head `d2b7a311858385a23747c30c4dede05d62121b08`)

- PR #2 remains open, Draft and unmerged on `brand/vayro-name-only`; the PR head and branch ref matched `d2b7a311858385a23747c30c4dede05d62121b08` at verification time.
- PR VAYRO CI [42455919904](https://github.com/gavad54/zelmira-one-/actions/runs/42455919904) and push VAYRO CI [42455915968](https://github.com/gavad54/zelmira-one-/actions/runs/42455915968) completed successfully on this exact head.
- Exact CI log evidence: `npm audit --audit-level=moderate` reported **0 vulnerabilities**; unit tests reported **47 passed / 0 failed**; PostgreSQL and production HTTP integration tests reported **16 passed / 0 failed**. Prisma client generation, schema validation, least-privilege role preparation and migration execution against the disposable CI PostgreSQL database, lint, TypeScript typecheck and production build all passed.
- PR CodeQL [42455919789](https://github.com/gavad54/zelmira-one-/actions/runs/42455919789) and push CodeQL [42455915966](https://github.com/gavad54/zelmira-one-/actions/runs/42455915966) completed successfully. The PR scan log reports 47/47 TypeScript and 22/22 JavaScript files scanned. Successful SARIF upload is not proof that every historical alert record is closed; alert disposition remains open for separate verification.
- PR lockfile validation [42455919795](https://github.com/gavad54/zelmira-one-/actions/runs/42455919795) completed successfully, including package/lockfile synchronization and reproducible locked installation.
- These are repository checks on the exact head only. The isolated CI migration did not touch VAYRO-CORE. No production deployment, live database mutation, release, merge or infrastructure change was performed.

## Security review findings added on 2026-11-08

- Login timing asymmetry: the login route performs scrypt verification only when an account record exists. A nonexistent email returns before the expensive password verification, creating a potential timing-based account-enumeration signal despite a uniform error response. Add a dummy scrypt verification for unknown accounts and a regression test before production.
- Owner bootstrap availability: the bootstrap attempt limiter uses one fixed shared identity (`owner-bootstrap:initial`). Unauthenticated requests can consume the shared five-attempt/hour budget and temporarily block legitimate first-owner setup. Review a proxy-aware, abuse-resistant design without trusting arbitrary forwarded headers or simply removing rate limiting.
- Trusted proxy topology, privileged MFA and complete endpoint-level negative authorization coverage remain open.

**Current posture remains: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**


## Fresh verification — 2026-11-08 (PR head `9d56e93ec6f94f83386a132a54d519feb330531e`)

- PR #2 remains open, Draft and unmerged on `brand/vayro-name-only`.
- PR VAYRO CI [42464939703](https://github.com/gavad54/zelmira-one-/actions/runs/42464939703): **success** on this exact head. Locked dependency installation, enforced `npm audit --audit-level=moderate` (**0 vulnerabilities**), 48/48 unit tests, Prisma client generation/schema validation, least-privilege role setup and migration execution in disposable CI PostgreSQL, lint, typecheck, production build, and 16/16 PostgreSQL/production HTTP integration tests all passed.
- PR lockfile validation [42464939812](https://github.com/gavad54/zelmira-one-/actions/runs/42464939812): **success**; package/lockfile synchronization and reproducible locked installation passed.
- PR CodeQL [42464939685](https://github.com/gavad54/zelmira-one-/actions/runs/42464939685) and push CodeQL [42464934482](https://github.com/gavad54/zelmira-one-/actions/runs/42464934482): **success**; analysis and SARIF upload completed. The PR run had a transient HTTP 504 while streaming the CodeQL bundle, then successfully completed via fallback download. One raw CodeQL diagnostic was logged, but its detail was not available in the retrieved job output. Current open-alert records were not independently retrieved; do not equate workflow success with zero open alerts.
- The CI install emitted a deprecation warning that the pinned ESLint 9.39.5 version is no longer supported. This did not fail CI or npm audit; assess a compatible supported upgrade separately rather than applying a blind major upgrade.
- Bootstrap hardening: `src/app/api/owner/bootstrap/route.ts` now validates the high-entropy bootstrap secret before consuming the shared owner-bootstrap attempt budget. The integration regression sends six invalid-token requests (each expected 403 / `bootstrap_unavailable`) and then verifies that the valid initial-owner flow can still proceed. This closes the unauthenticated quota-consumption path covered by that test; it does not close one-time secret removal/rotation after successful setup, proxy topology review, privileged MFA, or complete endpoint authorization review.
- These checks apply only to repository code and the disposable CI database. They do not verify VAYRO-CORE migration safety, production hosting, email delivery, external backup/restore, Android, UAT, or production release.

**Current posture: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**

## Verification addendum — 2026-11-08 database access audit

This addendum records repository verification for the exact branch head below. It does not supersede production gates.

- Verified branch head: `ce08fa5747ca325c8939df20049b3ee947ad6d4c`.
- VAYRO CI run 758: [42513786720](https://github.com/gavad54/zelmira-one-/actions/runs/42513786720) — **success**.
- CodeQL run 721: [42513786711](https://github.com/gavad54/zelmira-one-/actions/runs/42513786711) — **success**. Successful scan execution does not establish zero open alerts; inspect Security alert disposition separately.
- Locked dependency audit: **0 vulnerabilities** at the time of this CI run.
- Unit tests: **60 passed / 0 failed**.
- PostgreSQL and production-HTTP integration tests: **25 passed / 0 failed**.
- Prisma client generation and schema validation: passed.
- Prisma migration deploy through the newly configured `MIGRATION_DATABASE_URL`: passed against disposable CI PostgreSQL only.
- Real-table tenant RLS isolation SQL proof under the isolated non-owner runtime login: passed.
- Lint, TypeScript typecheck and production build: passed.
- The migration connection is now explicitly separated in Prisma schema through `directUrl = env("MIGRATION_DATABASE_URL")`; CI supplies an isolated disposable migration URL. This is repository/configuration separation only, not production role provisioning.

### Whole-application database access remains blocked

The new source audit is recorded in [DATABASE-ACCESS-PATH-AUDIT.md](security/DATABASE-ACCESS-PATH-AUDIT.md). Tenant routes use the dedicated tenant RLS client, but authentication/MFA and platform-owner operations still use the default Prisma client. The actual production role behind `DATABASE_URL` remains unknown. The MFA tables have RLS enabled without policies in the current MFA migration. Platform-wide owner operations still need a separately verified platform control-plane role and policy boundary.

Required before production:
- [ ] Define and test a least-privilege authentication runtime role/policies for user, session, action-token, MFA, recovery-code, challenge, rate-limit and narrowly scoped audit operations.
- [ ] Define and test a separate platform control-plane role/client for owner products and email administration, with transaction-bound actor context and exact table/operation grants.
- [ ] Verify trusted proxy configuration or another trusted client-IP mechanism so IP throttling is active.
- [ ] Obtain fresh read-only production role/catalog evidence.
- [ ] Complete independent encrypted backup and isolated restore proof, migration baseline reconciliation and forward/recovery rehearsal.
- [ ] Obtain explicit owner authorization for each production role, baseline and migration action.

**Decision remains: REPOSITORY VERIFICATION PASS ON THE EXACT HEAD ABOVE — WHOLE-APPLICATION DATABASE LEAST-PRIVILEGE NOT VERIFIED — PRODUCTION ROLE/BASELINE/MIGRATION NOT EXECUTED — DEPLOYMENT BLOCKED — NOT RELEASED.**


## Verification addendum — 2026-11-09 (current engineering pass)

- PR #2 remains open, draft and unmerged. PR #6 remains open, draft and unmerged; current PR #6 head at this addendum is `ccd0193640827389ab45e70c76b2d8c82d005406`.
- A fresh CI run on prior head `66a1eb828ab189305e1a48281814c63a3cc34ce2` failed in unit tests. The dependency audit passed; the failing tests exposed (1) provider-configuration validation order in the DANA AI adapter and (2) a NEGAH creative-brief test that expected the raw format key even though the implementation intentionally renders a localized format label.
- Corrected the AI adapter to fail closed on missing provider credentials before checking the selected text model, and corrected the creative-brief test to assert the rendered localized label and supplied fields. These changes are committed on PR #6 as `71d09756fa316450660ec9a09f1ad1fb87a35846` and `6a9939c9ebce221aca19d166a515533ded88304a`.
- CI and CodeQL were triggered on `6a9939c9ebce221aca19d166a515533ded88304a`; at the time of this addendum, those runs had not yet returned a final conclusion. The documentation-only product roadmap commit `ccd0193640827389ab45e70c76b2d8c82d005406` is the current PR #6 head; its CI and CodeQL runs are queued/pending. Do not report these checks as passed until completed on the exact current head.
- Added `docs/PRODUCT-FAMILY-DELIVERY-ROADMAP.md`, defining minimum commercial scope and evidence gates for all eleven products. It is a delivery baseline, not proof that any product is complete.
- The PR #6 changed-file inventory currently contains the shared platform/security foundation and DANA/NEGAH work. It does not demonstrate complete operational workflows for ARVAND, CHARSU, GANJINEH, SEPEHR, NAMA, PAYAM, ARIA, ARIANA or LEADORA. The independent repositories for ARIA, ARIANA and LEADORA require separate audits; they were not modified in this pass.

**Current posture: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.** No production database mutation, merge, deployment, payment activation or public release was performed.


## Fresh release-blocker inspection — 2026-11-09

- Current PR #6 head: `88a6bd6769822d74515fa5ff3468536cf49564e5`; PR #6 remains Draft/open/unmerged and depends on PR #2, which remains Draft/open/unmerged.
- The prior CI failure on head `2e3230bd9675335659c7392dac22ed55ad2ae1cc` was TypeScript TS7016 for the JavaScript AI provider module imported by DANA and NEGAH. Added `src/lib/ai-provider.d.mts`, corrected image-provider credential validation order, and added a negative test for missing image-provider credentials. CodeQL passed on `2de003b2020d4fbb90315dc1f06b3615c264f7b9`; VAYRO CI was still running at the time of this inspection. New CI and CodeQL runs on the current documentation/audit head `88a6bd6769822d74515fa5ff3468536cf49564e5` were pending/in progress. No green result is claimed for the current head.
- Fresh Railway workspace listing returned only projects `ARIA Web` and `LEADORA`; no dedicated VAYRO project is present. No Railway project or service was created or changed.
- Fresh read-only VAYRO-CORE inspection on 2026-11-09 found 11 public tables, zero rows, no recorded migrations, RLS enabled but no policies and no FORCE RLS on all 11 tables; only `postgres` table grants were observed; `postgres` and `service_role` have BYPASSRLS; no `vayro_app`, `vayro_auth`, or `vayro_platform` roles were present. See `docs/security/DATABASE-ACCESS-PATH-AUDIT.md` section 10. This is a production security blocker, not an invitation to apply migrations directly.
- Independent backup/restore proof, live DB baseline reconciliation, production runtime role provisioning, hosting, email, billing, product-provider configuration, Android, UAT, legal review and release approval remain unverified or blocked.

**Current posture remains: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.** No production database writes, Railway changes, merges or deployments were performed.


## Fresh verification — 2026-11-09 (PR #6 head `7e472a2045b16c249d2426db08d9701593e2f683`)

- PR #6 remains open, Draft and unmerged. Current branch head at verification: `7e472a2045b16c249d2426db08d9701593e2f683`.
- VAYRO CI run [42564091088](https://github.com/gavad54/zelmira-one-/actions/runs/42564091088): **success** on this exact head. Verified completed steps: locked dependency installation, dependency audit, unit tests, Prisma generation and validation, least-privilege auth/platform/tenant database role tests, real migration application in isolated PostgreSQL, lint, TypeScript typecheck, production build, and PostgreSQL/production-HTTP integration tests.
- CodeQL run [42564091086](https://github.com/gavad54/zelmira-one-/actions/runs/42564091086): **success** on this exact head. This certifies scan execution, not zero open alerts.
- The two AI-generation route fixes committed immediately before this head convert DANA and NEGAH provider DTOs into explicit JSON objects before Prisma persistence; the exact head passed the full CI pipeline above.
- Fresh Railway workspace listing still contains only `ARIA Web` and `LEADORA`; no dedicated VAYRO Railway project exists.
- VAYRO-CORE (`wdqhdnhpgxhmmfeyxwxr`) is ACTIVE_HEALTHY, but its migration history is empty. Supabase security advisor still reports 11 public tables with RLS enabled and no policies. No production migration or data mutation was performed.
- Supabase performance advisor reports 10 currently unused indexes. With no application traffic and no customer records, this is informational only; do not remove indexes before workload evidence exists. Health advisor returned no findings.
- PR #2 remains open, Draft and unmerged at head `c52f199e832b7808136313664895da0896523aab`; PR #6 is stacked on its product-shell branch. Neither PR was merged.
- The repository-level CI pass does not establish production role configuration, live RLS policy enforcement, backup/restore, independent hosting, provider credentials, durable NEGAH asset storage, email delivery, billing, Android device acceptance, product-level UAT or release readiness.

**Current decision: EXACT-HEAD REPOSITORY CI PASS + CODEQL EXECUTION PASS — PRODUCTION SECURITY/INFRASTRUCTURE GATES OPEN — DEPLOYMENT BLOCKED — NOT RELEASED.**

## Live verification addendum — 2026-11-09 (PR #6 exact head)

- Current PR #6 head: `1fc32b368856a5eeaaf39b23149457a90febd08b`; PR #6 is still OPEN, DRAFT and unmerged.
- VAYRO CI PR run [42564678213](https://github.com/gavad54/zelmira-one-/actions/runs/42564678213) and push run [42564675504](https://github.com/gavad54/zelmira-one-/actions/runs/42564675504) both completed successfully on this exact head. The completed job includes locked dependency audit, unit tests, Prisma generation/schema validation, isolated PostgreSQL role setup, real migration application in isolated PostgreSQL, auth/platform/tenant role-isolation tests, lint, typecheck, production build and PostgreSQL/production HTTP integration tests.
- CodeQL run [42564678308](https://github.com/gavad54/zelmira-one-/actions/runs/42564678308) completed successfully on this exact head. This confirms scan execution only; it is not evidence that every alert is closed.
- Latest CI evidence is repository/isolated-environment evidence. It does not certify production configuration or release readiness.

### Fresh live infrastructure observations

- Supabase project VAYRO-CORE (`wdqhdnhpgxhmmfeyxwxr`) is `ACTIVE_HEALTHY`, PostgreSQL 17.11.
- Fresh live catalog query: 11 public tables have RLS enabled; zero public RLS policies; zero tables with FORCE RLS; migration history is empty. Supabase Security Advisor reports 11 informational RLS-enabled/no-policy findings. Health Advisor returned no findings. All 11 tables were reported empty by the table inventory.
- The branch schema/migrations include newer authentication/MFA, tenant-RLS and AI-generation structures that are not represented by the live migration history. This is schema drift/baseline work, not permission to run migrations against production.
- Railway currently lists only `ARIA Web` and `LEADORA` in the owner's workspace; no dedicated VAYRO project exists. Do not reuse either project's resources.
- No independent encrypted backup and isolated restore proof was produced in this verification. No production DDL, grants, policies, role creation, data writes, deployment, merge or release was performed.

### Blocking release gates — current

- [ ] Establish an independently controlled encrypted backup and complete a restore drill into an isolated environment, with checksums and measured RPO/RTO.
- [ ] Reconcile the live 11-table schema against the complete Prisma migration chain; establish a reviewed baseline and rehearse forward/rollback on a restored clone.
- [ ] Provision and verify separate least-privilege production LOGIN identities for auth, tenant and platform clients; prove memberships, grants, table ownership, BYPASSRLS/superuser flags, policies and FORCE RLS. Do not place credentials in source or chat.
- [ ] Complete production deployment configuration, dedicated VAYRO hosting, protected environment variables, domain/TLS, health monitoring and rollback. Railway currently has no VAYRO project.
- [ ] Configure durable object storage for NEGAH generated assets; provider URL persistence alone is not durable storage.
- [ ] Configure and verify production email delivery, sender identity, privileged-user MFA enrollment and recovery.
- [ ] Complete trusted-proxy/IP rate-limit validation, security headers/CSP/CORS review and independent security assessment.
- [ ] Complete billing/licensing, payment webhook idempotency, legal/privacy review, product integrations, Android release/device acceptance and owner UAT.
- [ ] Verify exact deployed commit parity and record explicit release approval.

**Decision: EXACT-HEAD REPOSITORY CI PASS + CODEQL EXECUTION PASS — PRODUCTION DATABASE/INFRASTRUCTURE GATES OPEN — DEPLOYMENT BLOCKED — NOT RELEASED.**


## Exact source verification — 2026-11-09 (PR #6 source commit `47792d4a891795d60a4b65c11c4a4ffb8cab2f74`)

- PR #6 remains open, Draft and unmerged. Its base is `brand/vayro-name-only`; PR #2 remains a separate prerequisite and is also unmerged.
- VAYRO CI [42568663911](https://github.com/gavad54/zelmira-one-/actions/runs/42568663911): completed successfully on this exact source commit.
- CodeQL [42568663777](https://github.com/gavad54/zelmira-one-/actions/runs/42568663777): completed successfully on this exact source commit. This proves the scan ran; it does not prove all alert records are closed.
- The CI log confirms dependency audit **0 vulnerabilities**, unit tests **78/78**, PostgreSQL/production-HTTP integration tests **27/27**, Prisma client generation and schema validation, full migration application to disposable PostgreSQL, auth/platform/tenant role-boundary SQL checks, lint, typecheck, production build and Docker image build all passed.
- The current source includes separate lazy `AUTH_DATABASE_URL` and `PLATFORM_DATABASE_URL` clients, plus `MIGRATION_DATABASE_URL` as Prisma `directUrl`. The auth and platform migrations add their own role grants/policies and FORCE RLS; see the superseding source-verification section in `docs/security/DATABASE-ACCESS-PATH-AUDIT.md`.
- A documentation-only update after this source commit must receive its own CI result before it is called verified. No production database, secret, hosting, DNS, payment, deployment, merge or release action is included in these CI results.

**Release posture remains: REPOSITORY SOURCE/ISOLATED-CI PASS ON THE EXACT SOURCE COMMIT — PRODUCTION BACKUP/RESTORE, LIVE ROLE/BASELINE, HOSTING AND PRODUCT RELEASE GATES OPEN — DEPLOYMENT BLOCKED — NOT RELEASED.**


## Fresh read-only VAYRO-CORE catalog reconciliation — 2026-11-09

A fresh read-only inspection of project `wdqhdnhpgxhmmfeyxwxr` returned PostgreSQL 17.11 and the following live state:

- 11 public tables; all 11 have RLS enabled; **0 policies** and **0 FORCE RLS** tables.
- Prisma migration history: **empty**.
- The four repository models `UserMfa`, `MfaRecoveryCode`, `AuthChallenge`, and `AiGeneration` are absent from the live catalog.
- Live `Session` is missing repository columns `revokedAt`, `lastSeenAt`, `assurance`, and `mfaAuthenticatedAt`.
- Live `AuditEvent` does contain `tenantId` and the `AuditEvent_tenantId_createdAt_idx` index, but the `AuditEvent_tenantId_fkey` foreign-key constraint is absent. RLS policies are also absent.
- The role groups `vayro_app`, `vayro_auth`, `vayro_platform`, and `vayro_platform_bootstrap` are absent; no `vayro_%` LOGIN role was found.
- Supabase Security Advisor reports 11 RLS-enabled/no-policy findings. Health Advisor returned no findings.

This confirms material schema and security drift, not just a missing migration-history record. **Do not apply the migration chain, record a baseline, create roles, or add policies on production.** The correct next gate is an independently encrypted backup and a successful isolated restore, followed by a full object-by-object schema comparison and rehearsed forward/recovery plan. A fresh empty branch is not a substitute for restoring the current production schema/data.


## Verification addendum — 2026-11-09 (PR #6 security branch)

This addendum supersedes prior PR #6 head and CI references above where they conflict.

- PR #6 head: `691c0626ceb0905643c8ac1423b2b132e22ed4ab`, branch `security/mfa-session-endpoint-gates`.
- PR #6 remains open, Draft and unmerged; base is `brand/vayro-name-only`.
- Exact-head VAYRO CI [42638412270](https://github.com/gavad54/zelmira-one-/actions/runs/42638412270): completed successfully. All inspected steps passed, including locked dependency audit, unit tests, Prisma generation/validation, isolated PostgreSQL auth/platform/tenant role-boundary tests, tenant RLS test, lint, typecheck, production build, Docker image build and PostgreSQL/production HTTP integration tests.
- Exact-head CodeQL [42638412263](https://github.com/gavad54/zelmira-one-/actions/runs/42638412263): completed successfully.
- This closes the current branch's repository CI and CodeQL execution gates only. It is not evidence of zero open CodeQL alert records unless the alert inventory is separately inspected, and it does not close production database, migration, backup/restore, hosting, email, billing, product MVP, Android, UAT, legal or release-approval gates.
- The exact-head run resolves the previously failing production HTTP integration job after test-only proxy identity isolation was corrected. The test proxy configuration exists only in disposable CI; do not copy its proxy-hop count or IP behavior into production without verifying the real hosting ingress.

**Current disposition remains: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**


## Live verification addendum — 2026-11-11 (supersedes conflicting historical entries)

This addendum is the current status snapshot. Earlier dated entries below are retained as history and must not be treated as current where they conflict with this section.

### Repository
- PR #2 (VAYRO rebrand/product-family foundation) was merged before this snapshot; do not report it as open or draft.
- PR #18 tenant authorization declaration correction was merged as `65335176a86313acd59e899f181bdeaa20d5ac26`. Exact-head CI and CodeQL passed.
- PR #19 live platform audit documentation was merged as `fb4e8852d04f6dafc5788cd74bbb48489888a04a`. Exact-head CI run [42991910077](https://github.com/gavad54/zelmira-one-/actions/runs/42991910077) completed successfully.
- Current main at this snapshot: `fb4e8852d04f6dafc5788cd74bbb48489888a04a`.

### Railway
- The VAYRO service is online in the `ARIA Web` Railway project; it is not yet an independently hosted VAYRO project.
- Latest deployment `0b90c87c-5f0a-4f3c-b668-2a303b367968` is SUCCESS on the current main commit, with 1/1 replica running and no active warnings, critical issues or recent failures at inspection.
- The service has no attached volume. Its service configuration currently lists no application variables; only Railway-generated system variables are present. Do not infer database readiness from container startup.
- A separate staged patch remains pending in the ARIA Web production environment and must not be accepted as a VAYRO fix without review.
- Railway HTTP logs show successful requests to the homepage and several routes in prior traffic, alongside 404s for `/favicon.ico` and `/vayro-mark.svg`. Recheck/fix static assets in a separate reviewed change.

### VAYRO-CORE database
- Live read-only inspection on 2026-11-11 found 11 public tables with RLS enabled, zero public RLS policies, no recorded applied migrations, no `vayro_*` runtime roles, and no application table grants for `anon`, `authenticated` or `service_role`.
- Security Advisor reports 11 `rls_enabled_no_policy` findings. This is not proof of tenant isolation.
- The repository has eight Prisma migration files; their presence in Git does not prove they have been applied to VAYRO-CORE.
- Do not execute production migrations, baseline resolution, role grants, RLS policies or seed data until an independently encrypted backup, successful separate-host PostgreSQL 17 restore, schema reconciliation and reviewed execution plan are evidenced.

### Backup and restore
- Backup and isolated-restore workflow files exist, but no successful encrypted backup artifact, checksum-verified independent restore, application-level validation, or measured RPO/RTO was evidenced at this inspection.
- Keep backup and restore gates OPEN. The runbooks require owner-provisioned protected GitHub Environments, scoped B2 credentials, age encryption keys and a separate disposable PostgreSQL 17 restore host. Never paste secret values into chat or source control.

### Product delivery
- The main repository does not prove that all 11 products are independently operational. Catalogue entries and route responses are not proof of complete product workflows.
- DANA and NEGAH have implementation areas; other products require independent evidence for runtime, data boundary, security, tests, backup, mobile acceptance and commercial operations.
- Preserve product boundaries: ARIA must not include accounting/ERP; ARIANA owns accounting/ERP; LEADORA remains a separate distribution-operations product.

### Current release decision
**ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT COMMERCIALLY RELEASED.**

Open gates include: dedicated VAYRO hosting and protected runtime configuration; database baseline/least-privilege role and RLS validation; encrypted offsite backup and isolated restore; privileged MFA and complete endpoint authorization tests; trusted proxy/security headers/CSP; email; licensing/payments/legal review; independently operational product modules; Android build/signing/device UAT; owner UAT; and explicit release approval.

No production database mutation, secret change, payment activation, customer onboarding or public commercial release is authorized by green CI or a successful Railway container deployment alone.
