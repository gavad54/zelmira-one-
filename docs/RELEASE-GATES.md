# VAYRO release gates

**Current posture: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**

This document is the current source of truth as of 2026-11-17. It supersedes older status notes in this file and older references to PR #2 or earlier commit SHAs.

## Current repository evidence

- Repository: `gavad54/zelmira-one-`
- Active engineering branch: `feature/vayro-real-dashboard`
- PR: [#5](https://github.com/gavad54/zelmira-one-/pull/5)
- Last verified application-code commit: `05b9a29061885c3c32e37ef6299abd3b5d184de6` (2026-11-17). VAYRO CI, Dashboard Validation and CodeQL all completed successfully on this exact SHA.
- PR #5 is **open, draft, not merged**. No production deployment or public release is authorized.
- VAYRO CI [run 44060768378](https://github.com/gavad54/zelmira-one-/actions/runs/44060768378): success on the exact application-code commit above.
- Dashboard Validation [run 44060768155](https://github.com/gavad54/zelmira-one-/actions/runs/44060768155): success on the exact application-code commit above.
- CodeQL [run 44060768154](https://github.com/gavad54/zelmira-one-/actions/runs/44060768154): success on the exact application-code commit above. A successful scan does not by itself prove that all historical alert records are closed or formally dispositioned.
- The CI logs report 74 unit tests passed, 0 failed, and 23 PostgreSQL/HTTP integration tests passed, 0 failed. Prisma generation/validation, lint, TypeScript typecheck, production build and dependency audit completed successfully. Dashboard Validation also passed on the same application-code commit.
- The owner dashboard and the shared dashboard now display the count against the approved catalogue size; the owner-products API filters out legacy non-catalogue records without deleting them.

### Verified CI checks on current PR head

- Locked dependency installation and enforced dependency audit: passed.
- Unit tests on verified application-code commit `05b9a29061885c3c32e37ef6299abd3b5d184de6`: **74 passed, 0 failed**.
- PostgreSQL/HTTP integration tests on that commit: **23 passed, 0 failed**.
- Prisma client generation and schema validation: passed.
- Least-privilege roles in isolated PostgreSQL: passed.
- Full Prisma migration history on isolated PostgreSQL 17: passed.
- Isolated PostgreSQL logical backup and restore smoke test: passed; restored marker record and migration-history counts matched.
- Lint, TypeScript typecheck and production build: passed.
- PostgreSQL and production-HTTP integration workflow: passed.

The CI backup test is a disposable test-database exercise. It is **not** evidence of encrypted off-site production backups, independent production restore, or measured RPO/RTO.

## Work completed in this engineering slice

- Privileged-account MFA flow with TOTP and recovery-code support.
- MFA management API and Persian security settings UI.
- Recovery-code rotation and controlled MFA disablement for eligible non-privileged users.
- Confirm-before-swap authenticator replacement: old factor is proven before a pending encrypted factor is created; pending factor expires; new factor must be confirmed before promotion; recovery codes rotate; current session is revalidated and retained while other sessions are revoked.
- Tests cover invalid old-factor proof, pending state, invalid new-factor confirmation, successful replacement, recovery-code rotation, replay protection and current-session preservation.
- Session revalidation is performed inside the relevant database transactions to fail closed if the session was revoked concurrently.

Repository implementation does not equal production activation. Production MFA encryption-key custody, rotation/recovery and owner UAT remain unverified.

## Live VAYRO-CORE database inspection (read-only, 2026-11-17)

- Separate Supabase project was inspected; 11 public tables were found and estimated live row counts were zero.
- All 11 tables have RLS enabled.
- No table grants were returned for `anon`, `authenticated` or `service_role`.
- The `anon` and `authenticated` roles are non-login and do not have BYPASSRLS. The `service_role` has BYPASSRLS but cannot log in. The `postgres` role can log in and has BYPASSRLS.
- Supabase security advisor reports 11 informational `rls_enabled_no_policy` findings because the tables have RLS enabled without policies. With no client-role table grants, this is not evidence of client access; however, application access must remain server-mediated and the production database connection role must be reviewed and least-privileged before release.
- Supabase performance advisor reports 10 unused-index informational findings. With empty tables/no production workload, these are not grounds to remove indexes.
- Supabase migration history is empty. The existing tables were provisioned directly; Prisma migration baseline is not registered.
- No production DDL, grants, policies, data changes or migrations were performed during this inspection.

## Remaining blocking gates

- [ ] **Database baseline:** reconcile live catalog, Prisma schema and migration SQL; design and independently review a safe baseline. No production migration until an independently verified backup exists.
- [ ] **Production DB identity:** provision/review a dedicated least-privilege application role; verify actual runtime connection identity and access boundaries. Do not use a BYPASSRLS superuser-like role as the normal application identity.
- [ ] **RLS/policies:** decide and test the intended server-only access model; if client access is ever introduced, add tenant-scoped policies before granting it. Verify read, write, export and delete isolation.
- [ ] **MFA key custody:** set the production encryption key in protected runtime secrets, document custody/rotation/recovery and verify without exposing the key.
- [ ] **Independent backup/restore:** encrypted backup outside the hosting provider, independent access control, checksum verification and measured RPO/RTO restore exercise.
- [ ] **Hosting:** dedicated VAYRO hosting, protected environment variables, health monitoring, rollback and production commit verification.
- [ ] **Email:** approved provider, verified sender, protected credentials, end-to-end verification and password-reset delivery.
- [ ] **Authorization:** endpoint-by-endpoint review across all protected routes, including tenant-bound read/write/export/delete behavior and race conditions.
- [ ] **Security:** inspect and disposition repository CodeQL/dependency alert records; verify CSP, headers, CORS, abuse controls, privacy flows and independent security review.
- [ ] **Commercial operations:** idempotent payment webhooks, invoicing, refunds, reconciliation, entitlement transitions and legal review.
- [ ] **Product operations:** each family product needs its own working workflows, scoped service identities, versioned contracts, health checks and failure handling. Catalogue entries are not complete products.
- [ ] **Android:** reproducible Android build, official release signing and real-device acceptance on the approved commit.
- [ ] **UAT:** owner and representative-user acceptance with evidence.
- [ ] **Governance:** explicit owner approval for merge, production deployment and release after all applicable gates pass.

## Safety constraints

- Work only on the development branch and isolated test environments unless a separately approved production change is in scope.
- Do not merge, deploy, run production migrations, modify production grants/policies, collect customer data, enable payments or onboard customers while any required gate is open.
- Do not reuse ARIA infrastructure, credentials, database or storage for VAYRO.
- Never expose secrets, recovery codes, MFA seeds or encryption keys in logs, commits or reports.
- A green CI run is evidence for that commit and those checks only; it is not a production-readiness or commercial-release certification.

**Release decision: BLOCKED.**

## Latest verified engineering update — 2026-11-17 07:17 UTC

This section supersedes older commit identifiers and CI run references above.

- Current PR #5 head at this verification: `cad0a4c7b155f0b02f7bf44732bbe790f76ba28b`; PR remains open, Draft and unmerged.
- VAYRO CI [44037240669](https://github.com/gavad54/zelmira-one-/actions/runs/44037240669), Dashboard Validation [44037240710](https://github.com/gavad54/zelmira-one-/actions/runs/44037240710), and CodeQL [44037240679](https://github.com/gavad54/zelmira-one-/actions/runs/44037240679) all completed successfully on this exact commit.
- Verified checks: 69 unit tests passed; 23 PostgreSQL/production-HTTP integration tests passed; locked dependency audit reported zero vulnerabilities; Prisma validation, isolated least-privilege PostgreSQL role setup, all repository migrations, isolated logical backup/restore, lint, TypeScript and production build passed.
- New session regression coverage proves that a future `lastSeenAt` value is rejected by both tenant authorization and the public `/api/auth/me` session endpoint. The owner-session guard also rejects future activity timestamps.
- Owner email-confirmation integration coverage now verifies successful confirmation, one-time token replay rejection, and rejection of disabled contacts. The confirmation write rechecks `enabled=true` atomically, preventing a concurrent disable from being overwritten by verification.
- These are repository and isolated-CI results only. They do not verify production database migration, production backup/restore, production key custody, live email delivery, hosting, billing, Android, independent product operation or owner UAT.
- Release posture remains **DEPLOYMENT BLOCKED — NOT RELEASED**. No merge, production deployment, production database change, payment activation or customer onboarding was performed.


## CI readiness-role correction — 2026-11-17 08:06 UTC

- Fresh PR #5 head before this correction was `72213244b211b6e3ef60736cb196daf8d1a48fb6`.
- VAYRO CI run [44042302299](https://github.com/gavad54/zelmira-one-/actions/runs/44042302299) failed only in the production-HTTP integration suite: 22/23 tests passed. The failing assertion expected `/api/ready` to report the database role as `ok`, but the route correctly returned `not_configured`.
- The CI workflow connects using the PostgreSQL container bootstrap account (`POSTGRES_USER=ci`), which is a superuser. The readiness endpoint deliberately rejects superuser/BYPASSRLS database identities. The implementation is fail-closed; the test expectation was incorrect.
- Corrected the integration assertion to expect `not_configured` for this CI-only superuser and clarified the workflow step name: it creates client roles for privilege-boundary assertions; it does **not** establish or test a least-privilege application runtime role.
- The corrected commit `3473791a0bdb8278b14aa296dc53bbe05d2f1553` passed [VAYRO CI](https://github.com/gavad54/zelmira-one-/actions/runs/44044233259): 69/69 unit tests, 23/23 PostgreSQL/HTTP integration tests, zero dependency vulnerabilities, and successful Prisma validation/migrations, isolated backup/restore, lint, typecheck and production build. [Dashboard Validation](https://github.com/gavad54/zelmira-one-/actions/runs/44044233205) and [CodeQL](https://github.com/gavad54/zelmira-one-/actions/runs/44044233131) also passed on that exact SHA. This validates the readiness fail-closed behavior in CI; it does not test a least-privilege application runtime role. The dedicated production runtime database role remains unprovisioned/unverified. Because the live schema has RLS enabled without policies and the application does not yet establish a reviewed tenant-aware RLS context, do not create or switch the production runtime role by guesswork.
- No production database, policy, grant, secret, deployment or customer data was changed.

**Release remains BLOCKED — NOT RELEASED.**


## Verified engineering checkpoint — 2026-11-17 (eleven-app catalogue and owner dashboard)

**Application-code commit:** `8f96fef52331c98d03743ed79f89ce0e5ee16dc4`  
**PR:** [#5](https://github.com/gavad54/zelmira-one-/pull/5), open, Draft and unmerged.

### Completed in this checkpoint

- Corrected the server-side product catalogue to exactly eleven independent apps: ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM, LEADORA, ARIANA, ARIA and ARMIN MARKET.
- DANA is explicitly the shared AI intelligence/management/orchestration command plane, not a twelfth app and not part of the eleven-app catalogue.
- Preserved the ARIA exclusion of accounting/ERP and the ARIANA accounting/finance/tax/ERP boundary.
- Updated the owner dashboard labels and denominator; the API now returns the authoritative catalogue size and filters displayed products to the approved eleven keys.
- Legacy DANA product rows are not deleted or mutated. They are excluded from the independent-app dashboard response and product count, preserving historical data.
- Added integration coverage proving a legacy DANA row is not exposed as a standalone app, the product metric matches the approved catalogue response, and the catalogue size is eleven.
- Updated README, architecture, product boundaries, brand naming, central dashboard, platform blueprint and dated verification records to use the same portfolio definition.

### Exact-commit verification

On the application-code commit above:

- VAYRO CI [run 44058691845](https://github.com/gavad54/zelmira-one-/actions/runs/44058691845): **success**.
- Dashboard Validation [run 44058692221](https://github.com/gavad54/zelmira-one-/actions/runs/44058692221): **success**.
- CodeQL Security Analysis [run 44058691959](https://github.com/gavad54/zelmira-one-/actions/runs/44058691959): **success**.
- Unit tests: **74 passed, 0 failed**.
- PostgreSQL/production-HTTP integration tests: **23 passed, 0 failed**.
- Enforced dependency audit: **0 vulnerabilities**.
- Prisma generation/schema validation, isolated PostgreSQL migration history, isolated backup/restore smoke test, lint, TypeScript typecheck and production build: **passed**.

These results apply to the cited application-code commit and the listed checks only. The CI backup/restore test is isolated PostgreSQL evidence, not proof of encrypted offsite production backup or independent production restore.

### Remaining blockers — unchanged

- Live VAYRO-CORE migration baseline and safe schema reconciliation.
- Dedicated least-privilege production runtime database identity and effective-privilege verification.
- Production MFA encryption-key custody, rotation/recovery and owner UAT.
- Independent encrypted off-provider backup and measured restore exercise.
- Dedicated VAYRO hosting; Railway free-plan resource provisioning limit remains unresolved.
- Verified transactional email delivery, production secrets, DNS/domain and monitoring/rollback.
- Complete endpoint-by-endpoint authorization and independent security review.
- Operational implementation, health checks, scoped APIs and acceptance evidence for each of the eleven independent apps.
- Commercial billing, payment webhooks, invoicing, refunds, reconciliation and legal review.
- Android reproducible build, official signing and real-device acceptance.
- Owner and representative-user UAT and explicit release approval.

No production database, external product repository, paid resource, production secret, domain, deployment, merge, payment or customer data was changed in this checkpoint.

**Release posture: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**


## Latest verification — 2026-11-17 14:14 UTC

- PR #5 head verified: `2e74b824750d21228ab94870c262d1c42ec37669`; PR remains open, Draft, and unmerged.
- All seven GitHub check runs attached to this exact head completed successfully: VAYRO CI, Dashboard Validation, CodeQL, and their associated validation/analyzer jobs. CodeQL reported no new alerts in code changed by this PR.
- The legacy commit-status endpoint reports `pending` with zero status contexts; the authoritative check-runs endpoint reports all seven check runs completed with `success`. No failing or in-progress check run was observed.
- This head is a documentation-only update after the last separately documented application-code test checkpoint. Do not infer that the 74 unit and 23 integration test counts were rerun on this documentation commit; those counts remain attached to the cited application-code SHA in the preceding checkpoint.
- PR mergeability is reported true by GitHub, but draft status and open release gates remain. No merge or deployment was performed.

### Fresh read-only VAYRO-CORE check — 2026-11-17 14:14 UTC

- Supabase still reports 11 public application tables, all empty by estimated row count and all with RLS enabled.
- The live `Session` table still has only five columns: `id`, `tokenHash`, `userId`, `expiresAt`, `createdAt`. It lacks `assurance`, `mfaAuthenticatedAt`, `revokedAt`, and `lastSeenAt`.
- `MfaCredential`, `MfaLoginChallenge`, and `MfaRecoveryCode` remain absent. Supabase migration history remains empty.
- Roles `anon` and `authenticated` cannot log in and do not bypass RLS. `service_role` cannot log in but has BYPASSRLS. `postgres` can log in and has BYPASSRLS. The proposed `vayro_app` role is absent.
- Security advisor continues to report 11 informational RLS-enabled-without-policy findings. No policy, grant, schema, role or data mutation was made.

**Decision unchanged: DEPLOYMENT BLOCKED — NOT RELEASED.**


## Live VAYRO-CORE schema drift audit — 2026-11-17 14:20 UTC

A read-only live database inspection was recorded in [PRODUCTION-DB-DRIFT-2026-11-17.md](verification/PRODUCTION-DB-DRIFT-2026-11-17.md).

- Eleven public tables exist and all had RLS enabled, but the security advisor reports eleven RLS-enabled/no-policy findings.
- Supabase migration history is empty although application tables already exist. Do not replay the initial create-table migration blindly.
- The three MFA tables expected by Prisma are absent. The live Session table lacks `revokedAt`, `lastSeenAt`, `assurance`, and `mfaAuthenticatedAt`.
- The inspected `postgres` role can log in and bypass RLS; no dedicated application runtime role was found in the inspected role set.
- These findings establish production schema drift and reinforce the deployment block. No production DDL, grants, policies, migration, secrets, or data were changed.
- Next engineering gate is a reviewed schema-diff/baseline design plus isolated migration and tenant-RLS/runtime-role tests. Production execution requires a separately reviewed change plan, verified backup/restore evidence, and owner approval.

**Release remains BLOCKED — NOT RELEASED.**


## Verified schema reconciliation checkpoint — 2026-11-17 (latest)

This section supersedes older status notes above where they conflict.

- Current branch head at authoring time: `74f3b6f58ab52ef62c1c9ed3afb4866f9e9992c4`; PR #5 remains open, Draft and unmerged.
- Added [SCHEMA-RECONCILIATION-2026-11-17.md](verification/SCHEMA-RECONCILIATION-2026-11-17.md), based on live read-only inspection and review of all six repository migration SQL files.
- Added [live-schema-inventory.sql](../prisma/verification/live-schema-inventory.sql), a reusable SELECT-only inventory script for columns, types, constraints, indexes, enums, RLS policies, roles, grants and migration history.
- Confirmed that the initial migration's 11 tables, inspected columns, timestamp precision, six enum definitions, primary/foreign keys and initial indexes correspond to the live catalog. This is object-shape evidence only; ownership and effective privilege equivalence still require separate verification before baseline acceptance.
- Confirmed missing later-migration objects: three MFA tables; `Session.assurance`, `mfaAuthenticatedAt`, `revokedAt`, `lastSeenAt`; `SessionAssurance`; `Session_userId_revokedAt_idx`; and the pending-factor columns/check constraint (the parent MFA table is absent).
- Migration history remains empty. The initial migration must not be replayed blindly. Baseline resolution is not authorized until backup/restore rehearsal and full privilege/ownership reconciliation pass on a disposable copy.
- No production SQL mutation, grants, policies, role change, migration bookkeeping, secret access or deployment occurred.
- New-head CI/check runs were still queued/in progress at the time of this commit; do not mark them green until polled on the exact resulting SHA.

**Next gate:** prove backup restore on a separate disposable database, complete privilege/ownership comparison, rehearse initial-migration baseline plus five subsequent migrations, and test tenant isolation with a dedicated least-privilege runtime identity. Production remains **BLOCKED — NOT RELEASED**.


## CI security and recovery checkpoint — 2026-11-17 (HEAD ab78b758)

See [VAYRO-CI-SECURITY-RESTORE-2026-11-17.md](verification/VAYRO-CI-SECURITY-RESTORE-2026-11-17.md) for the run-specific evidence.

- On exact HEAD `ab78b75874e9fb1b3146d3d6ffa4451495a1c8a9`, Dashboard Validation and CodeQL passed.
- VAYRO CI passed all unit, Prisma migration-contract, idempotency, baseline rehearsal, isolated PostgreSQL logical backup/restore, lint, typecheck, production build and PostgreSQL/HTTP integration steps.
- The strict dependency audit then failed: 13 high-severity vulnerabilities, including GHSA-fc5q-39xc-vjpf / CVE-2026-112366 affecting picomatch through 4.0.7. The current advisory has no verified fixed release. Proposed upstream 2.x/4.x fixes remain open and unmerged. No unverified override, forced major upgrade, audit suppression or threshold reduction was applied.
- The isolated restore test verified a marker row and migration-history count after `pg_dump` / `pg_restore`. This is not a production backup, encrypted off-site copy, PITR test, or production restore.
- No production schema, grants, policies, secrets, data or deployment were changed.

**Decision: SECURITY GATE BLOCKED; DEPLOYMENT BLOCKED — NOT RELEASED.**
