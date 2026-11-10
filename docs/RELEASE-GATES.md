

## Exact-head and hosting verification addendum — 2026-11-10
- Current PR #12 head `e8a5fecb9bebbbac67919d805677fc71dceb2c08`; PR remains open, draft and unmerged.
- Exact-head VAYRO CI run [42769407953](https://github.com/gavad54/zelmira-one-/actions/runs/42769407953) and CodeQL run [42769407907](https://github.com/gavad54/zelmira-one-/actions/runs/42769407907) completed successfully.
- Inspected CI job: 86/86 unit tests and 30/30 PostgreSQL/production HTTP integration tests passed. Isolated PostgreSQL migration, least-privilege auth/platform role checks, tenant runtime RLS proof, lint, typecheck, Prisma schema validation, production build and Docker build passed.
- Railway VAYRO service is online at 1/1 replicas but remains deployed from base commit `f3abc61523cb7abbd0b0ab4559a34f40a068ddb5`, not the PR head. Five recent failures remain in the last-24-hour snapshot.
- Inspected failed deployment `6354aa02-a334-4457-a46d-5f41188845a5`: Next.js started, but Railway readiness check `/api/ready` repeatedly returned HTTP 503. The route checks the primary DB plus dedicated auth and platform database roles. Internal error detail is intentionally suppressed; the exact missing dependency/credential is not established.
- Live healthcheck is now `/api/health`, which establishes liveness only, not database-backed readiness.
- No direct service environment variables were listed; shared environment variables were not inspected. Do not infer production secret state.
- Actual B2 setup, encrypted offsite backup, isolated restore, production DB reconciliation, dedicated hosting project, deployment parity, Android/UAT and owner release approval remain open.

**Disposition: CI + CodeQL PASS ON EXACT PR HEAD — PRODUCTION BACKUP/RESTORE AND DEPLOYMENT GATES OPEN — DEPLOYMENT BLOCKED — NOT RELEASED.**


## Latest exact-head gate verification — 2026-11-10
- Current PR #12 head `33ef687486f7d4f64b292a3a283b808e54b2e72e`; PR remains open, draft and unmerged.
- VAYRO CI [42774211321](https://github.com/gavad54/zelmira-one-/actions/runs/42774211321) and CodeQL [42774211165](https://github.com/gavad54/zelmira-one-/actions/runs/42774211165) both completed successfully on this exact head.
- Inspected CI job: 86/86 unit tests and 30/30 PostgreSQL/production HTTP integration tests passed; isolated PostgreSQL 17 migration and auth/platform/tenant role-isolation checks passed; lint, typecheck, Prisma validation, production build and Docker build passed.
- CI database log included serialization-conflict errors during concurrent operations, while the overall test job succeeded. This is recorded for concurrency/retry follow-up; it does not establish a production defect.
- Production backup/restore, production DB reconciliation, dedicated hosting, deployment parity, Android/UAT and release authorization remain open.

**Disposition: EXACT-HEAD CI + CODEQL PASS — PRODUCTION GATES OPEN — DEPLOYMENT BLOCKED — NOT RELEASED.**

## Latest exact-head release gate — 2026-11-10
- PR #12 head `077c540102df569811aac074db2e2a1c6294bcf5`; open, draft, unmerged; 28 commits ahead of main, 0 behind.
- Exact-head VAYRO CI [42775449887](https://github.com/gavad54/zelmira-one-/actions/runs/42775449887) and CodeQL [42775450223](https://github.com/gavad54/zelmira-one-/actions/runs/42775450223) passed. Inspected all CI/CodeQL job steps.
- CI: 86/86 unit and 30/30 integration tests passed; isolated PostgreSQL 17 migration, auth/platform/tenant role isolation, dependency audit, lint, typecheck, Prisma validation, production build and Docker build passed.
- CI PostgreSQL logs show serializable transaction conflicts on concurrent `EmailContact.enabled` update and `AuditEvent` insert, in context of `vayro_platform_actor_is_owner`; PostgreSQL suggests retry. Track for source-level transaction/retry review. No production defect inferred.
- Railway service remains on base commit `f3abc61523cb7abbd0b0ab4559a34f40a068ddb5`, not PR head; current snapshot is online 1/1 but has five recent failures in 24 hours.
- Actual B2 backup, independent restore, production DB schema/policy reconciliation, dedicated hosting/deployment parity, Android/UAT and release authorization remain open.

**Disposition: EXACT-HEAD CI + CODEQL PASS; PRODUCTION RELEASE GATES OPEN; NOT RELEASED.**