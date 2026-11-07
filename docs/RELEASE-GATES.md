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
