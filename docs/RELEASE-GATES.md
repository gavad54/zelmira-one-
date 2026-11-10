# VAYRO release gates
Snapshot: 2026-11-10 11:33:43 +03:30; last exact verified source candidate b8abdfcb1f0a52bb3d58c5639b8ee7d26df5882f.

| Gate | Acceptance criteria | Status | Evidence / blocker |
|---|---|---|---|
| RG-01 CI | All required CI steps pass on exact source SHA | VERIFIED | CI 42779145368; 45/45 steps passed on b8abdfc. Current owner-dashboard/platform-role refactor candidate awaits a new exact-head run. |
| RG-02 CodeQL | CodeQL completes on exact source SHA | VERIFIED | CodeQL 42779145558 success on b8abdfc. Current candidate awaits a new exact-head run. |
| RG-03 Backup | Encrypted offsite object exists; checksum/size verified | BLOCKED | No bucket, keys, protected secrets or backup object |
| RG-04 Restore | Independent PostgreSQL 17 restore and invariants pass | BLOCKED | No independent restore target |
| RG-05 Schema | Live DB and migration chain reconciled object-by-object | BLOCKED | Live migration history empty; schema drift |
| RG-06 Production RLS | Policies and real runtime tenant isolation proven | BLOCKED | 11 tables RLS-enabled, zero policies, zero FORCE RLS |
| RG-07 MFA/session | Production MFA schema, enforcement, lifecycle and recovery verified | BLOCKED | Live DB missing MFA tables/session columns; runtime key unverified |
| RG-08 Endpoint authorization | Complete matrix and per-operation negative/positive tests pass | IN_PROGRESS | 42 operations inventoried; row-level evidence incomplete |
| RG-09 Security operations | CSP, headers, CORS, rate limits, audit, email recovery and independent review verified | IN_PROGRESS | Production evidence and independent review incomplete |
| RG-10 Deployment parity | Production runs reviewed SHA with DB-backed readiness and rollback | BLOCKED | Railway runs base SHA f3abc61, not PR candidate |
| RG-11 Hosting independence | Dedicated VAYRO hosting/domain/monitoring within authorized cost | BLOCKED | Dedicated Railway project blocked by observed free-plan resource limit |
| RG-12 UAT | Owner-approved acceptance scenarios pass | BLOCKED | No UAT evidence |
| RG-13 Android | If in release scope, signed build runs on real device | NOT VERIFIED | No real-device evidence |
| RG-14 Legal/release approval | Legal/privacy/store checks and explicit authorized approval | BLOCKED | No release authorization |

## Stop conditions
No production schema/role/grant/RLS changes before verified backup/restore and recovery rehearsal. No merge, production deployment, onboarding, payment activation or public release while P0 gates remain open. Disposable CI is not production certification. The current owner-dashboard/platform-role refactor requires its own exact-head CI/CodeQL run.

**Disposition: DEPLOYMENT BLOCKED — NOT RELEASED.**
