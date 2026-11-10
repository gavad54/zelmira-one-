

## 2026-11-10 — Exact-head CI completion and Railway diagnosis
- Rechecked PR #12 head `e8a5fecb9bebbbac67919d805677fc71dceb2c08`; PR remains open, draft and unmerged.
- Exact-head VAYRO CI run 42769407953 completed successfully; CodeQL run 42769407907 completed successfully.
- Inspected CI job logs: 86/86 unit tests passed; 30/30 PostgreSQL/production HTTP integration tests passed; real migration history, isolated auth/platform role checks and real-table tenant RLS isolation proof passed; lint, typecheck, Prisma validation, production build and Docker build passed.
- Rechecked Railway: existing VAYRO service online at 1/1 replicas, but its active deployment still runs base commit `f3abc61523cb7abbd0b0ab4559a34f40a068ddb5`, not PR #12. Five recent failed deployments remain in the 24-hour snapshot.
- Inspected failed deployment `6354aa02-a334-4457-a46d-5f41188845a5`: image build and Next.js startup succeeded; the configured readiness path `/api/ready` repeatedly returned HTTP 503. That endpoint checks primary DB, auth DB role and platform DB role; the route intentionally suppresses internal exceptions, so exact production cause remains unproven.
- Current live service config uses `/api/health` as liveness healthcheck. This is not proof that database-backed features are ready.
- Live service's direct variable-name list was empty; values were not accessed. Environment-shared variables remain unverified.
- No live DB mutation, staged Railway patch acceptance, B2 setup, backup/restore execution, deployment, merge or release performed.


## Execution update — 2026-11-10 (latest exact PR head)
- Rechecked PR #12 metadata and compare: open, draft, unmerged, mergeable reported true; branch `infra/backup-restore-b2` is 24 commits ahead of `main`, 0 behind.
- Exact head `33ef687486f7d4f64b292a3a283b808e54b2e72e`: VAYRO CI run 42774211321 and CodeQL run 42774211165 both completed successfully.
- Inspected CI job and logs: 86 unit tests and 30 PostgreSQL/production HTTP integration tests passed; isolated PostgreSQL migration and role/RLS isolation checks, lint, typecheck, schema validation, production build and Docker build passed.
- CI PostgreSQL logs recorded serialization conflicts under concurrent test activity; suite still passed. Track as a concurrency/retry observation.
- No production DB mutation, offsite backup/restore, Railway deployment, merge or release was performed.
- Next: owner-controlled backup provider/credentials and isolated restore host are prerequisites for a real restore drill; continue production schema reconciliation only after that safety gate.

## 2026-11-10 — Reverification of latest documentation head
- Rechecked PR #12: open, draft, unmerged; head `077c540102df569811aac074db2e2a1c6294bcf5`; 28 commits ahead of main and 0 behind.
- Exact-head VAYRO CI run 42775449887 (run 1150) and CodeQL run 42775450223 (run 1113) both completed successfully. Inspected every CI and CodeQL job step; all 45 CI steps and all CodeQL analysis steps succeeded.
- Exact-head CI log: 86/86 unit tests and 30/30 PostgreSQL/production HTTP integration tests passed. Isolated PostgreSQL 17 migration, auth/platform/tenant role-isolation checks, locked dependency audit, lint, typecheck, Prisma validation, production build and Docker image build passed.
- Inspected PostgreSQL service-container logs. Serialization failures occurred during concurrent `EmailContact.enabled` UPDATE and `AuditEvent` INSERT; PostgreSQL identifies the latter context as SQL function `vayro_platform_actor_is_owner` and recommends retry. Test suite passed. This is an observed serializable-isolation conflict in disposable CI, not proof of a production incident. No retry behavior was changed because the exact transaction boundary and intended retry semantics need source-level review before code changes.
- Railway snapshot: existing VAYRO service online with 1/1 replica, but five failed deployments in the preceding 24 hours; active deployment remains on base commit `f3abc61523cb7abbd0b0ab4559a34f40a068ddb5`. No PR deployment parity.
- No provider backup resources, protected secrets, actual encrypted backup, separate restore host, or successful restore exist. Live Supabase schema/security drift remains a production blocker.
- No production database mutation, Railway staged patch application, PR merge, deployment or release performed.
- Next: investigate serialization/retry semantics from application source; owner-controlled backup provider and isolated restore resources remain prerequisites for actual backup/restore and safe production schema reconciliation.
