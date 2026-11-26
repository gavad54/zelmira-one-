# وایرو | VAYRO

**INTELLIGENCE. WITHOUT LIMITS.**

VAYRO is the Persian-first, mobile-first mother application and platform for eleven independently governed specialist products. The application name shown to users is **VAYRO / وایرو** only.

## Approved product family

| Product | Domain |
|---|---|
| ARVAND | International trade, import and export |
| CHARSU | Marketplace and commerce network |
| GANJINEH | Digital stores and e-commerce |
| NEGAH | Creative studio and content production |
| SEPEHR | Cloud and digital infrastructure |
| NAMA | Website and landing-page builder |
| PAYAM | Marketing and customer growth |
| LEADORA | Distribution, sales, inventory and commercial operations |
| ARIANA | Accounting, finance and ERP |
| ARIA | Social, communications, services and listings — no accounting/ERP |
| ARMIN MARKET | Buyer requests, supplier quotations and sourcing |

**DANA is VAYRO's internal AI intelligence and orchestration capability, not a twelfth product.** Product data, authorization and release boundaries remain independent. ARIA must not contain accounting/ERP; ARIANA owns that domain.

## Engineering status — 2026-11-26

The main branch includes the VAYRO product-family/task-engine foundation, tenant-scoped conversation and archive metadata/API foundation, provider-neutral encrypted S3 backup/restore workflows, and an Android WebView wrapper.

The exact-head repository CI and CodeQL checks passed for the conversation/archive and backup integration commit. The Android Gradle debug build also passed on its isolated integration branch. These are source/CI checks, not production acceptance or security certification.

### Live infrastructure and release gates

- VAYRO-CORE is a dedicated Supabase PostgreSQL 17 project. Its live public schema is not reconciled with the current Prisma migration history: 11 public tables, no registered migration history, no public RLS policies and no dedicated VAYRO runtime roles were observed in the latest read-only audit. Do not run production migrations until an independent encrypted backup and isolated restore are verified.
- No independent VAYRO Railway project could be created because the connected Railway account reports that its trial has expired. Existing VAYRO-named services inside ARIA Web and LEADORA are not independent VAYRO hosting and must not be reused.
- Encrypted S3 backup and isolated restore workflows are committed, but provider selection, private bucket, GitHub Environment secrets/variables, successful backup and successful restore drill are not yet evidenced.
- Transactional email adapters and owner license management foundations exist. Production email delivery, a legally approved payment provider, payment webhooks/reconciliation/refunds and commercial activation are not production-proven.
- Android WebView source and compile CI exist. An installable APK requires the exact dedicated VAYRO HTTPS URL; real-device tests and owner-controlled release signing remain outstanding.
- Archive binary upload/download, object storage integration, export jobs, retention/legal hold, archive UI and complete DANA thread/stream orchestration remain incomplete.
- The eleven products are not all independently implemented, deployed and acceptance-tested. A catalogue or API contract is not a completed product.
- Owner UAT, incident/restore rehearsal, endpoint-by-endpoint authorization review, CSP/security review and explicit release approval remain required.

Customer onboarding, real payments, production data collection and public release must remain disabled until the relevant gates are independently evidenced.

## Stack

- Next.js App Router, React and TypeScript
- PostgreSQL 17 and Prisma
- Zod input validation
- GitHub Actions CI, CodeQL and isolated PostgreSQL integration tests
- Android WebView wrapper with Gradle / Java 17 / Android SDK 35
- Provider-neutral S3-compatible encrypted backup workflow

## Local development

1. Install Node.js 22 or later and PostgreSQL 17.
2. Copy `.env.example` to `.env` and configure a private development `DATABASE_URL`.
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
- `npm run db:migrate:deploy` — only after schema reconciliation, independent backup, verified restore and an approved migration plan.

Never commit secrets, production credentials, signing keys, customer data or backups.
