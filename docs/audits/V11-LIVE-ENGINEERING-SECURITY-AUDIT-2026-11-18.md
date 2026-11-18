# VAYRO V11 — Live engineering and security audit
**Audit date:** 2026-11-18  
**Repository:** `gavad54/zelmira-one-`  
**Audited main SHA:** `f0d31804e695cd3d73b452c7507affdca9573740`  
**Database:** `VAYRO-CORE` / PostgreSQL 17.11 / `wdqhdnhpgxhmmfeyxwxr`  
**Decision:** **BLOCKED — NOT RELEASED**

> This is an evidence snapshot, not a claim that remediation or release acceptance is complete. All production database inspection in this audit was read-only.

## 1. Repository and pull-request status

- Default branch is `main`; repository is public and the connected GitHub identity reports admin/push permissions.
- Latest commit returned by the repository commit search is `f0d31804e695cd3d73b452c7507affdca9573740` (2026-11-11 15:28:13 UTC).
- The only combined status returned for that SHA is `ARIA Web - VAYRO: success`, a Railway deployment status. It is not evidence of current GitHub CI, CodeQL, dependency audit, integration tests or build.
- The workflow-run lookup for this SHA returned no PR-triggered workflow runs. Therefore current CI/CodeQL/dependency-audit status on main is **UNVERIFIED**, not PASS.
- The current PR #2 search result's description says it is open and unmerged. This conflicts with an earlier conversational report that it had merged; the current PR description is treated as the newer evidence. PR #2 must not be assumed merged.
- The repo search also surfaced PR #5 (owner dashboard/product catalog) and PR #31 (authentication rate-limit fail-closed change). Search result metadata did not expose authoritative state/head fields for every PR; do not infer mergeability or CI from their descriptions.
- Branch search returned `main` and `feat/owner-dashboard-secure-mainline`; a search for V11 branches returned none before this audit branch was created.

## 2. Live database evidence

Project is `ACTIVE_HEALTHY`, PostgreSQL 17.11. Read-only queries and Supabase advisors returned:

| Check | Observed result | Assessment |
|---|---:|---|
| Public tables | 11 | Inventory only |
| RLS enabled | 11/11 | Enabled, not sufficient |
| RLS policies | 0 | **BLOCKED** |
| FORCE ROW LEVEL SECURITY | 0/11 | **BLOCKED** |
| Table grants to anon/authenticated/service_role | 0 rows returned | No exposed-client table grants observed |
| `_prisma_migrations` table | absent | **BLOCKED** |
| Supabase migration history | empty | **BLOCKED** |
| Dedicated VAYRO runtime LOGIN role | not found in inspected role set | **BLOCKED / not proven** |
| `postgres` role | LOGIN, BYPASSRLS | Privileged administration identity; not acceptable proof of tenant runtime isolation |
| `service_role` | BYPASSRLS, NOLOGIN | Privileged role; must never be used as tenant-isolated runtime identity |
| Session live columns | only id, tokenHash, userId, expiresAt, createdAt | MFA/revocation lifecycle drift |
| UserMfa / MfaRecoveryCode / AuthChallenge live tables | absent | **BLOCKED** |
| Security Advisor | 11 RLS-enabled/no-policy findings | **BLOCKED** |
| Performance Advisor | 10 unused-index notices | Review only; no deletion authorized |
| Health Advisor | no findings | Service health only |

No DDL, DML, grants, policies, migration, role creation, secret change or production deployment was executed.

## 3. Prisma/live schema gap

The current `main` Prisma schema contains models `UserMfa`, `MfaRecoveryCode`, `AuthChallenge`, and Session fields `revokedAt`, `lastSeenAt`, `assurance`, `mfaAuthenticatedAt`. The live database inventory does not contain those three MFA tables or those four Session columns. The live `Session` table currently has only five columns.

The live catalog has 11 tables; the Supabase migration history is empty and `_prisma_migrations` is absent. A direct production `prisma migrate deploy` or baseline operation is unsafe until a verified backup/restore copy, object-by-object reconciliation, and forward/rollback rehearsal exist.

The current main Prisma schema includes tenant relations for Membership, License, AuditEvent and AiGeneration. This does not itself prove every API, query, job, storage operation or export is tenant-scoped.

## 4. RLS and role assessment

- RLS is enabled but there are no policies on any of the 11 public tables.
- FORCE RLS is not enabled on any of the 11 tables.
- The inspected roles show `postgres` has BYPASSRLS and LOGIN; `service_role` has BYPASSRLS. Neither proves a restricted application runtime.
- No dedicated VAYRO role was returned by the role-name inspection.
- No direct table grants to `anon`, `authenticated`, or `service_role` were returned from `information_schema.role_table_grants`; this is a positive exposure signal but does not replace inspection of schema grants, function EXECUTE, views, triggers, storage policies, or the actual application DB identity.
- Because there are no policies, it is unsafe to add broad generic `TO authenticated USING (true)` policies. The correct policies depend on the real application access model and a tested, non-owner runtime role.

**Tenant isolation: BLOCKED.** No positive and negative two-tenant tests against the actual production runtime role were performed.

## 5. MFA, session and authentication assessment

- Prisma schema has MFA and recovery-code models, but the corresponding live tables are absent.
- Live Session columns do not support the full lifecycle represented by the current Prisma model.
- A model or route existing in source is not evidence of an end-to-end deployed MFA flow.
- Current main CI/CodeQL results could not be freshly confirmed from the latest SHA.
- MFA enrollment, encrypted secret storage, one-time recovery-code consumption, TOTP replay prevention, session revocation, assurance elevation and privileged-owner enforcement remain **UNVERIFIED/BLOCKED** until tested end-to-end against a reconciled database.

## 6. Deployment, backup and release

- The latest main combined status contains a successful Railway status for the VAYRO service under the `ARIA Web` project. This is not independent VAYRO hosting or proof of runtime readiness.
- Prior backup workflow evidence recorded a failure at protected configuration validation because required injected inputs were empty. This audit did not re-run the backup workflow and therefore does not claim a new backup attempt.
- No successful external encrypted backup, remote checksum verification, isolated restore, measured RPO/RTO, Android signed release/device acceptance, owner UAT, or exact production commit parity was evidenced in this audit.
- Commercial release remains prohibited until all release gates pass and owner approval is recorded.

## 7. Security remediation priority

| Priority | Finding | Required safe remediation |
|---|---|---|
| P0 | 0 RLS policies, 0 FORCE RLS | Reconcile schema; design per-table policies; create restricted runtime roles; validate effective grants and two-tenant tests in isolated restored DB |
| P0 | No verified external backup/restore | Fix protected environment configuration without sharing secret values; create encrypted backup; verify remote checksum; restore into isolated PostgreSQL 17 |
| P0 | Empty migration history and live drift | Establish reviewed baseline only on verified disposable restore; test forward and rollback; never baseline blindly in production |
| P1 | Missing MFA tables and Session columns | Reconcile Prisma migrations and live catalog; implement and test migration on isolated DB before any production migration |
| P1 | Runtime role not proven | Create least-privilege LOGIN roles only after role matrix and isolated tests; verify actual application connection identity |
| P1 | Current main CI/CodeQL/dependency audit not confirmed | Trigger supported checks on exact current head; retain strict dependency threshold |
| P1 | Hosting is not independent | Provision dedicated VAYRO infrastructure only after cost/availability and isolation review; do not reuse ARIA/LEADORA resources |
| P2 | Ten unused-index notices | Measure workload and query plans; do not remove indexes solely from advisor notices |

## 8. V11 work performed

- Re-ran live repository, commit, status, PR-search, branch and documentation inspection.
- Re-ran live Supabase project, table/column/FK inventory, migration history and all three advisors.
- Executed read-only SQL checks for RLS policies, FORCE RLS, database roles, client-role table grants and Prisma migration-table presence.
- Created this audit branch from current `main` to preserve an inspectable V11 evidence record.
- No source-code or production changes were made because no verified isolated restored database is currently available for safe migration/RLS validation.

## 9. Weighted progress estimate

This is a conservative engineering-foundation estimate, not a release-readiness percentage. Only evidence on the audited mainline and live database is counted; unmerged PR work and unverified features are excluded.

| Domain | Weight | Conservative credited progress |
|---|---:|---:|
| Architecture and foundation | 15% | 6% |
| Backend and APIs | 15% | 3% |
| Frontend and UX | 10% | 2% |
| Database and schema | 10% | 2% |
| Tenant isolation and RLS | 15% | 0% |
| MFA and authentication | 10% | 1% |
| Security and privacy | 10% | 1% |
| DevOps and CI/CD | 5% | 1% |
| Tests and quality | 5% | 1% |
| Documentation and release | 5% | 3% |
| **Total** | **100%** | **20%** |

**V11 conservative progress estimate: 20%.** This is not a claim that 20% of the eleven products are commercially complete. No product should be marketed as independently production-ready based on this score.

## 10. Next execution gate

The next safe engineering sequence is:
1. Obtain an encrypted external backup and a successful isolated PostgreSQL 17 restore.
2. Use that isolated restore to reconcile all live objects against Prisma and migration SQL.
3. Build and verify restricted auth/platform/tenant runtime roles and table-by-table RLS policies.
4. Run positive and negative cross-tenant tests through the actual restricted application role.
5. Add and test MFA/session migrations and end-to-end flows on the isolated database.
6. Re-run CI, CodeQL and strict dependency audit on the exact proposed source commit.
7. Only then prepare a reviewed production migration and deployment plan.

**Release decision: BLOCKED — NOT RELEASED.**
