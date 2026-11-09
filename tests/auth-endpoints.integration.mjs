import test, { before, after } from "node:test";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const port = 43179;
const origin = `http://127.0.0.1:${port}`;
const bootstrapToken = randomBytes(48).toString("hex");
let server;
let serverError = "";

before(async () => {
  server = spawn(
    process.execPath,
    ["server.js"],
    {
      env: { ...process.env, NODE_ENV: "production", PORT: String(port), HOSTNAME: "127.0.0.1", NEXT_PUBLIC_APP_URL: origin, VAYRO_OWNER_BOOTSTRAP_TOKEN: bootstrapToken, EMAIL_PROVIDER: "disabled-for-test" },
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
  let adminUserId;
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
    assert.equal(unverifiedList.status, 401);
    assert.deepEqual(await unverifiedList.json(), { error: "unauthorized" });
    assert.match(unverifiedList.headers.get("cache-control") ?? "", /no-store/);

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

    const crossOriginRename = await fetch(`${origin}/api/tenants/${createdTenantId}`, {
      method: "PATCH",
      headers: {
        Origin: "https://attacker.invalid",
        "Content-Type": "application/json",
        Cookie: cookie
      },
      body: JSON.stringify({ name: "تغییر غیرمجاز" })
    });
    assert.equal(crossOriginRename.status, 403);

    const invalidRename = await fetch(`${origin}/api/tenants/${createdTenantId}`, {
      method: "PATCH",
      headers: {
        Origin: `http://localhost:${port}`,
        Host: `localhost:${port}`,
        "Content-Type": "application/json",
        Cookie: cookie
      },
      body: JSON.stringify({ name: "نام تازه", role: "OWNER" })
    });
    assert.equal(invalidRename.status, 400);

    const admin = await db.user.create({
      data: {
        email: `tenant-admin-${suffix}@example.invalid`,
        passwordHash: "integration-test-only-hash",
        displayName: "Tenant Admin Test",
        emailVerifiedAt: new Date()
      }
    });
    adminUserId = admin.id;
    const adminToken = randomBytes(32).toString("hex");
    const adminTokenHash = createHash("sha256").update(adminToken).digest("hex");
    await db.membership.create({
      data: { userId: adminUserId, tenantId: createdTenantId, role: "ADMIN" }
    });
    await db.session.create({
      data: {
        userId: adminUserId,
        tokenHash: adminTokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      }
    });
    const adminCookie = `vayro_session=${adminToken}`;

    const adminRename = await fetch(`${origin}/api/tenants/${createdTenantId}`, {
      method: "PATCH",
      headers: {
        Origin: `http://localhost:${port}`,
        Host: `localhost:${port}`,
        "Content-Type": "application/json",
        Cookie: adminCookie
      },
      body: JSON.stringify({ name: "نام سازمان توسط مدیر" })
    });
    assert.equal(adminRename.status, 200);
    assert.equal((await adminRename.json()).tenant.name, "نام سازمان توسط مدیر");
    assert.ok(await db.auditEvent.findFirst({
      where: {
        actorUserId: adminUserId,
        tenantId: createdTenantId,
        action: "tenant.renamed"
      }
    }));

    const adminClose = await fetch(`${origin}/api/tenants/${createdTenantId}`, {
      method: "DELETE",
      headers: {
        Origin: `http://localhost:${port}`,
        Host: `localhost:${port}`,
        Cookie: adminCookie
      }
    });
    assert.equal(adminClose.status, 401);

    const ownerClose = await fetch(`${origin}/api/tenants/${createdTenantId}`, {
      method: "DELETE",
      headers: {
        Origin: `http://localhost:${port}`,
        Host: `localhost:${port}`,
        Cookie: cookie
      }
    });
    assert.equal(ownerClose.status, 200);
    const closedResponse = await ownerClose.json();
    assert.equal(closedResponse.closed, true);
    assert.equal(closedResponse.tenant.status, "CLOSED");

    const retainedTenant = await db.tenant.findUnique({
      where: { id: createdTenantId },
      select: { id: true, status: true }
    });
    assert.deepEqual(retainedTenant, { id: createdTenantId, status: "CLOSED" });
    assert.equal(await db.membership.count({ where: { tenantId: createdTenantId } }), 2);
    assert.ok(await db.auditEvent.findFirst({
      where: {
        actorUserId: userId,
        tenantId: createdTenantId,
        action: "tenant.closed"
      }
    }));

    const closedWorkspace = await fetch(`${origin}/api/tenants/${createdTenantId}`, {
      headers: { Cookie: cookie }
    });
    assert.equal(closedWorkspace.status, 401);
  } finally {
    if (adminUserId) {
      await db.auditEvent.deleteMany({ where: { actorUserId: adminUserId } });
      await db.session.deleteMany({ where: { userId: adminUserId } });
      await db.membership.deleteMany({ where: { userId: adminUserId } });
      await db.user.deleteMany({ where: { id: adminUserId } });
    }
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


test("public HTML uses a fresh per-response nonce-based CSP for scripts", async () => {
  const response = await fetch(origin);
  assert.equal(response.status, 200);
  const csp = response.headers.get("content-security-policy") ?? "";
  const nonceMatch = csp.match(/'nonce-([A-Za-z0-9+/]+=*)'/);
  assert.ok(nonceMatch, "CSP must contain a cryptographically random script nonce; received: " + csp);
  assert.match(csp, /script-src[^;]*'strict-dynamic'/);
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);
  assert.match(csp, /style-src[^;]*'nonce-/);
  assert.doesNotMatch(csp, /style-src[^;]*'unsafe-inline'/);
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /base-uri 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
  const html = await response.text();
  assert.deepEqual(
    [...'<SCRIPT nonce="test">'.matchAll(/<script\b[^>]*>/gi)].map(([tag]) => tag),
    ['<SCRIPT nonce="test">'],
    "script tag detection must be case-insensitive"
  );
  const scriptTags = [...html.matchAll(/<script\b[^>]*>/gi)].map(([tag]) => tag);
  assert.ok(scriptTags.length > 0, "homepage must include script tags");
  assert.ok(
    scriptTags.every(tag => tag.includes(`nonce="${nonceMatch[1]}"`)),
    "every script tag must carry the CSP nonce"
  );

  const secondResponse = await fetch(origin);
  assert.equal(secondResponse.status, 200);
  const secondCsp = secondResponse.headers.get("content-security-policy") ?? "";
  const secondNonce = secondCsp.match(/'nonce-([A-Za-z0-9+/]+=*)'/)?.[1];
  assert.ok(secondNonce);
  assert.notEqual(secondNonce, nonceMatch[1], "each HTML response must receive a fresh nonce");
  const secondHtml = await secondResponse.text();
  const secondScriptTags = [...secondHtml.matchAll(/<script\b[^>]*>/gi)].map(([tag]) => tag);
  assert.ok(secondScriptTags.length > 0, "second homepage response must include script tags");
  assert.ok(
    secondScriptTags.every(tag => tag.includes(`nonce="${secondNonce}"`)),
    "every script tag in the second response must carry its own CSP nonce"
  );
});


test("owner bootstrap cannot grant owner access before email verification", async () => {
  const db = new PrismaClient();
  const suffix = randomUUID();
  const email = `owner-bootstrap-${suffix}@example.invalid`;
  let userId;

  try {
    await db.$connect();
    const existingOwners = await db.user.count({
      where: { platformRole: { in: ["OWNER", "PLATFORM_ADMIN"] } }
    });
    assert.equal(existingOwners, 0, "bootstrap integration test requires a clean owner state");

    const response = await fetch(`${origin}/api/owner/bootstrap`, {
      method: "POST",
      headers: {
        Origin: `http://localhost:${port}`,
        Host: `localhost:${port}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        bootstrapToken,
        email,
        displayName: "Initial Owner Test",
        password: "a-strong-test-password-2026"
      })
    });

    const bootstrapBody = await response.json();
    assert.equal(response.status, 503, "unexpected bootstrap response: " + JSON.stringify(bootstrapBody));
    assert.deepEqual(bootstrapBody, {
      created: true,
      authenticated: false,
      verification: "required",
      error: "verification_delivery_unavailable"
    });

    const owner = await db.user.findUnique({ where: { email } });
    assert.ok(owner);
    userId = owner.id;
    assert.equal(owner.platformRole, "OWNER");
    assert.equal(owner.emailVerifiedAt, null);
    assert.equal(await db.session.count({ where: { userId } }), 0);
    assert.ok(await db.authActionToken.findFirst({
      where: { userId, purpose: "EMAIL_VERIFY", consumedAt: null }
    }));

    const resend = await fetch(`${origin}/api/auth/resend-verification`, {
      method: "POST",
      headers: {
        Origin: `http://localhost:${port}`,
        Host: `localhost:${port}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });
    assert.equal(resend.status, 202);
  } finally {
    if (userId) {
      await db.authActionToken.deleteMany({ where: { userId } });
      await db.session.deleteMany({ where: { userId } });
      await db.auditEvent.deleteMany({ where: { actorUserId: userId } });
      await db.emailContact.deleteMany({ where: { email } });
      await db.user.deleteMany({ where: { id: userId } });
    }
    await db.$disconnect();
  }
});


test("tenant members endpoint requires OWNER or ADMIN and never exposes credentials", async () => {
  const db = new PrismaClient();
  const suffix = randomUUID();
  const ownerToken = randomBytes(32).toString("hex");
  const viewerToken = randomBytes(32).toString("hex");
  const ownerTokenHash = createHash("sha256").update(ownerToken).digest("hex");
  const viewerTokenHash = createHash("sha256").update(viewerToken).digest("hex");
  let ownerId;
  let viewerId;
  let tenantId;

  try {
    await db.$connect();
    const owner = await db.user.create({
      data: {
        email: `members-owner-${suffix}@example.invalid`,
        passwordHash: "must-never-be-returned",
        displayName: "Members Owner",
        emailVerifiedAt: new Date()
      }
    });
    ownerId = owner.id;

    const viewer = await db.user.create({
      data: {
        email: `members-viewer-${suffix}@example.invalid`,
        passwordHash: "must-never-be-returned",
        displayName: "Members Viewer",
        emailVerifiedAt: new Date()
      }
    });
    viewerId = viewer.id;

    const tenant = await db.tenant.create({
      data: {
        name: "Members API Test",
        slug: `members-api-${suffix}`,
        memberships: {
          create: [
            { userId: ownerId, role: "OWNER" },
            { userId: viewerId, role: "VIEWER" }
          ]
        }
      }
    });
    tenantId = tenant.id;

    await db.session.createMany({
      data: [
        { userId: ownerId, tokenHash: ownerTokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
        { userId: viewerId, tokenHash: viewerTokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) }
      ]
    });

    const unauthenticated = await fetch(`${origin}/api/tenants/${tenantId}/members`);
    assert.equal(unauthenticated.status, 401);
    assert.match(unauthenticated.headers.get("cache-control") ?? "", /no-store/);

    const ownerResponse = await fetch(`${origin}/api/tenants/${tenantId}/members`, {
      headers: { Cookie: `vayro_session=${ownerToken}` }
    });
    assert.equal(ownerResponse.status, 200);
    assert.match(ownerResponse.headers.get("cache-control") ?? "", /no-store/);
    const body = await ownerResponse.json();
    assert.equal(body.members.length, 2);
    assert.deepEqual(
      body.members.map(({ email, role }) => ({ email, role })),
      [
        { email: owner.email, role: "OWNER" },
        { email: viewer.email, role: "VIEWER" }
      ]
    );
    assert.doesNotMatch(JSON.stringify(body), /passwordHash|must-never-be-returned/);

    const viewerResponse = await fetch(`${origin}/api/tenants/${tenantId}/members`, {
      headers: { Cookie: `vayro_session=${viewerToken}` }
    });
    assert.equal(viewerResponse.status, 401);

    const otherTenant = await db.tenant.create({
      data: { name: "Other Members Tenant", slug: `other-members-${suffix}` }
    });
    const crossTenant = await fetch(`${origin}/api/tenants/${otherTenant.id}/members`, {
      headers: { Cookie: `vayro_session=${ownerToken}` }
    });
    assert.equal(crossTenant.status, 401);
    await db.tenant.delete({ where: { id: otherTenant.id } });
  } finally {
    if (tenantId) {
      await db.auditEvent.deleteMany({ where: { tenantId } });
      await db.membership.deleteMany({ where: { tenantId } });
      await db.tenant.deleteMany({ where: { id: tenantId } });
    }
    if (ownerId || viewerId) {
      const userIds = [ownerId, viewerId].filter(Boolean);
      await db.session.deleteMany({ where: { userId: { in: userIds } } });
      await db.auditEvent.deleteMany({ where: { actorUserId: { in: userIds } } });
      await db.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await db.$disconnect();
  }
});


test("session identity endpoint denies an unverified account even if a session row exists", async () => {
  const db = new PrismaClient();
  const suffix = randomUUID();
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  let userId;

  try {
    await db.$connect();
    const user = await db.user.create({
      data: {
        email: `unverified-session-${suffix}@example.invalid`,
        passwordHash: "integration-test-only-hash",
        displayName: "Unverified Session Test"
      }
    });
    userId = user.id;
    await db.session.create({
      data: { userId, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) }
    });

    const response = await fetch(`${origin}/api/auth/me`, {
      headers: { Cookie: `vayro_session=${token}` }
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { authenticated: false });
  } finally {
    if (userId) {
      await db.session.deleteMany({ where: { userId } });
      await db.user.deleteMany({ where: { id: userId } });
    }
    await db.$disconnect();
  }
});


test("session identity endpoint denies expired sessions and disabled accounts", async () => {
  const db = new PrismaClient();
  const suffix = randomUUID();
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  let userId;

  try {
    await db.$connect();
    const user = await db.user.create({
      data: {
        email: `inactive-session-${suffix}@example.invalid`,
        passwordHash: "integration-test-only-hash",
        displayName: "Inactive Session Test",
        emailVerifiedAt: new Date()
      }
    });
    userId = user.id;

    await db.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() - 1000)
      }
    });

    const expired = await fetch(`${origin}/api/auth/me`, {
      headers: { Cookie: `vayro_session=${token}` }
    });
    assert.equal(expired.status, 401);
    assert.deepEqual(await expired.json(), { authenticated: false });
    assert.match(expired.headers.get("cache-control") ?? "", /no-store/);

    await db.session.update({
      where: { tokenHash },
      data: { expiresAt: new Date(Date.now() + 60 * 60 * 1000) }
    });
    await db.user.update({
      where: { id: userId },
      data: { disabledAt: new Date() }
    });

    const disabled = await fetch(`${origin}/api/auth/me`, {
      headers: { Cookie: `vayro_session=${token}` }
    });
    assert.equal(disabled.status, 401);
    assert.deepEqual(await disabled.json(), { authenticated: false });
    assert.match(disabled.headers.get("cache-control") ?? "", /no-store/);
  } finally {
    if (userId) {
      await db.session.deleteMany({ where: { userId } });
      await db.user.deleteMany({ where: { id: userId } });
    }
    await db.$disconnect();
  }
});
