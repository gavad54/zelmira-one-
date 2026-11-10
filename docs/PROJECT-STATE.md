# VAYRO project state — authoritative snapshot
Updated: 2026-11-10 11:33:43 +03:30 (2026-11-10T08:03:43Z)
Fixed 48-hour window: 2026-11-10T07:43:24Z to 2026-11-12T07:43:24Z. No reset or extension.

## Repository and verified baseline
- Repository: gavad54/zelmira-one-
- PR #12: OPEN / DRAFT / UNMERGED; branch infra/backup-restore-b2; 48 commits ahead / 0 behind main.
- Last exact-head verified source SHA before the current owner-dashboard change: b8abdfcb1f0a52bb3d58c5639b8ee7d26df5882f.
- VAYRO CI run 42779145368 (#1162): completed success; all 45 steps passed.
- CodeQL run 42779145558 (#1125): completed success.
- Those checks validated the bootstrap-role membership hardening. The current owner-dashboard/product-catalog/platform-role refactor is a new candidate and requires its own exact-head CI/CodeQL.
- Last verified source CI included unit tests, dependency audit, Prisma generation/validation, PostgreSQL 17 migrations in disposable CI, auth/platform/tenant role isolation, tenant RLS SQL proof, lint, typecheck, production build, Docker build and PostgreSQL/HTTP integration.

## Product identity and boundaries
- Mother app: VAYRO only.
- Seven approved family modules: ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM.
- DANA is a platform-level AI capability, not an eighth family product or product-catalog record.
- Three independent products remain: LEADORA, ARIANA, ARIA.
- ARIA excludes accounting/ERP; ARIANA owns accounting/ERP; LEADORA remains independent pending audit.
- Preserve existing capabilities until audited and approved for change. Product data stores remain independent; integrate through reviewed, versioned APIs.
- UI target: Persian RTL + English, mobile-first and responsive.

## Current engineering changes in this candidate
- Owner dashboard page added at /dashboard, with metrics, product status/HTTPS configuration and separate platform-capability display.
- Login now routes an OWNER to /dashboard after successful MFA; other users go to /workspaces.
- Owner products API moved from the default Prisma connection to withPlatformOwnerTransaction and the dedicated platform runtime role. Authentication/rate-limit operations use the dedicated auth role.
- Catalog now contains seven approved VAYRO family modules plus three independent products. DANA remains in PLATFORM_CAPABILITIES and is not newly inserted as a Product row.
- Catalog initialization uses createMany with skipDuplicates and does not overwrite existing product statuses/configuration.
- These changes are IMPLEMENTED in the current candidate but await exact-head CI/CodeQL.

## Live production evidence — fresh read-only inspection 2026-11-10
- VAYRO-CORE project wdqhdnhpgxhmmfeyxwxr is ACTIVE_HEALTHY, PostgreSQL 17.11, region eu-central-1.
- 11 public tables; RLS enabled on all 11; zero RLS policies; zero FORCE RLS; all 11 tables currently empty.
- Supabase migration history is empty.
- Security Advisor reports 11 RLS-enabled/no-policy findings; Health Advisor has no findings.
- Live schema lacks UserMfa, MfaRecoveryCode, AuthChallenge and AiGeneration. Session lacks revokedAt, lastSeenAt, assurance and mfaAuthenticatedAt.
- No vayro_% database roles exist.
- No production DDL, roles, grants, policies or migrations have been applied.

## Hosting and release
- Railway VAYRO service is online with one running replica, zero active warnings/critical notifications and five failed deployments in the last 24h.
- It remains in legacy project ARIA Web, branch main, last successful deployment base SHA f3abc61523cb7abbd0b0ab4559a34f40a068ddb5. /api/health is liveness only.
- A stale staged Railway patch remains unapplied; not applied.
- No actual encrypted offsite backup, protected backup secrets, separate restore target or successful restore exists.
- No merge, deployment of PR code, Android signing, UAT completion or public release.

## Open PR and branch governance
- Open PRs: #12 (active engineering), #1 (older rebrand/product-family), #3 (older baseline audit), #5 (owner dashboard on a non-main base), and Dependabot #7–#11.
- PRs #1/#3/#5 overlap with parts of current scope; see DUPLICATE-REGISTER.md. They were not merged or closed.
- No listed repository branch was protected at inspection, including main. No branch-protection settings were changed.

## Weighted progress
100-point registry includes all seven end-to-end modules and owner dashboard. VERIFIED remains GOV-001 (2) + CI-001 (4) + PROD-001 (3) = 9/100 = 9%. The current dashboard/platform-role candidate earns no weight until exact-head CI passes. This is evidence-weighted task completion, not source-code volume.

## Disposition
ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.
