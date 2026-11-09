# VAYRO security engineering checkpoint — 2026-11-09

**Workstream:** trusted client-IP throttling and endpoint authorization inventory  
**Branch:** `security/mfa-session-endpoint-gates`  
**PR:** #6  
**Production posture:** READ-ONLY — DEPLOYMENT BLOCKED — NOT RELEASED

## 1. Fail-closed IP throttling

### Change
- Added `src/lib/ip-rate-limit.mjs` and its TypeScript declaration.
- Updated `src/lib/auth-service.ts` so `allowIpAttempt()` delegates to the fail-closed gate.
- If `TRUSTED_PROXY_HOPS` is missing/invalid, or the forwarded chain cannot produce a trusted client fingerprint, the IP limiter returns `false`. The calling endpoint therefore denies the protected operation instead of treating missing identity as permission.
- The account/user keyed limiter remains a separate control; it does not substitute for the IP limiter.

### Tests added
- `tests/ip-rate-limit.test.mjs`: missing/null/empty fingerprint denies without calling the persistence limiter; valid fingerprints delegate; limiter decision is preserved.
- `tests/auth-endpoints.integration.mjs`: adds negative-origin and unauthenticated checks for DANA prompt studio, NEGAH creative brief and password change; verifies the public AI capability catalogue and rejects invalid product filters.

**Important operational effect:** until the actual ingress/proxy chain is verified and `TRUSTED_PROXY_HOPS` is set in protected runtime configuration, endpoints that invoke the IP gate will be denied. This is intentional fail-closed behavior, not a healthy launch configuration. No hop count was guessed and no production environment variable was changed.

## 2. Endpoint authorization inventory

The source inventory now covers 33 API route files changed in PR #6 (40 exported HTTP method handlers) plus the two existing baseline endpoints `GET /api/auth/me` and `GET /api/health`: 42 HTTP operations total.

Added source-derived rows for:
- `POST /api/auth/change-password`
- `GET /api/ai-business-suite/capabilities`
- `POST /api/dana/prompt-studio`
- `POST /api/negah/creative-brief`

The matrix explicitly distinguishes public static catalogue data from authenticated template-only endpoints, and from tenant-authorized provider-backed generation/history endpoints.

Updated documents:
- `docs/security/ENDPOINT-AUTHORIZATION-MATRIX.md`
- `docs/operations/TRUSTED-PROXY-AND-MIGRATION-REHEARSAL-RUNBOOK.md`

Source inventory is reconciled; this does **not** mean every matrix row has an independently executed positive and negative test. Per-operation evidence remains incomplete.

## 3. Verification and limits

- New unit and integration tests are committed.
- The CI workflow is configured to run on pushes to `security/mfa-session-endpoint-gates`; CodeQL is also configured for pushes to that branch.
- The connected workflow-run listing returns only PR-triggered runs, so it does not expose the push-triggered runs for this branch. The combined status currently shows only the external Railway context as pending. Exact-head CI and CodeQL results therefore remain **unverified through the available connection**.
- No local checkout/runtime is available in this session to execute `npm test`, `npm run test:integration`, `npm run lint`, `npm run typecheck` or `npm run build`.
- Production ingress has not been exercised. No production environment variable was changed.
- No database DDL/DML, migration, role, grant, policy, backup, restore, hosting or deployment operation was performed.

## 4. Remaining gates

1. Obtain hosting-operator evidence for the real reverse-proxy chain and configure the exact trusted hop count in protected runtime settings.
2. Run real-ingress tests proving client-IP extraction, per-IP throttling, independent client keys, malformed-chain denial and no direct-origin bypass.
3. Obtain exact-head CI, integration, lint, typecheck, build, Docker and CodeQL evidence.
4. Add/execute operation-specific positive and negative authorization tests for every critical/high row; review role distinctions and bearer-token capabilities.
5. Complete independent encrypted backup, isolated restore and schema/migration reconciliation before any database rehearsal.
6. Keep production database read-only until the restore clone and migration/role/RLS negative tests pass.

**Decision: SOURCE CHANGES COMMITTED — TESTS ADDED BUT NOT EXECUTED/VERIFIED HERE — PRODUCTION SECURITY NOT VERIFIED — DEPLOYMENT BLOCKED — NOT RELEASED.**
