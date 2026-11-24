# VAYRO Task Engine — First Durable Queue Slice

Date: 2026-11-21  
Branch: \`upgrade/full-independent-product-family-modules-2026-11-20\`  
Status: implementation slice committed; database migration and runtime remain unverified

## Implemented in this change

- Added the \`EngineeringTask\` and \`EngineeringTaskAttempt\` Prisma models and a versioned PostgreSQL migration.
- Added a bounded task-definition contract with a fixed handler allowlist. Arbitrary shell commands, arbitrary code strings, and unbounded payloads are not accepted.
- Added the standard task states, approval gate, idempotency key, bounded attempts, deadline, worker lease, heartbeat, result, and error fields.
- Added PostgreSQL claim logic using \`FOR UPDATE SKIP LOCKED\`, a random lease token, bounded lease duration, and attempt history.
- Added worker-only database function calls for claim, heartbeat, completion, and failure. The worker role has function execution rights only and no direct table grants.
- Added a dedicated lazy Prisma client that requires \`TASK_WORKER_DATABASE_URL\` and fails closed instead of falling back to the application or owner database credential.
- Added retry with bounded exponential backoff, lease-expiry recovery, and terminalization of expired/exhausted tasks.
- Added pure state-machine tests for validation, approval, claim, heartbeat, completion, retry, expired-lease reclaim, and cancellation.

## Security and deployment boundary

The migration creates a non-login group role named \`vayro_task_worker\`. It does **not** create a login credential, configure a Railway variable, apply the migration to the live VAYRO-CORE database, or deploy a worker service. A separately provisioned login must be granted only this role and supplied through the protected \`TASK_WORKER_DATABASE_URL\` environment variable after database migration review.

The task worker must dispatch only registered handlers. The current handler keys are contracts, not permission to run arbitrary commands. No handler runner or scheduler loop is included in this slice.

## Verification

- Local isolated Node test run: 8/8 task state-machine tests passed.
- Prisma schema validation, migration application against PostgreSQL, SQL function concurrency tests, CI, and runtime database-role verification: not yet evidenced.
- No production database write, Railway configuration change, deployment, merge, or secret creation was performed.

## Remaining work before an operational claim

1. Run Prisma validation and the repository CI on the exact branch head.
2. Apply the migration only to an isolated disposable PostgreSQL database and test concurrent claims, duplicate idempotency keys, expired leases, heartbeat, retry exhaustion, and worker-role privilege boundaries.
3. Implement owner-authorized task enqueue/approval with an audit event and transactional outbox.
4. Implement a scheduler that materializes due schedules without executing jobs itself.
5. Implement a bounded worker loop with a strict handler registry, graceful shutdown, lease heartbeat, timeout, and result persistence.
6. Add restart-recovery integration tests and evidence artifacts.
7. Provision the protected worker credential and runtime service only after the database and security gates pass.

## State classification

| Capability | State |
|---|---|
| Task contract and state transitions | IMPLEMENTED |
| Pure task state tests | TESTED locally |
| PostgreSQL task/attempt schema and queue functions | IMPLEMENTED in migration; NOT APPLIED |
| Worker database adapter | IMPLEMENTED in source; NOT CONNECTED |
| Scheduler and worker loop | NOT IMPLEMENTED |
| Restart recovery in a live process | NOT TESTED |
| Production operation | NOT OPERATIONAL |


## Follow-up implementation — owner enqueue and approval boundary

The next additive slice now includes:

- Owner-only task list/create API at `/api/owner/tasks`.
- MFA-backed owner transaction, same-origin enforcement, request rate limiting, strict input validation and a 64 KiB payload cap.
- Idempotency-key uniqueness; a repeated key is surfaced as a conflict rather than creating a second task.
- Task creation and the corresponding audit event occur in the same database transaction.
- Tasks marked `approvalRequired` start in `WAITING_APPROVAL`; a separate owner PATCH action invokes a SECURITY DEFINER approval function that revalidates the current owner/MFA transaction context.
- A separate migration enables RLS and grants the platform role only SELECT/INSERT on the task table. It does not grant UPDATE/DELETE or direct access to attempt history. Worker state transitions remain function-only.
- CI includes an isolated PostgreSQL login-role test proving inherited worker function execution and absence of direct table access.

The new migration and API source are committed on the same development branch. Their CI run is pending/in progress at the time of this note. They are not applied to the live VAYRO-CORE database. The scheduler, worker loop, concrete handler implementations, outbox, and restart-recovery E2E are still open.


## Status reconciliation — 2026-11-24

This section supersedes earlier statements in this document that the worker loop and owner enqueue/approval API were not implemented.

### Implemented in the current development branch

- The owner-only task API is implemented in `src/app/api/owner/tasks/route.ts`: authenticated owner transaction, same-origin checks, bounded request body, rate limiting, idempotency conflict handling, audit events, and a separate owner approval action.
- The goal-planning API is implemented in `src/app/api/owner/goals/plan/route.ts`; it validates a bounded dependency graph and persists tasks plus dependency edges in one owner transaction.
- The worker loop is implemented in `src/worker/task-worker.mjs` and starts with `npm run worker:tasks`. It requires the dedicated `TASK_WORKER_DATABASE_URL`, checks its runtime role at startup, claims one task at a time, heartbeats leases, enforces bounded handler timeouts/results, retries transient failures with bounded backoff, handles SIGTERM/SIGINT, and records terminal failures for dead-letter handling.
- The fixed handler allowlist is `report.generate`, `repo.audit`, and `repo.test`. The latter two only observe GitHub metadata/Actions through GET requests. No shell or arbitrary code handler is registered.
- One-time future scheduling is represented by `scheduledAt` mapped to `availableAt`; the database claim function only selects tasks whose `availableAt` is due. No separate recurring schedule materializer has been implemented.

### Exact-head verification

At the 2026-11-24 observation, branch head was `9b88def1959a06405b60ee1df2b326e01dfdfc96`. Push CI run [45370932019](https://github.com/gavad54/zelmira-one-/actions/runs/45370932019) completed successfully on that exact SHA. Its `validate` job passed dependency audit, unit tests, Prisma generation/validation, migrations against disposable PostgreSQL, catalog/RLS/role boundaries, task dependency and lease-recovery SQL tests, lint, typecheck, production build, Docker build and HTTP integration tests.

The PR-triggered CI run [45370938684](https://github.com/gavad54/zelmira-one-/actions/runs/45370938684) was still pending and CodeQL run [45370938513](https://github.com/gavad54/zelmira-one-/actions/runs/45370938513) was still in progress at the same observation. These must not be reported as PASS based on the successful push run.

The SQL restart-recovery test expires a claimed task's lease and proves a new worker can reclaim it while the old lease token is fenced. This verifies database lease-recovery semantics in isolated PostgreSQL; it is not a test that kills and restarts a deployed worker process.

### Not operational / still gated

- The task-engine migrations remain in the PR branch and have not been applied to VAYRO-CORE. The live Supabase migration registry is empty and the live public schema still lacks the task-engine tables.
- No protected worker database credential has been provisioned and no Railway worker service is running. The source implementation and passing isolated CI do not prove a live persistent worker.
- No recurring scheduler, real process-level restart drill, external evidence-store integration, or end-to-end runtime queue evidence exists yet.
- The backup and isolated-restore workflows are present only on the unmerged branch and run only from `main`; no encrypted off-site backup artifact or successful restore was observed.

Current classification: worker source and isolated database tests are implemented/tested on the observed SHA; live database integration and deployed worker operation remain NOT RUN / BLOCKED.
