# Session revocation enforcement — 2026-11-14

## Baseline
- Repository: `gavad54/zelmira-one-`
- PR: [#5](https://github.com/gavad54/zelmira-one-/pull/5)
- Branch: `feature/vayro-real-dashboard`
- Reviewed head before this change: `14cc80396c4776b4398937a33cb7029b067e691f`
- The PR branch's `Session` model and database table had no persisted revocation timestamp. The shared session lookup, platform-owner authorization helper and tenant authorization helper therefore had no common revocation signal to enforce.

## Change
- Added nullable `Session.revokedAt` to Prisma and a forward-only migration that adds the database column.
- `currentSession()` now rejects sessions with a non-null revocation timestamp.
- `authorizeOwnerSession()` and `authorizeTenantRequest()` reject revoked sessions before granting access; tenant authorization denies before loading membership.
- Added owner/tenant unit regression tests and a PostgreSQL-backed HTTP regression test for `GET /api/auth/me`.
- Updated the workspace authorization fixture to model an explicitly unrevoked database session.

## Verification boundary
The migration is intended for the disposable PostgreSQL instance used by CI. It has not been applied to VAYRO-CORE or any production database. Repository CI must pass on the final commit before this change is considered verified. No deployment, merge, secret change or public release is included.
