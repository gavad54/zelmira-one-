# VAYRO milestone plan
Window: 2026-11-10T07:43:24Z to 2026-11-12T07:43:24Z UTC; immutable.
| Window | Objective | Exit criterion | Current |
|---|---|---|---|
| H0–H4 | Audit/baseline | Live PR/head, checks, docs, DB, Railway, blockers recorded | Baseline refreshed |
| H4–H12 | Infra/security | Backup/restore prerequisites, DB roles/RLS and auth/session evidence | BLOCKED by absent backup/restore and live DB gaps |
| H12–H28 | Product/API | Versioned contracts, owner workflows, product boundaries and endpoint matrix | Partial source; production proof incomplete |
| H28–H36 | Security/QA | Positive/negative tenant/API tests, review, restore invariants | CI pass; production proof blocked |
| H36–H43 | Deployment rehearsal | Dedicated host, exact commit parity, HTTP readiness, rollback | BLOCKED |
| H43–H48 | Delivery decision | All gates verified or precise blocker report | DEPLOYMENT BLOCKED |
Time boxes do not waive security, backup, cost controls or owner approval.
