# Autonomous Operations Control Plane — 2026-11-21

## Purpose

VAYRO and its independent products must keep running, testing, backing up, and producing operational evidence while no ChatGPT conversation is open. ChatGPT is not the runtime host. Durable work belongs to GitHub Actions, Railway, PostgreSQL/Supabase, and off-site object storage. A scheduled ChatGPT task is an audit/orchestration layer only; it is not a substitute for service processes or provider-native monitoring.

## Product and trust boundaries

- VAYRO is the parent platform.
- DANA is an internal orchestration/control capability of VAYRO, not an unrestricted administrator.
- ARIA, ARIANA, LEADORA, and ARMIN MARKET remain separate products with independent repositories, data boundaries, identity/authorization, APIs, deployment and release gates.
- ARIA must not acquire accounting/ERP. ARIANA owns accounting/ERP/tax. LEADORA owns distribution operations.
- ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA and PAYAM remain in the product family; do not label them independently operational until independent runtime and end-to-end evidence exist.
- Any background agent must use least privilege, protected environments, auditable actions, bounded retries, and explicit approval gates for production-impacting operations.

## Desired operating model

### 1. Continuous integration and scheduled verification

For each independent repository:
- Run tests, static analysis, dependency/security audit and build on pull requests and pushes.
- Run a scheduled verification from the repository's default branch (daily is the initial target), with concurrency controls and bounded timeouts.
- Store test summaries and machine-readable evidence as workflow artifacts; retain enough history to compare failures.
- Use a dedicated workflow identity with read-only repository permissions unless a specific job demonstrably requires more.
- Do not run a schedule only on an unmerged feature branch and assume it will execute: GitHub scheduled workflows are evaluated from the default branch.
- Do not treat a debug APK build as a signed release or device test.

### 2. Runtime health and incident detection

For each Railway production service:
- Maintain a provider-native health check and external HTTP check.
- Alert on deployment failure/crash, zero healthy replicas, repeated restarts, elevated 5xx/latency, exhausted disk/volume, and missed scheduled jobs.
- Send alerts to a durable channel with timestamps, service, environment, deployment SHA and runbook link.
- Keep application readiness separate from process liveness; readiness must verify required dependencies without exposing secrets.
- Monitor the actual product service, not a similarly named service in another project.

### 3. Backup and restore

- PostgreSQL backup must run from a protected GitHub Actions environment or a dedicated backup worker, use a least-privilege database role, encrypt before upload, and write to a private off-site bucket.
- Verify object presence, byte length, checksum and retention/immutability metadata. Never expose database URLs, encryption identities or cloud credentials.
- Restore drills must target a separate isolated database host/project, never production. Require explicit manual dispatch and a confirmation input.
- A successful dump/upload is not a successful restore. A restore is accepted only after schema, row-count and application invariants pass.
- Report the most recent successful backup timestamp, artifact key (redacted where appropriate), checksum result, retention and latest successful restore drill.
- A workflow file in a PR branch is a proposal until merged and observed running from the default branch.

### 4. Database and tenant security

- Maintain versioned migrations in source control and compare repository migration history with the live database migration registry.
- Review table grants, RLS enablement, policies, FORCE RLS, service-role bypass, tenant predicates and negative cross-tenant tests.
- Do not add blanket RLS policies to silence linter findings. Determine intended access by table and runtime role first.
- Production schema/data changes require a separate approved migration and a verified backup/restore path.

### 5. Scheduled orchestration and evidence

- Provider-native CI, backup schedules, runtime monitors and alerts continue independently of ChatGPT.
- A daily ChatGPT automation may inspect provider evidence and prepare a concise change report, but it does not keep Railway services alive, execute a backup by itself, or guarantee that external providers are reachable.
- Keep one consolidated daily family-wide audit rather than several duplicate reports.
- Every reported state must include observation time, repository/project/environment, exact commit/deployment identifier, and a link or artifact. Use PASS, FAIL, IN_PROGRESS, UNVERIFIED, BLOCKED, or NOT RUN accurately.

## Live baseline observed on 2026-11-21

### Railway

The connected Railway account lists two projects: `ARIA Web` and `LEADORA`. It does not list a distinct project named VAYRO.

- In `ARIA Web` / `production`, service `VAYRO` is sourced from `gavad54/zelmira-one-` branch `main`. Its latest deployment record is `FAILED` (2026-11-09). Runtime status returned `Offline`. A separate service creation/update is staged, not live; it is sourced from branch `brand/vayro-name-only`. Do not accept or deploy this staged patch without owner review.
- In `LEADORA` / `production`, service `leadora-web` is sourced from `gavad54/LEADORA` branch `main`, has a 500 MB volume mounted at `/data`, and runtime status returned `Offline`. Its latest deployment field was empty.
- The `LEADORA` Railway project also contains a second service named `VAYRO`, sourced from the VAYRO repository on branch `security/mfa-session-endpoint-gates`; its latest deployment record is `FAILED` (2026-11-09) and runtime status returned `Offline`.
- No cron service was present in either described production environment.
- Railway monitor/automation inspection was unavailable through the connected account; do not infer that monitors exist or are configured.

These observations indicate that the current Railway layout does not yet demonstrate an independent, healthy VAYRO production project. Do not move, rename, delete or deploy services as an automatic correction.

### Supabase VAYRO-CORE

- Project `wdqhdnhpgxhmmfeyxwxr` returned `ACTIVE_HEALTHY`, PostgreSQL 17.11.
- The Supabase migration-list endpoint returned an empty migration registry. This does not prove the database has no schema; it means the migration registry was not populated/visible through that endpoint.
- The security advisor returned 11 informational `rls_enabled_no_policy` findings. RLS is enabled but no policies were found on those tables. This is not proof of public data exposure; default-deny behavior and service-role bypass/grants must be verified table by table before deciding remediation.
- The health advisor returned no findings at the observation time.
- No production database writes or migrations were performed.

### GitHub workflows

- VAYRO PR #47 contains an encrypted off-site backup workflow with a daily cron and a separately gated, manually dispatched isolated restore drill. The backup job is guarded to run only on `main`. Its existence on an unmerged branch is not evidence that the default branch is running it.
- The inspected ARIA, ARIANA, LEADORA and ARMIN MARKET workflow files run on pushes and/or pull requests; no scheduled test trigger was present in the inspected files.
- Do not add scheduled workflows to feature branches and claim continuous operation. First validate the workflow on the default branch through an approved merge or an explicitly approved separate default-branch change.

## Release and authority gates

No automatic merge, production deploy, DNS change, database migration, secret rotation, billing action, destructive operation or public release is authorized by this runbook. Production changes require explicit owner approval, protected secrets, an independently verified backup, a successful isolated restore, and the relevant product's release gates.

## Immediate engineering sequence

1. Resolve Railway ownership/layout: establish one explicitly named VAYRO project and remove cross-product service ambiguity only after the owner approves a migration plan and data-preservation checks. Do not alter the existing projects automatically.
2. Determine why the current VAYRO and LEADORA production services are offline and why their latest deployments failed; inspect deployment logs and configuration without revealing secret values.
3. Validate the VAYRO backup workflow's required protected variables and encryption/storage setup using presence checks only; run a real backup and restore drill only through the protected workflows after configuration and isolated target are verified.
4. Reconcile Prisma/source migrations with the live VAYRO-CORE schema and migration registry. Investigate all 11 RLS findings against intended roles and tenant access; do not add blanket policies.
5. Add default-branch scheduled CI for each product after workflow commands are validated and approved for merge. Keep per-product build/test evidence separate.
6. Configure provider-native uptime/replica/deployment/volume alerts and a durable notification destination. Verify each alert delivery with a harmless test event.
7. Continue the family-wide daily audit and record deltas, exact SHAs, run IDs and blockers.

## Status semantics

- `PASS`: the exact operation ran successfully and has independent evidence.
- `FAIL`: an executed check or operation failed.
- `IN_PROGRESS`: the operation is running and has not concluded.
- `UNVERIFIED`: evidence or access is missing.
- `BLOCKED`: a required dependency, permission or approval is absent.
- `NOT RUN`: no execution was attempted.

Never convert a design, workflow file, PR, staged change, healthy database control-plane status, or successful static test into a claim of production readiness.
