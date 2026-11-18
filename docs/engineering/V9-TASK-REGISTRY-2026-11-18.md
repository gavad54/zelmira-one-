# VAYRO V9 Task Registry — 2026-11-18

Baseline branch: `main`
Baseline SHA: `f0d31804e695cd3d73b452c7507affdca9573740`
Registry branch: `engineering/v9-task-registry-2026-11-18`
Scope: evidence-led engineering checkpoint. No production mutations, migrations, grants, policies, secrets, deployments, merges, releases, purchases, or destructive operations.

## Verified repository state

- Repository: https://github.com/gavad54/zelmira-one-
- Default branch: `main`; current ref resolves to `f0d31804e695cd3d73b452c7507affdca9573740`.
- Historical anchor `28e1990ade2a5dc6efd4656091ec9a135de83245` exists, authored 2026-11-18T05:48:32Z, unsigned. It is not main. Comparison main...28e1990 reports `diverged`, 533 ahead / 17 behind; this is not a safe integration base.
- PR #2 is MERGED (2026-11-09T18:07:01Z), merge commit `4e98a25503f94c2dc5d4ebc11a804f64d6568d5c`. Earlier reports describing it as open are stale.
- PR #31 is OPEN / DRAFT / unmerged; current PR head `7a0426421fe4942c840dee28f6ab9c1626d437c2`, base `feature/vayro-real-dashboard` at `a0a5ca910b0e4978a0efb912a389d04172beff21`. Exact-head VAYRO CI push run 44251679056 and PR run 44251684140 both completed with FAILURE on 2026-11-18. An earlier commit `28e1990...` also has VAYRO CI run 44246815056 with FAILURE.
- Exact main combined status endpoint reports only one success status context (Railway deployment status). The last main VAYRO CI and CodeQL successes are 43048676444 and 43048671466 from 2026-11-11; no fresh main CI/CodeQL run was found for 2026-11-18.
- The files `docs/RELEASE-GATES.md`, `docs/ARCHITECTURE.md`, and `docs/PRODUCT-BOUNDARIES.md` exist on main. The file `docs/verification/SCHEMA-RECONCILIATION-2026-11-17.md` was not found at the requested main path (404); do not assume it is present on main based on PR text.

## Task registry

| Task ID | Priority | Domain | Root cause / finding | Status | Acceptance evidence required |
|---|---|---|---|---|---|
| V9-001 | P0 | Git governance | Main remains at f0d3180; historical anchor 28e1990 is divergent and cannot be treated as current main | VERIFIED | Current ref and compare API snapshots |
| V9-002 | P0 | CI / PR31 | PR31 head 7a04264 is on a non-main base; exact-head CI runs 44251679056 and 44251684140 both failed | BLOCKED | CI, CodeQL and audit on exact PR head; independent review; no merge in this task |
| V9-003 | P0 | Dependency security | Earlier audit evidence reports 13 High findings, but the exact current main lockfile audit has not been freshly executed in this pass | IN_PROGRESS | Full current-lockfile advisory inventory, dependency paths, compatible patched versions, exact-head audit and tests |
| V9-004 | P0 | Database schema | Live VAYRO-CORE has 11 public tables; Prisma defines 15 models; MFA/AI models and Session columns are absent | BLOCKED | Object-by-object catalog diff, migration-chain rehearsal on verified isolated restore, forward/rollback evidence |
| V9-005 | P0 | Migration history | Live Supabase migration history is empty; no baseline is recorded | BLOCKED | Independently verified backup and isolated restore before baseline design/rehearsal; no production baseline action |
| V9-006 | P0 | Database IAM/RLS | All 11 public tables have RLS enabled but zero policies; Advisor reports 11 findings; grants observed only for postgres; production runtime identity unproven | BLOCKED | Least-privilege non-owner runtime roles and positive/negative two-tenant tests in isolated environment |
| V9-007 | P1 | MFA/session | Prisma/live catalog mismatch includes UserMfa, MfaRecoveryCode, AuthChallenge and Session lifecycle fields | BLOCKED | Exact schema compatibility plus enrollment, recovery, replay, revocation and expiry tests on isolated environment |
| V9-008 | P1 | Hosting | Railway workspace currently lists ARIA Web and LEADORA only; VAYRO service is nested in ARIA Web | BLOCKED | Independently approved VAYRO project/service, domain, secrets, health and rollback; no new spend without owner approval |
| V9-009 | P1 | Backup/DR | Latest main scheduled backup run 44067328879 failed; no verified external encrypted backup or isolated restore | BLOCKED | Off-host encrypted backup, checksum, isolated PostgreSQL 17 restore, measured RPO/RTO |
| V9-010 | P2 | Android | Debug APK artifact exists historically; official signing and real-device install/runtime evidence unavailable in this pass | UNVERIFIED | Reproducible signed release candidate, install/run/crash evidence on a real device |
| V9-011 | P2 | Product boundaries | Main product-boundary document exists; independent E2E evidence for seven specialist products not established | IN_PROGRESS | Per-product API, data ownership, auth, deploy, monitoring and E2E acceptance; ARIA excludes ERP/accounting, ARIANA owns ERP, LEADORA remains independent, DANA is platform capability |
| V9-012 | P3 | UAT/release | No owner UAT or release approval evidence supplied by live systems in this pass | NOT RUN | Recorded owner UAT, exact deployed SHA parity, signed release approval |

## Read-only live Supabase snapshot — 2026-11-18

Project `wdqhdnhpgxhmmfeyxwxr` is reported ACTIVE_HEALTHY (PostgreSQL 17.11). Inventory returned 11 public tables, all RLS-enabled; no migration records; zero rows in the table inventory. Security Advisor reports 11 RLS-enabled/no-policy findings. Performance Advisor reports 10 unused-index findings; Health Advisor returned no findings. Catalog grants observed in the executed query were postgres-only. These observations do not prove the production app's effective connection identity or tenant isolation.

## Read-only Railway snapshot — 2026-11-18

Accessible projects: `ARIA Web` and `LEADORA`; no dedicated VAYRO project. Service `VAYRO` in ARIA Web is live in production, one replica in iad, last deployment SUCCESS at 2026-11-11T15:28:15Z, domain `vayro-production.up.railway.app`, no custom domain, no volumes, and no service variable names. Tracing is disabled. This is not independent VAYRO hosting.

## Product boundary invariants

- ARIA must not contain accounting or ERP.
- ARIANA owns accounting and ERP.
- LEADORA remains an independent product boundary.
- ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA and PAYAM are not declared independently complete without end-to-end acceptance evidence.
- DANA is a platform AI/orchestration capability, not an additional standalone product.

## Execution and safety record

This checkpoint created only this task-registry branch and document. No production database writes, DDL, migrations, grants, policies, secrets, Railway configuration, deployment, PR merge, public release, purchase, or deletion were performed. No local build/test execution is claimed.
