# Architecture — VAYRO

## Purpose
VAYRO is the platform shell and governance plane for independent specialist products. Tenant authorization and the operational control plane remain under development.

## Current infrastructure (verified 2026-11-10)
- Web application: Next.js App Router, React and TypeScript; Prisma ORM; PostgreSQL 17.
- Database: dedicated Supabase PostgreSQL project named VAYRO-CORE, region eu-central-1, Free plan.
- Database is separate from ARIA and LEADORA. No ARIA or LEADORA database, volume or credentials are reused.
- Eleven initial Prisma-aligned tables are present in the live public schema. RLS is enabled on all eleven, but there are currently zero RLS policies and zero FORCE RLS tables. Security Advisor reports eleven RLS-enabled/no-policy findings.
- Live migration history is empty. The schema was provisioned directly; do not run `prisma migrate deploy`, baseline production, create runtime roles or change grants/policies until the schema is reconciled object-by-object, an independently encrypted backup is restored successfully to an isolated PostgreSQL 17 target, and a forward/recovery plan is rehearsed.
- GitHub Actions CI and CodeQL are configured. Exact PR #12 head d0300f87eef12011623378e377b6bfd625f4eed9 passed VAYRO CI and CodeQL. A later documentation-only commit b8d0c766dfe99b27884170b80b762b9ee6d0d0fb has a fresh CI run in progress as of 2026-11-10; do not assume it passed.
- A Railway service named VAYRO exists and is online at `https://vayro-production.up.railway.app`, but it is housed in the legacy Railway project `ARIA Web`, not a dedicated VAYRO project. Its latest observed successful deployment ran base commit f3abc61523cb7abbd0b0ab4559a34f40a068ddb5, not the PR #12 branch head. One recent failed deployment on commit 93108e0d95ff940e9855f8fdc3ef4f37063b1043 was classified as a healthcheck failure even though the process log showed Next.js starting and becoming ready. A separate VAYRO Railway project was previously blocked by the free-plan resource limit; no paid upgrade is authorized.
- PR #12 adds backup/restore workflow scaffolding only. No B2 bucket/keys, protected GitHub secrets, backup object, isolated restore database or actual backup/restore run exists.

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
- Review migrations and test forward/recovery in isolated environments.
- Store encrypted backups outside the hosting provider and prove an isolated restore.
- AI tools require allowlists, scoped identities, budgets, approval for consequential actions and audit trails.
- The existing Railway service is not accepted as independent VAYRO production hosting because it remains in the legacy ARIA Web project and is not running the current reviewed PR head.
- No independent backup/restore drill, live production tenant isolation, owner UAT or public commercial release is verified. Keep customer onboarding, real payments and production data collection disabled until release gates pass and the authorized owner approves release.

**Current release disposition: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**
