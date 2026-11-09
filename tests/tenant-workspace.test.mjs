import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { getTenantWorkspace } from "../src/lib/tenant-workspace.mjs";

const sessionToken = "cd".repeat(32);
const tokenHash = createHash("sha256").update(sessionToken).digest("hex");
const now = new Date("2026-11-06T08:00:00.000Z");

const activeSession = {
  id: "session-1",
  userId: "user-1",
  createdAt: new Date("2026-11-06T07:50:00.000Z"),
  lastSeenAt: new Date("2026-11-06T07:58:00.000Z"),
  expiresAt: new Date("2026-11-07T08:00:00.000Z"),
  assurance: "MFA",
  mfaAuthenticatedAt: new Date("2026-11-06T07:00:00.000Z"),
  user: { id: "user-1", emailVerifiedAt: new Date("2026-11-05T08:00:00.000Z"), disabledAt: null }
};
const activeMembership = {
  userId: "user-1",
  tenantId: "tenant-1",
  role: "OWNER",
  tenant: { id: "tenant-1", status: "ACTIVE" }
};
const activeTenant = {
  id: "tenant-1",
  name: "شرکت نمونه",
  slug: "vayro-sample",
  status: "ACTIVE",
  createdAt: new Date("2026-11-01T08:00:00.000Z"),
  _count: { memberships: 2 },
  licenses: [{
    id: "license-1",
    startsAt: new Date("2026-11-01T00:00:00.000Z"),
    endsAt: null,
    product: {
      key: "DANA",
      name: "دانا",
      description: "دستیار هوشمند",
      status: "ACTIVE",
      baseUrl: null
    }
  }]
};

function makeDb({ session = activeSession, membership = activeMembership, tenant = activeTenant, tenantError } = {}) {
  const calls = { session: [], membership: [], tenant: [], roleCheck: 0 };
  return {
    calls,
    session: {
      async findUnique(args) {
        calls.session.push(args);
        return session;
      },
      async updateMany() {
        return { count: 1 };
      }
    },
    user: {
      async findUnique() {
        return session?.user ?? null;
      }
    },
    membership: {
      async findUnique(args) {
        calls.membership.push(args);
        return membership;
      }
    },
    tenant: {
      async findUnique(args) {
        calls.tenant.push(args);
        if (tenantError) throw tenantError;
        return tenant;
      }
    },
    async $queryRaw() {
      calls.roleCheck += 1;
      if (calls.roleCheck === 1) return [{
        role_name: "vayro_app",
        is_superuser: false,
        bypasses_rls: false,
        can_use_vayro_app: true,
        owns_protected_tables: false
      }];
      return [];
    },
    async $transaction(callback) {
      return callback(this);
    }
  };
}

test("returns a workspace summary only after DB-backed membership authorization", async () => {
  const db = makeDb();
  const result = await getTenantWorkspace({
    sessionToken, tenantId: "tenant-1", db, now
  });

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, {
    tenant: {
      id: "tenant-1",
      name: "شرکت نمونه",
      slug: "vayro-sample",
      status: "ACTIVE",
      createdAt: activeTenant.createdAt,
      memberCount: 2,
      products: [{
        licenseId: "license-1",
        startsAt: activeTenant.licenses[0].startsAt,
        endsAt: null,
        key: "DANA",
        name: "دانا",
        description: "دستیار هوشمند",
        status: "ACTIVE",
        baseUrl: null
      }]
    },
    role: "OWNER"
  });
  assert.equal(db.calls.session[0].where.tokenHash, tokenHash);
  assert.equal(db.calls.membership[0].where.userId_tenantId.tenantId, "tenant-1");
  assert.equal(db.calls.tenant.length, 1);
  assert.deepEqual(db.calls.tenant[0].where, { id: "tenant-1" });
});

test("denies missing sessions and cross-tenant membership before reading tenant data", async () => {
  const noSession = makeDb({ session: null });
  const deniedSession = await getTenantWorkspace({
    sessionToken, tenantId: "tenant-1", db: noSession, now
  });
  assert.equal(deniedSession.status, 401);
  assert.equal(noSession.calls.tenant.length, 0);

  const otherTenant = makeDb({
    membership: {
      ...activeMembership,
      tenantId: "tenant-2",
      tenant: { id: "tenant-2", status: "ACTIVE" }
    }
  });
  const deniedTenant = await getTenantWorkspace({
    sessionToken, tenantId: "tenant-1", db: otherTenant, now
  });
  assert.equal(deniedTenant.status, 401);
  assert.equal(otherTenant.calls.tenant.length, 0);
});

test("returns not found for deleted or inactive tenants", async () => {
  for (const tenant of [null, { ...activeTenant, status: "SUSPENDED" }]) {
    const db = makeDb({ tenant });
    const result = await getTenantWorkspace({
      sessionToken, tenantId: "tenant-1", db, now
    });
    assert.equal(result.status, 404);
  }
});

test("fails closed with a generic service error when tenant storage fails", async () => {
  const db = makeDb({ tenantError: new Error("private database details") });
  const result = await getTenantWorkspace({
    sessionToken, tenantId: "tenant-1", db, now
  });
  assert.deepEqual(result, {
    status: 503,
    body: { error: "workspace_unavailable" }
  });
});
