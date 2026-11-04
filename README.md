# VAYRO ONE

**VAYRO SIGNATURE** — Intelligence. Without limits.  
**وایرو — هوشمندی، بدون مرز**

VAYRO ONE is the Persian-first, mobile-first central platform for discovering, accessing and governing a family of independent specialist products.

## Engineering status

This repository contains an initial executable platform foundation and product-family presentation. It is **not a production release**. Production deployment remains blocked until database provisioning, authentication hardening, tenant-isolation tests, backup/restore proof, security review and user acceptance testing are complete.

## Product family

| Product | Domain |
|---|---|
| ARVAND | International trade, export and import |
| CHARSU | Marketplace and buyer/seller discovery |
| GANJINEH | Digital storefronts and e-commerce |
| NEGAH | Creative studio and digital production |
| SEPEHR | Cloud and digital infrastructure |
| NAMA | Website and landing-page builder |
| PAYAM | Marketing, customer acquisition and compliant referral programs |
| DANA | AI intelligence and workflow orchestration |

Existing independent products retain their names and boundaries:
- **LEADORA** — distribution, sales, inventory and commercial operations.
- **ARIANA** — accounting, finance and ERP.
- **ARIA** — social, services and marketplace; it must not contain accounting or ERP functionality.
- **ARMIN MARKET** — buyer requests and supplier quotations.

The product directory is a catalog, not a claim that every listed product is already implemented or commercially available. Each specialist product requires its own delivery gates, security review, licensing definition and operational evidence.

## Architecture principles

- VAYRO ONE provides central identity, product discovery, governance and access orchestration.
- Specialist products remain independently deployable and separately licensable.
- Product data stores are not merged by default. Integrations require versioned APIs, scoped authorization and audit records.
- Customer control covers their tenant data, users, permissions, settings and exports. It does not imply transfer of software intellectual property unless a separate written agreement provides for it.
- Referral rewards, where offered, must be based on verified completed sales rather than recruitment or entry fees.
- Marketplace legal responsibilities depend on contracts and applicable law; do not claim blanket zero liability.

## Stack

- Next.js App Router + React + TypeScript
- PostgreSQL + Prisma
- Zod for input validation
- GitHub Actions for CI
- Railway deployment target (provisioning previously blocked by workspace resource limits; recheck before deployment)

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

## Security baseline

Never commit secrets, production credentials, signing keys, customer data or database backups. Production secrets belong in the hosting provider's protected secret store. Do not expose internal health details publicly.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/BRAND-ARCHITECTURE.md](docs/BRAND-ARCHITECTURE.md), [docs/PRODUCT-BOUNDARIES.md](docs/PRODUCT-BOUNDARIES.md), [docs/VAYRO-BRAND-SYSTEM.md](docs/VAYRO-BRAND-SYSTEM.md) and [docs/RELEASE-GATES.md](docs/RELEASE-GATES.md).
