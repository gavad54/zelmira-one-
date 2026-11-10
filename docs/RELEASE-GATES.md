# VAYRO release gates — authoritative status
Snapshot: 2026-11-10 11:18 +03:30.

| Gate | Acceptance criteria | Status | Evidence / blocker |
|---|---|---|---|
| RG-01 Repository CI | All required CI steps pass on exact final candidate SHA | IN_PROGRESS | Prior SHA 7d0edb7 passed; current source SHA 06f3e35 lacks fresh workflow |
| RG-02 CodeQL | CodeQL passes on exact final candidate SHA | IN_PROGRESS | Prior SHA 7d0edb7 passed; current source SHA 06f3e35 lacks fresh workflow |
| RG-03 Backup | Encrypted offsite object exists; checksum/size verified | BLOCKED | No provider bucket/keys, protected secrets or backup object |
| RG-04 Restore | Independent PostgreSQL 17 restore and data/invariant checks pass | BLOCKED | No independent restore target or restore evidence |
| RG-05 Schema reconciliation | Live DB and Prisma/migration chain reconciled object-by-object | BLOCKED | Live migration history empty; schema drift |
| RG-06 Production RLS | Policies and real runtime tenant isolation proven on live DB | BLOCKED | 11 tables RLS-enabled, zero policies, zero FORCE RLS |
| RG-07 MFA/session | Production MFA schema, enforcement, lifecycle and recovery verified | BLOCKED | Live DB missing MFA tables and session columns |
| RG-08 Endpoint authorization | Complete endpoint-role matrix and negative tests pass | IN_PROGRESS | CI coverage exists; full production route proof incomplete |
| RG-09 Security operations | CSP, headers, CORS, rate limiting, audit and email recovery verified | IN_PROGRESS | Production evidence incomplete |
| RG-10 Deployment parity | Production runs reviewed SHA and DB-backed readiness; rollback proven | BLOCKED | Railway runs base SHA f3abc61, not PR candidate |
| RG-11 Hosting independence | Dedicated VAYRO project/domain/monitoring within authorized cost | BLOCKED | Dedicated Railway project blocked by free-tier resource limit |
| RG-12 UAT | Owner-approved acceptance scenarios pass | BLOCKED | No UAT evidence |
| RG-13 Android | If in release scope, signed build installs/runs on real device | NOT VERIFIED | No current real-device evidence |
| RG-14 Legal/release approval | Legal/privacy/store checks and explicit authorized approval | BLOCKED | No release authorization |

## Stop conditions
- No production schema, role, grant or RLS changes before RG-03 and RG-04 plus schema/recovery rehearsal.
- No merge, production deployment, customer onboarding, payment activation or public release while P0 gates remain open.
- Disposable CI does not prove production safety.

**Disposition: DEPLOYMENT BLOCKED — NOT RELEASED.**
