import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { authorizeTenantRequest } from "../src/lib/tenant-request-authorization.mjs";

const token = "ab".repeat(32);
const tokenHash = createHash("sha256").update(token).digest("hex");
const now = new Date("2026-11-04T12:00:00.000Z");

function database({ session, membership, sessionError, membershipError } = {}) {
  const calls = { session: [], membership: [] };
  return {
    calls,
    session: {
      async findUnique(args) {
        calls.session.push(args);
        if (sessionError) throw sessionError;
        return session ?? null;
      }
    },
    membership: {
      async findUnique(args) {
        calls.membership.push(args);
        if (membershipError) throw membershipError;
        return membership ?? null;
      }
    }
  };
}

const activeSession = {
  expiresAt: new Date("2026-11-05T12:00:00.000Z"),
  user: { id: "user-a", emailVerifiedAt: new Date("2026-11-01T00:00:00.000Z"), disabledAt: null }
};
const activeMembership = {
  userId: "user-a",
  tenantId: "tenant-a",
  role: "OWNER",
  tenant: { id: "tenant-a", status: "ACTIVE" }
};

test("authorizes only a valid active session and DB-derived tenant membership", async () => {
  const db = database({ session: activeSession, membership: activeMembership });
  const result = await authorizeTenantRequest({
    sessionToken: token, tenantId: "tenant-a", action: "tenant_read", db, now
  });
  assert.deepEqual(result, {
    authorized: true, userId: "user-a", tenantId: "tenant-a", role: "OWNER"
  });
  assert.deepEqual(db.calls.session[0], {
    where: { tokenHash },
    include: { user: { select: { id: true, emailVerifiedAt: true, disabledAt: true } } }
  });
  assert.deepEqual(db.calls.membership[0], {
    where: { userId_tenantId: { userId: "user-a", tenantId: "tenant-a" } },
    include: { tenant: { select: { id: true, status: true } } }
  });
});

test("denies missing, malformed and unknown session tokens without querying membership", async () => {
  for (const sessionToken of [undefined, null, "", "x".repeat(5000)]) {
    const db = database();
    const result = await authorizeTenantRequest({
      sessionToken, tenantId: "tenant-a", action: "tenant_read", db, now
    });
    assert.equal(result.authorized, false);
    assert.equal(db.calls.membership.length, 0);
  }
});

test("rejects non-canonical session tokens before database lookup", async () => {
  const db = database({ session: activeSession, membership: activeMembership });
  const result = await authorizeTenantRequest({
    sessionToken: "z".repeat(64), tenantId: "tenant-a", action: "tenant_read", db, now
  });
  assert.equal(result.authorized, false);
  assert.equal(db.calls.session.length, 0);
  assert.equal(db.calls.membership.length, 0);
});

test("denies unknown sessions", async () => {
  const db = database();
  const result = await authorizeTenantRequest({
    sessionToken: token, tenantId: "tenant-a", action: "tenant_read", db, now
  });
  assert.equal(result.authorized, false);
  assert.equal(db.calls.session[0].where.tokenHash, tokenHash);
});

test("denies unverified users before checking tenant membership", async () => {
  const db = database({
    session: { ...activeSession, user: { id: "user-a", emailVerifiedAt: null, disabledAt: null } },
    membership: activeMembership
  });
  assert.equal((await authorizeTenantRequest({
    sessionToken: token, tenantId: "tenant-a", action: "tenant_read", db, now
  })).authorized, false);
  assert.equal(db.calls.membership.length, 0);
});

test("denies expired sessions and disabled users", async () => {
  const expired = database({
    session: { ...activeSession, expiresAt: new Date(now.getTime()) },
    membership: activeMembership
  });
  assert.equal((await authorizeTenantRequest({
    sessionToken: token, tenantId: "tenant-a", action: "tenant_read", db: expired, now
  })).authorized, false);
  assert.equal(expired.calls.membership.length, 0);

  const disabled = database({
    session: { ...activeSession, user: { id: "user-a", disabledAt: now } },
    membership: activeMembership
  });
  assert.equal((await authorizeTenantRequest({
    sessionToken: token, tenantId: "tenant-a", action: "tenant_read", db: disabled, now
  })).authorized, false);
  assert.equal(disabled.calls.membership.length, 0);
});

test("denies absent, cross-tenant and inactive tenant memberships", async () => {
  for (const membership of [
    null,
    { ...activeMembership, tenantId: "tenant-b", tenant: { id: "tenant-b", status: "ACTIVE" } },
    { ...activeMembership, tenant: { id: "tenant-a", status: "SUSPENDED" } }
  ]) {
    const db = database({ session: activeSession, membership });
    assert.equal((await authorizeTenantRequest({
      sessionToken: token, tenantId: "tenant-a", action: "tenant_read", db, now
    })).authorized, false);
  }
});

test("applies action-level role restrictions to database membership", async () => {
  const db = database({
    session: activeSession,
    membership: { ...activeMembership, role: "VIEWER" }
  });
  assert.equal((await authorizeTenantRequest({
    sessionToken: token, tenantId: "tenant-a", action: "billing_manage", db, now
  })).authorized, false);
});

test("fails closed when database lookups throw", async () => {
  for (const db of [
    database({ sessionError: new Error("database unavailable") }),
    database({ session: activeSession, membershipError: new Error("database unavailable") })
  ]) {
    const result = await authorizeTenantRequest({
      sessionToken: token, tenantId: "tenant-a", action: "tenant_read", db, now
    });
    assert.equal(result.authorized, false);
  }
});
