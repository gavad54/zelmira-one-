# وایرو | VAYRO

**INTELLIGENCE. WITHOUT LIMITS.**

VAYRO is the mother ecosystem and top-level ownership/governance layer. The public application name is **VAYRO / وایرو** only.

## Command structure

- **VAYRO** — owns ecosystem governance, portfolio policy, security baseline, identity governance and release approval.
- **DANA** — VAYRO's central command and orchestration center. It coordinates authorized operations and AI workflows; it is not a fifth customer-facing application and cannot bypass product permissions.
- **Four independent flagship applications under DANA command:**
  - **ARIA** — general-purpose AI, social, communications, services and listings. No accounting/ERP.
  - **ARIANA** — accounting, finance and ERP; sole system of record for these domains.
  - **LEADORA** — distribution, sales, inventory and commercial operations; not the accounting/ERP system of record.
  - **ARMIN MARKET** — buyer requests, supplier quotations and sourcing.
- **Other VAYRO portfolio initiatives:** ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA and PAYAM. Their deployment and product packaging remain subject to individual audits.

ARIA is **not** the parent or shared runtime of ARIANA, LEADORA or ARMIN MARKET. Each flagship application retains its own source, user experience, domain logic, data ownership, authorization, runtime, deployment and release cycle. Cross-app coordination uses versioned APIs/events and scoped service identities; applications must not directly access one another's private database tables.

The binding decision and implementation rules are in [ADR-0002 — Four independent applications under DANA command](docs/architecture/ADR-0002-four-independent-apps-under-dana.md) and [Product boundaries](docs/PRODUCT-BOUNDARIES.md).

## Engineering status

This repository contains a VAYRO engineering foundation: public product directory, authentication routes and primitives, owner bootstrap, initial tenant authorization, PostgreSQL/Prisma schema, audit foundations, health/readiness checks and automated CI. These are not a production release or a security certification.

A dedicated VAYRO-CORE PostgreSQL 17 project is provisioned on Supabase Free in eu-central-1, separate from ARIA. Its 11 initial tables have RLS enabled and client-role access revoked. The schema was provisioned directly; the Prisma migration baseline is not yet registered, and migration forward/rollback testing remains open. Read-only production inspection has found schema/RLS reconciliation blockers. Do not apply production migrations or grants until independent encrypted backup, successful isolated restore, reviewed reconciliation and explicit approval are complete.

Production email, complete endpoint-level authorization coverage, privileged MFA, full tenant-scoped product workflows, licensing/billing, independent backup/restore, dedicated VAYRO hosting, mobile acceptance, owner UAT and explicit release approval remain open gates. Customer onboarding, real payments and production data collection must remain disabled until evidence supports release.

## Stack

- Next.js App Router, React and TypeScript
- PostgreSQL 17 (dedicated Supabase Free project) and Prisma
- Zod input validation
- GitHub Actions CI and CodeQL
- Independent VAYRO application hosting remains unresolved; do not repurpose ARIA or LEADORA infrastructure.

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
