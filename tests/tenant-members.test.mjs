import test from "node:test";
import assert from "node:assert/strict";
import * as tenantService from "../src/lib/tenant-service.mjs";

test("lists tenant members using a safe user projection and stable join ordering", async () => {
  const calls = [];
  const joinedAt = new Date("2026-11-08T10:00:00.000Z");
  const db = {
    membership: {
      async findMany(args) {
        calls.push(args);
        return [{
          role: "OWNER",
          createdAt: joinedAt,
          user: {
            id: "user-1",
            email: "owner@example.invalid",
            displayName: "Tenant Owner"
          }
        }];
      }
    }
  };

  const members = await tenantService.listTenantMembers({ db, tenantId: "tenant-1" });

  assert.deepEqual(calls, [{
    where: { tenantId: "tenant-1" },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      role: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          displayName: true
        }
      }
    }
  }]);
  assert.deepEqual(members, [{
    userId: "user-1",
    email: "owner@example.invalid",
    displayName: "Tenant Owner",
    role: "OWNER",
    joinedAt
  }]);
  assert.equal(Object.hasOwn(members[0], "passwordHash"), false);
});

test("returns an empty member list for a tenant without memberships", async () => {
  const db = {
    membership: {
      async findMany() { return []; }
    }
  };

  assert.deepEqual(
    await tenantService.listTenantMembers({ db, tenantId: "tenant-empty" }),
    []
  );
});
