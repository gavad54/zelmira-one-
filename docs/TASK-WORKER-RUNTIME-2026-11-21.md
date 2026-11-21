# VAYRO Task Worker Runtime — 2026-11-21

## Scope

This change adds the first long-running worker process for the durable PostgreSQL task queue. It is a development-branch implementation only; it is not deployed or connected to the live VAYRO-CORE database.

## Runtime behavior

- Requires the dedicated `TASK_WORKER_DATABASE_URL`; it never falls back to the web application's database URL.
- Verifies at startup that the database login inherits only the task-worker role, is not superuser/BYPASSRLS, does not own public tables, and has no other role memberships.
- Claims one task at a time through `vayro_claim_engineering_task`; the database function owns lease issuance and attempt counting.
- Heartbeats the lease while a handler is running; stale or expired leases cannot complete a task.
- Applies a bounded handler timeout, bounded result size, bounded polling backoff, and graceful SIGTERM/SIGINT shutdown.
- Persisting success/failure uses only the SECURITY DEFINER worker functions; no direct task-table writes are made.
- Emits structured logs without serializing task payloads or secrets.

## Registered handlers

- `report.generate`: deterministic JSON summary and SHA-256 digest of the supplied payload.
- `repo.audit`: read-only GitHub repository metadata and latest commit observation.
- `repo.test`: read-only observation of existing GitHub Actions runs; it does not trigger workflows or execute arbitrary repository code.
- `product.health_check` is intentionally not registered yet. It fails closed until a reviewed target registry and egress policy exist.
- Shell execution, arbitrary code execution, deployment, merge, database migration, billing, and secret mutation are not supported.

Private repository observation may use an optional protected `VAYRO_GITHUB_READ_TOKEN` with read-only repository and Actions permissions. The token is read only from the process environment and is never accepted in task payloads or logged.

## Start command

`npm run worker:tasks`

Required runtime variable: `TASK_WORKER_DATABASE_URL`. Optional bounded controls: `TASK_WORKER_ID`, `TASK_WORKER_LEASE_SECONDS` (10–300), `TASK_WORKER_POLL_MS` (250–30000), `TASK_WORKER_HANDLER_TIMEOUT_MS` (1000–900000), and `VAYRO_GITHUB_READ_TOKEN`.

## Verification boundary

The source and isolated unit tests are part of the development PR. CI must pass on the exact resulting commit before this slice is considered tested. No Railway service, production credential, database migration, deployment, or recurring scheduler has been provisioned. Runtime operation remains unverified until a separately provisioned worker is deployed against an isolated database and passes restart-recovery tests.
