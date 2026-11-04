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

This repository is an evolving application foundation, not a production release. The current work establishes the VAYRO brand, responsive product directory and product boundaries. Authentication, authorization, tenant isolation, licensing, operational product integrations, billing, audit workflows, backup/restore proof, security review and UAT remain release gates.

## Stack

- Next.js App Router, React and TypeScript
- PostgreSQL and Prisma
- Zod input validation
- GitHub Actions CI
- Railway is the intended hosting target, subject to workspace resource availability

## Local development

1. Install Node.js 22 or later and PostgreSQL 16 or later.
2. Copy `.env.example` to `.env` and configure a private `DATABASE_URL`.
3. Run `npm install`.
4. Run `npm run db:generate`.
5. Run `npm run dev`.

## Commands

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run db:validate`

Never commit secrets, production credentials, signing keys, customer data or backups.
