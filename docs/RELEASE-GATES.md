# VAYRO release gates
Snapshot 2026-11-10T10:29:44Z. Candidate de1c51712b6dec2c5a66bee5babd3743a9835103 (PR #12, infra/backup-restore-b2); base main f3abc61523cb7abbd0b0ab4559a34f40a068ddb5.
| Gate | Acceptance | Status | Evidence/blocker |
|---|---|---|---|
| RG-01 CI | Required checks pass on exact SHA | VERIFIED | Run 42779828156; 45/45 steps |
| RG-02 CodeQL | Exact-SHA CodeQL success | VERIFIED | Run 42779828204 |
| RG-03 Dependency audit | Locked audit passes | VERIFIED | CI step 6 |
| RG-04 Backup | Encrypted offsite object/checksum verified | BLOCKED | No B2 object/protected config |
| RG-05 Restore | Isolated PostgreSQL 17 restore and invariants | BLOCKED | No independent target |
| RG-06 Schema | Live schema and migration chain reconciled | BLOCKED | Empty migration history/schema drift |
| RG-07 RLS | Policies/FORCE RLS and real runtime tenant tests | BLOCKED | 11 tables RLS enabled; zero policies/FORCE |
| RG-08 MFA/session | Production schema, enforcement, lifecycle, recovery | BLOCKED | Live tables/columns absent |
| RG-09 Endpoint authorization | All positive/negative tests pass | IN_PROGRESS | 42 operations inventoried; evidence incomplete |
| RG-10 Security operations | CSP/headers/CORS/rate limits/audit/email/review | BLOCKED | Production evidence incomplete |
| RG-11 Deployment parity | Production runs candidate with DB readiness/rollback | BLOCKED | Railway runs main SHA f3abc615 |
| RG-12 Hosting independence | Dedicated host/domain/monitoring | BLOCKED | VAYRO service in legacy ARIA Web project |
| RG-13 UAT | Owner-approved acceptance | BLOCKED | No UAT evidence |
| RG-14 Android | Signed real-device run if in scope | NOT RUN | No device evidence |
| RG-15 Legal/release | Legal/privacy and explicit approval | BLOCKED | No release approval |
No production schema/role/grant/RLS changes before verified backup/restore and recovery rehearsal. No merge/deploy/onboarding/payment activation/public release while P0 gates remain open.
**Disposition: DEPLOYMENT BLOCKED — NOT RELEASED.**
