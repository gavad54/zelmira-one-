# VAYRO Implementation Gap Audit

**Application name:** وایرو (VAYRO)  
**Audit scope:** repository state on `brand/vayro-name-only`  
**Audit date:** 2026-11-04  
**Status:** engineering baseline review; not a security certification or production-readiness approval.

## Verified repository baseline

- Next.js App Router, React, TypeScript and Prisma are configured.
- PostgreSQL is the configured database provider.
- The package name is `vayro`.
- The homepage is a product catalogue and brand landing page. Product cards do not yet prove operational integrations.
- The Prisma schema contains preliminary User, Tenant, Membership, Session, Product, License and AuditEvent models.
- The CI workflow runs Prisma generation/validation, lint, typecheck and a production build on pull requests to `main`.
- The current working branch is 22 commits ahead of `main`; the changes are not merged.
- CI run #23 for commit `e9d2bd915684411e460c7c8dae0b83be89d37497` completed successfully: dependency installation, Prisma generation/validation, lint, TypeScript check and production build all passed.
- The dependency installation still uses `npm install`; no committed lockfile was found, so dependency resolution is not yet deterministic.
- `/api/health` is a liveness endpoint only. It does not verify database connectivity or external dependencies.

## Critical implementation gaps found in the current schema and application

### 1. Identity and session lifecycle
The schema has a unique email and a passwordHash field, but the repository review has not verified a complete authentication implementation, password hashing policy, email verification flow, recovery flow, MFA, session rotation, revocation, device management, or abuse throttling. Do not expose registration or login as operational until these are implemented and tested.

### 2. Tenant isolation
Tenant and Membership records exist, but the current schema does not yet define tenant-scoped business records for the platform's own operational workflows, nor database-level isolation controls. Every tenant-owned query and mutation must derive tenant scope from a server-verified membership, never from a client-supplied tenant identifier alone. Add negative cross-tenant tests before any customer data is accepted.

### 3. Authorization and owner governance
PlatformRole and MembershipRole are useful starting points, not a complete permission system. Implement explicit server-side permission checks, least-privilege defaults, owner recovery, privileged-action step-up verification, dual-control for destructive operations, and immutable records for sensitive administration. Never grant owner authority from an email string or an unverified client claim.

### 4. Audit integrity
AuditEvent is currently a generic event table. Define an event taxonomy, actor and tenant context, correlation IDs, redaction rules, retention policy, privileged-event alerts, and tamper-evident export/retention. Secrets, passwords, session tokens and unnecessary personal data must never enter audit metadata.

### 5. Licensing and revenue
License records are not a billing ledger. Before charging customers, implement payment-provider integration, idempotent webhook handling, invoice/receipt records, refund and dispute states, tax handling by jurisdiction, reconciliation, and an auditable entitlement state machine. Keep commerce disabled until tested end-to-end.

### 6. Backup and recovery
A backup design document is not a backup system. Implement encrypted scheduled database backups, independent storage outside the primary hosting account, retention and lifecycle controls, access logging, restore automation in an isolated environment, integrity checks, and measured RPO/RTO. A release gate requires a successful restore drill with evidence and no production data exposure.

### 7. Product integrations
The eight product entries are catalogue metadata only. Integrations must use versioned APIs, scoped service identities, signed requests where appropriate, timeouts, retries with idempotency, circuit breakers, schema validation, and per-product health monitoring. Preserve the independent data and business boundaries of LEADORA, ARIANA, ARIA and ARMIN MARKET. ARIA must never inherit accounting or ERP capabilities from ARIANA.

### 8. Security and privacy
The current Next.js configuration sets several useful response headers, but this is not a complete security posture. Add a reviewed Content-Security-Policy, secure cookie policy, CSRF protections where applicable, request-size limits, rate limiting, secret rotation, dependency and container scans, threat modelling, incident response, privacy notices, data export/deletion workflows, and independent security testing.

### 9. Accessibility and multilingual UX
The existing landing page is Persian-first and responsive, but there is no verified end-to-end accessibility or multilingual workflow. Add WCAG 2.2 AA-oriented keyboard, contrast, screen-reader, reduced-motion, scalable-text, voice-input/output, localization and RTL/LTR tests. Voice features must be optional and have clear consent and privacy controls.

## Required implementation order

1. Establish reproducible CI using the lockfile and deterministic dependency installation; make CI status a required merge gate.
2. Implement identity, session lifecycle, MFA and owner recovery behind disabled-by-default routes.
3. Implement tenant authorization and negative cross-tenant isolation tests.
4. Implement audit event taxonomy and privileged-action controls.
5. Implement independent encrypted backup and prove isolated restore.
6. Implement product integration gateway and service-to-service identity.
7. Implement licensing and billing in test mode, then reconcile provider events.
8. Complete accessibility, localization, performance and security testing.
9. Conduct independent review and UAT.
10. Only then consider production deployment and commercial activation.

## Release policy

The product must remain **NOT RELEASED / COMMERCE DISABLED** until every critical gate has evidence. Do not describe a roadmap, schema model, catalogue card, mock endpoint, or design document as an implemented operational capability.
