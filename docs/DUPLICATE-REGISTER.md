# VAYRO duplicate-work register
Last reconciled: 2026-11-10 11:14 +03:30

| Canonical work item | Equivalent aliases / overlapping requests | Reuse rule | Current disposition |
|---|---|---|---|
| CI-001 | CI, workflow validation, unit/integration/build verification | One exact commit SHA defines one verification result. New source commit invalidates exact-head claim. | Head 7d0edb7 verified once |
| BACKUP-001 | encrypted DB backup, B2 backup, offsite backup workflow | Workflow code is scaffolding; do not duplicate it. Actual backup object and checksum are separate acceptance evidence. | Scaffold exists; actual backup not done |
| RESTORE-001 | restore drill, disaster recovery, backup recovery | One isolated PostgreSQL 17 restore plus validation/RPO/RTO evidence. | Not run |
| TENANT-001 / RLS-001 | tenant isolation, RLS, cross-tenant security | Keep app-level authorization and database RLS as distinct controls; CI proof is not live proof. | CI proof exists; production policies absent |
| AUTH-001 / MFA-001 / SESSION-001 | IAM, MFA, token lifecycle, logout-all | Shared identity domain but separate acceptance criteria; do not rebuild existing primitives. | Partial foundation; production schema/config incomplete |
| DEPLOY-001 | Railway deploy, production parity, live release | Deployment only counts when exact reviewed SHA and readiness are proven in production. | Current live SHA differs |
| ARCH-001 | architecture audit, product boundary review | Preserve independent products/data stores and only reviewed versioned APIs. | Doc correction pending |

## No duplicate work detected
- Exact-head CI and CodeQL were checked once for 7d0edb71522c281b546011ae110f4501c6903c43.
- Earlier successful runs on 077c540 and other older SHAs are historical evidence, not repeated current-head work.
- No production migration, backup, restore, deploy, merge or release has been repeated or falsely marked complete.
