# VAYRO production blocker audit — 2026-11-09

## Scope and safety boundary

This is a read-only production infrastructure audit plus repository evidence review. It does not authorize or perform production DDL, role creation, grants, RLS policy changes, secrets, backup jobs, restore operations, deployment, DNS, merge, signing, payment activation or release.

- Repository: `gavad54/zelmira-one-`
- Security workstream: `security/mfa-session-endpoint-gates`
- Audited source commit: `16281e749e2ed2572be3d26aafd8fd241ae53a95`
- PR #2: open, Draft, unmerged; head `c52f199e832b7808136313664895da0896523aab`.
- PR #6: open, Draft, unmerged; head `16281e749e2ed2572be3d26aafd8fd241ae53a95`.

## Exact-head repository checks

At `16281e749e2ed2572be3d26aafd8fd241ae53a95`:

- VAYRO CI `validate`: completed, success.
- CodeQL JavaScript/TypeScript analysis: completed, success.
- Additional PR/push check entries for CI and CodeQL: completed, success.
- CI includes locked dependency installation and audit, unit tests, Prisma generation/validation, isolated PostgreSQL migration apply, auth/platform/tenant role-boundary SQL tests, lint, typecheck, production build, and PostgreSQL/HTTP integration tests.
- A successful CodeQL run proves scan execution, not zero open alert records.
- These checks prove repository behavior in disposable CI only; they do not prove production configuration or runtime safety.

## Fresh VAYRO-CORE read-only findings

Supabase project `wdqhdnhpgxhmmfeyxwxr` (`VAYRO-CORE`) is `ACTIVE_HEALTHY`, PostgreSQL 17.11, region `eu-central-1`.

Observed production catalog:

- 11 public base tables; all 11 have RLS enabled.
- 0 public RLS policies.
- 0 tables with FORCE ROW LEVEL SECURITY.
- No `vayro_*` runtime roles exist.
- No `public._prisma_migrations` table exists and Supabase migration history is empty.
- The 11 observed tables are empty at audit time.
- Existing public tables are an older/partial schema: for example the live Session table does not expose the MFA/session-lifecycle columns required by the current branch's Prisma model.
- Security advisor reports 11 `rls_enabled_no_policy` findings (INFO); health advisor reports no lints.
- The `postgres` role is BYPASSRLS; Supabase `service_role` is BYPASSRLS. Neither is an acceptable general application runtime identity.

**Decision:** production database schema, migration baseline, runtime identities and tenant isolation are BLOCKED. RLS enabled without policies and FORCE RLS is not tenant isolation. An empty database or empty tables do not prove the schema is disposable or safe to replace.

## Hosting and operations

A fresh Railway project listing exposes only `ARIA Web` and `LEADORA`; no dedicated VAYRO Railway project is present. No VAYRO hosting, domain, runtime secret or deployment change was made.

No independent encrypted backup and isolated restore evidence, checksum, measured RPO/RTO, or forward/rollback rehearsal is available.

## Web and product-delivery status

Repository implementation present on the audited branch:

- Persian-first VAYRO public product directory for eight planned specialist products and independent ARIA, ARIANA and LEADORA boundaries.
- AI Business Suite capability registry and catalogue page. Registry entries are explicitly PLANNED; catalogue display is not service availability.
- DANA prompt studio currently builds a structured prompt template; it does not call an AI provider or persist generated output.
- NEGAH creative brief currently builds a structured brief; it does not render an image or persist an asset.
- DANA text and NEGAH image API routes call an OpenAI-compatible provider adapter when configured. Provider credentials/models are not evidenced in production.
- AI generation responses explicitly report billing `NOT_CONNECTED` and `persisted: false`; durable history, usage ledger, quota enforcement, payment, and commercial entitlements are not complete.
- The homepage links to the DANA prompt studio and NEGAH creative brief; ARMIN MARKET is not listed as one of the VAYRO independent products.

The above is code-presence evidence only. It is not evidence of a live provider, working commercial workflow, or customer-ready product.

## Remaining blockers and required closure evidence

| Blocker | Required closure evidence | Current decision |
|---|---|---|
| Production schema and migration baseline | Independent backup; isolated restore; catalog/schema comparison against Prisma and full migration chain; forward and recovery rehearsal; explicit reviewed migration plan | BLOCKED |
| Auth/platform/tenant DB roles | Dedicated non-owner LOGIN identities, correct role memberships, grants and policies; same-connection role assertions; negative tests on a restored clone | BLOCKED |
| Tenant RLS | Policies and FORCE RLS for every tenant-owned table and all read/write/export/delete paths; cross-tenant negative tests on restored clone | BLOCKED |
| Backup and disaster recovery | Encrypted off-provider backup, isolated restore, checksum, measured RPO/RTO, documented retention and access controls | BLOCKED |
| Dedicated VAYRO hosting | Dedicated project/service, protected secrets, health/readiness, TLS, logs, monitoring and production commit parity | BLOCKED |
| Email delivery | Verified provider/domain or approved provider setup; delivery, bounce, retry and abuse tests | BLOCKED |
| AI provider and cost controls | Real provider configuration in controlled environment; request limits, per-tenant/user usage ledger, cost ceilings, queue/retry behavior, private output storage and retention | BLOCKED |
| Commercial billing | Product entitlements, append-only usage/financial ledger, sandbox payment lifecycle, idempotent webhooks, refunds and reconciliation | BLOCKED |
| Product MVPs | Working UI/API/persistent data/authorization/negative tests/telemetry and acceptance evidence per product | BLOCKED |
| Mobile release and UAT | Signed release artifact, device install/run proof, accessibility/RTL checks, owner and representative-user UAT | BLOCKED |
| Security/legal release review | Independent security review, production headers/CSP verification, privacy/terms/data-retention review and unresolved-risk acceptance | BLOCKED |

## Safe next execution sequence

1. Obtain an independently restorable backup and restore it into an isolated project. Do not change production schema or roles before this.
2. Compare the restored catalog with the exact Prisma schema and every committed migration; resolve drift and foreign-key/data implications.
3. Rehearse the complete migration sequence and recovery plan on the restored clone; verify all runtime role assertions and negative authorization tests.
4. Complete code-level auth/platform/tenant data-path review and product route/model inventory.
5. Create a dedicated VAYRO hosting environment and configure secrets only after a deployment plan and owner-approved access path exist.
6. Implement real AI metering/storage and the commercial billing foundation before enabling paid provider usage.
7. Run product-specific end-to-end, mobile, UAT, security and operational acceptance gates.
8. Only after all gates pass, request explicit authorization for each production migration, deployment, merge and release action.

## Release decision

`DEPLOYMENT BLOCKED — NOT RELEASED`.

No production writes, migration, role or policy changes, backup/restore operation, deployment, DNS change, secret update, PR merge, signing, payment activation or public release was performed during this audit.
