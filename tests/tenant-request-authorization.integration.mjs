import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { authorizeTenantRequest } from "../src/lib/tenant-request-authorization.mjs";

const db = new PrismaClient();
const now = new Date();
const sessionToken = randomBytes(32).toString("hex");
const tokenHash = createHash("sha256").update(sessionToken).digest("hex");
const suffix = randomUUID();
let userId;
let tenantAId;
let tenantBId;

before(async () => {
  await db.$connect();
  const user = await db.user.create({
    data: {
      email: `tenant-auth-${suffix}@example.invalid`,
      passwordHash: "test-only-not-a-real-password-hash",
      displayName: "Integration Test User",
      emailVerifiedAt: now
    }
  });
  userId = user.id;

  const tenantA = await db.tenant.create({
    data: { name: "Tenant A", slug: `tenant-a-${suffix}` }
  });
  tenantAId = tenantA.id;

  const tenantB = await db.tenant.create({
    data: { name: "Tenant B", slug: `tenant-b-${suffix}` }
  });
  tenantBId = tenantB.id;

  await db.membership.create({
    data: { userId, tenantId: tenantAId, role: "OWNER" }
  });

  await db.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    }
  });
});

after(async () => {
  if (userId) await db.session.deleteMany({ where: { userId } });
  if (tenantAId || tenantBId) {
    await db.membership.deleteMany({
      where: { tenantId: { in: [tenantAId, tenantBId].filter(Boolean) } }
    });
    await db.tenant.deleteMany({
      where: { id: { in: [tenantAId, tenantBId].filter(Boolean) } }
    });
  }
  if (userId) await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});

test("PostgreSQL-backed authorization enforces session, tenant and role boundaries", async () => {
  const allowed = await authorizeTenantRequest({
    sessionToken, tenantId: tenantAId, action: "tenant_read", db, now
  });
  assert.deepEqual(allowed, {
    authorized: true, userId, tenantId: tenantAId, role: "OWNER"
  });

  const crossTenant = await authorizeTenantRequest({
    sessionToken, tenantId: tenantBId, action: "tenant_read", db, now
  });
  assert.equal(crossTenant.authorized, false);

  await db.membership.update({
    where: { userId_tenantId: { userId, tenantId: tenantAId } },
    data: { role: "VIEWER" }
  });
  const billingDenied = await authorizeTenantRequest({
    sessionToken, tenantId: tenantAId, action: "billing_manage", db, now
  });
  assert.equal(billingDenied.authorized, false);

  await db.membership.update({
    where: { userId_tenantId: { userId, tenantId: tenantAId } },
    data: { role: "OWNER" }
  });
  await db.session.update({
    where: { tokenHash },
    data: { expiresAt: new Date(now.getTime() - 1000) }
  });
  const expiredDenied = await authorizeTenantRequest({
    sessionToken, tenantId: tenantAId, action: "tenant_read", db, now
  });
  assert.equal(expiredDenied.authorized, false);

  await db.session.update({
    where: { tokenHash },
    data: { expiresAt: new Date(now.getTime() + 60 * 60 * 1000) }
  });
  await db.user.update({
    where: { id: userId },
    data: { disabledAt: now }
  });
  const disabledDenied = await authorizeTenantRequest({
    sessionToken, tenantId: tenantAId, action: "tenant_read", db, now
  });
  assert.equal(disabledDenied.authorized, false);

  await db.user.update({
    where: { id: userId },
    data: { disabledAt: null }
  });
  await db.tenant.update({
    where: { id: tenantAId },
    data: { status: "SUSPENDED" }
  });
  const suspendedDenied = await authorizeTenantRequest({
    sessionToken, tenantId: tenantAId, action: "tenant_read", db, now
  });
  assert.equal(suspendedDenied.authorized, false);
});
