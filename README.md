# وایرو | VAYRO

**INTELLIGENCE. WITHOUT LIMITS.**

VAYRO is the central command and governance platform for a portfolio of independently operated applications. The application name shown to users is **وایرو** only.

## VAYRO control plane

VAYRO provides the central product directory, owner command center, portfolio visibility, identity and optional federation, entitlement governance, subscription/revenue visibility, integration approvals, AI/automation orchestration, infrastructure health, release governance and audit oversight.

VAYRO is not a shared runtime or operational database for the portfolio. An outage or release of one product must not stop another product. Each application remains independently usable, deployable, supportable and saleable.

## Independent applications

| Application | Domain |
|---|---|
| ARVAND | International trade, import and export |
| CHARSU | Marketplace and commerce network |
| GANJINEH | Digital stores and e-commerce |
| NEGAH | Creative studio and content production |
| SEPEHR | Cloud and digital infrastructure |
| NAMA | Website and landing-page builder |
| PAYAM | Marketing and customer growth |
| LEADORA | Distribution and sales operations |
| ARIANA | Accounting, finance and ERP |
| ARIA | Social, services and marketplace; no accounting/ERP |
| ARMIN MARKET | Buyer requests and supplier quotations |

DANA is a shared VAYRO AI/orchestration capability, not a separately catalogued application.

Every application must own its codebase and release lifecycle, runtime/deployment, operational database, product identity, local authentication and authorization, versioned API contracts, backup/restore, support model and commercial terms. Optional VAYRO SSO and central entitlement checks must not create a runtime dependency. Product-to-product data exchange is permitted only through approved, versioned, least-privilege APIs with service identity, audit and revocation.

## Engineering status

This repository contains the VAYRO control-plane foundation and product governance registry. The product registry is metadata only; it does not mean the eleven applications are implemented, hosted, backed up or production-ready. The architecture and release gates are documented separately.

The dedicated VAYRO-CORE PostgreSQL 17 project is separate from ARIA. A previous live catalog audit found 11 initial tables, RLS enabled but no policies and no FORCE RLS tables; the schema migration baseline remains unregistered. Do not treat RLS enabled as proof of tenant isolation. No production schema mutation is authorized until backup/restore and reconciliation gates pass.

Production email, complete endpoint authorization, tenant isolation, privileged-user MFA/session controls, licensing/billing operations, independent backup/restore, dedicated application hosting, mobile acceptance, owner UAT and explicit release approval remain open gates. Customer onboarding, live payments and production data collection must remain disabled until those gates are evidenced.

## Stack

- Next.js App Router, React and TypeScript
- PostgreSQL 17 (dedicated Supabase project) and Prisma
- Zod input validation
- GitHub Actions CI and CodeQL
- Application hosting remains unresolved; no verified VAYRO production deployment exists.

## Local development

1. Install Node.js 22 or later and PostgreSQL 16 or later.
2. Copy `.env.example` to `.env` and configure a private `DATABASE_URL`.
3. Run `npm ci`.
4. Run `npm run db:generate`.
5. Run `npm run dev`.

## Commands

- `npm test`
- `npm run test:integration`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run db:validate`
- `npm run db:migrate:deploy` only after the existing database baseline is reconciled and verified

Never commit secrets, production credentials, signing keys, customer data or backups. See [docs/INDEPENDENT-PRODUCT-ARCHITECTURE.md](docs/INDEPENDENT-PRODUCT-ARCHITECTURE.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/PRODUCT-BOUNDARIES.md](docs/PRODUCT-BOUNDARIES.md) and [docs/RELEASE-GATES.md](docs/RELEASE-GATES.md) and [docs/PRODUCT-REPOSITORY-INVENTORY.md](docs/PRODUCT-REPOSITORY-INVENTORY.md).
