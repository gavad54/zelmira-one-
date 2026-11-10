# VAYRO task registry
Snapshot: 2026-11-10 11:14 Iran time (UTC+03:30)
Fixed mission window: 2026-11-10 11:13:24+03:30 to 2026-11-12 11:13:24+03:30. This is a project deadline, not a background scheduler.

Status vocabulary: NOT_STARTED, IN_PROGRESS, IMPLEMENTED, TESTED, VERIFIED, BLOCKED. VERIFIED requires current evidence and a passing acceptance test. A passing disposable CI test is not production verification.

| ID | Activity / acceptance criteria | Priority | Dependencies | Status | Evidence / blocker |
|---|---|---:|---|---|---|
| GOV-001 | Reconcile PR head, branch, PR state and exact-head workflows | P1 | none | VERIFIED | PR #12 open/draft/unmerged; head 7d0edb7; CI 42776421939 success; CodeQL 42776421968 success |
| CI-001 | Unit, integration, migration, role-isolation, RLS, lint, typecheck, build and Docker steps pass on exact head | P0 | GOV-001 | VERIFIED | All 45 CI job steps successful; see TEST-EVIDENCE.md. Isolated CI only |
| ARCH-001 | Architecture doc matches live DB and hosting evidence and approved product boundaries | P1 | GOV-001 | IN_PROGRESS | Existing doc has stale commit references; reconciliation pending |
| DB-001 | Reconcile live schema against Prisma and migration chain without mutation | P0 | BACKUP-001, RESTORE-001 | BLOCKED | Live schema drift; migration history empty; no safe restore |
| BACKUP-001 | Encrypted offsite backup exists and checksum/object integrity is verified | P0 | authorized provider resources | BLOCKED | No bucket, protected secrets or actual backup object |
| RESTORE-001 | Restore to independent isolated PostgreSQL 17 target and validate data/invariants | P0 | BACKUP-001 | BLOCKED | No independent restore target or restore evidence |
| AUTH-001 | Verify authentication, recovery, owner bootstrap and production configuration | P0 | DB-001 | IN_PROGRESS | Foundation exists; production configuration/operational evidence incomplete |
| MFA-001 | MFA enrollment, challenge, recovery and enforcement work in production | P0 | DB-001, AUTH-001 | BLOCKED | Live DB lacks required MFA tables/columns |
| SESSION-001 | Session rotation, revocation, expiry, all-session logout and assurance verified | P0 | DB-001, AUTH-001 | IN_PROGRESS | Session primitives exist; live schema is behind |
| API-AUTH-001 | Every protected endpoint has role/permission matrix and positive/negative tests | P0 | AUTH-001 | IN_PROGRESS | Full route inventory and production proof incomplete |
| TENANT-001 | Tenant-scoped read/write/export/delete isolation proven with real runtime identities | P0 | DB-001, RESTORE-001 | BLOCKED | Disposable CI RLS proof passed; live database has zero policies |
| RLS-001 | Production RLS policies, FORCE RLS decision and cross-tenant denial verified | P0 | BACKUP-001, RESTORE-001, DB-001 | BLOCKED | 11 tables RLS-enabled, zero policies, zero FORCE RLS |
| SECURITY-001 | CSP, headers, CORS, rate limiting, audit, email recovery and independent review pass | P1 | AUTH-001 | IN_PROGRESS | Production evidence incomplete |
| DEPLOY-001 | Production runs reviewed commit with DB-backed readiness, monitoring and rollback | P1 | DB-001, SECURITY-001 | BLOCKED | Railway runs base commit f3abc61, not PR head; project remains legacy workspace |
| ANDROID-001 | If Android is in release scope, signed build installs/runs on real device | P2 | release scope, signing owner | NOT_STARTED | No current real-device proof |
| UAT-001 | Owner-approved acceptance scenarios pass | P1 | DEPLOY-001 | BLOCKED | Owner UAT evidence absent |
| RELEASE-001 | Legal/privacy/store checks and explicit authorized release approval | P0 | all P0/P1 gates | BLOCKED | No release authorization; do not publish |

## Execution rules
- Before creating a task, compare purpose, inputs, outputs, files, dependencies and acceptance criteria against this registry and DUPLICATE-REGISTER.md.
- Continue incomplete tasks from the last evidenced state; do not rerun valid checks unless the source commit changes.
- Never mark production tasks VERIFIED based on disposable CI.
- Do not mutate production database until independently verified backup and restore plus schema reconciliation and rehearsed recovery exist.
