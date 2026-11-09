import test from "node:test";
import assert from "node:assert/strict";
import { assertTenantRuntimeRole } from "../src/lib/tenant-request-transaction.mjs";

function fakeTransaction(role) {
  return {
    async $queryRaw(strings) {
      assert.match(strings.join("?"), /has_other_role_membership/);
      return [role];
    }
  };
}

const safeRole = {
  role_name: "vayro_app_ci",
  is_superuser: false,
  bypasses_rls: false,
  can_use_vayro_app: true,
  has_elevated_membership: false,
  has_other_role_membership: false,
  owns_protected_tables: false
};

test("tenant runtime role accepts only the dedicated vayro_app membership", async () => {
  await assert.doesNotReject(() => assertTenantRuntimeRole(fakeTransaction(safeRole)));
});

test("tenant runtime role rejects any additional role membership", async () => {
  await assert.rejects(
    () => assertTenantRuntimeRole(fakeTransaction({
      ...safeRole,
      has_other_role_membership: true
    })),
    /UNSAFE_TENANT_DATABASE_ROLE/
  );
});

test("tenant runtime role rejects missing and elevated roles", async () => {
  await assert.rejects(
    () => assertTenantRuntimeRole(fakeTransaction(null)),
    /UNSAFE_TENANT_DATABASE_ROLE/
  );
  await assert.rejects(
    () => assertTenantRuntimeRole(fakeTransaction({
      ...safeRole,
      has_elevated_membership: true
    })),
    /UNSAFE_TENANT_DATABASE_ROLE/
  );
});
