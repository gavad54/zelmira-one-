import test from "node:test";
import assert from "node:assert/strict";
import { authorizeTenantAction } from "../src/lib/authorization.mjs";

const membership = {
  userId: "user-a",
  tenantId: "tenant-a",
  role: "OWNER"
};

const base = {
  authenticatedUserId: "user-a",
  requestedTenantId: "tenant-a",
  membership,
  tenantStatus: "ACTIVE",
  action: "tenant_read"
};

test("allows an active member to read their own tenant", () => {
  assert.equal(authorizeTenantAction(base), true);
});

test("denies cross-tenant access even when the user is an owner elsewhere", () => {
  assert.equal(
    authorizeTenantAction({ ...base, requestedTenantId: "tenant-b" }),
    false
  );
});

test("denies a membership belonging to another user", () => {
  assert.equal(
    authorizeTenantAction({
      ...base,
      membership: { ...membership, userId: "user-b" }
    }),
    false
  );
});

test("denies suspended or closed tenants", () => {
  assert.equal(
    authorizeTenantAction({ ...base, tenantStatus: "SUSPENDED" }),
    false
  );
  assert.equal(
    authorizeTenantAction({ ...base, tenantStatus: "CLOSED" }),
    false
  );
});

test("restricts billing changes to tenant owners", () => {
  assert.equal(
    authorizeTenantAction({ ...base, action: "billing_manage" }),
    true
  );
  assert.equal(
    authorizeTenantAction({
      ...base,
      membership: { ...membership, role: "ADMIN" },
      action: "billing_manage"
    }),
    false
  );
});

test("denies unknown and inherited object-property action names", () => {
  for (const action of ["make_me_admin", "__proto__", "constructor", "toString"]) {
    assert.equal(authorizeTenantAction({ ...base, action }), false);
  }
});

test("denies malformed identity, membership and role values", () => {
  assert.equal(
    authorizeTenantAction({ ...base, authenticatedUserId: null }),
    false
  );
  assert.equal(
    authorizeTenantAction({ ...base, membership: null }),
    false
  );
  assert.equal(
    authorizeTenantAction({
      ...base,
      membership: { ...membership, role: "PLATFORM_ADMIN" }
    }),
    false
  );
  assert.equal(
    authorizeTenantAction({ ...base, membership: "OWNER" }),
    false
  );
});
