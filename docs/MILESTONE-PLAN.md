# VAYRO Milestone Plan
Snapshot: 2026-11-10T17:10:47Z. Existing 48-hour window is not reset by this update. The previously recorded start time is 2026-11-10T07:43:24Z; retain as prior-session record, not independently timestamp-attested by GitHub/Railway.

| Milestone | Objective | Acceptance | State |
|---|---|---|---|
| M0 Audit | Current PR/head, CI, docs, Railway, Supabase baseline | Exact SHA and live source evidence recorded | VERIFIED for this snapshot |
| M1 Safe foundation | Backup/restore proof, schema reconciliation, role/RLS plan | Isolated restore + catalog diff + test evidence | BLOCKED |
| M2 Auth/security | MFA/session lifecycle, endpoint authorization, tenant boundaries | Tests on actual least-privilege runtime path | IN_PROGRESS / BLOCKED by schema |
| M3 Product functionality | VAYRO control plane and independent app API integrations | End-to-end workflows and independent runtime evidence | IN_PROGRESS |
| M4 Release quality | Headers, email, payment, Android, UAT | Production-like tests and owner acceptance | NOT_STARTED |
| M5 Release | Gates, rollback, explicit owner authorization | All mandatory gates VERIFIED | BLOCKED |

No production deployment, merge or public release is authorized by this plan.
