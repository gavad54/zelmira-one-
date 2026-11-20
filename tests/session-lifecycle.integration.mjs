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
    stdio: ["ignore", "ignore", "pipe"]
  });
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


test("stale MFA sessions cannot revoke one or all sessions without fresh authentication", async () => {
  const suffix = randomBytes(6).toString("hex");
  const user = await db.user.create({
    data: {
      email: `session-stale-mfa-${suffix}@example.invalid`,
      passwordHash: "integration-only-hash",
      displayName: "Stale MFA Session Test",
      emailVerifiedAt: new Date()
    }
  });
  const staleToken = randomBytes(32).toString("hex");
  const targetToken = randomBytes(32).toString("hex");
  const now = Date.now();
  const stale = await db.session.create({
    data: {
      userId: user.id,
      tokenHash: createHash("sha256").update(staleToken).digest("hex"),
      expiresAt: new Date(now + 24 * 60 * 60 * 1000),
      lastSeenAt: new Date(now),
      assurance: "MFA",
      mfaAuthenticatedAt: new Date(now - 13 * 60 * 60 * 1000)
    }
  });
  const target = await db.session.create({
    data: {
      userId: user.id,
      tokenHash: createHash("sha256").update(targetToken).digest("hex"),
      expiresAt: new Date(now + 24 * 60 * 60 * 1000),
      lastSeenAt: new Date(now),
      assurance: "PASSWORD"
    }
  });
  const headers = {
    Cookie: `vayro_session=${staleToken}`,
    Origin: `http://localhost:${port}`,
    Host: `localhost:${port}`,
    "Content-Type": "application/json"
  };
  try {
    const revokeOne = await fetch(`${origin}/api/auth/sessions/revoke`, {
      method: "POST", headers, body: JSON.stringify({ sessionId: target.id })
    });
    assert.equal(revokeOne.status, 403, "stale MFA must block single-session revocation");
    assert.equal((await revokeOne.json()).error, "mfa_required");

    const revokeAll = await fetch(`${origin}/api/auth/sessions/revoke-all`, {
      method: "POST", headers, body: "{}"
    });
    assert.equal(revokeAll.status, 403, "stale MFA must block revoke-all");
    assert.equal((await revokeAll.json()).error, "mfa_required");

    assert.equal((await db.session.findUnique({ where: { id: stale.id } })).revokedAt, null);
    assert.equal((await db.session.findUnique({ where: { id: target.id } })).revokedAt, null);
  } finally {
    await db.session.deleteMany({ where: { userId: user.id } });
    await db.user.delete({ where: { id: user.id } });
  }
});


test("platform OWNER session revocation requires fresh MFA and permits it when current", async () => {
  const suffix = randomBytes(6).toString("hex");
  const user = await db.user.create({
    data: {
      email: `session-owner-mfa-${suffix}@example.invalid`,
      passwordHash: "integration-only-hash",
      displayName: "Platform Owner Session Test",
      platformRole: "OWNER",
      emailVerifiedAt: new Date()
    }
  });
  const tokens = [randomBytes(32).toString("hex"), randomBytes(32).toString("hex"), randomBytes(32).toString("hex")];
  const now = Date.now();
  const sessions = await Promise.all(tokens.map((token, index) => db.session.create({
    data: {
      userId: user.id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(now + 24 * 60 * 60 * 1000),
      lastSeenAt: new Date(now),
      assurance: index === 0 ? "PASSWORD" : "MFA",
      mfaAuthenticatedAt: index === 0 ? null : new Date(now)
    }
  })));
  const headersFor = token => ({
    Cookie: `vayro_session=${token}`,
    Origin: `http://localhost:${port}`,
    Host: `localhost:${port}`,
    "Content-Type": "application/json"
  });
  try {
    const passwordOnly = await fetch(`${origin}/api/auth/sessions/revoke-all`, {
      method: "POST", headers: headersFor(tokens[0]), body: "{}"
    });
    assert.equal(passwordOnly.status, 403, "platform OWNER cannot revoke sessions with PASSWORD-only assurance");
    assert.equal((await passwordOnly.json()).error, "mfa_required");
    assert.ok((await db.session.findMany({ where: { userId: user.id, revokedAt: null } })).length === 3,
      "denied owner operation must not revoke any session");

    const revokeOne = await fetch(`${origin}/api/auth/sessions/revoke`, {
      method: "POST",
      headers: headersFor(tokens[1]),
      body: JSON.stringify({ sessionId: sessions[2].id })
    });
    assert.equal(revokeOne.status, 200, "fresh-MFA platform OWNER can revoke another own session");
    assert.ok((await db.session.findUnique({ where: { id: sessions[2].id } })).revokedAt);

    const revokeAll = await fetch(`${origin}/api/auth/sessions/revoke-all`, {
      method: "POST", headers: headersFor(tokens[1]), body: "{}"
    });
    assert.equal(revokeAll.status, 200, "fresh-MFA platform OWNER can revoke all own sessions");
    assert.equal((await revokeAll.json()).authenticated, false);
    assert.ok((await db.session.findMany({ where: { userId: user.id, revokedAt: null } })).length === 0);
  } finally {
    await db.session.deleteMany({ where: { userId: user.id } });
    await db.auditEvent.deleteMany({ where: { actorUserId: user.id } });
    await db.user.delete({ where: { id: user.id } });
  }
});
