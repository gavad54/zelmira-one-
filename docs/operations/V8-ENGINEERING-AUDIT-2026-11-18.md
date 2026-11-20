# VAYRO V8 engineering audit — 2026-11-18

**Status:** Repository CI and CodeQL verified on the exact PR head; production release remains BLOCKED.  
**Repository:** `gavad54/zelmira-one-`  
**Branch:** `engineering/vayro-hardening-2026-11-18`  
**PR:** [#39](https://github.com/gavad54/zelmira-one-/pull/39)  
**Audited head:** `cddc25d60af7c72e819ddefe912284d3b8575a44`

## 1. Scope and evidence standard

This is a fresh read-only repository/PR audit using GitHub repository metadata, PR metadata and diff, exact-commit workflow runs and job-step results, current branch files, PR review records, Prisma schema, application tenant transaction code, SQL diagnostics and release/architecture documents.

No production database mutation, DDL, migration, role grant, policy change, secret operation, Railway change, paid resource, merge or deployment was performed.

This report is authoritative for the exact repository/PR evidence listed below. Older dated statements elsewhere in the repository remain historical unless they agree with this checkpoint.

## 2. Exact repository and PR state

- Repository visibility: public; connected GitHub permission snapshot includes Admin, Maintain, Pull and Push.
- Default branch: `main`.
- PR #39: OPEN, not merged, not draft; GitHub reports `mergeable=true`.
- PR base: `main`, base SHA `f0d31804e695cd3d73b452c7507affdca9573740`.
- PR head: `cddc25d60af7c72e819ddefe912284d3b8575a44`.
- The branch exists at the requested name.
- Comparison of source head `fa6d5f0496a81d7dd61f59e0b745dadff3bc2a91` to audited head shows exactly one additional commit and one changed file: `docs/operations/ENGINEERING-EXECUTION-2026-11-18.md`, +19 lines, no deletions. No application source, test or workflow file changed after that source head.
- PR #39 currently has no submitted review records, no inline review threads and no PR comments returned by the connected GitHub read.

## 3. Exact-head CI and CodeQL

The commit-specific workflow lookup for the audited head returned:

- VAYRO CI run [44362850927](https://github.com/gavad54/zelmira-one-/actions/runs/44362850927): completed, SUCCESS.
- CodeQL run [44362851068](https://github.com/gavad54/zelmira-one-/actions/runs/44362851068): completed, SUCCESS.

The CI job `validate` completed successfully at every step:

1. locked dependency installation;
2. unit tests;
3. Prisma client generation and schema validation;
4. isolated PostgreSQL least-privilege role setup;
5. real repository migration replay on disposable PostgreSQL;
6. authentication and platform role boundary SQL checks;
7. dedicated tenant runtime login and tenant RLS isolation SQL;
8. lint and TypeScript typecheck;
9. production build and Docker image build;
10. PostgreSQL/production-HTTP integration tests;
11. production-only dependency audit;
12. full locked dependency audit.

CodeQL's JavaScript/TypeScript analysis and upload steps completed successfully. This proves scan execution, not that every historical alert record is closed; the connected GitHub tools available in this audit did not expose the Security alert inventory.

The combined commit-status endpoint returned no legacy status entries. The exact-commit Actions run and job-step records above are the authoritative evidence for these workflow checks.

## 4. Reviewed code change and test evidence

PR #39 changes the tenant creation boundary:

- The tenant creation API now calls `createTenantForAuthenticatedUser` rather than passing a caller-defined callback and tenant context through the generic user-scoped transaction.
- The constrained helper validates token format, session expiry/revocation, user verification/disabled state, idle timeout, and revalidates session/user within the tenant DB transaction.
- The generic user-scoped helper rejects a non-empty caller-supplied tenant ID and is documented for tenant listing only.
- Tenant runtime role validation rejects superuser, BYPASSRLS, membership in other/elevated roles, and ownership of protected tables.
- Integration coverage includes arbitrary tenant-context rejection, constrained tenant provisioning, tenant RLS, and cross-tenant access denial.

The exact-head CI run passed the associated integration suite. This does not prove the production database has the expected schema, role memberships, grants or policies.

## 5. Current production database blockers — last documented live read-only observation

The latest recorded VAYRO-CORE read-only catalog inspection in the repository checkpoint reports:

- 11 existing public tables against 15 Prisma models.
- Missing tables: `AiGeneration`, `AuthChallenge`, `MfaRecoveryCode`, `UserMfa`.
- Missing Session columns: `revokedAt`, `lastSeenAt`, `assurance`, `mfaAuthenticatedAt`.
- All 11 existing tables have RLS enabled, zero policies, FORCE RLS disabled, and owner `postgres`.
- Dedicated roles `vayro_app`, `vayro_auth`, `vayro_platform`, and `vayro_platform_bootstrap` were absent in that inspection.
- Supabase `service_role` has BYPASSRLS and is not acceptable as the ordinary tenant runtime identity.
- Prisma migration ledger is absent.
- `AuditEvent.tenantId` foreign key to Tenant was not found.
- The inventory reported zero rows at inspection time; this is a point-in-time observation, not a permanent guarantee.

These are last recorded read-only findings, not a fresh database query performed by this audit. Production schema, role and policy state must be re-read before any approved change. No production DDL, baseline, grants or policies are authorized.

## 6. Backup, restore and independent hosting

The repository documents backup and restore workflows, but the latest checkpoint does not evidence a successful encrypted offsite production backup or a restore of that backup to an independently controlled PostgreSQL target.

Protected GitHub Environment configuration is still required for the documented `vayro-backup` and `vayro-restore` environments. External object storage and restore-target credentials cannot be created or inferred from this GitHub read-only audit. Do not request or store secret values in source or chat.

No independently controlled VAYRO hosting project/deployment is verified. Existing VAYRO-named Railway services inside ARIA/LEADORA projects are not independent hosting and must not be reused.

## 7. Documentation consistency findings

- `docs/ARCHITECTURE.md` and `docs/PRODUCT-BOUNDARIES.md` agree on the eleven-product boundary, DANA's role, independent product data ownership, ARIA's exclusion of accounting/ERP, and ARIANA's exclusive accounting/ERP scope.
- `docs/operations/VAYRO-DATABASE-ACCESS-MATRIX.md` explicitly labels its policies as intended migration contract, not live production state. It also correctly flags broad auth-role policies as a security review risk.
- `docs/RELEASE-GATES.md` contains many older historical addenda, including earlier PR numbers, dependency findings and CI heads. Its latest 2026-11-18 state must be read together with this report and the current engineering checkpoint. The exact-head CI and full dependency audit are now green on `cddc25d`; the production release blockers remain open.
- No contradiction was found in the approved product boundaries. Historical repository notes must not be used as current operational evidence when superseded by this report.

## 8. Central findings register

| ID | Severity | Finding | Evidence/status | Required closure |
|---|---|---|---|---|
| V8-001 | Critical | Live schema is not reconciled to Prisma/migrations | Last recorded read-only inventory: 4 tables and 4 Session columns missing; migration ledger absent | Independent backup/restore, full catalog diff, reviewed baseline and isolated rehearsal |
| V8-002 | Critical | Live RLS policies and FORCE RLS are absent on 11 observed tables | Last recorded live catalog: RLS on, zero policies, FORCE RLS off | Per-table policy/grant review and negative tests on restored clone; separately approved production change |
| V8-003 | Critical | Dedicated runtime roles not verified in live database | Last recorded role inventory lacks four VAYRO roles; service_role bypasses RLS | Verify/create separate least-privilege roles only after backup/restore and owner approval |
| V8-004 | Critical | No independently verified encrypted backup and restore | Repository workflow exists; successful real backup/restore not evidenced | Protected configuration, offsite encrypted object, checksum/decrypt/restore and measured RPO/RTO |
| V8-005 | High | No independently controlled VAYRO hosting/deployment | Current architecture checkpoint says no independent project/deployment verified | Independent project, secrets, domain/TLS, DB connection, health checks, monitoring and rollback |
| V8-006 | High | Product family is not demonstrated as eleven operational commercial products | Architecture/release docs describe foundation/catalogue; end-to-end product acceptance absent | Product-by-product backend, data, authorization, API, tests, support and commercial evidence |
| V8-007 | High | Android release is not evidenced | No verified Android source/build/signing/device acceptance in current release evidence | Android project, secure API/session integration, signed artifact and real-device UAT |
| V8-008 | High | Email and billing are not production-proven | Provider credentials/delivery and payment lifecycle are not evidenced | End-to-end email; payment/webhook/idempotency/refund/reconciliation/legal gates |
| V8-009 | High | Endpoint authorization and privileged MFA coverage are not fully certified | Tenant transaction hardening is tested in isolated CI; full endpoint inventory and production MFA review remain open | Endpoint-by-endpoint authorization matrix, negative tests, privileged MFA and independent review |
| V8-010 | Medium | Release-gate document contains stale historical status blocks | Many dated addenda precede the current exact-head evidence | Treat this report/current dated checkpoint as latest; future edits should clearly mark superseded statements |
| V8-011 | Medium | CodeQL workflow success does not establish zero open alert records | CodeQL run passed; alert inventory unavailable in this audit | Inspect GitHub Security code-scanning alerts and document dispositions |
| V8-012 | Medium | Trusted-proxy/IP rate-limit topology is not production-verified | Release notes identify proxy trust as open | Validate deployed proxy chain and trusted client IP behavior with tests |

Severity reflects release risk, not a claim that every finding is an exploitable vulnerability. No production exploit test was performed.

## 9. Remediation sequencing and stop conditions

1. Keep PR #39 open; do not merge or deploy solely because CI/CodeQL passed.
2. Obtain and verify encrypted offsite backup plus isolated restore.
3. Capture a fresh full live catalog/role/grant/policy snapshot and reconcile every object against Prisma and ordered migrations.
4. Review the database access matrix, including the explicitly identified broad authentication-role policy risk.
5. Rehearse baseline, forward migration and recovery on a restored clone; run cross-tenant and cross-role negative tests.
6. Only after all prior gates pass, prepare a separately authorized production change plan. Do not execute it under this audit.
7. Complete independent hosting, email, billing, product workflows, Android and owner UAT.
8. Perform independent security review and verify CodeQL alert dispositions.
9. Obtain explicit owner approval for merge and separately for production deployment.

## 10. Verified progress and release decision

- Repository/PR metadata: VERIFIED.
- Exact-head VAYRO CI: VERIFIED PASS.
- Exact-head CodeQL execution: VERIFIED PASS.
- Tenant provisioning hardening: IMPLEMENTED and TESTED in isolated CI.
- Product boundary documentation: VERIFIED CONSISTENT across architecture and boundary documents.
- Production schema/RLS/roles: BLOCKED pending fresh reconciliation and approved remediation.
- Backup/restore: BLOCKED; no real successful drill evidenced.
- Independent hosting: BLOCKED.
- Product commercialization, Android and UAT: NOT VERIFIED.
- Production release: BLOCKED — NOT RELEASED.

No percentage is assigned: the full acceptance inventory and product-by-product evidence/weights have not yet been completed, so a defensible weighted denominator is not available.

**Decision: EXACT PR HEAD CI PASS + CODEQL EXECUTION PASS — PRODUCTION DATABASE/RECOVERY/HOSTING/PRODUCT RELEASE GATES OPEN — KEEP PR OPEN — NO MERGE OR DEPLOYMENT.**
