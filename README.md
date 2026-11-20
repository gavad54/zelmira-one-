# وایرو | VAYRO

**INTELLIGENCE. WITHOUT LIMITS.**

VAYRO is the mother application and governance platform. The application name shown to users is **وایرو | VAYRO** only.

## Six independent applications

| Product | Domain |
|---|---|
| ARIA | AI, communications, social/services and digital work; no accounting or ERP |
| ARIANA | Accounting, finance, ledger and ERP |
| LEADORA | Distribution, sales, inventory, commercial operations and growth |
| ARMIN MARKET | Marketplace, buyer requests, supplier quotations and market intelligence |
| DANA | Independent command-center and authorized orchestration application |
| ARVAND | International trade, import, export and trade operations |

## ARIA internal domains

GANJINEH (digital storefront/catalogue), NEGAH (creative studio), SEPEHR (cloud/resource tools) and NAMA (website/page builder) are internal ARIA domains, not additional independent VAYRO applications.

CHARSU is consolidated into ARMIN MARKET. PAYAM is consolidated into LEADORA. Their historical records and capabilities must be preserved in the archive/crosswalk; they are not current standalone products.

## Engineering status

This repository contains an engineering foundation: Persian-first public shell, authentication routes and primitives, owner bootstrap, initial tenant authorization, PostgreSQL/Prisma schema, audit foundations, health/readiness checks and automated CI. These are not a production release or a security certification.

The dedicated VAYRO-CORE PostgreSQL 17 project is provisioned on Supabase in eu-central-1 and remains separate from ARIA. Live schema reconciliation, RLS policies, runtime roles and migration baseline are incomplete. No production database mutation is authorized until a verified external backup and isolated restore drill exist.

No dedicated, live VAYRO Railway project/service is verified. Current Railway services named VAYRO are offline and are not an approved substitute for independent VAYRO hosting. Production email, complete endpoint authorization, privileged MFA, licensing/billing, product integrations, encrypted backup/restore, Android release, device acceptance, UAT and explicit owner release approval remain open gates.

Customer onboarding, real payments and production data collection must remain disabled until the relevant release gates are evidenced.

## Stack

- Next.js App Router, React and TypeScript
- PostgreSQL 17 and Prisma
- Zod input validation
- GitHub Actions CI and CodeQL
- Application hosting: independent VAYRO deployment not yet verified

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
- `npm run db:migrate:deploy` — only after the live schema baseline, backup and restore are independently verified.

Never commit secrets, production credentials, signing keys, customer data or backups.
