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

## Product family
- ARVAND: international trade, import and export.
- CHARSU: marketplace and commerce network.
- GANJINEH: digital stores and e-commerce.
- NEGAH: creative studio and content production.
- SEPEHR: cloud and digital infrastructure.
- NAMA: website and landing-page builder.
- PAYAM: marketing and customer growth.
- DANA: AI intelligence and orchestration.

## Independent products
LEADORA is distribution and sales operations; ARIANA is accounting and ERP; ARIA is social, services and marketplace without accounting/ERP; ARMIN MARKET is request and supplier quotation marketplace. Keep their data stores separate. Integrate only through separately reviewed, versioned APIs. Purchasing one product must not require another.

## Reliability and release boundary
- Review migrations and test forward/rollback in isolated environments.
- Store encrypted backups outside the hosting provider and prove an isolated restore.
- AI tools require allowlists, scoped identities, budgets, approval for consequential actions and audit trails.
- No VAYRO application deployment, independent backup/restore drill, owner UAT or public commercial release is verified. Keep customer onboarding, real payments and production data collection disabled until release gates pass and the authorized owner approves release.
