# VAYRO Goal Planner, Recurring Scheduler and Agent Governance

**Implementation state:** development-branch implementation committed; exact-head CI verification pending.  
**Production state:** NOT DEPLOYED.  
**Branch:** `upgrade/full-independent-product-family-modules-2026-11-20`

## 1. Durable goal hierarchy

The additive Prisma models and migration introduce:
- `GoalRecord`: versioned goal identity, project, title, status, priority, approval policy and scheduling window.
- `GoalEpic`: ordered work packages under a goal.
- `GoalFeature`: acceptance criteria, approved handler, status, ordering and optional link to the durable EngineeringTask.

The owner-only `POST /api/owner/goals/plan` accepts either:
- The backwards-compatible flat `acceptanceCriteria` array, stored under a generated `execution-plan` Epic; or
- An explicit `epics[]` hierarchy, each with `id`, `title` and `features[]`.

Feature IDs must be unique across the goal. The planner validates handler allowlists, dependency existence, cycles, priority, dates and stable idempotency keys. Goal/Epic/Feature and task/dependency records are created in one owner transaction. Approval-required tasks stay in `WAITING_APPROVAL`.

A replay with the same task idempotency keys returns the existing task set. Partial collisions fail closed. A different hierarchy or changed acceptance criteria must use a new goal version; the system does not silently overwrite an existing version.

## 2. Recurring schedules

The owner-only `POST /api/owner/schedules` creates a durable `RecurringSchedule` record. Supported intervals:
- `MINUTES`
- `HOURS`
- `DAYS`
- `WEEKS`

All intervals are UTC-anchored fixed durations. Calendar months, local wall-clock schedules and DST transitions are not supported. Bounds: interval 1–10,000; effective duration at most 366 days; optional maxRuns 1–100,000; endAt must follow startAt.

Missed-run policies:
- `SKIP`: materialize only the latest due occurrence and advance beyond the backlog.
- `CATCH_UP_ONCE`: materialize one oldest missed occurrence, then advance beyond the backlog. It does not replay every missed interval.

Each occurrence receives a deterministic idempotency key:
`schedule:<scheduleKey>:<UTC occurrence timestamp>`.

The SQL materializer uses row locks with `SKIP LOCKED`, a unique task idempotency key and one transaction per scheduler batch to avoid concurrent duplicate materialization. It creates only the three fixed read-only handlers.

## 3. Scheduler worker and database role

Command: `npm run worker:schedules`

Required environment:
- `TASK_SCHEDULER_DATABASE_URL`: dedicated login inheriting only `vayro_task_scheduler`.
- Optional `TASK_SCHEDULER_ID`, `TASK_SCHEDULER_POLL_MS` (500–60,000), `TASK_SCHEDULER_BATCH_SIZE` (1–100).

The scheduler asserts at startup that its login is non-superuser, NOBYPASSRLS, has the scheduler role, owns no public tables and has no other role memberships. It has EXECUTE-only access to:
- `vayro_materialize_due_engineering_schedules`
- `vayro_reconcile_goal_progress`

It has no direct SELECT/INSERT/UPDATE/DELETE rights on schedule, goal, task or agent tables and cannot claim tasks. The separate task worker retains its own `TASK_WORKER_DATABASE_URL` and `vayro_task_worker` boundary.

## 4. Agent registry and task review

The owner-only `POST /api/owner/agents` stores versioned agent definitions with:
- Allowlisted capabilities: `REPORT_GENERATION`, `REPOSITORY_AUDIT`, `CI_OBSERVATION`, `TASK_REVIEW`.
- Allowlisted permissions: `READ_TASK`, `READ_REPOSITORY`, `WRITE_TASK_RESULT`, `REQUEST_OWNER_APPROVAL`.
- Optional project scope.
- Explicit enabled/disabled state.

The migration seeds four bounded identities: report adapter, repository auditor, CI observer and deterministic policy reviewer. They are not unrestricted AI agents and cannot execute arbitrary shell/code, deploy, merge, access secrets or perform financial actions.

The task worker:
1. Claims a task through the task-worker SECURITY DEFINER API.
2. Resolves an enabled executor whose capability matches the fixed handler and whose project scope permits the task.
3. Runs the existing immutable read-only handler.
4. Resolves a distinct enabled `TASK_REVIEW` agent.
5. Applies a deterministic handler-specific output contract and records evidence through a restricted SQL function.
6. Completes the task only after the review record is accepted and the decision is `APPROVE`. A `BLOCK` decision fails the task closed.

The review function independently verifies the executor and reviewer registry identities, project scope, task lease and distinct agent keys. The reviewer is deterministic policy validation, not an LLM or human-equivalent code review. Generative review remains a separate future capability requiring privacy, provider, prompt-injection, validation and approval controls.

## 5. Goal progress reconciliation

The scheduler calls `vayro_reconcile_goal_progress` each cycle. Feature status is derived from the linked EngineeringTask; Epic status is derived from its features; Goal status is derived from its Epics. The task ledger remains authoritative. This reconciliation does not approve, create or dispatch work.

## 6. Tests and evidence

New unit suites:
- `tests/recurring-scheduler.test.mjs`
- `tests/agent-registry.test.mjs`

New isolated PostgreSQL privilege test:
- `tests/sql/scheduler-worker-role-boundary.sql`

CI also runs the full migration history, Prisma generation/validation, catalog reconciliation, RLS checks, task-worker role boundary, dependency claim and restart-recovery SQL tests, lint, typecheck, production build, Docker build and HTTP integration tests.

**Do not report success until the exact branch-head CI results are green.** Source files and SQL migration commits alone are not execution evidence.

## 7. Production blockers

- The new migrations have not been applied to live VAYRO-CORE.
- The live database migration ledger and schema have not been reconciled against a restored clone.
- Encrypted off-site backup and isolated restore are not yet evidenced.
- Dedicated scheduler/task-worker login credentials have not been provisioned or validated in Railway.
- The scheduler and task worker have not been deployed as separate services.
- No Railway runtime health, real process restart drill or live recurring schedule E2E evidence exists.
- PR #47 remains Draft/Open/Unmerged.

No production migration, production role grant, secret change, service deployment, merge or public release is authorized by these commits.
