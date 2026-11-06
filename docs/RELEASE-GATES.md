# VAYRO release gates

The application must not be described as production-ready until every applicable gate has current, inspectable evidence.

## Latest verified repository checks

- [x] Latest branch/PR head rechecked: `1366e95341b28428f7ba518192f76b614aac439d` on `brand/vayro-name-only`; PR #2 is still open, draft and unmerged.
- [x] The latest head's VAYRO CI passed on both push and pull_request events: [push run 42190991422](https://github.com/gavad54/zelmira-one-/actions/runs/42190991422), [PR run 42190996346](https://github.com/gavad54/zelmira-one-/actions/runs/42190996346).
- [x] The latest head's CodeQL passed on both events: [push run 42190991262](https://github.com/gavad54/zelmira-one-/actions/runs/42190991262), [PR run 42190996348](https://github.com/gavad54/zelmira-one-/actions/runs/42190996348).
- [x] Exact latest CI log confirms 32/32 unit tests and 12/12 PostgreSQL/production HTTP integration tests passed (0 failures); Prisma generation/schema validation, isolated PostgreSQL migration deployment, lint, typecheck and production build also passed.

- [x] VAYRO CI passed on PR head `1366e95341b28428f7ba518192f76b614aac439d`: [PR run 42190996346](https://github.com/gavad54/zelmira-one-/actions/runs/42190190559) and [push run 42190991422](https://github.com/gavad54/zelmira-one-/actions/runs/42190187148).
- [x] CodeQL passed on the same commit: [PR run 42190996348](https://github.com/gavad54/zelmira-one-/actions/runs/42190190515) and [push run 42190991262](https://github.com/gavad54/zelmira-one-/actions/runs/42190187144).
- [x] CI completed locked dependency installation, 32 unit tests, Prisma client generation and schema validation, least-privilege role preparation in disposable PostgreSQL, real Prisma migration deployment to disposable CI PostgreSQL, lint, TypeScript typecheck, production build, and 12 PostgreSQL/production HTTP integration tests. All 32 unit tests and all 12 integration tests passed.
- [x] CodeQL JavaScript/TypeScript analysis completed successfully.
- [x] The generated lockfile contains `deepmerge-ts 8.0.2` and `postcss 8.5.32`.
- [x] PR #2 remains open, draft and unmerged. Passing CI is not production approval.

## Dependency security — OPEN

- The latest lockfile audit in CI reported **6 moderate-severity vulnerabilities**. The audit output did not report High or Critical findings in this run.
- The CI audit step is explicitly `continue-on-error: true`; therefore a green CI run does **not** mean the dependency-security gate passed.
- The remaining report includes `minimatch` in the `@typescript-eslint/typescript-estree` dependency chain (GHSA-g3hv-75wg-m249).
- Earlier audit on the prior lockfile reported 11 vulnerabilities (7 moderate, 4 high). The current audit count is improved, but the remaining advisories must be investigated and resolved or formally risk-accepted before release.
- Do not use `npm audit fix --force`, suppress advisories, or weaken CI assertions. Verify compatibility after any dependency changes.

## Outstanding release gates

- [ ] Dependency security: resolve or formally assess all remaining advisories; make the release gate enforceable after remediation.
- [ ] Authentication: production HTTPS secure-cookie verification, expired/reused tokens, disabled/unverified users, DB/email-provider failures, privileged-user MFA and owner-bootstrap cleanup.
- [ ] Authorization: continue endpoint-by-endpoint review; every protected operation must use server-verified sessions and database-derived membership.
- [ ] Tenant isolation: cross-tenant read denial is tested; cross-tenant write/export/delete coverage remains incomplete until those operations exist and are tested.
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

The last recorded read-only inspection of the separate VAYRO-CORE Supabase project found PostgreSQL 17, 11 initial tables with RLS enabled, no client-role table grants, and no migration-history baseline. The inspected schema was directly provisioned; it must be reconciled with Prisma before migrations are run. This is a historical inspection record, not a fresh live-health check.

No ARIA database, Railway project, volume, credentials or data may be reused or modified for VAYRO. No production database mutation, public deployment or release is authorized by a passing repository CI run.

## Product scope and delivery status

The repository contains a public product directory and an engineering foundation for authentication, owner bootstrap, initial tenant authorization, PostgreSQL/Prisma schema, audit foundations, health/readiness checks and CI. The eight product-family entries (ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM and DANA) are currently a product catalogue, not eight completed, integrated operational systems.

There is no verified VAYRO production hosting deployment, Android application/release artifact, operational email delivery, independent backup/restore proof or UAT sign-off. Customer onboarding, live payments and production data collection must remain disabled until the relevant gates have evidence.

## Deployment safety status

**ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**

Latest verified PR head at the time of this record: `1366e95341b28428f7ba518192f76b614aac439d` (VAYRO CI run 42190190559; CodeQL run 42190190515). The next documentation commit will require its own CI/CodeQL verification.

Passing repository checks validate code and disposable CI infrastructure only. They do not prove production hosting, production database readiness, email delivery, Android device execution, independent backup/restore, UAT or release approval. Do not merge, deploy, migrate production data or publish without the required gates and explicit owner approval.
