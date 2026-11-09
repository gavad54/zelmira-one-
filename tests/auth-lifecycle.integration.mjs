import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { AuthTokenPurpose } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const suffix = randomUUID();
const rawToken = randomBytes(32).toString("hex");
const tokenHash = createHash("sha256").update(rawToken).digest("hex");
let userId;

before(async () => {
  await db.$connect();
  const user = await db.user.create({
    data: {
      email: `auth-lifecycle-${suffix}@example.invalid`,
      passwordHash: "integration-test-hash-only",
      displayName: "Auth Lifecycle Test",
      emailVerifiedAt: new Date()
    }
  });
  userId = user.id;
  await db.session.createMany({
    data: [
      { userId, tokenHash: createHash("sha256").update(randomBytes(32)).digest("hex"), expiresAt: new Date(Date.now() + 3600000) },
      { userId, tokenHash: createHash("sha256").update(randomBytes(32)).digest("hex"), expiresAt: new Date(Date.now() + 3600000) }
    ]
  });
  await db.authActionToken.create({
    data: {
      userId,
      tokenHash,
      purpose: AuthTokenPurpose.PASSWORD_RESET,
      expiresAt: new Date(Date.now() + 1800000)
    }
  });
});

after(async () => {
  if (userId) {
    await db.authActionToken.deleteMany({ where: { userId } });
    await db.session.deleteMany({ where: { userId } });
    await db.auditEvent.deleteMany({ where: { actorUserId: userId } });
    await db.user.deleteMany({ where: { id: userId } });
  }
  await db.$disconnect();
});

test("password-reset token is consumed once and revokes all active sessions atomically", async () => {
  const result = await db.$transaction(async tx => {
    const token = await tx.authActionToken.findUnique({ where: { tokenHash } });
    assert.ok(token);
    assert.equal(token.purpose, AuthTokenPurpose.PASSWORD_RESET);
    assert.equal(token.consumedAt, null);
    assert.ok(token.expiresAt > new Date());

    const consumed = await tx.authActionToken.updateMany({
      where: { id: token.id, consumedAt: null, expiresAt: { gt: new Date() } },
      data: { consumedAt: new Date() }
    });
    assert.equal(consumed.count, 1);

    await tx.user.update({
      where: { id: userId },
      data: { passwordHash: "new-integration-test-hash" }
    });
    const revoked = await tx.session.deleteMany({ where: { userId } });
    await tx.auditEvent.create({
      data: {
        actorUserId: userId,
        action: "auth.password_reset",
        resource: "User",
        resourceId: userId
      }
    });
    return { consumed: consumed.count, revoked: revoked.count };
  });

  assert.deepEqual(result, { consumed: 1, revoked: 2 });
  assert.equal(await db.session.count({ where: { userId } }), 0);
  const tokenAfter = await db.authActionToken.findUnique({ where: { tokenHash } });
  assert.ok(tokenAfter?.consumedAt);
  assert.equal(await db.user.findUnique({ where: { id: userId } }).then(u => u.passwordHash), "new-integration-test-hash");
  assert.equal(await db.auditEvent.count({
    where: { actorUserId: userId, action: "auth.password_reset" }
  }), 1);
});

test("a consumed password-reset token cannot be consumed a second time", async () => {
  const token = await db.authActionToken.findUnique({ where: { tokenHash } });
  assert.ok(token?.consumedAt);
  const secondUse = await db.authActionToken.updateMany({
    where: { id: token.id, consumedAt: null, expiresAt: { gt: new Date() } },
    data: { consumedAt: new Date() }
  });
  assert.equal(secondUse.count, 0);
});
