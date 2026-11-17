import test from "node:test";
import assert from "node:assert/strict";
import { authorizeOwnerSession } from "../src/lib/owner-session.mjs";

const now = new Date("2026-11-14T08:00:00.000Z");

function makeDb(session, updateCount = 1) {
  const updates = [];
  return {
    updates,
    session: {
      findUnique: async () => session,
      updateMany: async args => {
        updates.push(args);
        return { count: updateCount };
      }
    }
  };
}

function ownerSession(overrides = {}) {
  return {
    id: "session-1",
    createdAt: new Date(now.getTime() - 60_000),
    lastSeenAt: new Date(now.getTime() - 60_000),
    revokedAt: null,
    expiresAt: new Date(now.getTime() + 60_000),
    assurance: "MFA",
    mfaAuthenticatedAt: new Date(now.getTime() - 60_000),
    user: {
      id: "owner-1",
      platformRole: "OWNER",
      emailVerifiedAt: new Date(now.getTime() - 86_400_000),
      disabledAt: null
    },
    ...overrides
  };
}

test("owner session accepts active, unexpired sessions with recent MFA assurance", async () => {
  const db = makeDb(ownerSession());
  const result = await authorizeOwnerSession({
    sessionToken: "a".repeat(64),
    db,
    now
  });
  assert.deepEqual(result, { authorized: true, userId: "owner-1" });
  assert.equal(db.updates.length, 0);
});

test("owner session rejects revoked sessions even when unexpired", async () => {
  const result = await authorizeOwnerSession({
    sessionToken: "a".repeat(64),
    db: makeDb(ownerSession({ revokedAt: new Date(now.getTime() - 1) })),
    now
  });
  assert.deepEqual(result, { authorized: false });
});

test("owner session rejects password-only or missing MFA assurance", async () => {
  for (const session of [
    ownerSession({ assurance: "PASSWORD", mfaAuthenticatedAt: null }),
    ownerSession({ assurance: "MFA", mfaAuthenticatedAt: null })
  ]) {
    assert.deepEqual(
      await authorizeOwnerSession({ sessionToken: "a".repeat(64), db: makeDb(session), now }),
      { authorized: false }
    );
  }
});

test("owner session rejects stale and future MFA timestamps", async () => {
  for (const mfaAuthenticatedAt of [
    new Date(now.getTime() - 12 * 60 * 60 * 1000 - 1),
    new Date(now.getTime() + 1)
  ]) {
    assert.deepEqual(
      await authorizeOwnerSession({
        sessionToken: "a".repeat(64),
        db: makeDb(ownerSession({ mfaAuthenticatedAt })),
        now
      }),
      { authorized: false }
    );
  }
});

test("owner session rejects unverified, non-owner, disabled and expired accounts", async () => {
  const base = ownerSession();
  const unverified = ownerSession({ user: { ...base.user, emailVerifiedAt: null } });
  const nonOwner = ownerSession({ user: { ...base.user, platformRole: "USER" } });
  const disabled = ownerSession({ user: { ...base.user, disabledAt: now } });
  const expired = ownerSession({ expiresAt: new Date(now.getTime() - 1) });
  for (const session of [unverified, nonOwner, disabled, expired]) {
    assert.deepEqual(
      await authorizeOwnerSession({ sessionToken: "a".repeat(64), db: makeDb(session), now }),
      { authorized: false }
    );
  }
});

test("owner session revokes future activity timestamps", async () => {
  const db = makeDb(ownerSession({ lastSeenAt: new Date(now.getTime() + 60_000) }));
  const result = await authorizeOwnerSession({ sessionToken: "a".repeat(64), db, now });
  assert.deepEqual(result, { authorized: false });
  assert.equal(db.updates.length, 1);
  assert.deepEqual(db.updates[0].where, { id: "session-1", revokedAt: null });
  assert.deepEqual(db.updates[0].data, { revokedAt: now });
});

test("owner session revokes idle sessions and rejects them", async () => {
  const db = makeDb(ownerSession({ lastSeenAt: new Date(now.getTime() - 31 * 60 * 1000) }));
  const result = await authorizeOwnerSession({ sessionToken: "a".repeat(64), db, now });
  assert.deepEqual(result, { authorized: false });
  assert.equal(db.updates.length, 1);
  assert.deepEqual(db.updates[0].where, { id: "session-1", revokedAt: null });
  assert.deepEqual(db.updates[0].data, { revokedAt: now });
});

test("owner session uses createdAt when lastSeenAt is null", async () => {
  const db = makeDb(ownerSession({
    createdAt: new Date(now.getTime() - 31 * 60 * 1000),
    lastSeenAt: null
  }));
  const result = await authorizeOwnerSession({ sessionToken: "a".repeat(64), db, now });
  assert.deepEqual(result, { authorized: false });
  assert.equal(db.updates.length, 1);
});

test("owner session refreshes activity after five minutes without weakening expiry checks", async () => {
  const db = makeDb(ownerSession({ lastSeenAt: new Date(now.getTime() - 6 * 60 * 1000) }));
  const result = await authorizeOwnerSession({ sessionToken: "a".repeat(64), db, now });
  assert.deepEqual(result, { authorized: true, userId: "owner-1" });
  assert.equal(db.updates.length, 1);
  assert.deepEqual(db.updates[0].data, { lastSeenAt: now });
  assert.deepEqual(db.updates[0].where, {
    id: "session-1",
    revokedAt: null,
    expiresAt: { gt: now }
  });
});

test("owner session rejects an activity refresh lost to concurrent revocation", async () => {
  const db = makeDb(ownerSession({ lastSeenAt: new Date(now.getTime() - 6 * 60 * 1000) }), 0);
  const result = await authorizeOwnerSession({ sessionToken: "a".repeat(64), db, now });
  assert.deepEqual(result, { authorized: false });
});

test("owner session fails closed for malformed tokens and database failures", async () => {
  assert.deepEqual(
    await authorizeOwnerSession({ sessionToken: "bad", db: makeDb(null), now }),
    { authorized: false }
  );
  const broken = {
    session: {
      findUnique: async () => { throw new Error("database offline"); },
      updateMany: async () => ({ count: 1 })
    }
  };
  assert.deepEqual(
    await authorizeOwnerSession({ sessionToken: "b".repeat(64), db: broken, now }),
    { authorized: false }
  );
  const missingUpdate = { session: { findUnique: async () => ownerSession() } };
  assert.deepEqual(
    await authorizeOwnerSession({ sessionToken: "c".repeat(64), db: missingUpdate, now }),
    { authorized: false }
  );
});
