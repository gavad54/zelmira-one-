import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

test("MFA persistence enforces replay, one-time token, RLS and least-privilege boundaries", async () => {
  const db = new PrismaClient();
  const suffix = randomUUID();
  let userId;

  try {
    await db.$connect();
    const user = await db.user.create({
      data: {
        email: `mfa-persistence-${suffix}@example.invalid`,
        passwordHash: "integration-test-only-hash",
        displayName: "MFA Persistence Test",
        emailVerifiedAt: new Date()
      }
    });
    userId = user.id;

    const credential = await db.mfaCredential.create({
      data: {
        userId,
        secretCiphertext: randomBytes(20).toString("hex"),
        secretIv: randomBytes(12).toString("hex"),
        secretAuthTag: randomBytes(16).toString("hex")
      }
    });
    assert.equal(credential.enabledAt, null);
    assert.equal(credential.lastAcceptedStep, -1n);
    await assert.rejects(() => db.mfaCredential.create({
      data: {
        userId,
        secretCiphertext: randomBytes(20).toString("hex"),
        secretIv: randomBytes(12).toString("hex"),
        secretAuthTag: randomBytes(16).toString("hex")
      }
    }));

    const firstStep = await db.mfaCredential.updateMany({
      where: { userId, lastAcceptedStep: { lt: 12n } },
      data: { lastAcceptedStep: 12n }
    });
    const replayStep = await db.mfaCredential.updateMany({
      where: { userId, lastAcceptedStep: { lt: 12n } },
      data: { lastAcceptedStep: 12n }
    });
    assert.equal(firstStep.count, 1);
    assert.equal(replayStep.count, 0);

    const race = await Promise.all([
      db.mfaCredential.updateMany({
        where: { userId, lastAcceptedStep: { lt: 13n } },
        data: { lastAcceptedStep: 13n }
      }),
      db.mfaCredential.updateMany({
        where: { userId, lastAcceptedStep: { lt: 13n } },
        data: { lastAcceptedStep: 13n }
      })
    ]);
    assert.equal(race.reduce((sum, item) => sum + item.count, 0), 1);

    const challengeHash = randomBytes(32).toString("hex");
    const challenge = await db.mfaLoginChallenge.create({
      data: { userId, tokenHash: challengeHash, expiresAt: new Date(Date.now() + 60_000) }
    });
    const consumeChallenge = () => db.mfaLoginChallenge.updateMany({
      where: { id: challenge.id, userId, tokenHash: challengeHash, consumedAt: null, expiresAt: { gt: new Date() } },
      data: { consumedAt: new Date() }
    });
    assert.equal((await consumeChallenge()).count, 1);
    assert.equal((await consumeChallenge()).count, 0);

    const expired = await db.mfaLoginChallenge.create({
      data: { userId, tokenHash: randomBytes(32).toString("hex"), expiresAt: new Date(Date.now() - 1_000) }
    });
    const expiredConsume = await db.mfaLoginChallenge.updateMany({
      where: { id: expired.id, userId, consumedAt: null, expiresAt: { gt: new Date() } },
      data: { consumedAt: new Date() }
    });
    assert.equal(expiredConsume.count, 0);

    const recoveryHash = randomBytes(32).toString("hex");
    await db.mfaRecoveryCode.create({ data: { userId, codeHash: recoveryHash } });
    const consumeRecovery = () => db.mfaRecoveryCode.updateMany({
      where: { userId, codeHash: recoveryHash, usedAt: null },
      data: { usedAt: new Date() }
    });
    assert.equal((await consumeRecovery()).count, 1);
    assert.equal((await consumeRecovery()).count, 0);

    const rls = await db.$queryRaw`
      SELECT c.relname, c.relrowsecurity AS enabled
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname IN ('MfaCredential', 'MfaLoginChallenge', 'MfaRecoveryCode')
      ORDER BY c.relname
    `;
    assert.equal(rls.length, 3);
    assert.ok(rls.every(row => row.enabled === true));

    const policies = await db.$queryRaw`
      SELECT tablename FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN ('MfaCredential', 'MfaLoginChallenge', 'MfaRecoveryCode')
    `;
    assert.deepEqual(policies, []);

    const grants = await db.$queryRaw`
      SELECT role_name, table_name,
        has_table_privilege(role_name, format('%I.%I', 'public', table_name), 'SELECT') AS can_select,
        has_table_privilege(role_name, format('%I.%I', 'public', table_name), 'INSERT') AS can_insert,
        has_table_privilege(role_name, format('%I.%I', 'public', table_name), 'UPDATE') AS can_update,
        has_table_privilege(role_name, format('%I.%I', 'public', table_name), 'DELETE') AS can_delete
      FROM (VALUES ('anon'), ('authenticated'), ('service_role')) AS roles(role_name)
      CROSS JOIN (VALUES ('MfaCredential'), ('MfaLoginChallenge'), ('MfaRecoveryCode')) AS tables(table_name)
      ORDER BY role_name, table_name
    `;
    assert.equal(grants.length, 9);
    assert.ok(grants.every(row => !row.can_select && !row.can_insert && !row.can_update && !row.can_delete));
  } finally {
    if (userId) await db.user.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  }
});
