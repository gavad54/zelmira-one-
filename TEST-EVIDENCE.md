# VAYRO test evidence — 2026-11-10
Candidate de1c51712b6dec2c5a66bee5babd3743a9835103.
| Check | Result | Evidence/scope |
|---|---|---|
| VAYRO CI validate | PASS | Run 42779828156; 45/45 steps |
| Locked dependency audit | PASS | CI step 6 |
| Unit tests | PASS | CI step 7; count not independently extracted in this audit |
| Prisma validation | PASS | CI step 9 |
| Disposable migration/role/RLS tests | PASS | CI steps 11–17; isolated PostgreSQL only |
| Lint/typecheck/build/Docker | PASS | CI steps 18–21 |
| PostgreSQL + production HTTP integration | PASS | CI step 22 |
| CodeQL | PASS | Run 42779828204 |
| Production RLS | FAIL | 11 tables, zero policies/FORCE RLS |
| Production migrations | FAIL | Migration list empty |
| Independent restore drill | NOT RUN | No independent target/evidence |
| DB-backed HTTP readiness | NOT RUN | Runtime Ready is not readiness; route logs alone do not prove DB readiness |
Combined status API returned empty statuses; Actions workflow jobs above are exact-head evidence.
