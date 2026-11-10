# VAYRO project state

Last verified: 2026-11-10 UTC
Repository: gavad54/zelmira-one-
Working branch: infra/backup-restore-b2
Current workstream: encrypted offsite PostgreSQL backup and isolated restore
Current PR: #12 (open, draft, unmerged)
Current PR head: dbbaf89d1d56b8faacead90bbfb87cf01f6341e3

## Product and architecture baseline
- VAYRO is the mother application and governance/product directory.
- Product family: ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM and DANA.
- Independent products remain separate: LEADORA, ARIANA (accounting/ERP), ARIA (no accounting/ERP), and ARMIN MARKET.
- VAYRO-CORE is the separate Supabase PostgreSQL project; never reuse ARIA or LEADORA data stores.
- Existing app stack is Next.js App Router, React, TypeScript, Prisma and PostgreSQL.

## Verified repository evidence
- Exact PR #12 head dbbaf89d1d56b8faacead90bbfb87cf01f6341e3: VAYRO CI run 42767999257 completed successfully.
- Exact PR #12 head: CodeQL run 42767999555 completed successfully.
- CI passed unit tests, dependency audit, Prisma generation/schema validation, isolated PostgreSQL migration and role/tenant isolation checks, lint, typecheck, production build, Docker image build and PostgreSQL/HTTP integration tests.
- CodeQL success means the scan ran; it is not a claim that all alert records are closed.
- Backup and restore workflows are scaffolding only; no real backup or restore has run.

## Live infrastructure constraints
- VAYRO-CORE last read-only inspected state: 11 public tables with RLS enabled, zero policies, zero FORCE RLS, no Prisma migration baseline, and schema drift against repository models. Do not mutate production until independent backup/restore and schema reconciliation.
- Railway VAYRO service was observed online under the legacy project name ARIA Web; no dedicated VAYRO Railway project exists. A new project was blocked by the free-plan resource limit.
- No verified production deployment, operational email, billing, Android release artifact, UAT or public release.

## Release decision
ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.

Do not claim completion until all applicable release gates have current evidence. Do not apply production migrations, merge/deploy, enable customer onboarding or payments, or publish a release without the required technical evidence and owner authorization.
