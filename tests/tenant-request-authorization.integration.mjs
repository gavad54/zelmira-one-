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
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      assurance: "MFA",
      mfaAuthenticatedAt: now
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


test("PostgreSQL-backed authorization covers every tenant role against every tenant action", async () => {
  const actions = [
    "tenant_read", "tenant_manage", "members_manage",
    "billing_manage", "tenant_delete", "ai_generate", "ai_read"
  ];
  const expected = {
    OWNER:   [true, true, true, true, true, true, true],
    ADMIN:   [true, true, true, false, false, true, true],
    MANAGER: [true, false, false, false, false, true, true],
    MEMBER:  [true, false, false, false, false, true, true],
    VIEWER:  [true, false, false, false, false, false, false]
  };
  const testNow = new Date();
  await db.user.update({ where: { id: userId }, data: { disabledAt: null } });
  await db.tenant.update({ where: { id: tenantAId }, data: { status: "ACTIVE" } });
  await db.session.update({
    where: { tokenHash },
    data: {
      expiresAt: new Date(testNow.getTime() + 60 * 60 * 1000),
      revokedAt: null,
      lastSeenAt: testNow,
      assurance: "MFA",
      mfaAuthenticatedAt: testNow
    }
  });

  try {
    for (const [role, decisions] of Object.entries(expected)) {
      await db.membership.update({
        where: { userId_tenantId: { userId, tenantId: tenantAId } },
        data: { role }
      });
      for (let index = 0; index < actions.length; index += 1) {
        const result = await authorizeTenantRequest({
          sessionToken, tenantId: tenantAId, action: actions[index], db, now: testNow
        });
        assert.equal(result.authorized, decisions[index],
          `PostgreSQL role/action mismatch: ${role} / ${actions[index]}`);
      }
    }

    for (const role of ["OWNER", "ADMIN"]) {
      await db.membership.update({
        where: { userId_tenantId: { userId, tenantId: tenantAId } },
        data: { role }
      });
      for (const mfaState of [
        { assurance: "PASSWORD", mfaAuthenticatedAt: null },
        { assurance: "MFA", mfaAuthenticatedAt: new Date(testNow.getTime() - 13 * 60 * 60 * 1000) },
        { assurance: "MFA", mfaAuthenticatedAt: new Date(testNow.getTime() + 1000) }
      ]) {
        await db.session.update({ where: { tokenHash }, data: mfaState });
        const result = await authorizeTenantRequest({
          sessionToken, tenantId: tenantAId, action: "tenant_read", db, now: testNow
        });
        assert.equal(result.authorized, false, `${role} must be denied with invalid or stale MFA`);
      }
    }

    for (const role of ["MANAGER", "MEMBER", "VIEWER"]) {
      await db.membership.update({
        where: { userId_tenantId: { userId, tenantId: tenantAId } },
        data: { role }
      });
      await db.session.update({
        where: { tokenHash },
        data: { assurance: "PASSWORD", mfaAuthenticatedAt: null }
      });
      const result = await authorizeTenantRequest({
        sessionToken, tenantId: tenantAId, action: "tenant_read", db, now: testNow
      });
      assert.equal(result.authorized, true, `${role} read access should not require privileged MFA step-up`);
    }
  } finally {
    await db.membership.update({
      where: { userId_tenantId: { userId, tenantId: tenantAId } },
      data: { role: "OWNER" }
    });
    await db.session.update({
      where: { tokenHash },
      data: { assurance: "MFA", mfaAuthenticatedAt: testNow, lastSeenAt: testNow }
    });
    await db.tenant.update({ where: { id: tenantAId }, data: { status: "ACTIVE" } });
    await db.user.update({ where: { id: userId }, data: { disabledAt: null } });
  }
});
