import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const port = 43183;
const origin = `http://127.0.0.1:${port}`;
const db = new PrismaClient();
let server;
let serverError = "";

before(async () => {
  server = spawn(process.execPath, ["server.js"], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NEXT_PUBLIC_APP_URL: origin,
      VAYRO_MFA_ENCRYPTION_KEY: "cd".repeat(32),
      EMAIL_PROVIDER: "disabled-for-test"
    },
    cwd: join(process.cwd(), ".next/standalone"),
    stdio: ["ignore", "pipe", "pipe"]
  });
  server.stdout.on("data", chunk => { serverError += chunk.toString(); });
  server.stderr.on("data", chunk => { serverError += chunk.toString(); });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Next.js production server exited early: ${serverError}`);
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch {}
    await delay(500);
  }
  server.kill("SIGTERM");
  throw new Error(`Next.js production server did not become ready: ${serverError}`);
});

after(async () => {
  if (server && server.exitCode === null) server.kill("SIGTERM");
  await db.$disconnect();
});

test("session listing, single-session revocation, revoke-all and idle expiry are enforced over production HTTP", async () => {
  const suffix = randomBytes(6).toString("hex");
  const user = await db.user.create({
    data: {
      email: `session-lifecycle-${suffix}@example.invalid`,
      passwordHash: "integration-only-hash",
      displayName: "Session Lifecycle Integration",
      emailVerifiedAt: new Date()
    }
  });
  const otherUser = await db.user.create({
    data: {
      email: `session-other-${suffix}@example.invalid`,
      passwordHash: "integration-only-hash",
      displayName: "Other Session Owner",
      emailVerifiedAt: new Date()
    }
  });
  const tokens = [randomBytes(32).toString("hex"), randomBytes(32).toString("hex"), randomBytes(32).toString("hex")];
  const otherUserToken = randomBytes(32).toString("hex");
  const now = Date.now();
  const current = await db.session.create({
    data: {
      userId: user.id,
      tokenHash: createHash("sha256").update(tokens[0]).digest("hex"),
      expiresAt: new Date(now + 24 * 60 * 60 * 1000),
      lastSeenAt: new Date(now - 6 * 60 * 1000)
    }
  });
  const target = await db.session.create({
    data: {
      userId: user.id,
      tokenHash: createHash("sha256").update(tokens[1]).digest("hex"),
      expiresAt: new Date(now + 24 * 60 * 60 * 1000),
      lastSeenAt: new Date(now - 2 * 60 * 1000)
    }
  });
  const idle = await db.session.create({
    data: {
      userId: user.id,
      tokenHash: createHash("sha256").update(tokens[2]).digest("hex"),
      expiresAt: new Date(now + 24 * 60 * 60 * 1000),
      lastSeenAt: new Date(now - 31 * 60 * 1000)
    }
  });
  const foreign = await db.session.create({
    data: {
      userId: otherUser.id,
      tokenHash: createHash("sha256").update(otherUserToken).digest("hex"),
      expiresAt: new Date(now + 24 * 60 * 60 * 1000),
      lastSeenAt: new Date(now)
    }
  });
  const cookie = `vayro_session=${tokens[0]}`;
  const headers = {
    Cookie: cookie,
    Origin: `http://localhost:${port}`,
    Host: `localhost:${port}`,
    "Content-Type": "application/json"
  };

  try {
    const listing = await fetch(`${origin}/api/auth/sessions`, { headers });
    assert.equal(listing.status, 200);
    const listingBody = await listing.json();
    assert.equal(listingBody.sessions.length, 2, "only active non-idle sessions should be listed");
    assert.ok(listingBody.sessions.some(item => item.id === current.id && item.current));
    assert.ok(listingBody.sessions.some(item => item.id === target.id && !item.current));
    assert.equal(JSON.stringify(listingBody).includes("tokenHash"), false);

    const touched = await db.session.findUnique({ where: { id: current.id } });
    assert.ok(touched.lastSeenAt.getTime() >= now - 1000, "activity should refresh after the write throttle");

    const foreignRevoke = await fetch(`${origin}/api/auth/sessions/revoke`, {
      method: "POST", headers, body: JSON.stringify({ sessionId: foreign.id })
    });
    const foreignRevokeBody = await foreignRevoke.json();
    assert.equal(foreignRevoke.status, 404, `a user must not revoke another user's session: ${JSON.stringify(foreignRevokeBody)}`);

    const revokeOne = await fetch(`${origin}/api/auth/sessions/revoke`, {
      method: "POST", headers, body: JSON.stringify({ sessionId: target.id })
    });
    assert.equal(revokeOne.status, 200);
    assert.equal((await revokeOne.json()).currentSessionRevoked, false);
    assert.ok((await db.session.findUnique({ where: { id: target.id } })).revokedAt);

    const idleAuth = await fetch(`${origin}/api/auth/me`, {
      headers: { Cookie: `vayro_session=${tokens[2]}` }
    });
    assert.equal(idleAuth.status, 401);
    assert.ok((await db.session.findUnique({ where: { id: idle.id } })).revokedAt);

    const revokeAll = await fetch(`${origin}/api/auth/sessions/revoke-all`, {
      method: "POST", headers, body: "{}"
    });
    assert.equal(revokeAll.status, 200);
    const revokeAllBody = await revokeAll.json();
    assert.equal(revokeAllBody.authenticated, false);
    assert.ok(revokeAllBody.revokedCount >= 1);
    assert.ok((await db.session.findUnique({ where: { id: current.id } })).revokedAt);
    assert.equal((await db.session.findUnique({ where: { id: foreign.id } })).revokedAt, null);
  } finally {
    await db.session.deleteMany({ where: { userId: { in: [user.id, otherUser.id] } } });
    await db.auditEvent.deleteMany({ where: { actorUserId: { in: [user.id, otherUser.id] } } });
    await db.user.deleteMany({ where: { id: { in: [user.id, otherUser.id] } } });
  }
});
