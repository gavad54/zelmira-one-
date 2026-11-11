# VAYRO live execution checkpoint — 2026-11-11

## Purpose

Evidence-based checkpoint after PR #15 was merged. This document records read-only checks performed on 2026-11-11. It does not claim backup, restore, tenant-isolation, or release completion.

## Repository and deployment

- Repository: `gavad54/zelmira-one-`
- Default branch: `main`
- Main HEAD observed: `cbad8640f033eecb456c91f282ca4e819bab1409`
- Commit signature: GitHub API reports `verified: true`.
- PR #15 is already merged; do not repeat its merge.
- Railway project: `ARIA Web` (`c936dddd-5aa7-46d9-bd04-aa77f2164586`)
- Production environment: `468fda02-2199-4520-8c7e-6b589d3ceb0a`
- VAYRO service: `ea06b2d7-b28e-462e-9251-2613af769d8e`
- Latest deployment: `63069f8a-bec0-4572-969a-5ef079ce7a19`
- Deployment status: `SUCCESS`; environment status: `online`; 1/1 replicas running; 0 recent failures; 0 active warning/critical notifications in the queried window.
- Deployment commit: `cbad8640f033eecb456c91f282ca4e819bab1409`
- Railway domain: `vayro-production.up.railway.app`; Railway-managed; no custom domain was listed.
- No Railway volume or bucket was attached to the VAYRO service in the inspected environment.
- Existing staged Railway patch `b9d85124-4dfe-42fe-8fe2-136f239987b0` remains staged, with a staged-create service from `brand/vayro-name-only`. It was not applied or discarded.

## GitHub governance findings

- GitHub branch metadata reports `main.protected = false`.
- Repository rulesets endpoint returned an empty list (`[]`).
- The branch-protection detail endpoint returned HTTP 403 for the connected integration. No write capability for branch protection or repository rulesets is exposed in the available GitHub actions.
- Therefore branch protection is confirmed absent from branch metadata, and cannot be enabled with the currently exposed integration.
- Repository Actions Environments and their required-reviewer settings could not be read through the available integration. Do not assume `vayro-backup` or `vayro-restore` exists or is protected.
- The backup workflow uses `workflow_dispatch` and a daily schedule (`17 2 * * *`, UTC) and targets the `vayro-backup` Environment.
- The restore workflow is manual-only and targets the `vayro-restore` Environment. It requires the exact typed confirmation string, but the runbook correctly states that this string is not authorization; Environment approval is required.
- A scheduled backup run targeting an Environment with required reviewers will wait for approval. This is not an unattended daily backup guarantee.

## Backup/restore workflow code review

Files inspected on `main`:

- `.github/workflows/vayro-db-backup.yml` blob SHA: `3fdc2ad425034399d42eefc03e35651610f7554d`
- `.github/workflows/vayro-db-restore-drill.yml` blob SHA: `007e3b4e2ee38257c18f0ec6872ec023baa06c37`
- `docs/BACKUP-RESTORE-RUNBOOK.md` blob SHA: `0579f2b6c8f329b69a61954916e302e36a414edc`

Observed controls:
- Backup uses PostgreSQL 17 custom-format dump, age public-key encryption, private B2 S3-compatible upload, and remote object-size checks.
- Restore verifies the SHA-256 sidecar, decrypts with a protected identity, checks archive readability, requires PostgreSQL 17, checks that source and target hostnames differ, refuses a non-empty target, and restores with `--exit-on-error`.
- Restore workflow then checks that user relations exist.
- The runbook explicitly requires additional application-level schema/object inventory, row-count and invariant validation, measured RPO/RTO, and a second independent restore drill.
- Backup size checks are not a cryptographic read-back verification of the stored object; the restore path performs checksum verification after download.
- Hostname inequality is a guardrail, not proof of separate physical infrastructure; independently verify the target database and network route.

Not evidenced:
- No B2 bucket, scoped B2 key, age key pair, GitHub Environment variables/secrets, successful backup run, uploaded encrypted object, or successful restore drill was verified.
- No evidence of retention/lifecycle policy or tested recovery of application file/object storage, Railway volumes, configuration, database roles/grants, or external integrations.

## VAYRO-CORE live read-only audit

Project: `VAYRO-CORE` (`wdqhdnhpgxhmmfeyxwxr`)

- Status: `ACTIVE_HEALTHY`
- Region: `eu-central-1`
- PostgreSQL: `17.11.0.018`
- Eleven public tables were returned by the live table inventory.
- All eleven tables have RLS enabled.
- Security Advisor reports 11 `rls_enabled_no_policy` findings: every inspected public table has RLS enabled but no policy.
- Migration history returned an empty list.
- All eleven tables reported zero rows in the inspected table inventory.
- Performance Advisor reports 10 unused-index findings. These are informational and are not grounds for deleting indexes without workload evidence.
- No production schema or data changes were made during this checkpoint.

Important: RLS enabled with no policies is not tenant isolation. Do not add generic policies or disable RLS to silence the advisor. Policy design must follow the actual application access model and be tested with distinct tenant identities. Do not migrate production until an independently verified backup and restore exists and the Prisma/live schema baseline is reconciled.

## Current blocker register

| ID | Priority | Blocker | Evidence / next gate |
|---|---|---|---|
| B-01 | P0 | Real encrypted offsite backup | Owner-provisioned private B2 bucket, least-privilege key, protected GitHub Environment, successful run and verified remote object |
| B-02 | P0 | Independent restore drill | Separate disposable PostgreSQL 17 host/database, protected restore Environment, successful restore and application-level validation |
| B-03 | P0 | Live DB/schema reconciliation | Empty migration history and live schema mismatch; reconcile baseline only after B-01/B-02 |
| B-04 | P0 | Tenant isolation | 11 RLS tables with zero policies; design and cross-tenant negative tests required |
| B-05 | P0 | MFA/session/endpoint authorization | Live schema previously found to lack expected MFA/session fields; re-audit code and live flows after backup gate |
| B-06 | P1 | GitHub main-branch governance | `main` reports unprotected and no rulesets; current integration lacks write/admin capability |
| B-07 | P1 | Independent product runtimes | Product registry/specifications do not prove eleven operational independent apps |
| B-08 | P1 | Android/UAT | Device-level build/install/run and user acceptance evidence still missing |

## Decisions and safety constraints

- No production SQL, migration, RLS policy, grant, or data change was executed.
- No Railway staged patch was applied or discarded.
- No backup or restore workflow was dispatched because required protected configuration and Environment protections are unverified.
- No secret values were requested or exposed.
- Keep overall release status at `DEPLOYMENT BLOCKED`.

## Next execution order

1. Obtain repository-administration capability to enable branch protection/rulesets and verify required checks.
2. Verify/create `vayro-backup` and `vayro-restore` Environments with owner-required approvals and branch restrictions.
3. Owner provisions the private B2 bucket, least-privilege key, age recipient/identity, and separate restore database. Store values only in the matching GitHub Environment settings.
4. Run a protected manual backup; verify the object and checksum evidence.
5. Run the isolated restore drill; compare schema/object inventory, row counts and application invariants; measure RPO/RTO; repeat independently.
6. Only then reconcile Prisma/live schema and prepare reviewed migration baseline.
7. Design least-privilege RLS policies from the real auth/tenant model and run cross-tenant access tests.

## Limitations

This checkpoint is a GitHub audit document only. It does not change application behavior, production data, secrets, GitHub administrative settings, or Railway infrastructure. The available integration cannot write repository branch-protection settings or inspect GitHub Environment secrets/reviewer configuration. Continuous background work after this conversation is not available.


## Pull-request and documentation reconciliation — 2026-11-11 09:10 +03:30

A fresh repository-wide pull-request listing supersedes stale PR-state statements in older documents:

| PR | Current GitHub state | Head | Disposition |
|---|---|---|---|
| #2 — VAYRO rebrand | CLOSED / MERGED (2026-11-09) | 255f6d9a521e5e29ecbac7f11ab66ff7f25baa9d | Already in main; do not repeat |
| #6 — MFA/session/authorization | CLOSED / MERGED (2026-11-09) | 93108e0d95ff940e9855f8fdc3ef4f37063b1043 | Already merged; re-audit production behavior, do not treat PR description as live proof |
| #12 — backup/restore engineering | OPEN / DRAFT / UNMERGED | 73e8bdaf117ab264c69cb9739e1f525bdaa0632d | Keep separate; do not merge wholesale |
| #13 — ARVAND product definition | OPEN / DRAFT / UNMERGED | b5edb5b79f26d615e53a2975e7dcc3cbe208243d | Documentation/specification only; no operational product proof |
| #14 — product governance | OPEN / DRAFT / UNMERGED | 06fad29c312718507747a18cf057b97e0697678a | Keep separate pending review |
| #15 — backup/restore workflow bootstrap | CLOSED / MERGED (2026-11-11) | 945a1c9a53f505ea4e562bb1d4b3cebd4baf2683 | Already in main; do not repeat |
| #16 — execution checkpoint | OPEN / DRAFT / UNMERGED | 271869564e8cffb701a8cd2822d1c5a28195f79a | This checkpoint; CI and CodeQL passed on this exact head before this addendum |

The current docs/RELEASE-GATES.md still contains obsolete statements that PR #2 is open/draft and references older source heads. Treat it as historical until corrected against live GitHub state. The live PR metadata is authoritative for merge state.

Exact PR #16 head evidence before this addendum:
- VAYRO CI run 42952219998, run number 1197: completed / success.
- CodeQL run 42952219849, run number 1160: completed / success.
- Combined commit status endpoint returned no separate status contexts; workflow-run records above are the positive evidence.
- Any update to this document creates a new PR head and requires fresh exact-head CI/CodeQL verification. Prior successful runs do not certify a later commit.

Additional finding: the repository PR listing exposes PR #13, which was not included in the previous short PR inventory. It is a product definition/specification and does not establish an operational ARVAND runtime.
