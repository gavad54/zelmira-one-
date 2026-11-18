# VAYRO engineering execution checkpoint — 2026-11-18

## Scope and safety

This checkpoint records work performed against the repository only. It does not certify production readiness and does not authorize production database DDL, migrations, data deletion, payment activation, public release, or reuse of ARIA/LEADORA infrastructure.

- Repository: `gavad54/zelmira-one-`
- Base branch: `main`
- Exact base commit inspected: `f0d31804e695cd3d73b452c7507affdca9573740`
- Isolated work branch: `engineering/vayro-hardening-2026-11-18`
- Main was not modified.
- Production database and hosting settings were not modified.

## Verified repository state

- PR #2 is merged; merge commit: `4e98a25503f94c2dc5d4ebc11a804f64d6568d5c`.
- The main commit above has a successful CI run recorded as `43048676444` (90 unit tests and 30 PostgreSQL/HTTP integration tests; schema validation, migration rehearsal, role/RLS tests, lint, typecheck, production build and Docker build).
- CodeQL run `43048671466` succeeded for that main commit.
- The main-commit CI dependency audit reported zero vulnerabilities. This is a repository/CI result, not a live production security certification.
- PR #5 remains open/draft and is not a safe merge candidate: its base is `experiment/cloudflare-free-hosting-audit`, and its branch has substantial divergence from main. Its 13 High development-dependency findings must be remediated without `npm audit fix --force`, audit suppression, or threshold reduction. The PR's production-only audit reporting zero findings does not clear the development dependency chain.
- The repository contains MFA/session models and routes, but a Prisma model or CI migration rehearsal does not prove that the live VAYRO-CORE catalog is reconciled.

## Live VAYRO-CORE findings from the read-only inspection

- Supabase project ref: `wdqhdnhpgxhmmfeyxwxr`; PostgreSQL 17.11; project status ACTIVE_HEALTHY.
- Eleven public tables were observed with RLS enabled, but zero RLS policies and zero FORCE RLS settings.
- Security Advisor reported eleven RLS-enabled/no-policy findings.
- Migration history was empty and `_prisma_migrations` was absent.
- The live catalog did not contain the Prisma MFA tables; live Session lacked the schema's `revokedAt`, `lastSeenAt`, `assurance`, and `mfaAuthenticatedAt` columns.
- The observed table owner was `postgres`; no dedicated `vayro_app` runtime login was confirmed. `service_role` has BYPASSRLS and must not be treated as the ordinary application runtime identity.
- No production DDL or migration was executed.

## Hosting and recovery findings

- The Railway workspace inventory did not show a dedicated VAYRO project. A service named VAYRO exists inside the ARIA Web project; a similarly named service exists in the LEADORA project. Neither is evidence of independently controlled VAYRO hosting. Do not repurpose or modify either project's resources as a workaround.
- The scheduled backup workflow failed its protected-configuration check. Missing configuration included the backup database URL, age recipient, B2 credentials, bucket, endpoint and region. No production backup object was created or verified.
- The restore workflow is designed for an isolated PostgreSQL target, but a successful restore of a real production backup has not been evidenced.
- A previous CI-only restore rehearsal is not a substitute for an offsite production backup and independent restore.

## Work performed in this branch

This branch establishes a current, inspectable engineering checkpoint and corrects stale release/architecture statements. It deliberately does not invent RLS policies or migration baselines without a reconciled table-by-table policy matrix and an independently verified restore point.

## Required next engineering gates

1. Remediate development dependency advisories in a dedicated dependency-only change; preserve the lockfile and full audit threshold; run CI and CodeQL.
2. Produce a complete Prisma-vs-live catalog diff and a table-by-table tenant access matrix. Design policies from actual access patterns, including owner/platform, auth, tenant, and service boundaries.
3. Configure protected backup secrets/variables in GitHub Environments, run a real encrypted offsite backup, then restore to a separate isolated PostgreSQL host and compare schema, row counts, and application invariants.
4. Only after gates 2–3 pass, prepare a reviewed baseline/migration and role/RLS plan for a separately authorized production change window. Never use a BYPASSRLS service identity as the normal tenant runtime.
5. Provision independent VAYRO hosting and database connectivity without borrowing ARIA or LEADORA resources.
6. Complete NAMA, NEGAH, PAYAM, payment/licensing, Android and UAT against explicit acceptance tests; do not equate roadmap documents or UI shells with working commercial capability.

## Acceptance and release decision

- Repository changes on this branch are proposals until CI/CodeQL and review pass.
- No production release is approved by this checkpoint.
- Current production state remains **BLOCKED** for database schema/tenant security, independent backup/restore, independent hosting, and end-to-end commercial/mobile acceptance.


## Follow-up live read-only diagnostic — 2026-11-18

The new read-only catalog query was executed against VAYRO-CORE project `wdqhdnhpgxhmmfeyxwxr`. It performed catalog SELECTs only; no data or schema was changed.

- Prisma expects 15 models/tables; only 11 exist in the live public schema.
- Missing live tables: `AiGeneration`, `AuthChallenge`, `MfaRecoveryCode`, `UserMfa`.
- The four expected MFA/session lifecycle columns are absent from live `Session`: `revokedAt`, `lastSeenAt`, `assurance`, `mfaAuthenticatedAt`.
- All 11 existing tables report RLS enabled, zero policies, and FORCE RLS disabled; all 11 are owned by `postgres`.
- Runtime roles `vayro_app`, `vayro_auth`, `vayro_platform`, and `vayro_platform_bootstrap` are absent. Supabase `service_role` exists and has BYPASSRLS.
- `public._prisma_migrations` is absent.
- The live FK inventory showed tenant FKs for `License` and `Membership`; the expected `AuditEvent.tenantId` FK was not present in the result.

This confirms that the issue is not only a stale dashboard or advisor message: live schema and runtime role provisioning are materially behind the repository migration contract. Do not attempt a production migration, baseline, grant, policy creation or owner change before an independently verified backup/restore and reviewed schema reconciliation.

## PR #39 verification status

The documentation and read-only diagnostic are on PR #39. GitHub Actions runs were started for the current PR head: CI run `44314253855` and CodeQL run `44314253046`. At the time of this update both were still in progress; no pass result is claimed.
