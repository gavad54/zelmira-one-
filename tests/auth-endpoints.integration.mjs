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


test("tenant HTTP APIs enforce authentication, verified email, membership and cross-tenant isolation", async () => {
  const db = new PrismaClient();
  const suffix = randomUUID();
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  let userId;
  let tenantBId;
  let createdTenantId;

  try {
    await db.$connect();

    const unauthenticatedList = await fetch(`${origin}/api/tenants`);
    assert.equal(unauthenticatedList.status, 401);

    const unauthenticatedCreate = await fetch(`${origin}/api/tenants`, {
      method: "POST",
      headers: { Origin: `http://localhost:${port}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Unauthorized Tenant" })
    });
    assert.equal(unauthenticatedCreate.status, 401);

    const user = await db.user.create({
      data: {
        email: `tenant-http-${suffix}@example.invalid`,
        passwordHash: "integration-test-only-hash",
        displayName: "Tenant HTTP Test"
      }
    });
    userId = user.id;

    await db.session.create({
      data: { userId, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) }
    });
    const cookie = `vayro_session=${token}`;

    const unverifiedList = await fetch(`${origin}/api/tenants`, {
      headers: { Cookie: cookie }
    });
    assert.equal(unverifiedList.status, 403);
    assert.deepEqual(await unverifiedList.json(), { error: "email_verification_required" });

    await db.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() }
    });

    const invalidCreate = await fetch(`${origin}/api/tenants`, {
      method: "POST",
      headers: {
        Origin: `http://localhost:${port}`,
        Host: `localhost:${port}`,
        Cookie: cookie,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: "Valid Tenant", role: "OWNER" })
    });
    assert.equal(invalidCreate.status, 400);

    const create = await fetch(`${origin}/api/tenants`, {
      method: "POST",
      headers: {
        Origin: `http://localhost:${port}`,
        Host: `localhost:${port}`,
        Cookie: cookie,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: "Tenant HTTP Test Workspace" })
    });
    assert.equal(create.status, 201);
    const created = await create.json();
    assert.equal(created.tenant.name, "Tenant HTTP Test Workspace");
    assert.equal(created.tenant.role, "OWNER");
    createdTenantId = created.tenant.id;

    const audit = await db.auditEvent.findFirst({
      where: {
        actorUserId: userId,
        tenantId: createdTenantId,
        action: "tenant.created"
      }
    });
    assert.ok(audit, "tenant creation must write an owner audit event");

    const list = await fetch(`${origin}/api/tenants`, {
      headers: { Cookie: cookie }
    });
    assert.equal(list.status, 200);
    const listed = await list.json();
    assert.deepEqual(listed.tenants.map(tenant => tenant.id), [createdTenantId]);

    const workspace = await fetch(`${origin}/api/tenants/${createdTenantId}`, {
      headers: { Cookie: cookie }
    });
    assert.equal(workspace.status, 200);
    const workspaceBody = await workspace.json();
    assert.equal(workspaceBody.tenant.id, createdTenantId);
    assert.equal(workspaceBody.role, "OWNER");

    const tenantB = await db.tenant.create({
      data: { name: "Unrelated Tenant", slug: `unrelated-${suffix}` }
    });
    tenantBId = tenantB.id;

    const crossTenantWorkspace = await fetch(`${origin}/api/tenants/${tenantBId}`, {
      headers: { Cookie: cookie }
    });
    assert.equal(crossTenantWorkspace.status, 401);

    const ownAccess = await fetch(`${origin}/api/tenants/${createdTenantId}/access`, {
      headers: { Cookie: cookie }
    });
    assert.equal(ownAccess.status, 200);
    assert.deepEqual(await ownAccess.json(), {
      tenantId: createdTenantId,
      role: "OWNER",
      access: "granted"
    });

    const crossTenantAccess = await fetch(`${origin}/api/tenants/${tenantBId}/access`, {
      headers: { Cookie: cookie }
    });
    assert.equal(crossTenantAccess.status, 401);
  } finally {
    if (userId) {
      await db.auditEvent.deleteMany({ where: { actorUserId: userId } });
      await db.session.deleteMany({ where: { userId } });
    }
    if (createdTenantId || tenantBId) {
      await db.membership.deleteMany({
        where: { tenantId: { in: [createdTenantId, tenantBId].filter(Boolean) } }
      });
      await db.tenant.deleteMany({
        where: { id: { in: [createdTenantId, tenantBId].filter(Boolean) } }
      });
    }
    if (userId) await db.user.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  }
});
