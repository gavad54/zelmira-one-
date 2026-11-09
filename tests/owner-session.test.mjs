import test from "node:test";
import assert from "node:assert/strict";
import { authorizeOwnerSession } from "../src/lib/owner-session.mjs";

function makeDb(session) {
  return {
    session: {
      findUnique: async () => session ? {
        id: "session-test",
        createdAt: new Date(),
        lastSeenAt: new Date(),
        ...session
      } : null,
      updateMany: async () => ({ count: 1 })
    }
  };
}

test("owner session accepts only active, unexpired OWNER sessions", async () => {
  const session = {
    expiresAt: new Date(Date.now() + 60_000),
    assurance: "MFA",
    mfaAuthenticatedAt: new Date(),
    user: { id: "owner-1", platformRole: "OWNER", emailVerifiedAt: new Date(), disabledAt: null }
  };
  const result = await authorizeOwnerSession({ sessionToken: "a".repeat(64), db: makeDb(session) });
  assert.deepEqual(result, { authorized: true, userId: "owner-1" });
});

test("owner session rejects unverified owner accounts", async () => {
  const unverified = {
    expiresAt: new Date(Date.now() + 60_000),
    user: { id: "owner-1", platformRole: "OWNER", emailVerifiedAt: null, disabledAt: null }
  };
  assert.deepEqual(
    await authorizeOwnerSession({ sessionToken: "a".repeat(64), db: makeDb(unverified) }),
    { authorized: false }
  );
});

test("owner session rejects non-owner, disabled and expired accounts", async () => {
  const base = { expiresAt: new Date(Date.now() + 60_000), user: { id: "u1", platformRole: "USER", disabledAt: null } };
  assert.deepEqual(await authorizeOwnerSession({ sessionToken: "a".repeat(64), db: makeDb(base) }), { authorized: false });
  const disabled = { ...base, user: { ...base.user, platformRole: "OWNER", disabledAt: new Date() } };
  assert.deepEqual(await authorizeOwnerSession({ sessionToken: "a".repeat(64), db: makeDb(disabled) }), { authorized: false });
  const expired = { ...base, expiresAt: new Date(Date.now() - 1), user: { ...base.user, platformRole: "OWNER" } };
  assert.deepEqual(await authorizeOwnerSession({ sessionToken: "a".repeat(64), db: makeDb(expired) }), { authorized: false });
});

test("owner session fails closed for malformed tokens and database failures", async () => {
  assert.deepEqual(await authorizeOwnerSession({ sessionToken: "bad", db: makeDb(null) }), { authorized: false });
  const broken = { session: { findUnique: async () => { throw new Error("database offline"); } } };
  assert.deepEqual(await authorizeOwnerSession({ sessionToken: "b".repeat(64), db: broken }), { authorized: false });
});

test("owner session rejects explicitly revoked sessions", async () => {
  const revoked = {
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: new Date(),
    user: { id: "owner-1", platformRole: "OWNER", emailVerifiedAt: new Date(), disabledAt: null }
  };
  assert.deepEqual(
    await authorizeOwnerSession({ sessionToken: "a".repeat(64), db: makeDb(revoked) }),
    { authorized: false }
  );
});

test("owner session rejects password-only and stale MFA assurance", async () => {
  const base = {
    expiresAt: new Date(Date.now() + 60_000),
    user: { id: "owner-1", platformRole: "OWNER", emailVerifiedAt: new Date(), disabledAt: null }
  };
  assert.deepEqual(
    await authorizeOwnerSession({ sessionToken: "a".repeat(64), db: makeDb({ ...base, assurance: "PASSWORD" }) }),
    { authorized: false }
  );
  assert.deepEqual(
    await authorizeOwnerSession({
      sessionToken: "a".repeat(64),
      db: makeDb({ ...base, assurance: "MFA", mfaAuthenticatedAt: new Date(Date.now() - 13 * 60 * 60 * 1000) })
    }),
    { authorized: false }
  );
});


test("owner session revokes idle sessions and rejects them", async () => {
  const now = new Date("2026-11-08T12:00:00.000Z");
  const idle = {
    expiresAt: new Date(now.getTime() + 60_000),
    lastSeenAt: new Date(now.getTime() - 31 * 60 * 1000),
    assurance: "MFA",
    mfaAuthenticatedAt: now,
    user: { id: "owner-1", platformRole: "OWNER", emailVerifiedAt: now, disabledAt: null }
  };
  const db = makeDb(idle);
  assert.deepEqual(
    await authorizeOwnerSession({ sessionToken: "a".repeat(64), db, now }),
    { authorized: false }
  );
});
