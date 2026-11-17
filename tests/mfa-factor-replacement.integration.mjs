import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { PrismaClient, PlatformRole } from "@prisma/client";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { hashPassword } from "../src/lib/auth-core.mjs";
import { decryptTotpSecret, encryptTotpSecret, generateTotpSecret } from "../src/lib/mfa-core.mjs";

const origin = "http://localhost:43180";
const key = "b".repeat(64);
const bootstrapToken = randomBytes(48).toString("hex");
let server;
let serverError = "";

before(async () => {
  server = spawn(process.execPath, ["server.js"], {
    env: { ...process.env, NODE_ENV: "production", PORT: "43180", HOSTNAME: "127.0.0.1", NEXT_PUBLIC_APP_URL: origin, VAYRO_OWNER_BOOTSTRAP_TOKEN: bootstrapToken, VAYRO_MFA_ENCRYPTION_KEY: key, EMAIL_PROVIDER: "disabled-for-test" },
    cwd: join(process.cwd(), ".next/standalone"),
    stdio: ["ignore", "ignore", "pipe"]
  });
  server.stderr.on("data", chunk => { serverError += chunk.toString(); });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Next.js production server exited early: ${serverError}`);
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch { /* server is starting */ }
    await delay(500);
  }
  server.kill("SIGTERM");
  throw new Error(`Next.js production server did not become ready: ${serverError}`);
});

after(() => {
  if (server && server.exitCode === null) server.kill("SIGTERM");
});

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

test("MFA factor replacement requires old-factor proof, confirms new factor, rotates recovery codes and preserves current session", async () => {
  const db = new PrismaClient();
  const suffix = randomUUID();
  const email = `mfa-replace-${suffix}@example.invalid`;
  const password = "VAYRO-factor-replacement-test-password-2026";
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  let userId;
  let currentSessionId;
  let otherSessionId;
  let rateLimitKeys = [];

  try {
    await db.$connect();
    const user = await db.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        displayName: "MFA Factor Replacement Test",
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
    currentSessionId = session.id;
    const otherSession = await db.session.create({
      data: {
        userId,
        tokenHash: createHash("sha256").update(randomBytes(32)).digest("hex"),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        assurance: "MFA",
        mfaAuthenticatedAt: new Date()
      }
    });
    otherSessionId = otherSession.id;

    const oldSecret = generateTotpSecret();
    const oldEncrypted = encryptTotpSecret(oldSecret, key);
    const credential = await db.mfaCredential.create({
      data: {
        userId,
        secretCiphertext: oldEncrypted.ciphertext,
        secretIv: oldEncrypted.iv,
        secretAuthTag: oldEncrypted.authTag,
        keyVersion: oldEncrypted.version,
        enabledAt: new Date()
      }
    });
    await db.mfaRecoveryCode.create({
      data: { userId, codeHash: createHash("sha256").update("OLDRECOVERYCODE00").digest("hex") }
    });

    const post = (body) => fetch(`${origin}/api/auth/mfa/replace`, {
      method: "POST",
      headers: {
        Origin: origin,
        Host: "127.0.0.1:43180",
        "Content-Type": "application/json",
        Cookie: `vayro_session=${token}`
      },
      body: JSON.stringify(body)
    });

    const begun = await post({ action: "begin", code: totpCode(oldSecret) });
    assert.equal(begun.status, 200);
    const beginBody = await begun.json();
    assert.equal(beginBody.pending, true);
    assert.match(beginBody.secret, /^[A-Z2-7]{32}$/);
    assert.match(beginBody.otpauthUri, /^otpauth:\/\/totp\//);
    assert.equal(beginBody.expiresInSeconds, 600);

    const afterBegin = await db.mfaCredential.findUnique({ where: { id: credential.id } });
    assert.equal(decryptTotpSecret({
      version: afterBegin.keyVersion,
      iv: afterBegin.secretIv,
      ciphertext: afterBegin.secretCiphertext,
      authTag: afterBegin.secretAuthTag
    }, key), oldSecret);
    assert.ok(afterBegin.pendingSecretCiphertext);
    assert.ok(afterBegin.pendingSecretIv);
    assert.ok(afterBegin.pendingSecretAuthTag);
    assert.ok(afterBegin.pendingExpiresAt > new Date());

    const invalidConfirmation = await post({ action: "confirm", code: "000000" });
    assert.equal(invalidConfirmation.status, 401);
    const stillPending = await db.mfaCredential.findUnique({ where: { id: credential.id } });
    assert.ok(stillPending.pendingSecretCiphertext);
    assert.equal(decryptTotpSecret({
      version: stillPending.keyVersion,
      iv: stillPending.secretIv,
      ciphertext: stillPending.secretCiphertext,
      authTag: stillPending.secretAuthTag
    }, key), oldSecret);

    const newSecret = beginBody.secret;
    const confirmed = await post({ action: "confirm", code: totpCode(newSecret) });
    assert.equal(confirmed.status, 200);
    const confirmBody = await confirmed.json();
    assert.equal(confirmBody.replaced, true);
    assert.equal(confirmBody.recoveryCodes.length, 10);
    assert.ok(confirmBody.recoveryCodes.every(value => /^[A-F0-9]{16}$/.test(value)));

    const active = await db.mfaCredential.findUnique({ where: { id: credential.id } });
    assert.equal(decryptTotpSecret({
      version: active.keyVersion,
      iv: active.secretIv,
      ciphertext: active.secretCiphertext,
      authTag: active.secretAuthTag
    }, key), newSecret);
    assert.equal(active.pendingSecretCiphertext, null);
    assert.equal(active.pendingSecretIv, null);
    assert.equal(active.pendingSecretAuthTag, null);
    assert.equal(active.pendingExpiresAt, null);
    assert.equal(Number(active.lastAcceptedStep), Math.floor(Date.now() / 30000));
    assert.equal(await db.mfaRecoveryCode.count({ where: { userId, usedAt: null } }), 10);
    assert.equal(await db.mfaRecoveryCode.count({
      where: { userId, codeHash: createHash("sha256").update("OLDRECOVERYCODE00").digest("hex") }
    }), 0);
    assert.equal((await db.session.findUnique({ where: { id: currentSessionId } })).revokedAt, null);
    assert.ok((await db.session.findUnique({ where: { id: otherSessionId } })).revokedAt);
    assert.ok(await db.auditEvent.findFirst({
      where: { actorUserId: userId, action: "auth.mfa.factor_replaced", resourceId: credential.id }
    }));

    const replay = await post({ action: "confirm", code: totpCode(newSecret) });
    assert.equal(replay.status, 409);
  } finally {
    if (userId) {
      await db.auditEvent.deleteMany({ where: { actorUserId: userId } });
      await db.user.deleteMany({ where: { id: userId } });
    }
    if (rateLimitKeys.length) await db.authRateLimit.deleteMany({ where: { keyHash: { in: rateLimitKeys } } });
    await db.$disconnect();
  }
});
