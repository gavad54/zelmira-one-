import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createTenantForAuthenticatedUser } from "../src/lib/tenant-request-transaction.mjs";

const now = new Date("2026-11-19T10:00:00.000Z");
const sessionToken = "a".repeat(64);
const tokenHash = createHash("sha256").update(sessionToken, "utf8").digest("hex");
const tenantId = "123e4567-e89b-12d3-a456-426614174000";
const userId = "user-test-001";

const safeRole = {
  role_name: "vayro_tenant_test",
  is_superuser: false,
  bypasses_rls: false,
  can_use_vayro_app: true,
  has_elevated_membership: false,
  has_other_role_membership: false,
  owns_protected_tables: false
};

function validSession(overrides = {}) {
  return {
    id: "session-test-001",
    tokenHash,
    userId,
    expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
    createdAt: new Date(now.getTime() - 60 * 1000),
    revokedAt: null,
    lastSeenAt: now,
    user: {
      id: userId,
      emailVerifiedAt: now,
      disabledAt: null
    },
    ...overrides
  };
}

function createHarness({
  initial = validSession(),
  current = validSession(),
  currentUser = { id: userId, emailVerifiedAt: now, disabledAt: null },
  role = safeRole
} = {}) {
  const calls = {
    transactions: 0,
    queryRaw: 0,
    tenantCreates: [],
    auditCreates: [],
    transactionOptions: null
  };

  const tx = {
    $queryRaw: async () => {
      calls.queryRaw += 1;
      return calls.queryRaw === 1 ? [role] : [];
    },
    session: { findUnique: async () => current },
    user: { findUnique: async () => currentUser },
    tenant: {
      create: async ({ data }) => {
        calls.tenantCreates.push(data);
        return {
          id: data.id,
          name: data.name,
          slug: data.slug,
          status: "ACTIVE",
          createdAt: now
        };
      }
    },
    auditEvent: {
      create: async ({ data }) => {
        calls.auditCreates.push(data);
        return data;
      }
    }
  };

  const authDb = {
    session: {
      findUnique: async () => initial
    }
  };
  const tenantDb = {
    $transaction: async (callback, options) => {
      calls.transactions += 1;
      calls.transactionOptions = options;
      return callback(tx);
    }
  };

  return { authDb, tenantDb, calls };
}

function input(harness) {
  return {
    ...harness,
    sessionToken,
    tenantId,
    name: "Test workspace",
    slug: "vayro-test-workspace",
    now
  };
}

test("tenant provisioning creates only the authenticated user's owner tenant and audit event", async () => {
  const harness = createHarness();
  const result = await createTenantForAuthenticatedUser(input(harness));

  assert.equal(result.authorized, true);
  assert.equal(result.userId, userId);
  assert.equal(result.value.id, tenantId);
  assert.equal(result.value.role, "OWNER");
  assert.equal(harness.calls.transactions, 1);
  assert.deepEqual(harness.calls.transactionOptions, { timeout: 10000 });
  assert.equal(harness.calls.tenantCreates.length, 1);
  assert.equal(harness.calls.tenantCreates[0].id, tenantId);
  assert.equal(harness.calls.tenantCreates[0].memberships.create.userId, userId);
  assert.equal(harness.calls.tenantCreates[0].memberships.create.role, "OWNER");
  assert.equal(harness.calls.auditCreates.length, 1);
  assert.equal(harness.calls.auditCreates[0].actorUserId, userId);
  assert.equal(harness.calls.auditCreates[0].tenantId, tenantId);
  assert.equal(harness.calls.auditCreates[0].action, "tenant.created");
});

test("tenant provisioning rejects an expired or revoked preflight session before opening a transaction", async () => {
  for (const invalid of [
    validSession({ expiresAt: new Date(now.getTime()) }),
    validSession({ revokedAt: new Date(now.getTime() - 1000) }),
    validSession({ user: { id: userId, emailVerifiedAt: null, disabledAt: null } }),
    validSession({ user: { id: userId, emailVerifiedAt: now, disabledAt: now } }),
    validSession({ lastSeenAt: new Date(now.getTime() - 31 * 60 * 1000) })
  ]) {
    const harness = createHarness({ initial: invalid });
    const result = await createTenantForAuthenticatedUser(input(harness));
    assert.deepEqual(result, { authorized: false });
    assert.equal(harness.calls.transactions, 0);
    assert.equal(harness.calls.tenantCreates.length, 0);
  }
});

test("tenant provisioning revalidates revocation inside the tenant transaction", async () => {
  const harness = createHarness({
    current: validSession({ revokedAt: new Date(now.getTime() - 1) })
  });

  const result = await createTenantForAuthenticatedUser(input(harness));

  assert.deepEqual(result, { authorized: false });
  assert.equal(harness.calls.transactions, 1);
  assert.equal(harness.calls.tenantCreates.length, 0);
  assert.equal(harness.calls.auditCreates.length, 0);
});

test("tenant provisioning fails closed for an elevated or incorrectly scoped database role", async () => {
  const harness = createHarness({
    role: { ...safeRole, bypasses_rls: true }
  });

  await assert.rejects(
    createTenantForAuthenticatedUser(input(harness)),
    /UNSAFE_TENANT_DATABASE_ROLE/
  );
  assert.equal(harness.calls.tenantCreates.length, 0);
  assert.equal(harness.calls.auditCreates.length, 0);
});

test("tenant provisioning rejects malformed identifiers and tenant metadata before database access", async () => {
  const harness = createHarness();
  const invalidInputs = [
    { tenantId: "not-a-uuid" },
    { name: " " },
    { name: "x".repeat(101) },
    { slug: "Invalid Slug" }
  ];

  for (const override of invalidInputs) {
    const result = await createTenantForAuthenticatedUser({
      ...input(harness),
      ...override
    });
    assert.deepEqual(result, { authorized: false });
  }

  assert.equal(harness.calls.transactions, 0);
  assert.equal(harness.calls.tenantCreates.length, 0);
});
