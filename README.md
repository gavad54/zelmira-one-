# ZELMIRA ONE

**ZELMIRA SIGNATURE** — Intelligence. Without limits.

A Persian-first, mobile-first platform shell for the ZELMIRA product ecosystem. This repository is independent from LEADORA, ARIANA, ARIA and all other product repositories.

## Engineering status

This is the initial executable foundation, not a production release. Production deployment remains blocked until database provisioning, authentication hardening, tenant-isolation tests, backup/restore proof, security review and UAT are complete.

## Stack

- Next.js App Router + React + TypeScript
- PostgreSQL + Prisma
- Zod for input validation
- GitHub Actions for CI
- Railway deployment target (provisioning currently blocked by workspace resource limits)

## Local development

1. Install Node.js 22 or later and PostgreSQL 16 or later.
2. Copy `.env.example` to `.env` and set a private `DATABASE_URL`.
3. Run `npm install`.
4. Run `npm run db:generate`.
5. Run `npm run dev` and open http://localhost:3000.

## Commands

- `npm run dev` — local development
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check
- `npm run build` — production build
- `npm run db:generate` — Prisma client generation
- `npm run db:validate` — Prisma schema validation

## Product boundaries

- ZELMIRA ONE is the central access, governance and orchestration experience.
- LEADORA remains the distribution and sales operations product.
- ARIANA remains the accounting and ERP product.
- ARIA is a social, services and marketplace product and must not contain accounting/ERP functionality.
- Product data stores are not merged by default. Integrations require versioned APIs, scoped authorization and audit records.

## Security baseline

Never commit secrets, production credentials, signing keys, customer data or database backups. Production secrets belong in the hosting provider's protected secret store. Do not expose internal health details publicly.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/RELEASE-GATES.md](docs/RELEASE-GATES.md) and [docs/PRODUCT-BOUNDARIES.md](docs/PRODUCT-BOUNDARIES.md).
