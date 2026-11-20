# Architecture — VAYRO

## Purpose
VAYRO is the platform shell and governance plane for independent specialist products. Tenant authorization and the operational control plane remain under development.

## Current infrastructure
- Web application: Next.js App Router, React and TypeScript.
- Database: dedicated Supabase PostgreSQL 17 project named VAYRO-CORE, region eu-central-1, Free plan.
- Database is separate from ARIA. No ARIA database, volume or credentials are used.
- Eleven initial Prisma-aligned tables are provisioned. RLS is enabled on all eleven; client-role table privileges are revoked. No user, tenant or sample records were inserted.
- The schema was provisioned directly. Prisma migration history is not yet baselined; do not run migrate deploy until baseline reconciliation and isolated forward/rollback testing are complete.
- GitHub Actions CI and CodeQL are configured.
- No independently controlled VAYRO hosting project or production deployment was verified. A VAYRO-named service exists inside the ARIA Web Railway project; a similarly named service exists inside LEADORA. These are not independent VAYRO hosting and must not be repurposed as a shortcut.

## Implemented foundation (not production certification)
- Public Persian-first product directory and responsive web shell.
- Password hashing, opaque server-side sessions, email verification and password-reset token primitives.
- Login, registration, logout, session inspection, email verification, password recovery and one-time owner-bootstrap routes.
- Database-backed rate-limit records and selected audit events.
- Database-derived tenant membership authorization helper and a minimal tenant access proof endpoint.
- Health and database-readiness endpoints.
- Prisma models for users, tenants, memberships, sessions, products, licenses, audit events and authentication support records.

Routes and helpers do not prove complete endpoint coverage, production email delivery, MFA, full tenant-aware CRUD, billing or operational readiness.

## Trust boundaries
1. Enforce authorization on the server for every protected operation.
2. Derive tenant membership from the authenticated session, never a browser-supplied tenant ID alone.
3. Require server-verified platform roles and audit records for owner actions.
4. Use versioned APIs, narrow scopes, timeouts, idempotency and auditable service identities.
5. Store secrets only in protected runtime/CI secret stores.
6. Unknown entitlement, identity or authorization state fails closed.
7. Database access is server-only; do not grant browser roles table privileges.

## Approved product family — six independent applications

VAYRO is the mother platform and is not counted among the six direct applications:

- ARIA: AI, communications, social/services and digital work; no accounting or ERP.
- ARIANA: accounting, finance, general ledger and ERP; sole owner of these capabilities.
- LEADORA: distribution, sales, inventory, commercial operations and growth; includes PAYAM's approved growth scope.
- ARMIN MARKET: marketplace, buyer requests, supplier quotations and market intelligence; includes CHARSU's approved marketplace scope.
- DANA: independent command-center and authorized orchestration application.
- ARVAND: international trade, import, export and trade operations.

Internal ARIA domains: GANJINEH (digital storefront/catalogue), NEGAH (creative studio), SEPEHR (cloud/resource tools) and NAMA (website/page builder). These are not additional independent products.

CHARSU is consolidated into ARMIN MARKET and PAYAM into LEADORA. Preserve their historical source records and capabilities in the archive/crosswalk; do not expose them as standalone current products or delete historical records.

## Independent product boundaries
Each product retains its own domain rules, data ownership, authorization, integrations and release evidence. Keep product data stores separate. Integrate only through separately reviewed, versioned APIs/events with scoped service identities and audit records. Purchasing one product must not require another. ARIANA alone owns accounting/ERP; ARIA must not contain accounting/ERP; LEADORA owns distribution and sales operations within its defined scope.

## Command Center and Future Development Lab
The Command Center provides portfolio oversight, people/access, commercial operations, platform/integrations, security/audit, backup/recovery, release governance and DANA orchestration. The Future Development Lab is the governed path for ideas, impact assessment, design proposals, isolated prototypes, testing/security review, explicit owner decisions, staged rollout and rollback. It has no direct production-write credentials and does not bypass release gates.

## Reliability and release boundary
- Review migrations and test forward/rollback in isolated environments.
- Store encrypted backups outside the hosting provider and prove an isolated restore.
- AI tools require allowlists, scoped identities, budgets, approval for consequential actions and audit trails.
- No VAYRO application deployment, independent backup/restore drill, owner UAT or public commercial release is verified. Keep customer onboarding, real payments and production data collection disabled until release gates pass and the authorized owner approves release.


## Implementation verification addendum — 2026-11-11

- Main branch includes the owner Command Center, six-product portfolio, Future Development Lab, owner license lifecycle API and tenant-scoped product entitlement API.
- The owner license endpoints require a fresh owner/MFA session, validate same-origin mutations, apply request limits, and append audit events. The tenant product endpoint derives membership/session authorization and executes data reads through the tenant-scoped PostgreSQL transaction/RLS boundary. Product access fails closed unless the product is ACTIVE and its license is current.
- The Future Development Lab stores append-only proposal/decision events. A research approval is not a production execution authorization.
- Exact main commit `ef71857074968a639aed484df030be6d630d8539` passed VAYRO CI run [43042296724](https://github.com/gavad54/zelmira-one-/actions/runs/43042296724) and CodeQL run [43042296836](https://github.com/gavad54/zelmira-one-/actions/runs/43042296836). CI included dependency audit, unit tests, Prisma validation, isolated PostgreSQL role/RLS tests, lint, typecheck, production build, Docker build and PostgreSQL/production-HTTP integration tests.
- A Railway service named `VAYRO` exists in project `ARIA Web`, not in an independently controlled VAYRO project. Its latest deployment reports SUCCESS on 2026-11-11, but the service has no configured variable names, no mounted volumes and no custom domain. Deployment success alone does not prove the application can connect to VAYRO-CORE or pass runtime readiness.
- VAYRO-CORE remains ACTIVE_HEALTHY (PostgreSQL 17.11), but its live Prisma migration history is empty. The live catalog contains 11 public tables, all with RLS enabled, but no RLS policies; Supabase Security Advisor reports 11 RLS-enabled/no-policy findings. The tables currently report zero rows.
- Repository migrations and isolated CI prove the intended schema works in disposable PostgreSQL; they do not reconcile or secure the live database. Do not apply migrations or grants to production until encrypted external backup, successful isolated restore, schema/object reconciliation, and rehearsed recovery are evidenced.


## Current infrastructure reconciliation — 2026-11-18

The dated read-only checkpoint in [ENGINEERING-EXECUTION-2026-11-18](operations/ENGINEERING-EXECUTION-2026-11-18.md) supersedes older hosting and database status notes. In particular, the live VAYRO-CORE catalog currently has RLS enabled but no policies, an empty migration history, and schema drift from the Prisma models. The backup workflow has not produced a verified production backup because protected credentials/configuration are absent. Do not run production migrations or grant runtime access until the schema diff, least-privilege role design, offsite backup and independent restore drill are complete.


## Database recovery and RLS evidence — 2026-11-18

The latest live VAYRO-CORE inventory is documented in [the production reconciliation and recovery plan](operations/PRODUCTION-RECONCILIATION-AND-RECOVERY-PLAN.md). Supabase reports 11 existing public tables, all with RLS enabled but no policies; migration history is empty; four Prisma tables and four Session lifecycle columns are missing; dedicated runtime roles are absent; and the AuditEvent tenant FK is missing. The inventory reported zero rows in the 11 existing tables. These observations do not authorize production DDL.

The intended security boundary remains fail-closed: ordinary tenant requests must use a dedicated non-BYPASSRLS runtime role; auth and platform/owner operations use separate least-privilege roles; browser roles receive no direct table access absent a separately reviewed public-read requirement. Policies must be built from a table-by-table access matrix and negative tests, not generic allow-all rules.

The encrypted backup and isolated restore workflows are present but have not completed successfully with real protected credentials and an independently controlled restore target. The exact required environment configuration is recorded in the recovery plan. No secret values belong in this repository.

On PR #39, CI run 44319284985 completed tests, isolated migration/role/RLS checks, lint, typecheck, production build, Docker build and integration tests; the full dependency audit alone failed with 13 High dev-dependency findings in the picomatch chain. CodeQL run 44319285028 passed. A separate production-only audit is now part of CI, but requires a fresh result on the new head.
