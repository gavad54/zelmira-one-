import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { withAuthenticatedUserTransaction, withTenantRequestTransaction } from "../src/lib/tenant-request-transaction.mjs";
import { createTenantInTransaction, listActiveTenants, listTenantMembers } from "../src/lib/tenant-service.mjs";

const authDb = new PrismaClient();
const tenantDb = new PrismaClient({
  datasources: { db: { url: process.env.TENANT_DATABASE_URL } }
});
const suffix = randomUUID();
const tokenA = randomBytes(32).toString("hex");
const tokenHashA = createHash("sha256").update(tokenA).digest("hex");
const tokenB = randomBytes(32).toString("hex");
const tokenHashB = createHash("sha256").update(tokenB).digest("hex");
const now = new Date();
let userA, userB, tenantA, tenantB, product;
const createdTenantIds = [];

before(async () => {
  assert.ok(process.env.TENANT_DATABASE_URL, "TENANT_DATABASE_URL must point to the dedicated RLS role");
  await Promise.all([authDb.$connect(), tenantDb.$connect()]);
  userA = await authDb.user.create({ data: {
    email: `rls-a-${suffix}@example.invalid`,
    passwordHash: "test-only",
    displayName: "RLS Tenant A",
    emailVerifiedAt: now
  }});
  userB = await authDb.user.create({ data: {
    email: `rls-b-${suffix}@example.invalid`,
    passwordHash: "test-only",
    displayName: "RLS Tenant B",
    emailVerifiedAt: now
  }});
  tenantA = await authDb.tenant.create({ data: {
    name: "RLS Tenant A", slug: `rls-a-${suffix}`
  }});
  tenantB = await authDb.tenant.create({ data: {
    name: "RLS Tenant B", slug: `rls-b-${suffix}`
  }});
  product = await authDb.product.create({ data: {
    key: `RLS_${suffix.replaceAll("-", "").slice(0, 20)}`,
    name: "RLS Fixture Product",
    description: "Disposable integration fixture",
    status: "ACTIVE"
  }});
  await authDb.membership.create({ data: { userId: userA.id, tenantId: tenantA.id, role: "OWNER" }});
  await authDb.membership.create({ data: { userId: userB.id, tenantId: tenantB.id, role: "OWNER" }});
  await authDb.membership.create({ data: { userId: userB.id, tenantId: tenantA.id, role: "MEMBER" }});
  await authDb.license.create({ data: {
    tenantId: tenantA.id, productId: product.id, startsAt: now, active: true
  }});
  await authDb.license.create({ data: {
    tenantId: tenantB.id, productId: product.id, startsAt: now, active: true
  }});
  await authDb.session.create({ data: {
    tokenHash: tokenHashA, userId: userA.id,
    expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
    assurance: "MFA", mfaAuthenticatedAt: now, lastSeenAt: now
  }});
  await authDb.session.create({ data: {
    tokenHash: tokenHashB, userId: userB.id,
    expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
    assurance: "MFA", mfaAuthenticatedAt: now, lastSeenAt: now
  }});
});

after(async () => {
  if (userA || userB) {
    await authDb.session.deleteMany({ where: { userId: { in: [userA?.id, userB?.id].filter(Boolean) } }});
    await authDb.auditEvent.deleteMany({ where: { actorUserId: { in: [userA?.id, userB?.id].filter(Boolean) } }});
    await authDb.license.deleteMany({ where: { tenantId: { in: [tenantA?.id, tenantB?.id].filter(Boolean) } }});
    await authDb.membership.deleteMany({ where: { userId: { in: [userA?.id, userB?.id].filter(Boolean) } }});
  }
  if (tenantA || tenantB || createdTenantIds.length) {
    await authDb.tenant.deleteMany({ where: { id: { in: [tenantA?.id, tenantB?.id, ...createdTenantIds].filter(Boolean) } }});
  }
  if (product) await authDb.product.deleteMany({ where: { id: product.id }});
  if (userA || userB) await authDb.user.deleteMany({ where: { id: { in: [userA?.id, userB?.id].filter(Boolean) } }});
  await Promise.all([tenantDb.$disconnect(), authDb.$disconnect()]);
});

test("tenant transaction boundary revalidates session and membership under real RLS role", async () => {
  const allowed = await withTenantRequestTransaction({
    authDb, tenantDb, sessionToken: tokenA, tenantId: tenantA.id, action: "tenant_read",
    now,
    callback: async tx => {
      const tenant = await tx.tenant.findUnique({ where: { id: tenantA.id }, select: { id: true }});
      const licenses = await tx.license.findMany({ select: { tenantId: true }});
      return { tenant, licenses };
    }
  });
  assert.equal(allowed.authorized, true);
  assert.deepEqual(allowed.value.tenant, { id: tenantA.id });
  assert.deepEqual(allowed.value.licenses, [{ tenantId: tenantA.id }]);

  const crossTenant = await withTenantRequestTransaction({
    authDb, tenantDb, sessionToken: tokenA, tenantId: tenantB.id, action: "tenant_read",
    now,
    callback: async tx => tx.tenant.findUnique({ where: { id: tenantB.id }})
  });
  assert.equal(crossTenant.authorized, false);
});

test("RLS runtime role fails closed without context and rejects mismatched actor/tenant context", async () => {
  const noContext = await tenantDb.tenant.findMany();
  assert.deepEqual(noContext, []);

  const forged = await tenantDb.$transaction(async tx => {
    await tx.$queryRaw`SELECT
      set_config('app.user_id', ${userA.id}, true),
      set_config('app.tenant_id', ${tenantA.id}, true),
      set_config('app.session_token_hash', ${tokenHashA}, true)
    `;
    return tx.membership.findUnique({
      where: { userId_tenantId: { userId: userA.id, tenantId: tenantB.id }}
    });
  });
  assert.equal(forged, null);
});

test("user-scoped RLS transaction lists memberships and provisions a new tenant safely", async () => {
  const listed = await withAuthenticatedUserTransaction({
    authDb, tenantDb, sessionToken: tokenA,
    callback: (tx, actor) => listActiveTenants({ db: tx, userId: actor.userId })
  });
  assert.equal(listed.authorized, true);
  assert.equal(listed.value.length, 1);
  assert.equal(listed.value[0].id, tenantA.id);

  const newTenantId = randomUUID();
  const created = await withAuthenticatedUserTransaction({
    authDb, tenantDb, sessionToken: tokenA, tenantId: newTenantId,
    callback: (tx, actor) => createTenantInTransaction({
      tx,
      userId: actor.userId,
      tenantId: newTenantId,
      name: "Provisioned by RLS",
      slug: `rls-created-${suffix}`
    })
  });
  assert.equal(created.authorized, true);
  assert.equal(created.value.id, newTenantId);
  assert.equal(created.value.role, "OWNER");
  createdTenantIds.push(newTenantId);
});

test("tenant OWNER can list only same-tenant member profiles; MEMBER cannot invoke directory action", async () => {
  const ownerResult = await withTenantRequestTransaction({
    authDb, tenantDb, sessionToken: tokenA, tenantId: tenantA.id, action: "members_manage",
    now,
    callback: tx => listTenantMembers({ db: tx, tenantId: tenantA.id })
  });
  assert.equal(ownerResult.authorized, true);
  assert.equal(ownerResult.value.length, 2);
  assert.deepEqual(
    ownerResult.value.map(member => member.userId).sort(),
    [userA.id, userB.id].sort()
  );

  const memberResult = await withTenantRequestTransaction({
    authDb, tenantDb, sessionToken: tokenB, tenantId: tenantA.id, action: "members_manage",
    now,
    callback: tx => listTenantMembers({ db: tx, tenantId: tenantA.id })
  });
  assert.equal(memberResult.authorized, false);
});
