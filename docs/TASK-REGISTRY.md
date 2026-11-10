# VAYRO task registry
Snapshot: 2026-11-10 11:20 +03:30
Fixed mission window: 2026-11-10 11:13:24+03:30 to 2026-11-12 11:13:24+03:30.

Statuses: NOT_STARTED, IN_PROGRESS, IMPLEMENTED, TESTED, VERIFIED, BLOCKED. VERIFIED requires current evidence and a passing acceptance test. Disposable CI does not prove production safety.

| ID | Activity / acceptance criteria | Priority | Dependencies | Status | Evidence / blocker |
|---|---|---:|---|---|---|
| GOV-001 | Reconcile PR head, branch, PR state and exact-head workflows | P1 | none | IN_PROGRESS | PR #12 open/draft/unmerged; current head had zero Actions runs/status checks |
| CI-001 | Unit, integration, migration, role-isolation, RLS, lint, typecheck, build and Docker pass on current candidate SHA | P0 | GOV-001 | IN_PROGRESS | Prior head 7d0edb7 passed 86 unit + 30 integration; current head not CI-verified |
| PROD-001 | Exactly seven approved family modules; DANA remains platform capability; independent products preserved | P1 | ARCH-001 | TESTED | Product directory/homepage/type/test changed in 06f3e35; 3 focused Node tests passed locally against copied exact source/test files; no repository CI/build |
| ARCH-001 | Architecture doc matches live DB/hosting and approved product boundaries | P1 | GOV-001 | IN_PROGRESS | Docs and homepage classification updated; full application review remains |
| DB-001 | Reconcile live schema against Prisma and migration chain without mutation | P0 | BACKUP-001, RESTORE-001 | BLOCKED | Live schema drift; migration history empty; no safe restore |
| BACKUP-001 | Encrypted offsite backup exists and checksum/object integrity is verified | P0 | authorized provider resources | BLOCKED | No bucket, protected secrets or actual backup object |
| RESTORE-001 | Restore to independent isolated PostgreSQL 17 target and validate data/invariants | P0 | BACKUP-001 | BLOCKED | No independent restore target or restore evidence |
| AUTH-001 | Verify authentication, recovery, owner bootstrap and production configuration | P0 | DB-001 | IN_PROGRESS | Code foundation exists; production configuration/operational evidence incomplete |
| MFA-001 | MFA enrollment, challenge, recovery and enforcement work in production | P0 | DB-001, AUTH-001 | BLOCKED | MFA service/routes exist; live DB lacks required MFA tables/columns |
| SESSION-001 | Session rotation, revocation, expiry, all-session logout and assurance verified | P0 | DB-001, AUTH-001 | IN_PROGRESS | Session lifecycle primitives/tests exist; live schema is behind |
| API-AUTH-001 | Every protected endpoint has role/permission matrix and positive/negative tests | P0 | AUTH-001 | IN_PROGRESS | CI coverage exists; full production route proof incomplete |
| TENANT-001 | Tenant-scoped read/write/export/delete isolation proven with real runtime identities | P0 | DB-001, RESTORE-001 | BLOCKED | Disposable CI RLS proof passed; live database has zero policies |
| RLS-001 | Production RLS policies, FORCE RLS decision and cross-tenant denial verified | P0 | BACKUP-001, RESTORE-001, DB-001 | BLOCKED | 11 tables RLS-enabled, zero policies, zero FORCE RLS |
| SECURITY-001 | CSP, headers, CORS, rate limiting, audit, email recovery and independent review pass | P1 | AUTH-001 | IN_PROGRESS | Production evidence incomplete |
| DEPLOY-001 | Production runs reviewed commit with DB-backed readiness, monitoring and rollback | P1 | DB-001, SECURITY-001 | BLOCKED | Railway runs base SHA f3abc61, not PR head |
| ANDROID-001 | If Android is in release scope, signed build installs/runs on real device | P2 | release scope, authorized signing | NOT_STARTED | No current real-device proof |
| UAT-001 | Owner-approved acceptance scenarios pass | P1 | DEPLOY-001 | BLOCKED | Owner UAT evidence absent |
| RELEASE-001 | Legal/privacy/store checks and explicit authorized release approval | P0 | all P0/P1 gates | BLOCKED | No release authorization; do not publish |

## Execution rules
- Compare purpose, inputs, outputs, files, dependencies and acceptance criteria before adding tasks.
- Continue incomplete tasks from last evidenced state; do not rerun valid checks unless source SHA changes.
- Never mark production tasks VERIFIED based on disposable CI.
- No production DB mutation before independently verified backup/restore, schema reconciliation and rehearsed recovery.
