# VAYRO Architecture — Verified Development Baseline

**Reviewed:** 2026-11-25  
**Repository:** `gavad54/zelmira-one-`  
**Reviewed branch:** `upgrade/full-independent-product-family-modules-2026-11-20`  
**Reviewed head:** `24dd343ee1221f13253e99207eb7de2de5d6934c`  
**PR:** #47 — OPEN / DRAFT / UNMERGED

## 1. Purpose and boundary

VAYRO is the parent platform and governance plane for independently operated specialist products. DANA is an internal orchestration capability, not a separate product. Product repositories, data ownership, identities, authorization, deployments, backups and release evidence remain independent.

Product invariants:
- ARIA does not contain accounting or ERP.
- ARIANA owns accounting, finance and ERP.
- LEADORA owns distribution and sales operations.
- ARMIN MARKET remains a separate marketplace product.
- ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA and PAYAM retain their approved product boundaries and must not be represented as production-ready without independent implementation and evidence.

## 2. Verified application foundation

The development branch contains:
- Next.js App Router, React, TypeScript, Node.js and Prisma.
- Password/session authentication, email verification and recovery flows.
- MFA enrollment/verification and recovery-code flows.
- Owner-only APIs protected by session assurance, same-origin checks, rate limits and audit events where implemented.
- Tenant membership authorization and tenant-scoped transaction/RLS helpers.
- Product catalog, entitlement and license lifecycle foundations.
- Owner Command Center, product directory and Future Development Lab.
- Health/readiness routes and GitHub Actions CI / CodeQL.

These are source-level capabilities. Their presence does not certify complete endpoint coverage, live email delivery, tenant isolation against the live database, payment operations or production readiness.

## 3. Engineering task control plane — source implementation

The branch contains:
- A durable PostgreSQL task schema with task attempts and dependency edges.
- Owner-only task creation/approval and goal-to-task planning APIs.
- Bounded task definitions, handler allowlists, idempotency keys, priority, one-time `scheduledAt`, deadline and dependency validation.
- Worker-only database role checks and SECURITY DEFINER function boundaries for claim, heartbeat, completion and failure.
- A long-running worker process requiring the dedicated `TASK_WORKER_DATABASE_URL`.
- Lease ownership/token/expiry, bounded handler timeout and result size, retry/backoff, dead-letter state and graceful shutdown.
- Three registered handlers: `report.generate`, `repo.audit` and `repo.test`. Repository and CI handlers are read-only; arbitrary shell/code execution, deployment, merge and financial actions are not registered.

## 4. Architecture gaps — explicitly not complete

The following are genuine remaining engineering gaps, not owner tasks:
1. **First-class durable goal hierarchy:** Goal/Epic/Feature records and lifecycle are not yet modeled as dedicated persistent entities. The current planner validates a goal and materializes task records; goal metadata is retained in task payload/audit metadata rather than a complete goal aggregate.
2. **Recurring scheduler:** one-time due-time scheduling exists; a durable recurring schedule registry, recurrence materializer, missed-run policy and schedule lifecycle do not.
3. **Agent/reviewer orchestration:** there is no complete agent registry, specialist execution lifecycle, independent reviewer orchestration or conflict-resolution workflow.
4. **Controller/reconciliation loop:** the full observe-plan-dispatch-verify-reconcile-next-task controller is not yet demonstrated as a continuously running, restart-independent service.
5. **Process-level recovery evidence:** isolated SQL verifies expired-lease reclamation and stale-token fencing. It does not prove a deployed worker can be terminated, restarted and continue a real workflow end-to-end.
6. **Operational execution:** no dedicated VAYRO Railway project/worker service with verified runtime credentials and health has been proven. Live VAYRO-CORE migration reconciliation, role/policy provisioning and a successful encrypted off-site backup plus isolated restore remain gated.
7. **Product integration contracts:** the product-family directory and boundaries exist, but planned products do not yet have independently verified runtime APIs, contract tests and end-to-end evidence.

## 5. Database and deployment safety

The development branch includes Prisma migrations and disposable-PostgreSQL CI tests. The live VAYRO-CORE database has not been reconciled with the branch migration history. Do not apply migrations, DDL, role grants or RLS policy changes to the live database until schema/object reconciliation, encrypted external backup, isolated restore and an approved recovery procedure are evidenced.

Do not infer a production deployment from a successful CI run or a Railway deployment record. A production claim requires the exact deployed commit, healthy runtime, verified database connectivity and passing readiness checks.

## 6. Exact-head verification

At the reviewed head `24dd343ee1221f13253e99207eb7de2de5d6934c`, the associated GitHub Actions runs completed successfully:
- VAYRO CI: run `45593868836` — SUCCESS.
- CodeQL: run `45593868798` — SUCCESS.
- npm lockfile validation: run `45593868846` — SUCCESS.

These results verify the repository's configured CI scope on this exact SHA. They do not certify production infrastructure or the operational autonomy acceptance test.

## 7. Release classification

**Development foundation: implemented with passing exact-head CI.**  
**Autonomous production operation: NOT READY.**  
**Commercial release: BLOCKED.**

PR #47 remains Draft/Open/Unmerged. No production migration, merge, deployment, billing activation or live-data mutation is authorized by this document.

## 8. Required implementation order

1. Add first-class Goal/Epic/Feature persistence, lifecycle transitions, ownership and audit semantics.
2. Add recurring schedule persistence and a bounded, idempotent schedule materializer.
3. Add typed agent registry, least-privilege execution contracts and independent review orchestration.
4. Add a durable controller/reconciler that resumes from database state after process restart.
5. Add process-level worker restart and multi-task continuation E2E tests in disposable infrastructure.
6. Provision and verify a dedicated non-production worker runtime and isolated database credentials before any production request.
7. Complete live DB baseline/reconciliation only after backup and restore gates pass.
8. Complete independent product API contracts and E2E evidence without merging product data or release boundaries.

All implementation remains additive and branch-scoped. Live production changes, secret/access changes, paid infrastructure, merge and public release remain approval-gated.
