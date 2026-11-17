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


## Repository implementation update — 2026-11-17

The repository now includes a privileged MFA lifecycle: password login can require a short-lived MFA challenge; TOTP credentials are encrypted at rest; successful verification establishes MFA assurance on the session; recovery codes are one-time hashes; and the Persian security-settings area supports status inspection, recovery-code rotation and eligible non-privileged MFA disablement. Privileged disablement is rejected and the role is rechecked inside the transaction.

The latest verified application-code head is `5274fdf8333f5d9b0451265df7920c85436edab8`. Subsequent documentation-only commits advanced PR #5 to `3e0632cdf6214a690d10571a6aa8c48fba35df90`; CI, CodeQL and Dashboard Validation for that documentation-only head were still running at the time of this note. VAYRO CI [43926257688](https://github.com/gavad54/zelmira-one-/actions/runs/43926257688), CodeQL [43926257680](https://github.com/gavad54/zelmira-one-/actions/runs/43926257680) and Dashboard Validation [43926257703](https://github.com/gavad54/zelmira-one-/actions/runs/43926257703) all completed successfully on that exact commit.

Authenticator-device replacement is not yet implemented; it must use a pending encrypted secret and confirm-before-swap transaction. Production key custody, live database baseline reconciliation, external encrypted backup and restore, dedicated hosting, production email, billing, Android delivery, independently operational product integrations and owner UAT remain unverified. PR #5 remains open and draft. The platform remains **DEPLOYMENT BLOCKED — NOT RELEASED**.


## 2026-11-17 implementation and infrastructure verification

- Added a safe TOTP authenticator replacement lifecycle: encrypted pending secret, ten-minute expiry, old-factor proof to begin, new-factor proof to confirm, atomic promotion, replay/rate-limit protection, audit events, recovery-code rotation and revocation of other sessions. The active factor remains intact until confirmation succeeds.
- Added a Persian security-settings workflow for device replacement and one-time recovery-code display.
- CI now uses PostgreSQL 17 and includes an isolated logical backup/restore smoke test. This validates CI restore mechanics only; no production backup or external encrypted storage is configured.
- Fresh read-only VAYRO-CORE inspection shows 11 public tables, no data rows, RLS enabled, no client table grants and no migration history. The live schema has not yet received MFA persistence or later Session columns. The database inspection identity was `postgres` (BYPASSRLS); the application's runtime database identity remains unverified.
- No dedicated VAYRO Railway project or Android/Gradle project exists in the current accessible workspace/repository tree.

The production database baseline, least-privilege runtime identity, protected MFA key custody, external encrypted backups/restore, hosting, email, billing, independent product operations, Android release, UAT and explicit owner release approval remain separate gates. No production schema, secret, deployment or data was changed.
