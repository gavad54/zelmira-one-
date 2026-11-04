# Architecture — VAYRO

## Purpose
VAYRO is the platform shell and governance plane for a family of independent specialist products. It provides product discovery and is intended to provide identity, tenant membership, licensing, auditability and controlled AI orchestration as those capabilities are implemented and verified.

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

Do not merge product databases. Integrate through APIs after contract, authorization, data mapping and failure-mode review.

## Reliability
- Health checks must not disclose secrets or internal infrastructure details.
- Database migrations are reviewed and applied explicitly.
- Backups must be stored outside the primary hosting volume and restored in an isolated environment before production release.
- External integrations must fail closed for privileged actions and must not silently grant access.

## Current implementation boundary
The repository currently contains the initial web shell, health endpoint and Prisma core schema. Authentication, authorization middleware, migrations, tenant-aware APIs, integrations and production operations remain implementation gates, not completed features.
