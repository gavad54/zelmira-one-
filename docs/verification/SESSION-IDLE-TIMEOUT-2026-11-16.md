# Session idle-timeout enforcement — 2026-11-16

## Scope

This change backports the tested mainline idle-session policy into PR #5 without changing its authentication schema or MFA model.

## Runtime behavior

- Sessions idle for more than 30 minutes are rejected and marked revoked.
- A missing `lastSeenAt` uses `createdAt` as the initial activity timestamp, preserving deterministic behavior for existing sessions.
- Active sessions update `lastSeenAt` at most once every five minutes.
- The owner-only authorization helper enforces the same idle policy directly, so privileged API routes cannot bypass it by avoiding `currentSession()`.
- Activity refresh uses a conditional update requiring the session to remain unrevoked and unexpired; a concurrent revocation/expiry causes authorization to fail closed.

## Verification added

- Unit tests cover idle revocation, the `createdAt` fallback, five-minute activity refresh and a concurrent update race.
- PostgreSQL + production-HTTP integration coverage verifies that `/api/auth/me` revokes a session idle for more than 30 minutes and refreshes a recently active session.

## Migration boundary

The new forward-only migration is applied only by the repository's disposable PostgreSQL CI job. It has not been run against VAYRO-CORE or any production database. PR #5 remains Draft and unmerged.
