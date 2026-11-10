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


## Exact-head reconciliation — 2026-11-10
- CI-001 on source candidate b2b78f3: CI 42777954484 and CodeQL 42777954612 passed. Do not repeat this exact source validation without a relevant source change.
- The governance-only follow-up changes the PR head and must receive its own CI/CodeQL check.
- SESSION-001 canonical scope includes opaque session lifecycle, expiry, single/all-session revocation, password reset/change, MFA assurance, rotation and privilege-change invalidation. Track these as acceptance criteria under SESSION-001 rather than creating duplicate tasks.
- MODULE-* tasks are distinct end-to-end product scopes; product-directory listing is not evidence of module implementation.


## Open PR and branch overlap audit — 2026-11-10
| PR | Scope | Overlap / decision |
|---|---|---|
| #1 | Older VAYRO rebrand and product family | Overlaps current product naming/directory; old version counts DANA as an eighth family product. Current branch supersedes that classification. Do not merge wholesale. |
| #3 | Earlier engineering baseline audit | Overlaps current PROJECT-STATE, RELEASE-GATES, SECURITY-REPORT and TEST-EVIDENCE. Retain as historical evidence; current live inspection and current-head evidence supersede stale snapshots. |
| #5 | Owner dashboard and product catalog, based on experiment/cloudflare-free-hosting-audit | Dashboard UI source is reused and adapted. Its old owner API/catalog implementation is not merged; current API is refactored to the dedicated platform role and the catalog is corrected to seven + three. Do not merge PR #5 wholesale. |
| #7–#11 | Dependabot dependency updates | Not duplicate feature work. Keep separate; Next 16 and Prisma 7 are major-version changes and require isolated compatibility validation before any merge. All were open and non-mergeable at audit. |

- PR #12 is the active canonical engineering branch. No other PR was merged or closed.
- No listed repository branch was protected at inspection; no branch-protection change was made.
- The owner products API previously used the default Prisma client; the current candidate changes it to the platform transaction boundary. Do not reintroduce the old PR #5 route implementation.
