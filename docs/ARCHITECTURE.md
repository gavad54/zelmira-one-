# Architecture — VAYRO

## Purpose and system shape

VAYRO is the central command, portfolio governance and coordination plane for independently operated applications. It is not a shared application runtime, a shared operational database, or a mandatory dependency for an application to continue serving its customers.

The architecture has two distinct layers:

1. **VAYRO control plane:** product registry, owner command center, portfolio-level identity and optional federation, entitlements, subscription/revenue visibility, integration approvals, AI/automation orchestration, infrastructure health, release governance and audit oversight.
2. **Independent application planes:** each application owns its execution, customer-facing workflows, runtime, operational data, local security controls, backups, release lifecycle, support and commercial operations.

A control-plane outage must not cause an application outage. A product deployment must not require coordinated deployment of another product.

## Independent applications

The application portfolio contains eleven independent applications:

- ARVAND — international trade, import and export.
- CHARSU — marketplace and commerce network.
- GANJINEH — digital stores and e-commerce.
- NEGAH — creative studio and content production.
- SEPEHR — cloud and digital infrastructure.
- NAMA — website and landing-page builder.
- PAYAM — marketing and customer growth.
- LEADORA — distribution and sales operations.
- ARIANA — accounting, finance and ERP.
- ARIA — social, services and marketplace; no accounting or ERP.
- ARMIN MARKET — buyer requests and supplier quotations.

DANA is a shared AI/orchestration capability of VAYRO, not an independent application or a substitute for application-specific business logic.

## Required independence contract

Every application must have:

- Its own source repository or separately controlled codebase and release pipeline.
- Its own deployable runtime, environment, domain/product identity and rollback path.
- Its own operational database, data owner, migrations and data-retention policy.
- Local authentication and server-side authorization. Optional VAYRO SSO must use a documented federation protocol and must fail without disabling local recovery access.
- Local authorization and tenant isolation; central VAYRO roles never implicitly grant access to product business data.
- Versioned APIs and scoped service identities for optional integrations.
- Independently controlled encrypted backups and a tested restore procedure.
- Its own pricing, subscriptions, licensing, support and customer terms.
- Independent installation, use, purchase and cancellation.
- Health and readiness checks that do not depend on other applications.

VAYRO may store product metadata, integration registration, entitlement references and portfolio-level operational signals. It must not become the source of truth for another application's transactions, accounting, inventory, customer records or other operational data.

## Integration and trust boundaries

- Product-to-product communication is API-only; no shared operational database, shared schema, direct cross-product credentials or implicit data access.
- Every integration has a versioned contract, authenticated service identity, least-privilege scopes, explicit data fields, timeout, idempotency strategy, audit record, revocation and failure behavior.
- No integration may require another product to be online for the local product's core workflows unless the user explicitly invoked that integration.
- Identity federation is optional. Each product retains local account recovery and local authorization.
- Unknown identity, entitlement or authorization state fails closed for the protected operation, not for unrelated local product functionality.
- AI tools use allowlists, scoped identities, budgets, human approval for consequential actions and audit trails.
- Product data is not copied into VAYRO for convenience or portfolio analytics without documented purpose, minimized fields, lawful basis/consent where required and retention controls.

## Current VAYRO infrastructure

- Web application: Next.js App Router, React and TypeScript.
- Database: dedicated Supabase PostgreSQL 17 project named VAYRO-CORE, region eu-central-1.
- VAYRO-CORE is separate from ARIA. No ARIA database, volume or credentials are reused.
- A previous live audit observed eleven initial tables and RLS enabled, but zero RLS policies and zero FORCE RLS tables. Therefore tenant isolation is not proven.
- The schema was provisioned directly. Prisma migration history is not yet baselined; do not run migrate deploy until baseline reconciliation and isolated forward/rollback testing are complete.
- GitHub Actions CI and CodeQL are configured.
- No VAYRO application hosting or production deployment is currently verified.

## Implemented foundation (not production certification)

- Public Persian-first product directory and responsive web shell.
- Password hashing, opaque server-side sessions, email verification and password-reset token primitives.
- Login, registration, logout, session inspection, email verification, password recovery and one-time owner-bootstrap routes.
- Database-backed rate-limit records and selected audit events.
- Database-derived tenant membership authorization helper and a minimal tenant access proof endpoint.
- Health and database-readiness endpoints.
- Prisma models for users, tenants, memberships, sessions, products, licenses, audit events and authentication support records.

Routes and helpers do not prove complete endpoint coverage, production email delivery, MFA, full tenant-aware CRUD, billing or operational readiness. The VAYRO product registry is metadata only and does not prove that any application has an independent runtime or database.

## Reliability and release boundary

- Review migrations and test forward/rollback in isolated environments.
- Store encrypted backups outside the hosting provider and prove an isolated restore.
- Each application must independently prove its own backup and restore.
- No VAYRO production deployment, independent application fleet, owner UAT or public commercial release is verified.
- Keep customer onboarding, real payments and production data collection disabled until release gates pass and the authorized owner approves release.

See [INDEPENDENT-PRODUCT-ARCHITECTURE.md](INDEPENDENT-PRODUCT-ARCHITECTURE.md), [PRODUCT-BOUNDARIES.md](PRODUCT-BOUNDARIES.md), [PRODUCT-REPOSITORY-INVENTORY.md](PRODUCT-REPOSITORY-INVENTORY.md), [DANA-COMMAND-CENTER.md](DANA-COMMAND-CENTER.md) and [RELEASE-GATES.md](RELEASE-GATES.md).

## Live deployment clarification — 2026-11-10

The current Railway account exposes projects `ARIA Web` and `LEADORA`; it does not expose a dedicated project named VAYRO. A service named `VAYRO` is live inside `ARIA Web`, sourced from this repository's `main` branch, with domain `vayro-production.up.railway.app` and a latest observed SUCCESS deployment. A second service also named `VAYRO` exists inside the `LEADORA` project, sourced from this repository's `security/mfa-session-endpoint-gates` branch; it has no public service domain and its latest observed deployment is SUCCESS. Neither service is hosted in a dedicated VAYRO project, and the second service's placement inside LEADORA is an additional boundary violation to investigate without deleting or repointing it blindly. These observations prove running service deployments only, not an independent VAYRO hosting boundary, production database readiness, or product release. The architecture acceptance gate remains open until VAYRO has a dedicated, independently controlled project/runtime and failure boundary. Do not reuse ARIA/LEADORA infrastructure or apply staged Railway changes as a substitute for that boundary.
