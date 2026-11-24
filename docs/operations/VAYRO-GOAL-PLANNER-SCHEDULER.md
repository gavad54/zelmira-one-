# VAYRO Goal Planner and Durable Task Scheduling

**Status:** implemented in development branch; CI verification pending; not production deployed.
**Date:** 2026-11-24

## Implemented path

The existing deterministic planner at `src/engine/goal-planner.mjs` validates an owner-supplied goal, validates its acceptance criteria and handler allowlist, rejects unknown dependencies and cycles, and emits stable topologically ordered task definitions with idempotency keys.

The owner-only API at `POST /api/owner/goals/plan` materializes the plan in one platform-owner transaction:
- Same-origin request check and bounded JSON body.
- Owner session via the platform transaction boundary.
- Per-owner rate limit.
- Strict Zod input schema and allowlisted handlers only.
- Stable idempotency keys; exact replay is returned without duplicate task creation; partial collisions fail closed.
- Task records and dependency edges are persisted transactionally.
- Approval-required goals create tasks in `WAITING_APPROVAL`; no worker can approve them.
- One audit event records goal identity/version and the created task IDs.
- Optional `scheduledAt` and `deadline` are propagated to every task.

Example request shape (illustrative; use an authenticated owner session and same-origin request):

```json
{
  "goal": {
    "goalId": "GOAL-VAYRO-001",
    "projectKey": "VAYRO",
    "title": "Verify worker recovery",
    "version": 1,
    "priority": 80,
    "approvalRequired": true,
    "scheduledAt": "2026-11-25T09:00:00.000Z",
    "deadline": "2026-11-26T09:00:00.000Z",
    "acceptanceCriteria": [
      {
        "id": "audit",
        "title": "Audit repository state",
        "handlerKey": "repo.audit",
        "dependsOn": []
      },
      {
        "id": "report",
        "title": "Generate verification report",
        "handlerKey": "report.generate",
        "dependsOn": ["audit"]
      }
    ]
  }
}
```

Only the three existing read-only handlers are accepted: `repo.audit`, `repo.test`, and `report.generate`. This is deliberate; the endpoint cannot create shell execution, arbitrary code execution, deployment, merge, financial, or production database tasks.

## Scheduling and continuation semantics

A separate cron scheduler is not yet justified for one-time tasks: the existing PostgreSQL queue is already the durable scheduler. The owner planner stores `scheduledAt` and `availableAt`; the database claim function only returns tasks whose `availableAt` is due and whose prerequisites have succeeded. The long-running worker polls the durable queue and applies lease, heartbeat, timeout, retry, deadline, and stale-worker fencing.

This gives durable, restart-tolerant execution of already materialized tasks. It is **not** yet a recurring calendar scheduler, an autonomous goal-discovery engine, or a persistent first-class Goal/Epic/Feature registry. Goal identity/version is currently traceable through task payloads, deterministic idempotency keys, and the audit event. A dedicated Goal/Epic/Feature persistence model remains future work and requires its own additive migration and RLS/role tests.

## Restart recovery evidence

The repository contains `tests/sql/task-worker-restart-recovery.integration.sql`, run by the VAYRO CI workflow against isolated PostgreSQL. It verifies expired-lease reclaim, a fresh lease token/second attempt, rejection of the stale worker's completion, and acceptance of the reclaimed worker's completion.

This proves the database lease protocol under an isolated SQL simulation. It does **not** yet prove an actual Railway worker process restart, network interruption recovery, or end-to-end application-level exactly-once side effects. Delivery is at-least-once; handlers must remain idempotent.

## Verification and release gates

- Existing unit coverage: `tests/goal-planner.test.mjs`.
- Added coverage for scheduledAt/deadline propagation and invalid date windows.
- CI run on the current implementation commit must pass unit tests, Prisma validation, PostgreSQL dependency/restart checks, lint, typecheck, production build, Docker build, and integration tests.
- Production DB migrations are blocked until independent encrypted backup and isolated restore are proven.
- Railway worker deployment, dedicated production runtime credentials, monitoring/alerts, and live restart drill remain unverified.
- Cloudflare R2 is not enabled on the connected account yet; no bucket or actual backup object exists.

## Safe operating rule

Keep PR #47 Draft and unmerged until the current commit passes CI, R2 backup/restore is complete, production migration drift is reconciled on restored clones, and a live worker restart drill is recorded. Never use the owner database URL as the worker URL and never put credentials in source control or chat.
