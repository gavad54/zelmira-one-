

## Exact-head verification update — 2026-11-10
- Current PR #12 head: `e8a5fecb9bebbbac67919d805677fc71dceb2c08`; PR is open, draft and unmerged.
- Exact-head VAYRO CI 42769407953 and CodeQL 42769407907 completed successfully.
- CI evidence: 86 unit tests and 30 PostgreSQL/production HTTP integration tests passed; isolated PostgreSQL migration, auth/platform role isolation, tenant RLS proof, lint, typecheck, Prisma schema validation, production build and Docker build passed.
- Railway's existing VAYRO service is online, but its active deployment remains on `f3abc61523cb7abbd0b0ab4559a34f40a068ddb5`, not this PR head. The previous failed deploy's readiness endpoint returned HTTP 503; exact internal cause is not exposed.
- The service healthcheck is currently `/api/health` (liveness only). This does not certify DB readiness or production feature operation.
- No B2 backup resource/keys, protected GitHub secrets, independent restore target, verified backup object or actual restore evidence exists.
- Release disposition remains: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.


## Latest verified CI and release state — 2026-11-10
- Current PR #12 head: `33ef687486f7d4f64b292a3a283b808e54b2e72e`.
- Exact-head VAYRO CI 42774211321 and CodeQL 42774211165 both passed.
- CI evidence: 86 unit tests and 30 PostgreSQL/production HTTP integration tests passed; isolated PostgreSQL 17 migration and auth/platform/tenant role-isolation checks passed; lint, typecheck, Prisma validation, production build and Docker build passed.
- CI PostgreSQL logs show serialization conflicts during concurrent test operations although the overall suite passed; follow up on retry/concurrency handling.
- Production backup/restore, live DB schema/security reconciliation, dedicated hosting and deployment parity remain blocked/open. PR remains draft and unmerged; no release.

## 2026-11-10 — latest exact-head verification
- PR #12 head `077c540102df569811aac074db2e2a1c6294bcf5`; open, draft, unmerged; 28 ahead / 0 behind main.
- VAYRO CI 42775449887 and CodeQL 42775450223 passed on this exact head; all job steps inspected.
- CI evidence: 86 unit tests and 30 PostgreSQL/HTTP integration tests passed; isolated PostgreSQL 17 migration, auth/platform/tenant role-isolation, dependency audit, lint, typecheck, Prisma validation, production build and Docker build passed.
- Test PostgreSQL logs record serializable conflicts around concurrent EmailContact enabled-state update and AuditEvent insert inside `vayro_platform_actor_is_owner`; follow up on transaction retry semantics. CI still passed.
- Railway VAYRO remains online at 1/1 replica but deployed from base commit `f3abc61523cb7abbd0b0ab4559a34f40a068ddb5`, not PR #12; five recent failures observed in the last 24-hour snapshot.
- No actual encrypted backup/restore or live DB security/schema reconciliation; dedicated hosting and deployment parity remain open. PR stays draft; no release.