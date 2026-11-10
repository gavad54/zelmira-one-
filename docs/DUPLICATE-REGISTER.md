# VAYRO duplicate-work register
Last reconciled: 2026-11-10 11:18 +03:30.

| Canonical work item | Equivalent aliases / overlap | Reuse rule | Current disposition |
|---|---|---|---|
| CI-001 | CI, workflow validation, unit/integration/build verification | One exact SHA defines one verification result. Source change invalidates exact-head claim. | 7d0edb7 verified; 06f3e35 pending |
| BACKUP-001 | encrypted DB backup, B2 backup, offsite backup workflow | Do not duplicate scaffold; actual backup object and checksum are separate acceptance evidence. | Scaffold exists; actual backup not done |
| RESTORE-001 | restore drill, disaster recovery | One isolated PostgreSQL 17 restore with data/invariant/RPO/RTO evidence. | Not run |
| TENANT-001 / RLS-001 | tenant isolation, RLS, cross-tenant security | App authorization and DB RLS are distinct controls; CI proof is not live proof. | CI proof exists; production policies absent |
| AUTH-001 / MFA-001 / SESSION-001 | IAM, MFA, token lifecycle, logout-all | Shared identity domain; separate acceptance criteria; preserve existing primitives. | Partial foundation; production schema/config incomplete |
| DEPLOY-001 | Railway deploy, production parity, live release | Exact reviewed SHA and DB-backed readiness required. | Current live SHA differs |
| PROD-001 | approved family modules, product directory and homepage naming | DANA remains platform capability; do not rebuild or delete DANA routes. | Classification updated in 06f3e35; test pending |

No repeated production migration, backup, restore, deploy, merge or release was performed.
