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
