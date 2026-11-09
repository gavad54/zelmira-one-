# VAYRO Session and Token Lifecycle

**Design baseline:** 19f4834f601e793df7b33917f5e141155de2ba87  
**Status:** PARTIAL IMPLEMENTATION — ISOLATED CI PASSED; PRODUCTION RELEASE GATES OPEN

## 1. Existing architecture

VAYRO currently uses an opaque, random 256-bit session bearer stored in the `vayro_session` HttpOnly cookie. Only SHA-256(token) is persisted in the PostgreSQL `Session.tokenHash` column. The cookie is configured with HttpOnly, SameSite=Lax, Path=/, an absolute seven-day expiry, and Secure when NODE_ENV=production.

The application does not currently issue JWT access tokens or separate refresh tokens. Therefore JWT signature, issuer, audience and algorithm validation are not applicable to the current design. Introducing JWTs is not required to complete this browser-session architecture and would add unnecessary key-management and replay complexity.

## 2. Existing verified-by-source behavior (not production verification)

- Session token generation uses Node crypto randomBytes(32).
- Session lookup uses a SHA-256 digest, not the raw cookie value.
- Current-session resolution rejects absent/malformed tokens, missing sessions, expired sessions, explicitly revoked sessions and disabled users.
- Owner-session and tenant-request authorization helpers also reject sessions with `revokedAt` set.
- Unit tests cover revoked owner and tenant sessions; an HTTP/PostgreSQL integration test covers `/api/auth/me` with a revoked session. The current branch CI passed the unit and PostgreSQL/production-HTTP integration suites.
- Logout deletes the current DB session and clears the cookie.
- Password-reset completion consumes the reset token transactionally, updates the password and deletes all sessions for that user.
- Tenant authorization resolves session and membership from trusted DB records and fails closed on lookup errors.
- Password-only login now issues a general session only for non-privileged users. Platform OWNER/PLATFORM_ADMIN and active tenant OWNER/ADMIN accounts receive a short-lived enrollment or login challenge instead.
- Expired absolute-TTL sessions are rejected. Idle sessions older than 30 minutes are revoked on authenticated session resolution; activity timestamps are refreshed at most once every five minutes.
- Prisma schema and additive migration define `revokedAt`, `lastSeenAt`, `assurance`, and `mfaAuthenticatedAt`. `revokedAt` is enforced by identity, owner and tenant authorization; recent MFA assurance is required by platform owner and tenant OWNER/ADMIN authorization. Last-seen updates use a five-minute write throttle; device metadata and session-family/rotation state remain unimplemented.
- `GET /api/auth/sessions` lists only the authenticated user's active sessions without token digests. `POST /api/auth/sessions/revoke` revokes one session only when it belongs to the authenticated user. `POST /api/auth/sessions/revoke-all` revokes all of that user's active sessions. Both mutation endpoints enforce same-origin and emit audit events.
- No authenticated password-change endpoint was found.

## 3. Target lifecycle

Keep opaque cookie sessions unless a documented non-browser client requirement justifies a separate token protocol.

Remaining required changes:
- Add a central policy abstraction for MFA assurance and step-up freshness; current enforcement exists in platform owner and tenant owner/admin authorization helpers.
- Make the current 30-minute idle timeout and five-minute activity-write interval configuration-backed with validated startup policy; currently these values are code constants.
- Add device/session metadata (coarse device label and created-from context) only after a privacy review.
- MFA enrollment, login verification and disablement revoke all previous sessions transactionally. Extend revocation to account disablement and privileged role/permission changes.
- Rotate the opaque session token after successful MFA step-up and other privilege-boundary transitions. Invalidate the previous token atomically.
- Use transactional compare-and-swap semantics to prevent concurrent rotation/replay.
- Never accept session identifiers or user IDs from client body/query as proof of ownership.
- Continue to reject state-changing cross-origin browser requests.
- Keep cookies HttpOnly, Secure in production, SameSite appropriate to the app's origin topology, Path=/, and no Domain attribute unless a reviewed requirement exists.
- Apply Cache-Control: no-store to identity and security responses.
- Do not put session or challenge tokens in URLs, analytics, telemetry or logs.

## 4. Session rotation and replay model

The session token remains a high-entropy opaque random value. Store only its digest. Rotation must occur in a DB transaction:
1. Validate the current unexpired, unrevoked session and its user.
2. Generate a new random token and digest.
3. Mark the old session as revoked (or replace it with a one-way rotation reference).
4. Create the successor session with the required authentication assurance.
5. Commit before returning the new cookie.
6. A concurrent reuse of the old session must not create multiple successors.

A session token is not a refresh token. The browser receives the new cookie only after the transaction commits. Reuse of a revoked/rotated token is denied and generates a security event without recording the raw token.

## 5. Expiry policy

The existing seven-day value is an absolute TTL, not proof of an appropriate risk-based idle policy. Before changing it, evaluate:
- Privilege level (platform owner/admin vs ordinary user).
- Whether MFA was completed and how recently.
- Sensitivity of the operation.
- Browser/device trust and recovery posture.
- Product usage and user experience.

The final policy must define idle expiry, absolute expiry, step-up freshness and revocation semantics separately. Values should be configuration-backed and validated at startup; missing or malformed security configuration must fail closed for privileged operations.

## 6. Required tests

- Expired, malformed, unknown and revoked session tokens are rejected.
- Logout invalidates the DB session and the old cookie cannot authenticate.
- Single-device revocation invalidates only the selected owned session.
- All-device revocation invalidates every session for the authenticated user.
- Password change/reset revokes all prior sessions.
- MFA enrollment, disablement and recovery revoke prior sessions.
- Session rotation invalidates the old token and accepts only the successor.
- Concurrent rotation cannot produce multiple valid successors.
- A session belonging to another user cannot be used or revoked by the caller.
- Privilege changes invalidate prior assurance and force fresh authentication/MFA.
- Expired session cleanup never deletes active sessions.
- Session tokens are absent from logs and URL parameters.
- Cookie attributes and no-store headers are verified over HTTP.

## 7. Acceptance

The session gate remains `BLOCKED` until the target behavior is implemented, the integration tests run against an isolated PostgreSQL test database, CI evidence is attached, and an independent review confirms the state transitions. Current source coverage is partial. The idle timeout and session management endpoints passed CI on the recorded branch head; independent review, production runtime key provisioning, production migration approval, privilege-change invalidation, password-change flow, and owner acceptance remain open.
