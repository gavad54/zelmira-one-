import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { hashPassword, verifyPassword } from "../src/lib/auth-core.mjs";

const port = 43184;
const origin = `http://127.0.0.1:${port}`;
const nativeFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = (input, init = {}) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (typeof url !== "string" || !url.startsWith(origin)) return nativeFetch(input, init);
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  // Simulate one trusted reverse proxy in CI only; use a distinct RFC 5737 test IP per suite.
  headers.set("x-forwarded-for", `198.51.100.${(port % 200) + 1}, 127.0.0.1`);
  return nativeFetch(input, { ...init, headers });
};
const db = new PrismaClient();
let server;
let serverError = "";

before(async () => {
  server = spawn(process.execPath, ["server.js"], {
    env: {
      ...process.env, NODE_ENV: "production", PORT: String(port),
      HOSTNAME: "127.0.0.1", NEXT_PUBLIC_APP_URL: origin, TRUSTED_PROXY_HOPS: "1",
      VAYRO_MFA_ENCRYPTION_KEY: "ef".repeat(32), EMAIL_PROVIDER: "disabled-for-test"
    },
    cwd: join(process.cwd(), ".next/standalone"),
    stdio: ["ignore", "ignore", "pipe"]
  });
  server.stderr.on("data", chunk => { serverError += chunk.toString(); });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Next.js production server exited early: ${serverError}`);
    try { if ((await fetch(`${origin}/api/health`)).ok) return; } catch {}
    await delay(500);
  }
  server.kill("SIGTERM");
  throw new Error(`Next.js production server did not become ready: ${serverError}`);
});

after(async () => {
  if (server && server.exitCode === null) server.kill("SIGTERM");
  await db.$disconnect();
});

test("authenticated password change verifies current password and revokes every session", async () => {
  const suffix = randomBytes(6).toString("hex");
  const oldPassword = "Current-password-123!";
  const newPassword = "New-password-456!Secure";
  const user = await db.user.create({
    data: {
      email: `password-change-${suffix}@example.invalid`,
      passwordHash: await hashPassword(oldPassword),
      displayName: "Password Change Integration",
      emailVerifiedAt: new Date()
    }
  });
  const tokens = [randomBytes(32).toString("hex"), randomBytes(32).toString("hex")];
  const sessions = await Promise.all(tokens.map(token => db.session.create({
    data: {
      userId: user.id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      lastSeenAt: new Date()
    }
  })));
  const headers = {
    Cookie: `vayro_session=${tokens[0]}`,
    Origin: `http://localhost:${port}`,
    Host: `localhost:${port}`,
    "Content-Type": "application/json"
  };

  try {
    const wrong = await fetch(`${origin}/api/auth/change-password`, {
      method: "POST", headers,
      body: JSON.stringify({ currentPassword: "Wrong-password-123!", newPassword: newPassword })
    });
    assert.equal(wrong.status, 401);
    assert.equal(await verifyPassword(oldPassword, (await db.user.findUnique({ where: { id: user.id } })).passwordHash), true);

    const changed = await fetch(`${origin}/api/auth/change-password`, {
      method: "POST", headers,
      body: JSON.stringify({ currentPassword: oldPassword, newPassword })
    });
    assert.equal(changed.status, 200);
    assert.deepEqual(await changed.json(), { changed: true, authenticated: false });
    const updated = await db.user.findUnique({ where: { id: user.id } });
    assert.equal(await verifyPassword(newPassword, updated.passwordHash), true);
    assert.equal(await verifyPassword(oldPassword, updated.passwordHash), false);
    for (const session of sessions) {
      assert.ok((await db.session.findUnique({ where: { id: session.id } })).revokedAt);
    }
    assert.ok(await db.auditEvent.findFirst({
      where: { actorUserId: user.id, action: "auth.password.changed" }
    }));
  } finally {
    await db.session.deleteMany({ where: { userId: user.id } });
    await db.auditEvent.deleteMany({ where: { actorUserId: user.id } });
    await db.user.delete({ where: { id: user.id } });
  }
});
