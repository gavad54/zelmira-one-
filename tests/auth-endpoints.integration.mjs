import test, { before, after } from "node:test";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const port = 43179;
const origin = `http://127.0.0.1:${port}`;
let server;
let serverError = "";

before(async () => {
  server = spawn(
    process.execPath,
    ["server.js"],
    {
      env: { ...process.env, NODE_ENV: "production", PORT: String(port), HOSTNAME: "127.0.0.1", NEXT_PUBLIC_APP_URL: origin },
      cwd: join(process.cwd(), ".next/standalone"),
      stdio: ["ignore", "ignore", "pipe"]
    }
  );
  server.stderr.on("data", chunk => { serverError += chunk.toString(); });

  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js production server exited early: ${serverError}`);
    }
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch {
      // The production server is still starting.
    }
    await delay(500);
  }
  server.kill("SIGTERM");
  throw new Error(`Next.js production server did not become ready: ${serverError}`);
});

after(() => {
  if (server && server.exitCode === null) server.kill("SIGTERM");
});

test("production homepage is public and exposes VAYRO account entry points", async () => {
  const response = await fetch(origin);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /VAYRO/);
  assert.match(html, /href="\/login"/);
  assert.match(html, /href="\/register"/);
});

test("liveness and database readiness are independently verified", async () => {
  const live = await fetch(`${origin}/api/health`);
  assert.equal(live.status, 200);
  assert.equal((await live.json()).status, "alive");

  const ready = await fetch(`${origin}/api/ready`);
  assert.equal(ready.status, 200);
  assert.equal((await ready.json()).checks.database, "ok");
});

test("authentication mutation endpoints reject cross-origin requests", async () => {
  const routes = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/logout",
    "/api/auth/resend-verification",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/auth/verify-email",
    "/api/owner/bootstrap"
  ];
  for (const route of routes) {
    const response = await fetch(`${origin}${route}`, {
      method: "POST",
      headers: { Origin: "https://attacker.invalid", "Content-Type": "application/json" },
      body: "{}"
    });
    assert.equal(response.status, 403, `${route} should reject a cross-origin request`);
  }
});

test("login endpoint rejects malformed JSON over HTTP", async () => {
  const response = await fetch(`${origin}/api/auth/login`, {
    method: "POST",
    headers: {
      Origin: `http://localhost:${port}`,
      Host: `localhost:${port}`,
      "Content-Type": "application/json"
    },
    body: "{malformed"
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid_credentials");
});


test("session identity endpoint denies absent and malformed cookies without exposing user data", async () => {
  const absent = await fetch(`${origin}/api/auth/me`);
  assert.equal(absent.status, 401);
  assert.deepEqual(await absent.json(), { authenticated: false });
  assert.match(absent.headers.get("cache-control") ?? "", /no-store/);

  const malformed = await fetch(`${origin}/api/auth/me`, {
    headers: { Cookie: "vayro_session=not-a-valid-session-token" }
  });
  assert.equal(malformed.status, 401);
  assert.deepEqual(await malformed.json(), { authenticated: false });
});

test("logout is idempotent without a session and expires the session cookie", async () => {
  const response = await fetch(`${origin}/api/auth/logout`, {
    method: "POST",
    headers: {
      Origin: `http://localhost:${port}`,
      Host: `localhost:${port}`
    }
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { authenticated: false });
  const cookie = response.headers.get("set-cookie") ?? "";
  assert.match(cookie, /vayro_session=/);
  assert.match(cookie, /Expires=Thu, 01 Jan 1970/i);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
});


test("valid session is returned by /me and revoked by HTTP logout", async () => {
  const db = new PrismaClient();
  const suffix = randomUUID();
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  let userId;

  try {
    await db.$connect();
    const user = await db.user.create({
      data: {
        email: `http-session-${suffix}@example.invalid`,
        passwordHash: "integration-test-only-hash",
        displayName: "HTTP Session Test",
        emailVerifiedAt: new Date()
      }
    });
    userId = user.id;
    const session = await db.session.create({
      data: { userId, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) }
    });

    const me = await fetch(`${origin}/api/auth/me`, {
      headers: { Cookie: `vayro_session=${token}` }
    });
    assert.equal(me.status, 200);
    const identity = await me.json();
    assert.equal(identity.authenticated, true);
    assert.equal(identity.user.id, userId);
    assert.equal(identity.user.email, user.email);
    assert.match(me.headers.get("cache-control") ?? "", /no-store/);

    const logout = await fetch(`${origin}/api/auth/logout`, {
      method: "POST",
      headers: {
        Origin: `http://localhost:${port}`,
        Host: `localhost:${port}`,
        Cookie: `vayro_session=${token}`
      }
    });
    assert.equal(logout.status, 200);
    assert.deepEqual(await logout.json(), { authenticated: false });
    assert.equal(await db.session.count({ where: { id: session.id } }), 0);
    const clearedCookie = logout.headers.get("set-cookie") ?? "";
    assert.match(clearedCookie, /vayro_session=/);
    assert.match(clearedCookie, /Expires=Thu, 01 Jan 1970/i);
    assert.match(clearedCookie, /HttpOnly/i);
    assert.match(clearedCookie, /SameSite=Lax/i);

    const afterLogout = await fetch(`${origin}/api/auth/me`, {
      headers: { Cookie: `vayro_session=${token}` }
    });
    assert.equal(afterLogout.status, 401);
    assert.deepEqual(await afterLogout.json(), { authenticated: false });
  } finally {
    if (userId) {
      await db.auditEvent.deleteMany({ where: { actorUserId: userId } });
      await db.session.deleteMany({ where: { userId } });
      await db.user.deleteMany({ where: { id: userId } });
    }
    await db.$disconnect();
  }
});
