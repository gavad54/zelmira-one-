import test from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { PrismaClient, PlatformRole } from "@prisma/client";
import { hashPassword } from "../src/lib/auth-core.mjs";
import { encryptTotpSecret, generateTotpSecret } from "../src/lib/mfa-core.mjs";

const origin = "http://127.0.0.1:43179";
const key = "a".repeat(64);

function totpCode(secret, now = Date.now()) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let buffer = 0, bits = 0;
  const bytes = [];
  for (const character of secret) {
    buffer = (buffer << 5) | alphabet.indexOf(character);
    bits += 5;
    if (bits >= 8) { bits -= 8; bytes.push((buffer >>> bits) & 255); }
    buffer &= (1 << bits) - 1;
  }
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 30000)));
  const digest = createHmac("sha1", Buffer.from(bytes)).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  const binary = ((digest[offset] & 127) << 24) | ((digest[offset + 1] & 255) << 16) |
    ((digest[offset + 2] & 255) << 8) | (digest[offset + 3] & 255);
  return String(binary % 1000000).padStart(6, "0");
}

test("MFA management requires fresh TOTP, rotates recovery codes atomically and protects privileged MFA", async () => {
  const db = new PrismaClient();
  const suffix = randomUUID();
  const email = `mfa-manage-${suffix}@example.invalid`;
  const password = "VAYRO-mfa-management-test-password-2026";
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  let userId;
  let sessionId;
  const rateLimitKey = createHash("sha256").update("mfa-manage:" + "placeholder").digest("hex");

  try {
    await db.$connect();
    const user = await db.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        displayName: "MFA Management Test",
        platformRole: PlatformRole.OWNER,
        emailVerifiedAt: new Date()
      }
    });
    userId = user.id;

    const session = await db.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        assurance: "MFA",
        mfaAuthenticatedAt: new Date()
      }
    });
    sessionId = session.id;
    const secret = generateTotpSecret();
    const encrypted = encryptTotpSecret(secret, key);
    await db.mfaCredential.create({
      data: {
        userId,
        secretCiphertext: encrypted.ciphertext,
        secretIv: encrypted.iv,
        secretAuthTag: encrypted.authTag,
        keyVersion: encrypted.version,
        enabledAt: new Date()
      }
    });
    await db.mfaRecoveryCode.create({
      data: { userId, codeHash: createHash("sha256").update("OLDRECOVERYCODE00").digest("hex") }
    });

    const crossOrigin = await fetch(`${origin}/api/auth/mfa/manage`, {
      method: "POST",
      headers: {
        Origin: "https://attacker.invalid",
        "Content-Type": "application/json",
        Cookie: `vayro_session=${token}`
      },
      body: JSON.stringify({ action: "regenerate_recovery_codes", code: totpCode(secret) })
    });
    assert.equal(crossOrigin.status, 403);

    const regenerated = await fetch(`${origin}/api/auth/mfa/manage`, {
      method: "POST",
      headers: {
        Origin: origin,
        Host: "127.0.0.1:43179",
        "Content-Type": "application/json",
        Cookie: `vayro_session=${token}`
      },
      body: JSON.stringify({ action: "regenerate_recovery_codes", code: totpCode(secret) })
    });
    assert.equal(regenerated.status, 200);
    const regeneratedBody = await regenerated.json();
    assert.equal(regeneratedBody.regenerated, true);
    assert.equal(regeneratedBody.recoveryCodes.length, 10);
    assert.ok(regeneratedBody.recoveryCodes.every(value => /^[A-F0-9]{16}$/.test(value)));
    assert.equal(await db.mfaRecoveryCode.count({ where: { userId, usedAt: null } }), 10);
    assert.equal(await db.mfaRecoveryCode.count({ where: { userId, codeHash: createHash("sha256").update("OLDRECOVERYCODE00").digest("hex") } }), 0);
    assert.equal((await db.session.findUnique({ where: { id: sessionId } })).revokedAt, null);

    const privilegedDisable = await fetch(`${origin}/api/auth/mfa/manage`, {
      method: "POST",
      headers: {
        Origin: origin,
        Host: "127.0.0.1:43179",
        "Content-Type": "application/json",
        Cookie: `vayro_session=${token}`
      },
      body: JSON.stringify({
        action: "disable",
        code: totpCode(secret, Date.now() + 30000),
        password
      })
    });
    assert.equal(privilegedDisable.status, 409);
    assert.equal((await privilegedDisable.json()).error, "mfa_required_for_privileged_account");
    assert.ok(await db.mfaCredential.findUnique({ where: { userId } }));

    const otherToken = randomBytes(32).toString("hex");
    await db.session.create({
      data: {
        userId,
        tokenHash: createHash("sha256").update(otherToken).digest("hex"),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        assurance: "MFA",
        mfaAuthenticatedAt: new Date()
      }
    });
    await db.user.update({ where: { id: userId }, data: { platformRole: PlatformRole.USER } });

    const disabled = await fetch(`${origin}/api/auth/mfa/manage`, {
      method: "POST",
      headers: {
        Origin: origin,
        Host: "127.0.0.1:43179",
        "Content-Type": "application/json",
        Cookie: `vayro_session=${token}`
      },
      body: JSON.stringify({
        action: "disable",
        code: totpCode(secret, Date.now() + 60000),
        password
      })
    });
    assert.equal(disabled.status, 200);
    assert.deepEqual(await disabled.json(), { disabled: true, authenticated: false });
    assert.equal(await db.mfaCredential.count({ where: { userId } }), 0);
    assert.equal(await db.mfaRecoveryCode.count({ where: { userId } }), 0);
    assert.equal(await db.session.count({ where: { userId, revokedAt: null } }), 0);
    assert.ok(await db.auditEvent.findFirst({
      where: { actorUserId: userId, action: "auth.mfa.disabled" }
    }));
    assert.match(disabled.headers.get("set-cookie") ?? "", /Expires=Thu, 01 Jan 1970/i);
  } finally {
    if (userId) {
      await db.auditEvent.deleteMany({ where: { actorUserId: userId } });
      await db.user.deleteMany({ where: { id: userId } });
    }
    await db.authRateLimit.deleteMany({ where: { keyHash: rateLimitKey } });
    await db.$disconnect();
  }
});
