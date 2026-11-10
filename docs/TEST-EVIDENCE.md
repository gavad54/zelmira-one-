

## Exact PR-head verification — 2026-11-10
Source PR head: `e8a5fecb9bebbbac67919d805677fc71dceb2c08`.
- VAYRO CI run [42769407953](https://github.com/gavad54/zelmira-one-/actions/runs/42769407953): completed successfully.
- CodeQL run [42769407907](https://github.com/gavad54/zelmira-one-/actions/runs/42769407907): completed successfully.
- Unit test runner: 86 tests passed, 0 failed.
- Isolated PostgreSQL role setup, actual Prisma migration history, auth/platform least-privilege checks and dedicated tenant runtime RLS isolation proof passed.
- Production HTTP/PostgreSQL integration runner: 30 tests passed, 0 failed.
- Lint, typecheck, Prisma generation/schema validation, production build and Docker image build passed.

These results validate the PR merge candidate in disposable CI PostgreSQL. They do not validate the live Supabase project, actual offsite backup/restore, production runtime secrets or Railway deployment parity. All operational-test items above remain open until independently evidenced.


## Exact latest-head verification — 2026-11-10
Source PR #12 head at verification: `33ef687486f7d4f64b292a3a283b808e54b2e72e`.
- VAYRO CI run [42774211321](https://github.com/gavad54/zelmira-one-/actions/runs/42774211321), run 1149: completed successfully; all 45 job steps completed successfully.
- CodeQL run [42774211165](https://github.com/gavad54/zelmira-one-/actions/runs/42774211165), run 1112: completed successfully; analysis upload and processing completed.
- Unit tests: 86 passed, 0 failed.
- PostgreSQL/production HTTP integration tests: 30 passed, 0 failed.
- Isolated PostgreSQL 17 setup, Prisma migration, auth/platform role isolation and tenant runtime RLS isolation passed.
- Locked dependency install/audit, Prisma generation/schema validation, lint, typecheck, production build and Docker image build passed.
- CI job log also records PostgreSQL serialization-conflict errors during concurrent test operations; the workflow and test suite nevertheless completed successfully. Treat this as a concurrency/retry observation for follow-up, not as a failed CI run or proof of production safety.

These results apply to disposable CI infrastructure only. They do not prove live Supabase migration/security, offsite backup/restore, or Railway production deployment parity.

## Exact latest PR head — 2026-11-10
Source PR #12 head: `077c540102df569811aac074db2e2a1c6294bcf5`.
- VAYRO CI [42775449887](https://github.com/gavad54/zelmira-one-/actions/runs/42775449887), run 1150: completed successfully; all 45 job steps succeeded.
- CodeQL [42775450223](https://github.com/gavad54/zelmira-one-/actions/runs/42775450223), run 1113: completed successfully; all analysis steps succeeded.
- Unit tests: 86 passed, 0 failed. PostgreSQL/production HTTP integration tests: 30 passed, 0 failed.
- Isolated PostgreSQL 17 migration, dedicated auth/platform runtime role checks, tenant RLS isolation proof, locked dependency audit, lint, typecheck, Prisma validation, production build and Docker build passed.
- PostgreSQL test-container log recorded serialization failures during concurrent `EmailContact.enabled` UPDATE and `AuditEvent` INSERT; the latter occurred in `vayro_platform_actor_is_owner`. PostgreSQL suggested retry. The full suite passed; this observation is not evidence of production failure. Retry behavior requires transaction-boundary review.

All results above apply to disposable CI infrastructure only. They do not establish live Supabase security/migration correctness, offsite backup/restore, Railway deployment parity, or production application readiness.