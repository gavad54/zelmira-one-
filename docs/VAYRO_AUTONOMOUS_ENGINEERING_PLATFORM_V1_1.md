# VAYRO Autonomous Engineering Platform
## Architecture Review and Executable Engineering Baseline — v1.1
Date: 2026-11-21
Status: Architecture baseline / implementation not yet production-operational
Owner: VAYRO

## 1. Executive decision

The proposal is directionally sound. The correct solution is an independently hosted control plane and execution plane. ChatGPT is an optional planning/review/reporting client; it is not a runtime dependency and must never be the scheduler, durable queue, secret store, or sole operator.

The first release should be deliberately smaller than the full target architecture:
- PostgreSQL is the system of record for projects, tasks, attempts, approvals, schedules, audit events, workflow state and transactional outbox.
- Start with a PostgreSQL-backed leased job queue using short transactions and `FOR UPDATE SKIP LOCKED`, bounded concurrency and lease expiry. This avoids introducing Redis before measured need. A dedicated broker (Redis/managed queue) or Temporal can be introduced behind the queue/workflow interfaces when throughput or long-running workflow complexity justifies it.
- A scheduler creates due task instances; it does not execute application work itself.
- Stateless workers claim jobs, execute allowlisted handlers, heartbeat leases, persist results and emit events.
- GitHub Actions remains the source/build/test automation layer. It is not the long-running production worker host.
- Railway hosts the API, scheduler and workers only after project ownership, service boundaries, health checks, secrets and deployment evidence are established.
- Off-site object storage is required for disaster recovery; a volume attached to the same hosting project is not an independent backup.
- AI proposes and explains changes. Deterministic policy code authorizes actions. AI output alone never grants permission.

## 2. Corrected product boundaries

- VAYRO is the parent product and owns the VAYRO-CORE control plane.
- DANA is the internal AI orchestration/management capability of VAYRO. It is not a separate peer product, has no unrestricted administrator role and cannot bypass policy gates.
- ARIA, ARIANA, LEADORA and ARMIN MARKET remain independently deployable products with their own repositories, data stores, identity/authorization boundaries, release gates, backups and operational evidence.
- ARIA must not contain accounting or ERP. ARIANA owns accounting/ERP. LEADORA owns distribution workflows.
- ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA and PAYAM remain in the VAYRO family catalogue. Do not claim independent operation until each has an independently verified repository/runtime/data boundary and end-to-end test.
- Products communicate through versioned APIs/events. No product reads another product's private database.
- A central control-plane outage must not corrupt product data or stop unrelated product runtime. Product-side agents should buffer telemetry locally or retry with bounded backoff.

## 3. Logical architecture

```text
Owner / approved operators
          |
  VAYRO Control API + Dashboard
          |
  Authentication + RBAC + Policy Engine
          |
  Task API / Workflow Coordinator
          |
  PostgreSQL (system of record)
  | tasks | attempts | approvals | schedules
  | audit | workflow state | outbox | costs
          |
  Scheduler ---> due task instances
          |
  Leased durable queue (PostgreSQL v1)
          |
  +-------+-----------+-------------+
  |                   |             |
Engineering workers  Ops workers   Reporting workers
  |                   |             |
GitHub PR/CI       health/backup   evidence aggregation
  |                   |             |
  +-------------------+-------------+
                      |
             Event processor / outbox relay
                      |
        product adapters + notifications
                      |
  ARIA / ARIANA / LEADORA / ARMIN MARKET / others
```

Control Plane responsibilities: identity, policy, task state, schedules, approvals, workflow state, audit and dashboard.
Execution Plane responsibilities: isolated job execution, health probes, backup jobs, report generation, product adapters and bounded retries.
The planes may share a database initially, but must have separate credentials, network roles and deployable processes. Workers must not receive owner/admin credentials.

## 4. Initial implementation stack and decision gates

| Capability | v1 choice | Upgrade trigger |
|---|---|---|
| API | Python + FastAPI, if repository audit confirms Python is already the maintainable backend | Existing stable stack or measured API constraints |
| UI | Existing VAYRO frontend; do not replace blindly | Only if current frontend cannot support required controls |
| System of record | Existing VAYRO-CORE PostgreSQL/Supabase, after schema and access audit | Independent managed PostgreSQL when isolation/availability demands it |
| Durable task queue | PostgreSQL task rows + lease + SKIP LOCKED + outbox | Sustained queue contention, throughput or multi-region need |
| Workflow engine | Explicit persisted workflow/step state machine | Temporal when workflows become long-running, timer-heavy or need complex compensation |
| CI | GitHub Actions | Keep as default |
| Runtime | Railway only after production layout and failure root causes are resolved | Another host only with measured operational benefit |
| Artifact storage | Private S3-compatible off-site object storage | Provider-specific lifecycle/immutability needs |
| Secrets | GitHub Environments / host secret manager; presence-only validation in logs | Dedicated secret manager when rotation/audit requirements warrant |
| Observability | Structured JSON logs, metrics endpoint, provider health + external probes | Prometheus/Grafana/OpenTelemetry/Sentry as operational load warrants |

Do not install Redis, Temporal, Prometheus, Grafana, Sentry or a second database merely to match a diagram. Each additional service adds cost, credentials, failure modes and maintenance burden.

## 5. Task contract and state machine

A task record must include:
- task_id UUID; project_id; task_type; schema_version; title; bounded input payload;
- priority; status; created_at; scheduled_at; deadline_at;
- idempotency_key unique within the defined scope;
- max_attempts; timeout_seconds; retry policy;
- dependency IDs; approval policy; requested_by;
- claimed_by; lease_expires_at; heartbeat_at;
- result reference; error class/code; started_at; finished_at.

Allowed states:
`DRAFT -> QUEUED -> RUNNING -> SUCCEEDED`
with controlled transitions to `BLOCKED`, `WAITING_APPROVAL`, `RETRYING`, `FAILED`, `CANCELLED`, `EXPIRED`.
Every transition is validated by the server and written to an append-only task event/audit record. Clients cannot set arbitrary states.

Execution rules:
1. Claim a task in a short DB transaction; never hold a transaction open during external work.
2. Assign a lease and heartbeat. Expired leases are reclaimable only after checking attempt status and idempotency.
3. Use bounded exponential backoff with jitter, max attempts, total execution deadline and per-provider rate limits.
4. Use idempotency keys for all externally visible side effects. Where provider idempotency is unavailable, use a durable operation ledger and reconciliation.
5. Separate retryable errors from permanent validation/authorization errors.
6. Route exhausted or poison tasks to a dead-letter state with a human-readable reason; do not silently delete.
7. Cancellation is cooperative and recorded. It cannot pretend to roll back an external side effect already completed.
8. Enforce per-project concurrency, global worker limits, budget ceilings and circuit breakers.

## 6. Workflow engine

Persist workflow definitions by version and each workflow instance/step transition. A step contains input/output references, status, attempt count, timeout, retry rule, start/end timestamps and evidence links.

Release workflow:
1. Pin repository, PR, branch and exact source SHA.
2. Validate source and branch protection.
3. Run lint, type checks, unit and integration tests.
4. Run secret/dependency/code security scans.
5. Build a versioned artifact and calculate checksum.
6. Deploy to isolated staging only when staging is explicitly configured.
7. Run smoke, migration compatibility and tenant-isolation tests.
8. Produce a release evidence bundle.
9. Wait for owner approval.
10. Production deploy only through protected environment with explicit approval.
11. Verify deployment SHA, readiness, error rate and rollback criteria.
No stage may infer success from a workflow file existing or a job merely being queued.

## 7. AI Engineering Gateway and DANA

AI capabilities: requirements analysis, architecture review, code review, test planning, failure triage, dependency review, documentation, release advisory and evidence summarization.

Mandatory controls:
- Tool allowlist per worker role and project.
- Strict input/output schemas and size limits.
- Treat repository files, issues, logs, webpages and model outputs as untrusted data; never execute embedded instructions.
- AI cannot access raw secrets, owner credentials, payment instruments or production database write credentials.
- AI-generated patches are proposed on isolated branches and must pass deterministic CI and code review.
- Policy Engine evaluates action type, target environment, actor role, budget, risk and approval requirement.
- High-impact operations (merge, production deploy, schema/data change, IAM/secret change, deletion, billing, public release) require explicit human approval.
- Store model/version, prompt/template version, tool calls, decisions, evidence references and policy result in audit logs, with sensitive values redacted.
- Add token/cost budgets, request timeouts, circuit breakers and a non-AI fallback path.

## 8. Security and tenant isolation

- Default deny; least privilege for API, scheduler, workers and product adapters.
- Separate database roles: migrations, API runtime, read-only auditor, queue worker and backup reader. Do not use Supabase service-role credentials in client apps.
- RLS policies must be table-specific and validated with positive and negative tenant tests. RLS enabled with no policy is not automatically a data leak; inspect grants, role bypass and access paths before remediation.
- MFA for owner/operator accounts; short-lived access tokens; refresh-token rotation and revocation.
- Validate every object-level authorization at the API boundary.
- Encrypt transport and backups; define key ownership and rotation.
- Protect default branches and environments; pin third-party GitHub Actions by immutable SHA where practical.
- Use OIDC/short-lived credentials where supported; avoid long-lived repository secrets.
- Sanitize logs and error responses. Never log tokens, connection strings, PII or secret values.
- Maintain dependency inventory, SBOM and vulnerability policy.
- Every privileged action is attributable to an actor and correlation ID.

## 9. Backup and disaster recovery

Backup scope is explicit per product: database, user files/object storage, configuration references, schema/migrations, release metadata and recovery instructions. Secrets are re-provisioned from secret manager; they are not dumped into backup artifacts.

Backup job:
1. Use a dedicated least-privilege backup identity.
2. Create a consistent database backup.
3. Encrypt before upload.
4. Upload to a private off-site bucket/account independent from the primary host.
5. Verify object size, checksum, encryption metadata, retention and immutability where available.
6. Record artifact ID, checksum, timestamps, source database identity and backup tool version.
7. Alert on missed/failed schedules.

Restore drill:
- Manual/protected dispatch only; target must be a separate isolated database/project.
- Verify checksum/decryption and restore process.
- Run schema, row-count, referential-integrity and product-specific invariant checks.
- Never restore over production as an automated test.
- A backup is PASS only after upload verification. Disaster recovery is PASS only after isolated restore and application-level validation.

RPO/RTO must be selected per product based on business impact and measured by drills; do not invent targets.

## 10. Observability and incident management

Minimum telemetry:
- service name, environment, version/commit SHA, deployment ID, correlation ID, task ID, tenant/product identifier (non-sensitive), timestamp and severity.
- API latency/error rate, worker concurrency, queue age/depth, task duration/retries, DB pool saturation, memory/CPU/disk, volume capacity, backup age and restore-drill age.
- Liveness checks process health; readiness checks required dependencies with bounded timeout.
- Alert on zero healthy replicas, crash loops, sustained 5xx/latency, queue age thresholds, expired leases, missed backup windows, volume exhaustion and failed restore drills.
- Alerts must reach a durable channel and have an owner/runbook. Test delivery with a harmless synthetic event.
- Maintain incident lifecycle: detected, acknowledged, mitigated, resolved, postmortem. Avoid alert storms through deduplication and cooldown.

## 11. API and event contracts

Minimum API surface (versioned under /v1):
- POST /projects/{project_id}/tasks
- GET /tasks/{task_id}
- POST /tasks/{task_id}/cancel
- POST /tasks/{task_id}/retry (policy-gated)
- GET /projects/{project_id}/tasks
- POST /workflows
- GET /workflows/{workflow_id}
- POST /approvals/{approval_id}/decision
- GET /health/live and /health/ready
- GET /metrics (restricted to monitoring network/identity)

Events use an envelope:
`event_id, event_type, schema_version, occurred_at, producer, product_id, correlation_id, idempotency_key, payload`.
Use transactional outbox to atomically persist state and event intent. Consumers keep an inbox/deduplication record. Schema evolution must be backward-compatible or explicitly versioned.

## 12. Core data model

Initial tables (names illustrative; reconcile with existing schema before migration):
- projects, product_services, environments
- tasks, task_attempts, task_dependencies, task_events
- workflow_definitions, workflow_instances, workflow_steps
- schedules, approvals, policy_decisions
- outbox_events, inbox_events, audit_events
- incidents, health_observations, deployment_observations
- backups, restore_drills, releases, artifacts
- cost_records, budget_policies, notifications

Use UUID primary keys, foreign keys, constraints, indexes for due-task scans and tenant/project scope, UTC timestamps, optimistic version columns and append-only audit events. Do not create a duplicate table if an equivalent already exists. Schema changes require reviewed versioned migrations and isolated migration tests.

## 13. GitHub automation standards

Per repository, workflows should be separated by purpose but avoid duplicate overlapping pipelines:
- PR CI: lint/type/unit/integration/build as applicable.
- Security: secret scan, dependency audit, code scanning.
- Scheduled verification: daily on the default branch, with concurrency group, timeout, least-privilege permissions and artifact retention.
- Maintenance: non-mutating checks by default; updates open PRs, never auto-merge.
- Release: protected environment, immutable artifact, approval gate, deployment verification and rollback instructions.

A cron workflow present only on an unmerged feature branch is not continuous operation. Scheduled workflows must be enabled on the default branch. Workflow permissions default to read-only; grant write permissions only to a specific job that needs them.

## 14. Deployment topology and current blockers

Target Railway topology, only after validating account/project ownership:
- vayro-api
- vayro-scheduler
- vayro-worker-engineering
- vayro-worker-operations
- vayro-worker-reporting
- optional dashboard
These may initially be one API process plus one worker process and a scheduler process; split further only when scaling/isolation requires it. PostgreSQL and object storage should be managed independently and backed up off-host. Do not create services or incur new charges without owner approval.

Observed blockers on 2026-11-21 (from connected provider checks):
- Railway lists projects `ARIA Web` and `LEADORA`, not a separately verified VAYRO production project.
- VAYRO services observed in those projects were Offline; deployment records showed FAILED. A staged service change exists in ARIA Web and is not live.
- LEADORA web service was Offline; a 500 MB volume is mounted at `/data`. A volume is not a verified backup.
- Railway Automations/monitor inspection is unavailable through the current account integration.
- Supabase VAYRO-CORE reported ACTIVE_HEALTHY on PostgreSQL 17.11; migration registry query returned no entries; security advisor showed 11 informational RLS-enabled/no-policy findings; health advisor returned no findings.
- No production database writes, migrations, deploys, merges, secret changes or billing actions were performed.
These are time-stamped observations, not guarantees of current state. Recheck before acting.

## 15. Phased implementation and acceptance gates

### Phase 0 — inventory and authority
Deliverables: repo/PR/SHA inventory, actual source tree and stack, Railway project/service map, database/schema/migration map, secrets-presence matrix (no values), CI and backup evidence, product boundary map.
Gate: every claim links to exact source, provider observation or workflow run.

### Phase 1 — control-plane foundation
Implement: task/project contracts, auth/RBAC, policy decisions, audit trail, migrations, health endpoints and owner read-only dashboard.
Gate: authenticated task creation/read, authorization-negative tests, audit event and restart-persistent task state.

### Phase 2 — durable execution
Implement: scheduler, PostgreSQL lease queue, worker registration/heartbeats, idempotency, retry/backoff, timeout, cancellation, dead-letter state and outbox/inbox.
Gate: kill/restart worker during a test task; task recovers without loss or duplicate side effect.

### Phase 3 — engineering workflows
Implement: read-only GitHub observation, CI evidence ingestion, branch-scoped patch proposal and PR creation where permission exists.
Gate: full workflow completes without ChatGPT session; no automatic merge or production deploy.

### Phase 4 — product adapters
Implement one read-only health/status adapter per product, versioned contracts, auth, rate limits and bounded retries.
Gate: each product reports its own commit/deployment/runtime evidence while remaining functional if VAYRO-CORE is unavailable.

### Phase 5 — operations and recovery
Implement: health/uptime alerts, off-site encrypted backup, isolated restore drill, incident workflow and runbooks.
Gate: verified alert delivery, backup checksum, isolated restore and application invariants.

### Phase 6 — commercial controls
Implement cost allocation, per-product budget ceilings, license/subscription integration in sandbox, reconciled revenue/cost reports.
Gate: sandbox evidence and accounting reconciliation; no live charge until separately approved.

## 16. Required test matrix

- Unit: state transitions, policy evaluation, retry classification, idempotency.
- Integration: database transactions, outbox/inbox, lease reclaim, API auth.
- Concurrency: multiple workers claiming the same queue; prove one active lease per task.
- Resilience: worker termination, DB interruption, queue backlog, provider timeout, duplicate delivery.
- Security: unauthenticated access, cross-project/tenant access, role escalation, secret leakage, RLS bypass paths.
- Recovery: encrypted backup integrity, isolated restore, schema/data invariants.
- E2E: create task -> schedule -> claim -> execute -> persist result -> event -> report.
- Release: exact commit/artifact/deployment SHA matching and rollback rehearsal.

## 17. Authority model

Level 0 — read-only observation, reporting and evidence collection.
Level 1 — reversible documentation/code changes on isolated development branches, tests and PR creation.
Level 2 — approved staging execution, isolated restore drills and sandbox integrations.
Level 3 — production deploy, merge to protected branch, schema/data migration, IAM/secret changes, deletion, billing and public release; explicit owner approval required.

The automation identity must not be an owner. No self-approval, no privilege escalation, no bypass of branch protection and no hidden spending. If required permission is absent, mark BLOCKED and request the smallest specific owner action.

## 18. Evidence and status vocabulary

Every capability has four independent states:
- DESIGNED: specification exists.
- IMPLEMENTED: code/workflow exists in a known commit.
- TESTED: exact test ran against exact SHA and passed.
- OPERATIONAL: deployed in intended environment and observed with independent runtime evidence.

Allowed execution statuses: PASS, FAIL, IN_PROGRESS, UNVERIFIED, BLOCKED, NOT_RUN.
Every evidence item records repository/project, branch, commit SHA, workflow run ID, environment, deployment ID, timestamp, artifact/checksum and observation method. No estimated completion percentages.

## 19. Immediate execution order

1. Re-audit current PR #47 and source tree; keep all changes additive.
2. Resolve Railway service/project ambiguity and diagnose Offline/FAILED deployments without accepting staged changes.
3. Reconcile existing VAYRO-CORE schema and migration state; investigate RLS findings table-by-table.
4. Implement the smallest vertical slice in a development branch: task API + durable Postgres task table + lease worker + audit + restart-recovery tests.
5. Add default-branch scheduled checks only after workflow commands are verified and the change is approved for the default branch.
6. Configure and verify provider-native monitoring and off-site backup/restore only after access and isolated targets are confirmed.
7. Connect product status adapters one product at a time, read-only first.

## 20. Non-negotiable operating rules

- Preserve historical repositories, module IDs, contracts, crosswalks and archives. No unreviewed deletion or reduction.
- Never equate file count, module registry count, workflow existence, successful static test or healthy database control-plane status with operational product capability.
- Production is read-only unless the owner explicitly approves a specific operation.
- No merges, deployments, migrations, secret changes, billing, DNS changes or destructive actions without explicit approval.
- Never expose secret values or store them in source control.
- Never claim continuous background execution from ChatGPT. Only provider-hosted services and scheduled workflows can continue independently.
- If a tool, permission, credential or provider integration is unavailable, mark the corresponding capability UNVERIFIED/BLOCKED; do not simulate evidence.
