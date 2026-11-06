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
