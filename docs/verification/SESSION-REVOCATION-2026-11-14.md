# Session revocation enforcement — 2026-11-14

## Baseline
- Repository: `gavad54/zelmira-one-`
- PR: [#5](https://github.com/gavad54/zelmira-one-/pull/5)
- Branch: `feature/vayro-real-dashboard`
- Reviewed head before change: `11bba59960e48d9ab6776f6e407f27b7b9007ddf`
- The Prisma `Session` model already contains nullable `revokedAt`, but the shared session lookup, platform-owner authorization helper and tenant authorization helper did not reject non-null revocation timestamps.

## Change
- `currentSession()` now rejects revoked sessions before returning an authenticated user.
- `authorizeOwnerSession()` now rejects revoked sessions before owner authorization.
- `authorizeTenantRequest()` now rejects revoked sessions before tenant membership lookup.
- Added unit regression tests for owner and tenant authorization and a PostgreSQL-backed HTTP regression test for `GET /api/auth/me`.

## Verification boundary
The change is limited to the development branch and the disposable CI database. The tests must pass on the resulting commit before this finding is marked repository-verified. No production migration, data change, deployment, merge, secret change or public release is included.
