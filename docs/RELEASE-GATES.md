# VAYRO release gates

**Current posture: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**

This document is the current source of truth as of 2026-11-17. It supersedes older status notes in this file and older references to PR #2 or earlier commit SHAs.

## Current repository evidence

- Repository: `gavad54/zelmira-one-`
- Active engineering branch: `feature/vayro-real-dashboard`
- PR: [#5](https://github.com/gavad54/zelmira-one-/pull/5)
- Last fully verified application-code head: `c489b97f3fe9b10dd7cfd63ac0c0fa1ecb71e3d4`. The subsequent release-gate document refresh is documentation-only; always read the live PR head and its own workflow runs before treating a newer commit as verified.
- PR #5 is **open, draft, not merged**. No production deployment or public release is authorized.
- VAYRO CI [run 44020434688](https://github.com/gavad54/zelmira-one-/actions/runs/44020434688): completed successfully on the verified application-code head above.
- Dashboard Validation [run 44020434855](https://github.com/gavad54/zelmira-one-/actions/runs/44020434855): completed successfully on the verified application-code head above.
- CodeQL PR analysis [run 44020435183](https://github.com/gavad54/zelmira-one-/actions/runs/44020435183): completed successfully on the verified application-code head above. This records a successful scan; it does not by itself prove that all historical alert records are closed or formally dispositioned.
- A separate push-triggered CodeQL run [44020429639](https://github.com/gavad54/zelmira-one-/actions/runs/44020429639) was still running at the last check; the PR-triggered CodeQL run above is the completed evidence used for this head.

### Verified CI checks on current PR head

- Locked dependency installation and enforced dependency audit: passed.
- Unit tests: **68 passed, 0 failed**.
- PostgreSQL/HTTP integration tests: **23 passed, 0 failed**.
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
