# VAYRO execution log

## 2026-11-10 — V3 execution
- PR #12 remains open, draft and unmerged.
- Exact head 7d0edb71522c281b546011ae110f4501c6903c43: CI 42776421939 and CodeQL 42776421968 passed. Inspected all 45 CI steps; 86/86 unit tests and 30/30 PostgreSQL/production HTTP integration tests passed.
- CI included isolated PostgreSQL 17 migrations, auth/platform least-privilege roles, tenant RLS isolation, dependency audit, lint, typecheck, production build and Docker build.
- PostgreSQL logs show serializable conflicts on concurrent EmailContact.enabled update and AuditEvent insert via vayro_platform_actor_is_owner. Source review found owner-contact PATCH/DELETE explicitly use Serializable and map Prisma P2034 to HTTP 409 contact_state_conflict_retry. No blind automatic retry was added; the invariant must be re-read after conflict.
- Added V3 governance files: TASK-REGISTRY, DUPLICATE-REGISTER, DECISION-LOG, MILESTONE-PLAN, SECURITY-REPORT and DEPLOYMENT-REPORT.
- Updated PROJECT-STATE, EXECUTION-LOG, RELEASE-GATES, TEST-EVIDENCE and ARCHITECTURE.
- Updated product directory: seven approved family modules; DANA remains a platform-level capability with routes preserved. Homepage, type declaration and unit test updated in 06f3e3528f12e1a76b801430788fa433ebeffef2.
- Ran three focused Node tests locally (Node v22.16.0) against copied exact product-directory source and unit test from the branch: 3 passed, 0 failed. This does not replace GitHub CI, Next.js production build or TypeScript checking.
- GitHub Actions query for current PR head 87e940774dedd3adf64610d7f9fc431657195a12 returned zero runs; combined commit status returned no checks. Current source/docs remain not verified on exact PR head.
- No production DB mutation, actual backup/restore, Railway deployment, PR merge or release performed.


## 2026-11-10 11:22 +03:30 — V3 exact-head verification
- PR #12 live state: open, draft, unmerged; branch infra/backup-restore-b2; 46 ahead / 0 behind main.
- Source candidate b2b78f3a9171eeddd53c4f11d740b8c54abd6a7d passed CI 42777954484 (#1160), all 45 steps; CodeQL 42777954612 (#1123) passed.
- CI included unit tests, locked dependency audit, Prisma generation/validation, migrations on isolated PostgreSQL 17, auth/platform/tenant role isolation, tenant RLS SQL proof, lint, typecheck, production build, Docker build and PostgreSQL/HTTP integration.
- Corrected session lifecycle documentation: password-change endpoint exists and revokes all sessions transactionally; MFA login creates a new MFA session without revoking other devices; rotation and privilege-change invalidation remain open.
- Weighted registry includes all seven end-to-end product modules. VERIFIED weights: GOV 2 + CI 4 + PROD directory 3 = 9/100.
- This docs-only follow-up changes the PR head and requires fresh exact-head CI/CodeQL. No production DB mutation, backup/restore, Railway deployment, PR merge or public release.


## 2026-11-10 — P0 role-boundary review
- Found a least-privilege assertion gap in the SECURITY DEFINER bootstrap owner role: the existing migration/test checked memberships held by the bootstrap role but not other roles granted membership in it.
- Updated migration 20261109160000 and tests/sql/platform-db-role-boundary.sql to reject membership in either direction and explicitly reject platform runtime membership in the bootstrap role.
- The fix is source-only and awaits exact-head CI/CodeQL. No production role, grant, schema or data was changed.
