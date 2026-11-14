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
The migration is intended for the disposable PostgreSQL instance used by CI. It has not been applied to VAYRO-CORE or any production database. ## CI evidence for the implementation commit

The code/schema/test change at `175d09e320ef3ecb0b2154a276a72656328234b6` completed all repository checks on 2026-11-14:

- [VAYRO CI #43574944542](https://github.com/gavad54/zelmira-one-/actions/runs/43574944542): success; 62 unit tests and 20 PostgreSQL/HTTP integration tests passed, zero failures; dependency audit reported 0 vulnerabilities; Prisma applied the complete migration history including `20261114090000_add_session_revocation`; lint, typecheck and production build passed.
- [Dashboard Validation #43574944557](https://github.com/gavad54/zelmira-one-/actions/runs/43574944557): success; 62 unit tests, lint, typecheck and production build passed.
- [CodeQL #43574944543](https://github.com/gavad54/zelmira-one-/actions/runs/43574944543): success.

These are repository/isolated-CI results only. They do not verify production migration, runtime DB-role configuration, live deployment, UAT or release readiness. No deployment, merge, secret change or public release is included.
