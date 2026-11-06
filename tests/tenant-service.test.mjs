import test from "node:test";
import assert from "node:assert/strict";
import { listActiveTenants, createTenantWithOwnerAudit } from "../src/lib/tenant-service.mjs";

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
