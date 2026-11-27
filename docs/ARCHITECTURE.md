# VAYRO Architecture — Verified Development Baseline

**Reviewed:** 2026-11-26  
**Repository:** `gavad54/zelmira-one-`  
**Reviewed branch:** `upgrade/full-independent-product-family-modules-2026-11-20`  
**Reviewed head:** `c1dc326d7dd483cafb67b5fc769ca90ee6e8a485`  
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
1. **Goal hierarchy:** persistent Goal/Epic/Feature records, owner-only multi-Epic planning, feature-to-task links and status reconciliation are now implemented on the development branch. Complex cross-goal portfolio planning, goal version diffing and automated goal decomposition remain incomplete.
2. **Recurring scheduler:** durable UTC fixed-interval schedules, owner pause/resume, idempotent occurrence materialization and a dedicated least-privilege scheduler process are implemented in source. Calendar-month and local-time/DST recurrence remain unsupported.
3. **Agent/reviewer orchestration:** a persistent allowlisted registry, project-scoped handler resolution and a separate deterministic evidence reviewer are implemented. These are bounded deterministic adapters, not autonomous generative AI agents or a human-equivalent independent code review.
4. **Controller/reconciliation loop:** the scheduler continuously materializes due recurring work and reconciles Goal/Epic/Feature projections from authoritative task states. Autonomous goal discovery, autonomous creation of unbounded work and a fully verified restart-independent controller remain out of scope.
5. **Process-level recovery evidence:** isolated SQL verifies expired-lease reclamation and stale-token fencing. It does not prove a deployed worker and scheduler can be terminated, restarted and continue a real workflow end-to-end.
6. **Operational execution:** dedicated worker and scheduler source/runtime commands exist, but Railway services, verified runtime credentials, health and monitoring have not been proven. Live VAYRO-CORE migration reconciliation, role provisioning and encrypted off-site backup plus isolated restore remain gated.
7. **Product integration contracts:** the product-family directory and boundaries exist, but planned products do not yet have independently verified runtime APIs, contract tests and end-to-end evidence.

## 5. Database and deployment safety

The development branch includes Prisma migrations and disposable-PostgreSQL CI tests. The live VAYRO-CORE database has not been reconciled with the branch migration history. Do not apply migrations, DDL, role grants or RLS policy changes to the live database until schema/object reconciliation, encrypted external backup, isolated restore and an approved recovery procedure are evidenced.

Do not infer a production deployment from a successful CI run or a Railway deployment record. A production claim requires the exact deployed commit, healthy runtime, verified database connectivity and passing readiness checks.

## 6. Exact-head verification

At the reviewed head `c1dc326d7dd483cafb67b5fc769ca90ee6e8a485`, the associated GitHub Actions runs completed successfully:
- VAYRO CI: run `45691131869` — SUCCESS.
- CodeQL: run `45691132030` — SUCCESS.
- npm lockfile validation: run `45691131853` — SUCCESS.
- A duplicate VAYRO CI run `45691118417` also completed successfully.

These results verify the repository's configured CI scope on this exact SHA. They do not certify production infrastructure or the operational autonomy acceptance test.

## 7. Release classification

**Development foundation: implemented with passing exact-head CI.**  
**Autonomous production operation: NOT READY.**  
**Commercial release: BLOCKED.**

PR #47 remains Draft/Open/Unmerged. No production migration, merge, deployment, billing activation or live-data mutation is authorized by this document.

## 8. Required implementation order

1. Run and repair exact-head CI until unit, Prisma, migration, RLS, scheduler-role, worker-role, lint, typecheck, build and integration gates pass.
2. Add disposable-PostgreSQL E2E tests for recurring schedule concurrency, catch-up semantics, schedule pause/resume, agent resolution and review-block behavior.
3. Provision dedicated non-production task-worker and scheduler login credentials; verify each role's function-only privileges and denied table access.
4. Deploy task worker and scheduler separately in non-production; prove health, restart recovery, idempotent schedule materialization and goal reconciliation using exact commit evidence.
5. Complete encrypted off-site backup and isolated restore; only then reconcile the live database against a restored clone and the exact migration ledger.
6. Complete independent product API contracts and E2E evidence without merging product data or release boundaries.

All implementation remains additive and branch-scoped. Live production changes, secret/access changes, paid infrastructure, merge and public release remain approval-gated.

## 9. Durable engineering control plane — additive implementation

The development branch now adds the following source and schema components:

- Persistent `GoalRecord`, `GoalEpic` and `GoalFeature` records, including versioned goal identity, acceptance criteria, ordering and a link from each feature to its EngineeringTask.
- The owner-only `POST /api/owner/goals/plan` path now writes the goal hierarchy and task graph in the same owner transaction. It accepts either the backwards-compatible flat acceptance-criteria shape or an explicit multi-Epic hierarchy.
- `RecurringSchedule` records and owner-only `POST /api/owner/schedules` creation. Supported recurrence is a bounded UTC-anchored interval in minutes, hours, days or weeks. Calendar-month and local-wall-clock/DST recurrence are deliberately not supported.
- A separate `src/worker/schedule-worker.mjs` process and `worker:schedules` command. It invokes SECURITY DEFINER materialization and goal-reconciliation functions through a dedicated `vayro_task_scheduler` role. The role has no direct table grants and cannot claim engineering tasks.
- `EngineeringAgent` registry records and owner-only `POST /api/owner/agents`. Agent permissions/capabilities are allowlisted. The migration seeds only deterministic read-only adapters and a deterministic policy reviewer; it does not seed unrestricted AI, shell or code-execution agents.
- The task worker resolves an enabled executor by handler capability and project scope, executes only the existing fixed handler registry, applies a separate deterministic result policy, and records the reviewer decision through a restricted database function before task completion.
- Goal/Epic/Feature status is reconciled from task state by the scheduler control loop. It is a derived projection; task status remains authoritative.
- Unit tests cover recurrence boundaries, idempotency, catch-up behavior, agent scopes and evidence-gated review. Isolated PostgreSQL CI adds scheduler-role privilege assertions.

## 10. Operational limits and release gates for the new control plane

The new migration and runtime are **not production activated**. A passing source-level implementation or CI migration does not authorize applying it to live VAYRO-CORE.

Required before production:
1. Current branch CI must pass on the exact commit, including Prisma generate/validate, all migrations on disposable PostgreSQL, catalog reconciliation, RLS checks, task-worker and scheduler role-boundary tests, lint, typecheck, build, Docker and integration tests.
2. Reconcile the live database schema against a restored clone and the exact migration ledger. No live DDL until the independent encrypted backup and isolated restore gates pass.
3. Provision separate least-privilege login credentials for task worker and scheduler; neither may use the owner, platform, postgres, service-role or BYPASSRLS credentials.
4. Deploy the task worker and scheduler as separate non-production services first. Verify health, exact commit, DB role assertions, logs, restart behavior, schedule materialization, stale-lease fencing and goal reconciliation.
5. Only the existing three read-only task handlers are executable. Agent registry entries do not permit arbitrary code, shell, merge, deploy, billing, secrets or production-data changes.
6. The reviewer is a deterministic policy validator, not a generative AI peer reviewer. A future LLM-based reviewer would require separate provider, privacy, output-validation and approval controls.
7. UTC fixed-duration schedules do not implement calendar-month or local-time recurrence. Add those only with explicit timezone/DST semantics and dedicated tests.
8. PR #47 remains Draft/Open/Unmerged until all release gates and owner review pass.

No production migration, deployment, role grant, secret change, merge or public release was performed as part of this implementation.


## 11. Current exact-head and live-infrastructure update — 2026-11-26

- Current PR #47 head remains `c1dc326d7dd483cafb67b5fc769ca90ee6e8a485`, OPEN / DRAFT / UNMERGED.
- Exact-head VAYRO CI `45691131869`, CodeQL `45691132030` and npm lockfile validation `45691131853` all completed SUCCESS on that SHA; duplicate CI run `45691118417` also completed SUCCESS.
- Fresh Railway environment-status inspection: the ARIA Web production VAYRO service is OFFLINE; LEADORA production's VAYRO service and LEADORA web service are OFFLINE. Only ARIA Web and LEADORA projects are present; no independent VAYRO project is available. No staged change was accepted and no deployment or configuration was changed.
- Fresh read-only VAYRO-CORE catalog inspection: 11 public tables, RLS enabled on all 11, zero policies, zero FORCE RLS, zero `vayro%` roles and zero migration-history tables. No database changes were made.
- The exact-head checks establish repository CI only. The platform remains NOT DEPLOYED; independent backup/restore, live schema reconciliation, runtime credentials, worker/scheduler deployment, product E2E and UAT remain open.

**Current classification: SOURCE ENGINEERING CHECKS PASS — PRODUCTION / COMMERCIAL RELEASE BLOCKED — NOT RELEASED.**


## Live verification addendum — 2026-11-26

This addendum supersedes the older reviewed-head and deployment snapshots above.

- The current PR #47 head is `479f144962ce16c98ce22d44b84bc5005d964652`; PR #47 remains OPEN/DRAFT/UNMERGED against main `f0d31804e695cd3d73b452c7507affdca9573740`.
- PR #54 is the additive conversation/archive slice on head `6801d32110ec54d1f45d32008c6f3cbb1493f739`, based on PR #47. PR #54 remains OPEN/DRAFT/UNMERGED.
- Exact-head CI [45775706143](https://github.com/gavad54/zelmira-one-/actions/runs/45775706143) and CodeQL [45775705952](https://github.com/gavad54/zelmira-one-/actions/runs/45775705952) both completed successfully on `6801d32110ec54d1f45d32008c6f3cbb1493f739`. These validate the configured isolated CI scope only.
- Fresh live VAYRO-CORE inspection found 11 public tables, zero applied migrations, zero public RLS policies, zero FORCE-RLS tables, zero expected VAYRO runtime roles and 0/16 checked application-domain tables. The database has not been reconciled with the current Prisma/migration set. No live DDL, role grant or RLS mutation was performed.
- Fresh Railway inspection found no independent VAYRO project. The only projects are ARIA Web and LEADORA; each has a VAYRO-named service whose latest deployment is FAILED. These projects and their databases/volumes/secrets must not be repurposed for VAYRO.
- PR #54 implements conversation/message/attachment metadata and tenant-scoped archive APIs, but does not complete file upload/download, object storage, export, retention/legal hold, AI streaming/thread orchestration or archive UI.
- The approved product family contains 11 products; DANA remains an internal VAYRO capability. ARIA remains outside accounting/ERP; ARIANA remains the accounting/ERP product.

**Updated release classification:** repository source CI is green on the inspected PR #54 head; live infrastructure and production readiness remain BLOCKED. Independent encrypted backup and verified isolated restore must precede live DB reconciliation. Dedicated hosting, operational services, product contracts, Android acceptance, UAT and explicit release approval remain outstanding.


## 12. Live main-branch and infrastructure verification — 2026-11-26

This addendum supersedes earlier statements in this document that PR #47 or PR #54 remain open.

- Main branch was read at `527db3a8051c3eef15c974c43ded4b6e755a75b3`. Its latest commit changes `README.md` only.
- PR #47 is CLOSED / MERGED. PR #54 is CLOSED / NOT MERGED. A complete 20-file comparison between PR #54 head `71da880633d5d009eb8d1abe01ed6f42e76bca60` and `main` found all 20 paths present with identical Git blob SHAs. Its conversation/archive source slice is therefore byte-identical in the inspected main tree.
- Combined commit status and the available workflow-run lookup returned no current-main checks for `527db3a8051c3eef15c974c43ded4b6e755a75b3`. Exact-main CI, CodeQL, dependency audit and build are therefore unverified; successful runs on older development heads do not establish current-main health.
- Railway currently exposes only ARIA Web and LEADORA projects in the connected workspace. The VAYRO-named service in each has a latest FAILED deployment; neither has a mounted VAYRO data volume. ARIA Web also has an unaccepted staged-create service. None is an independent VAYRO production environment.
- Supabase VAYRO-CORE is ACTIVE_HEALTHY on PostgreSQL 17.11. A fresh read-only catalog query found 11 public tables, all RLS-enabled, zero FORCE RLS, zero public policies, zero `vayro%` roles and no migration ledger. No database changes were made.
- The database is not production-ready merely because the Supabase project is healthy. Runtime identity/privileges, migration reconciliation, policies/authorization and independent backup/restore must be proven before production use.
- No Railway changes, deployments, database mutations, secret changes or public release were performed in this verification.

**Current classification: SOURCE TREE PRESENT — CURRENT-MAIN CHECKS UNVERIFIED — HOSTING / DATABASE / BACKUP GATES BLOCKED — NOT RELEASED.**


## 12. Live verification update — 2026-11-27

- PR #62 documentation head `dd30b7f0239d9fcaf6e7969d25d6c1cb5347e153` passed VAYRO CI [45946632157](https://github.com/gavad54/zelmira-one-/actions/runs/45946632157) and CodeQL [45946632187](https://github.com/gavad54/zelmira-one-/actions/runs/45946632187). CI included locked dependency audit, unit tests, complete Prisma migration execution and RLS/role tests on disposable PostgreSQL, lint, typecheck, production build, Docker build and PostgreSQL/HTTP integration tests.
- All 20 files in the inspected PR #54 source change set were verified present on main with identical Git blob SHAs.
- VAYRO-CORE remains ACTIVE_HEALTHY, but its live catalog is not reconciled: 11 public tables, all RLS-enabled, zero FORCE RLS, zero policies, zero VAYRO roles and empty migration history. All 11 tables currently report zero rows. No production SQL mutation was made.
- Railway workspace inventory still shows only ARIA Web and LEADORA. Both VAYRO-named services are OFFLINE. Creating a dedicated VAYRO project was blocked by Railway's response that the trial has expired and a plan must be selected. No paid plan was selected and no infrastructure was changed.
- The old LEADORA-hosted VAYRO deployment log confirms its historical build failed because `AUTH_DATABASE_URL` was required during page-data collection. Current source uses lazy auth/platform clients and the exact PR #62 CI build passes; the old deployment is still offline and must not be reused.

**Classification: REPOSITORY ENGINEERING CHECKS PASS — LIVE DATABASE AND INDEPENDENT HOSTING NOT READY — BACKUP/RESTORE NOT PROVEN — PRODUCTION DEPLOYMENT BLOCKED.**


## 13. Backup automation source status — 2026-11-27

The repository's main branch already contains the encrypted S3 backup workflow, isolated restore-drill workflow, setup runbook, design specification, implementation plan and contract tests. Their workflow source is byte-identical to the corresponding PR #53 backup/restore paths. CI tests their configuration contract, but this is not a real provider integration test. No active bucket/credentials, encrypted remote backup object, remote checksum verification or successful isolated restore has been evidenced. The backup/restore implementation is therefore **present in source, not operationally activated or proven**.


## 14. Product API implementation inventory — 2026-11-27

A source-tree inventory of `src/app/api` found these product-related namespaces in the VAYRO repository:

- `/api/negah`: creative-brief and generate routes.
- `/api/dana`: generate and prompt-studio routes; DANA is an internal capability, not a product.
- `/api/ai-business-suite/capabilities`: shared capability registry, not a separate API implementation for each product.

The UI/catalogue lists eleven products, but this inventory does not show eleven independently implemented product API surfaces. ARVAND, CHARSU, GANJINEH, SEPEHR and NAMA, PAYAM need their own scoped service/API contracts and acceptance tests; LEADORA, ARIANA, ARIA and ARMIN MARKET must be validated in their respective independent repositories. This is a real implementation gap, not a CI failure.


## 15. Android delivery status — 2026-11-27

The repository includes a native Android WebView wrapper (`android/app`) and an Android build workflow. Run [45782951645](https://github.com/gavad54/zelmira-one-/actions/runs/45782951645) succeeded on integration branch commit `2f92fa9805fd48434bad22eb29daf0b369422ad5`, compiling a debug APK with Java 17, Android SDK 35 and Gradle 8.9. The run used the compile-only `https://vayro.invalid` URL; artifact upload was intentionally skipped and no APK artifact was produced. A manually dispatched build requires the real deployed VAYRO HTTPS origin. No signed release artifact or real-device acceptance is verified. The repository also lacks a Gradle wrapper and release signing configuration in the inspected app Gradle file.
