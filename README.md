# وایرو | VAYRO

**INTELLIGENCE. WITHOUT LIMITS.**

VAYRO is a Persian-first, mobile-first mother platform for a family of independently governed digital products. The application name shown to users is **وایرو** only.

## Direct product family

VAYRO has six independent direct products:

| Product | Domain |
|---|---|
| ARIA | General AI assistant, digital workspace, communications and services |
| ARIANA | Accounting, finance and ERP |
| LEADORA | Business operations, distribution, sales, lead management and marketing/growth |
| ARMIN MARKET | Marketplace, storefront, buyer requests, supplier quotations and market intelligence |
| DANA | Independent AI intelligence product |
| ARVAND | International trade, import/export and trade operations |

The following four areas remain internal domains of ARIA, not separately counted VAYRO products: **GANJINEH** (store/catalog), **NEGAH** (creative studio), **SEPEHR** (cloud, storage and infrastructure), and **NAMA** (website/page builder).

Product ownership is explicit: ARIA does not contain accounting, ledger or ERP; those belong only to ARIANA. Market intelligence belongs to ARMIN MARKET. Marketing and growth operations belong to LEADORA. International trade belongs to ARVAND. Historical identifiers remain traceable in private migration records; historical names are not public product names.

## Engineering status

This repository contains an engineering foundation: public product directory, authentication routes and primitives, owner bootstrap, initial tenant authorization, PostgreSQL/Prisma schema, audit foundations, health/readiness checks and automated CI. These are not a production release or a security certification.

A dedicated VAYRO-CORE PostgreSQL 17 project is provisioned on Supabase Free in eu-central-1, separate from ARIA. Its 11 initial tables have RLS enabled and client-role access revoked. The schema was provisioned directly and verified; the Prisma migration baseline is not yet registered, and migration forward/rollback testing remains open.

Production email, complete endpoint-level authorization coverage, full tenant-scoped product workflows, MFA, licensing/billing operations, independent backup/restore, dedicated application hosting, mobile acceptance, owner UAT and explicit release approval remain open gates. Customer onboarding, real payments and production data collection must remain disabled until those gates are evidenced.

## Stack

- Next.js App Router, React and TypeScript
- PostgreSQL 17 (dedicated Supabase Free project) and Prisma
- Zod input validation
- GitHub Actions CI and CodeQL
- Application hosting remains unresolved; Railway free-plan resource limit prevented provisioning. No VAYRO deployment exists.

## Local development

1. Install Node.js 22 or later and PostgreSQL 16 or later.
2. Copy `.env.example` to `.env` and configure a private `DATABASE_URL` for the dedicated VAYRO database.
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
- `npm run db:migrate:deploy` (only after the existing database baseline is reconciled and verified)

Never commit secrets, production credentials, signing keys, customer data or backups.
