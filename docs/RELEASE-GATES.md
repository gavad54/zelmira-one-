# VAYRO release gates

The application must not be described as production-ready until every applicable gate has current, inspectable evidence.

## Repository verification

- PR #2 targets `main`, remains open and draft, and is not merged.
- Current branch and PR head: `387403f745da7503ab0a77573c7b2017ae1b589f`.
- The immediately preceding code-bearing/documentation head `1366e95341b28428f7ba518192f76b614aac439d` passed VAYRO CI on push (run 42190991422) and pull_request (run 42190996346), and CodeQL on push (run 42190991262) and pull_request (run 42190996348).
- The verified CI log for `1366e953...` records 32/32 unit tests and 12/12 PostgreSQL/production HTTP integration tests passing, plus Prisma generation/schema validation, isolated PostgreSQL migration deployment, lint, typecheck and production build.
- The current documentation-only head `387403f...` has new CI and CodeQL runs queued/in progress (runs 42192017006 and 42192016961; duplicate PR-event runs 42192023418 and 42192023422). Do not mark this head green until those exact runs complete successfully.
- CI success on a disposable test database does not prove production DB readiness or release readiness.

## Dependency security — OPEN

- Latest lockfile audit on the prior verified CI run reported **6 moderate-severity vulnerabilities**, with no High or Critical findings reported in that run.
- The audit step is configured with `continue-on-error: true`; green CI therefore does **not** mean the dependency-security gate passed.
- The remaining report includes `minimatch` in the `@typescript-eslint/typescript-estree` dependency chain (GHSA-g3hv-75wg-m249).
- Earlier audit on the prior lockfile reported 11 vulnerabilities (7 moderate, 4 high). This is an improvement, not closure.
- Resolve or formally assess remaining advisories and make the release gate enforceable. Do not use `npm audit fix --force`, suppress advisories, or weaken CI assertions.

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

Latest PR head: `387403f745da7503ab0a77573c7b2017ae1b589f`. CI and CodeQL on this exact head are pending verification at the time this document was corrected.

Do not merge, deploy, migrate production data or publish without the required gates and explicit owner approval.
