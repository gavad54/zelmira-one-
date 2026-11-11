# Duplicate Work Register — VAYRO
Snapshot: 2026-11-10T17:10:47Z.

| Work area | Existing source of truth | Duplicate rule |
|---|---|---|
| Product governance/catalog | PR #14, branch architecture/vayro-independent-product-governance | Do not create another catalog/registry change unless requirements or evidence change |
| Backup/restore implementation | PR #12, branch infra/backup-restore-b2 | Do not rewrite workflow; next distinct task is actual backup-object and isolated-restore proof |
| ARVAND business modules/revenue specification | PR #13 | Do not create another ARVAND naming/spec document; audit source repository before implementation |
| MFA/session/endpoint security | PR #6 and docs/security/* checkpoints | Do not reimplement primitives; reconcile source to live DB/runtime and rerun tests only for changed commits |
| Product inventory | docs/PRODUCT-REPOSITORY-INVENTORY.md | Update inventory only when new repository/runtime evidence is found |
| Daily status | Active VAYRO status automations | Do not create another daily status automation |

CI and CodeQL results are SHA-specific. Any commit changing source invalidates exact-head verification until workflows rerun on the new SHA.
