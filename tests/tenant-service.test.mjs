import test from "node:test";
import assert from "node:assert/strict";
import * as tenantService from "../src/lib/tenant-service.mjs";
const { listActiveTenants, createTenantWithOwnerAudit } = tenantService;

test("lists only active memberships for the authenticated user", async () => {
  const calls = [];
  const rows = [{
    role: "OWNER",
    tenant: {
      id: "tenant-1",
      name: "شرکت نمونه",
      slug: "vayro-sample",
      status: "ACTIVE",
      createdAt: new Date("2026-11-01T00:00:00.000Z")
    }
  }];
  const db = {
    membership: {
      async findMany(args) {
        calls.push(args);
        return rows;
      }
    }
  };

  const result = await listActiveTenants({ db, userId: "user-1" });
  assert.deepEqual(result, [{ ...rows[0].tenant, role: "OWNER" }]);
  assert.deepEqual(calls[0].where, {
    userId: "user-1",
    tenant: { status: "ACTIVE" }
  });
});

test("creates tenant, OWNER membership and audit event in one transaction", async () => {
  const operations = [];
  const created = {
    id: "tenant-new",
    name: "شرکت جدید",
    slug: "vayro-random",
    status: "ACTIVE",
    createdAt: new Date("2026-11-06T08:00:00.000Z")
  };
  const db = {
    async $transaction(callback) {
      operations.push("transaction:start");
      const result = await callback({
        tenant: {
          async create(args) {
            operations.push("tenant:create");
            assert.equal(args.data.name, "شرکت جدید");
            assert.equal(args.data.slug, "vayro-random");
            assert.deepEqual(args.data.memberships.create, {
              userId: "user-owner",
              role: "OWNER"
            });
            return created;
          }
        },
        auditEvent: {
          async create(args) {
            operations.push("audit:create");
            assert.deepEqual(args.data, {
              actorUserId: "user-owner",
              tenantId: "tenant-new",
              action: "tenant.created",
              resource: "Tenant",
              resourceId: "tenant-new"
            });
          }
        }
      });
      operations.push("transaction:commit");
      return result;
    }
  };

  const result = await createTenantWithOwnerAudit({
    db,
    userId: "user-owner",
    name: "شرکت جدید",
    slug: "vayro-random"
  });

  assert.deepEqual(operations, [
    "transaction:start",
    "tenant:create",
    "audit:create",
    "transaction:commit"
  ]);
  assert.deepEqual(result, { ...created, role: "OWNER" });
});

test("does not report tenant creation as successful when audit write fails", async () => {
  const db = {
    async $transaction(callback) {
      return callback({
        tenant: { async create() { return { id: "tenant-new" }; } },
        auditEvent: { async create() { throw new Error("audit unavailable"); } }
      });
    }
  };

  await assert.rejects(
    createTenantWithOwnerAudit({
      db,
      userId: "user-owner",
      name: "شرکت جدید",
      slug: "vayro-random"
    }),
    /audit unavailable/
  );
});


test("renames only an active tenant and records the change atomically", async () => {
  const operations = [];
  const renamed = {
    id: "tenant-1",
    name: "نام تازه",
    slug: "vayro-one",
    status: "ACTIVE",
    updatedAt: new Date("2026-11-07T10:00:00.000Z")
  };
  const db = {
    async $transaction(callback) {
      return callback({
        tenant: {
          async updateMany(args) {
            operations.push("tenant:update");
            assert.deepEqual(args, {
              where: { id: "tenant-1", status: "ACTIVE" },
              data: { name: "نام تازه" }
            });
            return { count: 1 };
          },
          async findUnique(args) {
            operations.push("tenant:read");
            assert.deepEqual(args, {
              where: { id: "tenant-1" },
              select: { id: true, name: true, slug: true, status: true, updatedAt: true }
            });
            return renamed;
          }
        },
        auditEvent: {
          async create(args) {
            operations.push("audit:create");
            assert.deepEqual(args.data, {
              actorUserId: "user-owner",
              tenantId: "tenant-1",
              action: "tenant.renamed",
              resource: "Tenant",
              resourceId: "tenant-1",
              metadata: { name: "نام تازه" }
            });
          }
        }
      });
    }
  };

  const result = await tenantService.renameTenantWithOwnerAudit({
    db, tenantId: "tenant-1", actorUserId: "user-owner", name: "نام تازه"
  });
  assert.deepEqual(result, renamed);
  assert.deepEqual(operations, ["tenant:update", "tenant:read", "audit:create"]);
});

test("does not rename or audit a tenant that is no longer active", async () => {
  const operations = [];
  const db = {
    async $transaction(callback) {
      return callback({
        tenant: {
          async updateMany() { operations.push("tenant:update"); return { count: 0 }; },
          async findUnique() { operations.push("tenant:read"); return null; }
        },
        auditEvent: { async create() { operations.push("audit:create"); } }
      });
    }
  };

  const result = await tenantService.renameTenantWithOwnerAudit({
    db, tenantId: "tenant-closed", actorUserId: "user-owner", name: "نام تازه"
  });
  assert.equal(result, null);
  assert.deepEqual(operations, ["tenant:update"]);
});

test("closes a tenant without deleting it and records the closure atomically", async () => {
  const operations = [];
  const closed = {
    id: "tenant-1",
    name: "شرکت نمونه",
    slug: "vayro-one",
    status: "CLOSED",
    updatedAt: new Date("2026-11-07T10:00:00.000Z")
  };
  const db = {
    async $transaction(callback) {
      return callback({
        tenant: {
          async updateMany(args) {
            operations.push("tenant:close");
            assert.deepEqual(args, {
              where: { id: "tenant-1", status: "ACTIVE" },
              data: { status: "CLOSED" }
            });
            return { count: 1 };
          },
          async findUnique() { operations.push("tenant:read"); return closed; }
        },
        auditEvent: {
          async create(args) {
            operations.push("audit:create");
            assert.deepEqual(args.data, {
              actorUserId: "user-owner",
              tenantId: "tenant-1",
              action: "tenant.closed",
              resource: "Tenant",
              resourceId: "tenant-1"
            });
          }
        }
      });
    }
  };

  const result = await tenantService.closeTenantWithOwnerAudit({
    db, tenantId: "tenant-1", actorUserId: "user-owner"
  });
  assert.deepEqual(result, closed);
  assert.deepEqual(operations, ["tenant:close", "tenant:read", "audit:create"]);
});


test("lists tenant members with a restricted user projection and stable ordering", async () => {
  const calls = [];
  const joinedAt = new Date("2026-11-08T09:00:00.000Z");
  const rows = [{
    role: "OWNER",
    createdAt: joinedAt,
    user: { id: "user-1", email: "owner@example.test", displayName: "Owner" }
  }, {
    role: "MEMBER",
    createdAt: new Date("2026-11-08T10:00:00.000Z"),
    user: { id: "user-2", email: "member@example.test", displayName: null }
  }];
  const db = {
    membership: {
      async findMany(args) {
        calls.push(args);
        return rows;
      }
    }
  };

  const result = await tenantService.listTenantMembers({ db, tenantId: "tenant-1" });

  assert.deepEqual(calls[0], {
    where: { tenantId: "tenant-1" },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      role: true,
      createdAt: true,
      user: { select: { id: true, email: true, displayName: true } }
    }
  });
  assert.deepEqual(result, [
    { userId: "user-1", email: "owner@example.test", displayName: "Owner", role: "OWNER", joinedAt },
    { userId: "user-2", email: "member@example.test", displayName: null, role: "MEMBER", joinedAt: rows[1].createdAt }
  ]);
});

test("rejects tenant member listing without a database or tenant identifier", async () => {
  await assert.rejects(
    tenantService.listTenantMembers({ db: null, tenantId: "tenant-1" }),
    /DB_AND_TENANT_ID_REQUIRED/
  );
  await assert.rejects(
    tenantService.listTenantMembers({ db: {}, tenantId: "" }),
    /DB_AND_TENANT_ID_REQUIRED/
  );
});
