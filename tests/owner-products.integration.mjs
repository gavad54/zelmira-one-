import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PrismaClient, PlatformRole, ProductStatus } from "@prisma/client";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const port = 43181;
const origin = `http://localhost:${port}`;
let server;
let serverError = "";

before(async () => {
  server = spawn(process.execPath, ["server.js"], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NEXT_PUBLIC_APP_URL: "https://vayro.invalid",
      EMAIL_PROVIDER: ""
    },
    cwd: join(process.cwd(), ".next/standalone"),
    stdio: ["ignore", "ignore", "pipe"]
  });
  server.stderr.on("data", chunk => { serverError += chunk.toString(); });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Next.js server exited: ${serverError}`);
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch { /* server starting */ }
    await delay(500);
  }
  server.kill("SIGTERM");
  throw new Error(`Next.js server did not become ready: ${serverError}`);
});

after(() => {
  if (server && server.exitCode === null) server.kill("SIGTERM");
});

test("owner product configuration writes are rate limited without weakening authorization or origin checks", async () => {
  const db = new PrismaClient();
  const suffix = randomUUID();
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  let userId;
  let productId;
  let actualRateLimitKey;

  try {
    await db.$connect();
    const user = await db.user.create({
      data: {
        email: `owner-products-${suffix}@example.invalid`,
        passwordHash: "integration-test-only-hash",
        displayName: "Owner Products Test",
        platformRole: PlatformRole.OWNER,
        emailVerifiedAt: new Date()
      }
    });
    userId = user.id;
    actualRateLimitKey = createHash("sha256").update("owner-products-update:" + userId).digest("hex");

    await db.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        assurance: "MFA",
        mfaAuthenticatedAt: new Date()
      }
    });
    const product = await db.product.create({
      data: {
        key: "RATE_LIMIT_TEST_" + suffix.replace(/-/g, "").slice(0, 16),
        name: "Rate Limit Test",
        description: "Temporary integration-test product",
        status: ProductStatus.PLANNED
      }
    });
    productId = product.id;

    const headers = {
      Origin: origin,
      Host: `localhost:${port}`,
      Cookie: `vayro_session=${token}`,
      "Content-Type": "application/json"
    };
    const crossOrigin = await fetch(`${origin}/api/owner/products`, {
      method: "PATCH",
      headers: { ...headers, Origin: "https://attacker.invalid" },
      body: JSON.stringify({ productId, status: "PLANNED", baseUrl: null })
    });
    assert.equal(crossOrigin.status, 403, "cross-origin owner mutations must remain rejected");

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await fetch(`${origin}/api/owner/products`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ productId, status: "PLANNED", baseUrl: null })
      });
      assert.equal(response.status, 200, "the first twenty owner product updates should be allowed");
    }

    const throttled = await fetch(`${origin}/api/owner/products`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ productId, status: "PLANNED", baseUrl: null })
    });
    assert.equal(throttled.status, 429, "the twenty-first owner product update must be rate limited");
    assert.equal((await db.authRateLimit.findUnique({ where: { keyHash: actualRateLimitKey } }))?.count, 21,
      "the owner product update throttle must count attempts atomically");
  } finally {
    if (actualRateLimitKey) await db.authRateLimit.deleteMany({ where: { keyHash: actualRateLimitKey } });
    if (productId) await db.product.deleteMany({ where: { id: productId } });
    if (userId) {
      await db.auditEvent.deleteMany({ where: { actorUserId: userId } });
      await db.session.deleteMany({ where: { userId } });
      await db.user.deleteMany({ where: { id: userId } });
    }
    await db.$disconnect();
  }
});
