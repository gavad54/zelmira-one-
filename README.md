# وایرو | VAYRO

**INTELLIGENCE. WITHOUT LIMITS.**

VAYRO is a Persian-first, mobile-first platform for discovering and coordinating independent specialist digital products. The application name shown to users is **وایرو** only.

## Product family

| Product | Domain |
|---|---|
| ARVAND | International trade, import and export |
| CHARSU | Marketplace and commerce network |
| GANJINEH | Digital stores and e-commerce |
| NEGAH | Creative studio and content production |
| SEPEHR | Cloud and digital infrastructure |
| NAMA | Website and landing-page builder |
| PAYAM | Marketing and customer growth |
| DANA | AI intelligence and orchestration |

Independent products retain their own identity and deployment boundaries: LEADORA (distribution and sales operations), ARIANA (accounting and ERP), ARIA (social, services and marketplace; no accounting/ERP), and ARMIN MARKET (request and supplier quotation marketplace).

## Engineering status

This repository contains a working engineering foundation: public product directory, authentication routes and primitives, owner bootstrap, initial tenant authorization, PostgreSQL/Prisma schema, audit foundations, health/readiness checks and automated CI. These are not a production release or a security certification.

Production email, complete endpoint-level authorization coverage, full tenant-scoped product workflows, MFA, licensing/billing operations, independent backup/restore, dedicated hosting, mobile acceptance, owner UAT and explicit release approval remain open gates. Customer onboarding, real payments and production data collection must remain disabled until those gates are evidenced.

## Stack

- Next.js App Router, React and TypeScript
- PostgreSQL and Prisma
- Zod input validation
- GitHub Actions CI and CodeQL
- Railway is the intended hosting target; a separate VAYRO project and database are not yet provisioned.

## Local development

1. Install Node.js 22 or later and PostgreSQL 16 or later.
2. Copy `.env.example` to `.env` and configure a private `DATABASE_URL`.
3. Run `npm install`.
4. Run `npm run db:generate`.
5. Run `npm run dev`.

## Commands

- `npm test`
- `npm run test:integration`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run db:validate`

Never commit secrets, production credentials, signing keys, customer data or backups.
