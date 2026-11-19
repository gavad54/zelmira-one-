# وایرو | VAYRO

**INTELLIGENCE. WITHOUT LIMITS.**

VAYRO is the mother application and owner/governance layer of the ecosystem. The public mother-app name is **VAYRO / وایرو**.

## Product hierarchy

Exactly five independent applications are direct sub-products of VAYRO:

- **DANA** — independent ecosystem command-center application. It coordinates authorized work across products but is not their parent and cannot bypass their permissions.
- **ARIA** — independent general-purpose AI, communication, content, services and digital-workspace application. It consolidates the audited capabilities of the remaining legacy apps. It does not contain accounting/ERP.
- **ARIANA** — independent accounting, finance and ERP application; sole system of record for those domains.
- **LEADORA** — independent distribution, sales, inventory and commercial-operations application; not the accounting/ERP system of record.
- **ARMIN MARKET** — independent buyer/supplier marketplace application.

All five are direct children of VAYRO. DANA is not a parent of the other applications. ARIA is not a parent or shared runtime for ARIANA, LEADORA or ARMIN MARKET.

## ARIA legacy consolidation

The currently known legacy initiatives to audit as ARIA modules are **ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA and PAYAM**, plus the existing ARIA capabilities. The 2026-11-18 execution matrix names eleven historical products: the seven ARIA consolidation targets plus ARIA, ARIANA, LEADORA and ARMIN MARKET. DANA was then recorded as an internal VAYRO engine; the current owner decision makes it the fifth independent app. Source completeness for all seven consolidation targets is still not proven.

- [ARIA functional redesign and delivery gates](https://github.com/gavad54/aria-android/blob/engineering/aria-functional-redesign-2026-11-19/docs/ARIA_FUNCTIONAL_REDESIGN_2026-11-19_FA.md)
- [ARIA legacy source and capability inventory](https://github.com/gavad54/aria-android/blob/engineering/aria-functional-redesign-2026-11-19/docs/ARIA_LEGACY_CAPABILITY_INVENTORY_2026-11-19_FA.md)
- [ARIA 32 source repair report](https://github.com/gavad54/aria-android/blob/engineering/aria-functional-redesign-2026-11-19/docs/ARIA_32_SOURCE_REPAIR_REPORT_FA.md)

Every legacy capability must be mapped to a source, owner, target module, API/data contract, test and disposition. No capability or data may be silently deleted or migrated. Any data movement requires source-to-target mapping, independent backup, dry run, integrity checks and rollback/forward-repair plan.

## Integration and independence

Each application retains its own source, domain logic, data ownership, authorization, runtime, secrets, backup and release cycle. Cross-app coordination uses versioned APIs/events, authenticated least-privilege service identities, schema validation, idempotency, correlation IDs and audit logs. No application may directly query or mutate another application's private database tables. Core workflows must remain available if DANA is unavailable.

## Engineering status

This repository contains a VAYRO engineering foundation: product directory, authentication routes and primitives, owner bootstrap, initial tenant authorization, PostgreSQL/Prisma schema, audit foundations, health/readiness checks and automated CI. These are not a production release or a security certification.

A dedicated VAYRO-CORE PostgreSQL 17 project is provisioned on Supabase Free in eu-central-1, separate from ARIA. Its 11 initial tables have RLS enabled; however, production inspection found schema/RLS reconciliation blockers, no registered Prisma migration baseline, and no verified tenant isolation. Do not apply production migrations or grants until independent encrypted backup, successful isolated restore, reviewed reconciliation and explicit approval are complete.

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
