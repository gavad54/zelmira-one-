# Architecture — VAYRO

## Purpose
VAYRO is the platform shell and governance plane for a family of independent specialist products. It provides product discovery and an initial identity foundation; tenant membership authorization and the operational control plane are being expanded and must not be represented as complete until all endpoint and production gates pass.

## Initial deployment topology
- Next.js App Router, React and TypeScript web application.
- PostgreSQL as the intended platform control-plane database.
- Prisma persistence and versioned migrations.
- GitHub Actions for automated validation.
- Railway is the intended hosting target; a separate VAYRO project and database still need to be provisioned.

## Implemented foundation (not production certification)
- Public Persian-first product directory and responsive web shell.
- Password hashing, opaque server-side sessions, email verification and password-reset token primitives.
- Login, registration, logout, session inspection, email verification, password recovery and one-time owner-bootstrap routes.
- Database-backed rate-limit records and basic audit events for selected authentication and owner actions.
- Database-derived tenant membership authorization helper and a minimal tenant access proof endpoint.
- Health and database-readiness endpoints.
- Prisma models for users, tenants, memberships, sessions, products, licenses, audit events and authentication support records.

The presence of a route or helper does not prove complete endpoint coverage, production email delivery, MFA, full tenant-aware CRUD, billing, or operational readiness. Those remain explicit release gates.

## Trust boundaries
1. Browser clients are untrusted. Authorization must be enforced on the server for every protected operation.
2. Tenant-scoped queries must derive tenant membership from the authenticated session, never trust a tenant ID supplied by the browser alone.
3. Platform-owner actions require a distinct server-verified platform role and an audit record.
4. Product integrations use versioned APIs, narrow scopes, explicit timeouts, idempotency and auditable service identities.
5. Secrets are stored only in protected runtime/CI secret stores and never in source control.
6. Unknown entitlement, identity or authorization state fails closed.

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
- LEADORA: distribution, sales, inventory and commercial operations.
- ARIANA: accounting, finance and ERP.
- ARIA: social, services and marketplace; no accounting or ERP.
- ARMIN MARKET: request and supplier quotation marketplace.

These are independent products, not deployed integrations within this repository. Do not merge their databases. Integrate only through separately reviewed, versioned APIs after authorization, data mapping and failure-mode review. Purchase of one product must not require purchase of another.

## Reliability and security
- Liveness and readiness are separate; readiness verifies PostgreSQL without exposing internal details.
- Database migrations are reviewed and tested in isolated environments before explicit application.
- Backups must be stored outside the primary hosting provider and restored in an isolated environment before production release.
- External integrations must fail closed for privileged actions and must not silently grant access.
- AI tools use allowlists, scoped identities, budgets, confirmation for consequential actions and audit trails.

## Current deployment boundary
The repository is an engineering foundation under review. There is no verified VAYRO production project, deployment, independent backup/restore drill, owner UAT or public commercial release. Keep customer onboarding, real payments and production data collection disabled until release gates are evidenced and the authorized owner approves release.
