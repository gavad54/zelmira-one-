# Architecture — VAYRO ONE

## Purpose

VAYRO ONE is the platform shell and governance plane for the VAYRO ecosystem. It provides identity, tenant membership, product discovery, licensing, auditability and later controlled AI orchestration.

## Initial deployment topology

- Next.js web application and server-side API routes.
- PostgreSQL as the platform control-plane database.
- Prisma as the typed persistence layer.
- GitHub Actions for reproducible validation.
- Railway is the intended hosting target, subject to account resource availability.

## Trust boundaries

1. Browser clients are untrusted. Authorization must be enforced on the server for every protected operation.
2. Tenant-scoped queries must derive tenant membership from the authenticated session, never trust a tenant ID supplied by the browser alone.
3. Platform-owner actions require a distinct server-verified platform role and audit record.
4. Product integrations use versioned APIs, narrow scopes, explicit timeouts and auditable service identities.
5. Secrets are stored only in protected runtime/CI secret stores.

## Product separation

- LEADORA: distribution, sales, inventory and commercial operations.
- ARIANA: accounting, finance and ERP.
- ARIA: social, services and marketplace; no accounting or ERP.
- ARMIN MARKET: request/quotation marketplace.

Do not merge product databases. Integrate through APIs after contract, authorization, data mapping and failure-mode review.

## Reliability

- Health checks must not disclose secrets or internal infrastructure details.
- Database migrations are reviewed and applied explicitly.
- Backups must be stored outside the primary hosting volume and restored in an isolated environment before production release.
- External integrations must fail closed for privileged actions and must not silently grant access.

## Current implementation boundary

The repository currently contains the initial web shell, health endpoint and Prisma core schema. Authentication, authorization middleware, migrations, tenant-aware APIs, integrations and production operations remain implementation gates, not completed features.
