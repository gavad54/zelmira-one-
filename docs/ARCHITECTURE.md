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
- No VAYRO application hosting or production deployment exists. Railway free-plan resource limits blocked a separate project.

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

## Approved product family — 11 independent products
- ARVAND: international trade, import and export.
- CHARSU: marketplace and commerce network.
- GANJINEH: digital stores and e-commerce.
- NEGAH: creative studio and content production.
- SEPEHR: cloud and digital infrastructure.
- NAMA: website and landing-page builder.
- PAYAM: marketing and customer growth.
- LEADORA: distribution, sales, inventory and commercial operations.
- ARIANA: accounting, finance and ERP.
- ARIA: social, communications, services and listings; explicitly excludes accounting and ERP.
- ARMIN MARKET: buyer requests and supplier quotations.

DANA is the central AI intelligence/orchestration capability within VAYRO Command Center, not a twelfth product. Its data and tools are task-scoped, authorized, logged and revocable.

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

- Main branch includes the owner Command Center, eleven-product portfolio, Future Development Lab, owner license lifecycle API and tenant-scoped product entitlement API.
- The owner license endpoints require a fresh owner/MFA session, validate same-origin mutations, apply request limits, and append audit events. The tenant product endpoint derives membership/session authorization and executes data reads through the tenant-scoped PostgreSQL transaction/RLS boundary. Product access fails closed unless the product is ACTIVE and its license is current.
- The Future Development Lab stores append-only proposal/decision events. A research approval is not a production execution authorization.
- Exact main commit `ef71857074968a639aed484df030be6d630d8539` passed VAYRO CI run [43042296724](https://github.com/gavad54/zelmira-one-/actions/runs/43042296724) and CodeQL run [43042296836](https://github.com/gavad54/zelmira-one-/actions/runs/43042296836). CI included dependency audit, unit tests, Prisma validation, isolated PostgreSQL role/RLS tests, lint, typecheck, production build, Docker build and PostgreSQL/production-HTTP integration tests.
- A Railway service named `VAYRO` exists in project `ARIA Web`, not in an independently controlled VAYRO project. Its latest deployment reports SUCCESS on 2026-11-11, but the service has no configured variable names, no mounted volumes and no custom domain. Deployment success alone does not prove the application can connect to VAYRO-CORE or pass runtime readiness.
- VAYRO-CORE remains ACTIVE_HEALTHY (PostgreSQL 17.11), but its live Prisma migration history is empty. The live catalog contains 11 public tables, all with RLS enabled, but no RLS policies; Supabase Security Advisor reports 11 RLS-enabled/no-policy findings. The tables currently report zero rows.
- Repository migrations and isolated CI prove the intended schema works in disposable PostgreSQL; they do not reconcile or secure the live database. Do not apply migrations or grants to production until encrypted external backup, successful isolated restore, schema/object reconciliation, and rehearsed recovery are evidenced.
