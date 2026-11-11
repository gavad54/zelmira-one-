import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync(
  new URL("../src/app/api/ready/route.ts", import.meta.url),
  "utf8"
);

test("readiness verifies the tenant database and its restricted runtime role", () => {
  assert.match(route, /getTenantPrisma/);
  assert.match(route, /assertTenantRuntimeRole/);
  assert.match(route, /await assertTenantRuntimeRole\(tenantPrisma\)/);
  assert.match(route, /await tenantPrisma\.\$queryRaw\x60SELECT 1\x60/);
  assert.match(route, /tenant:\s*"ok"/);
});
