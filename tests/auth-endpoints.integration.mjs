import test, { before, after } from "node:test";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { hashPassword } from "../src/lib/auth-core.mjs";
import { totpAt } from "../src/lib/mfa-core.mjs";
import { setTimeout as delay } from "node:timers/promises";

const port = 43179;
const origin = `http://127.0.0.1:${port}`;
const nativeFetch = globalThis.fetch.bind(globalThis);
let proxyRequestSequence = 0;
globalThis.fetch = (input, init = {}) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (typeof url !== "string" || !url.startsWith(origin)) return nativeFetch(input, init);
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  // Simulate one trusted reverse proxy in CI only; use a distinct RFC 5737 test IP per suite.
  proxyRequestSequence = (proxyRequestSequence % 254) + 1;
  headers.set("x-forwarded-for", `198.51.100.${proxyRequestSequence}, 127.0.0.1`);
  return nativeFetch(input, { ...init, headers });
};
const bootstrapToken = randomBytes(48).toString("hex");
let server;
let serverError = "";

before(async () => {
  server = spawn(
    process.execPath,
    ["server.js"],
    {
      env: { ...process.env, NODE_ENV: "production", PORT: String(port), HOSTNAME: "127.0.0.1", NEXT_PUBLIC_APP_URL: origin, TRUSTED_PROXY_HOPS: "1", VAYRO_OWNER_BOOTSTRAP_TOKEN: bootstrapToken, VAYRO_MFA_ENCRYPTION_KEY: "ab".repeat(32), EMAIL_PROVIDER: "disabled-for-test" },
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
  const readiness = await ready.json();
  assert.equal(readiness.checks.database, "ok");
  assert.equal(readiness.checks.authentication, "ok");
  assert.equal(readiness.checks.platform, "ok");
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
    "/api/auth/mfa/enroll",
    "/api/auth/mfa/enroll/confirm",
    "/api/auth/mfa/verify",
    "/api/auth/mfa/disable",
    "/api/auth/mfa/recovery-codes",
    "/api/auth/sessions/revoke",
    "/api/auth/sessions/revoke-all",
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
      data: { userId, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000), assurance: "MFA", mfaAuthenticatedAt: new Date() }
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
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        assurance: "MFA",
        mfaAuthenticatedAt: new Date()
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
    [...'<SCRIPT nonce="test">'.matchAll(/<[sS][cC][rR][iI][pP][tT]\b[^>]*>/g)].map(([tag]) => tag),
    ['<SCRIPT nonce="test">'],
    "script tag detection must be case-insensitive"
  );
  const scriptTags = [...html.matchAll(/<[sS][cC][rR][iI][pP][tT]\b[^>]*>/g)].map(([tag]) => tag);
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
  const secondScriptTags = [...secondHtml.matchAll(/<[sS][cC][rR][iI][pP][tT]\b[^>]*>/g)].map(([tag]) => tag);
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

    // Invalid bootstrap credentials must not consume the one-time owner's shared setup budget.
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const rejected = await fetch(`${origin}/api/owner/bootstrap`, {
        method: "POST",
        headers: {
          Origin: `http://localhost:${port}`,
          Host: `localhost:${port}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          bootstrapToken: "x".repeat(48),
          email,
          displayName: "Invalid Bootstrap Attempt",
          password: "a-strong-test-password-2026"
        })
      });
      assert.equal(rejected.status, 403, "invalid bootstrap credentials must not exhaust the valid setup budget");
      assert.deepEqual(await rejected.json(), { error: "bootstrap_unavailable" });
    }

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
        { userId: ownerId, tokenHash: ownerTokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000), assurance: "MFA", mfaAuthenticatedAt: new Date() },
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


test("HTTP identity endpoint rejects a session marked revoked in PostgreSQL", async () => {
  const db = new PrismaClient();
  const suffix = randomUUID();
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  let userId;
  try {
    await db.$connect();
    const user = await db.user.create({
      data: {
        email: `revoked-session-${suffix}@example.invalid`,
        passwordHash: "integration-test-only-hash",
        displayName: "Revoked Session Test",
        emailVerifiedAt: new Date()
      }
    });
    userId = user.id;
    await db.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        revokedAt: new Date()
      }
    });
    const response = await fetch(`${origin}/api/auth/me`, {
      headers: { Cookie: `vayro_session=${token}` }
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { authenticated: false });
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  } finally {
    if (userId) {
      await db.session.deleteMany({ where: { userId } });
      await db.user.deleteMany({ where: { id: userId } });
    }
    await db.$disconnect();
  }
});

test("privileged login requires enrollment, TOTP replay is rejected, and recovery codes are single-use", async () => {
  const db = new PrismaClient();
  const suffix = randomUUID();
  const email = `mfa-owner-${suffix}@example.invalid`;
  const password = "Vayro-MFA-Integration-2026!";
  let userId;
  let normalUserId;
  const requestHeaders = {
    Origin: `http://localhost:${port}`,
    Host: `localhost:${port}`,
    "Content-Type": "application/json"
  };
  async function login() {
    return fetch(`${origin}/api/auth/login`, {
      method: "POST", headers: requestHeaders,
      body: JSON.stringify({ email, password })
    });
  }
  async function logout(cookie) {
    return fetch(`${origin}/api/auth/logout`, {
      method: "POST", headers: { ...requestHeaders, Cookie: cookie }
    });
  }
  async function verify(challengeToken, code) {
    return fetch(`${origin}/api/auth/mfa/verify`, {
      method: "POST", headers: requestHeaders,
      body: JSON.stringify({ challengeToken, code })
    });
  }
  try {
    await db.$connect();
    const user = await db.user.create({
      data: {
        email, passwordHash: await hashPassword(password),
        displayName: "MFA Integration Owner",
        platformRole: "OWNER", emailVerifiedAt: new Date()
      }
    });
    userId = user.id;
    const preEnrollmentToken = randomBytes(32).toString("hex");
    const preEnrollmentSession = await db.session.create({
      data: {
        userId,
        tokenHash: createHash("sha256").update(preEnrollmentToken).digest("hex"),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      }
    });

    const firstLogin = await login();
    assert.equal(firstLogin.status, 202);
    const enrollmentChallenge = await firstLogin.json();
    assert.equal(enrollmentChallenge.authenticated, false);
    assert.equal(enrollmentChallenge.enrollmentRequired, true);
    assert.equal(typeof enrollmentChallenge.challengeToken, "string");
    assert.equal(firstLogin.headers.get("set-cookie"), null, "privileged password login must not issue a session cookie");
    assert.equal(await db.session.count({ where: { userId, revokedAt: null } }), 1, "login must not create a general session before enrollment");

    const enrollment = await fetch(`${origin}/api/auth/mfa/enroll`, {
      method: "POST", headers: requestHeaders,
      body: JSON.stringify({ challengeToken: enrollmentChallenge.challengeToken })
    });
    assert.equal(enrollment.status, 200);
    const setup = await enrollment.json();
    assert.match(setup.otpauthUrl, /^otpauth:\/\/totp\/VAYRO/);
    assert.match(setup.secret, /^[A-Z2-7]+$/);
    const enrollmentCode = totpAt(setup.secret, Date.now());

    const confirmation = await fetch(`${origin}/api/auth/mfa/enroll/confirm`, {
      method: "POST", headers: requestHeaders,
      body: JSON.stringify({ challengeToken: enrollmentChallenge.challengeToken, code: enrollmentCode })
    });
    assert.equal(confirmation.status, 200);
    const confirmationBody = await confirmation.json();
    assert.equal(confirmationBody.mfaEnabled, true);
    assert.equal(confirmationBody.recoveryCodes.length, 10);
    const recoveryCode = confirmationBody.recoveryCodes[0];
    const ownerCookie = (confirmation.headers.get("set-cookie") ?? "").split(";")[0];
    assert.match(ownerCookie, /^vayro_session=[a-f0-9]{64}$/);

    const activeMfa = await db.userMfa.findUnique({ where: { userId } });
    assert.ok(activeMfa?.enabledAt);
    assert.ok(activeMfa?.secretCiphertext);
    assert.equal(activeMfa.pendingSecretCiphertext, null);
    assert.equal(await db.mfaRecoveryCode.count({ where: { userId, usedAt: null } }), 10);
    const activeSession = await db.session.findUnique({
      where: { tokenHash: createHash("sha256").update(ownerCookie.split("=")[1]).digest("hex") }
    });
    assert.equal(activeSession?.assurance, "MFA");
    assert.ok(activeSession?.mfaAuthenticatedAt);
    const revokedPreEnrollmentSession = await db.session.findUnique({ where: { id: preEnrollmentSession.id } });
    assert.ok(revokedPreEnrollmentSession?.revokedAt, "MFA enrollment must revoke prior password-only sessions");

    // Reusing the exact TOTP time-step accepted during enrollment must fail.
    await logout(ownerCookie);
    const replayLogin = await login();
    assert.equal(replayLogin.status, 202);
    const replayChallenge = await replayLogin.json();
    assert.equal(replayChallenge.enrollmentRequired, false);
    const replayResponse = await verify(replayChallenge.challengeToken, enrollmentCode);
    assert.equal(replayResponse.status, 401);
    const currentSteps = new Set([-1, 0, 1].map(offset => totpAt(setup.secret, Date.now() + offset * 30_000)));
    const wrongCode = Array.from({ length: 10 }, (_, index) => String(index).repeat(6))
      .find(candidate => !currentSteps.has(candidate)) ?? "987654";
    for (let attempt = 0; attempt < 4; attempt += 1) {
      assert.equal((await verify(replayChallenge.challengeToken, wrongCode)).status, 401);
    }
    assert.equal((await verify(replayChallenge.challengeToken, wrongCode)).status, 401);
    const exhaustedChallenge = await db.authChallenge.findUnique({
      where: { challengeHash: createHash("sha256").update(replayChallenge.challengeToken).digest("hex") }
    });
    assert.equal(exhaustedChallenge?.attempts, 5, "challenge must stop accepting attempts after five tries");

    // New MFA login must not revoke an unrelated already-active MFA session.
    const otherDeviceToken = randomBytes(32).toString("hex");
    const otherDeviceSession = await db.session.create({
      data: {
        userId,
        tokenHash: createHash("sha256").update(otherDeviceToken).digest("hex"),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        assurance: "MFA",
        mfaAuthenticatedAt: new Date()
      }
    });

    // A recovery code succeeds once and issues an MFA-assured session.
    const recoveryLogin = await login();
    assert.equal(recoveryLogin.status, 202);
    const recoveryChallenge = await recoveryLogin.json();
    const recoveryResponse = await verify(recoveryChallenge.challengeToken, recoveryCode);
    assert.equal(recoveryResponse.status, 200);
    const retainedOtherDeviceSession = await db.session.findUnique({ where: { id: otherDeviceSession.id } });
    assert.equal(retainedOtherDeviceSession?.revokedAt, null, "MFA login must preserve other active devices");
    const recoveryCookie = (recoveryResponse.headers.get("set-cookie") ?? "").split(";")[0];
    assert.match(recoveryCookie, /^vayro_session=[a-f0-9]{64}$/);
    assert.equal(await db.mfaRecoveryCode.count({
      where: { userId, codeHash: createHash("sha256").update(recoveryCode).digest("hex"), usedAt: { not: null } }
    }), 1);

    // The same recovery code cannot authenticate a second challenge.
    await logout(recoveryCookie);
    const reuseLogin = await login();
    assert.equal(reuseLogin.status, 202);
    const reuseChallenge = await reuseLogin.json();
    const reused = await verify(reuseChallenge.challengeToken, recoveryCode);
    assert.equal(reused.status, 401);

    // A fresh MFA session plus a second unused factor is required to disable MFA.
    const disableLogin = await login();
    assert.equal(disableLogin.status, 202);
    const disableChallenge = await disableLogin.json();
    const secondRecovery = confirmationBody.recoveryCodes[1];
    const disableSessionResponse = await verify(disableChallenge.challengeToken, secondRecovery);
    assert.equal(disableSessionResponse.status, 200);
    const disableCookie = (disableSessionResponse.headers.get("set-cookie") ?? "").split(";")[0];
    const rotateResponse = await fetch(`${origin}/api/auth/mfa/recovery-codes`, {
      method: "POST",
      headers: { ...requestHeaders, Cookie: disableCookie },
      body: JSON.stringify({ code: confirmationBody.recoveryCodes[3] })
    });
    assert.equal(rotateResponse.status, 200);
    const rotatedCodes = await rotateResponse.json();
    assert.equal(rotatedCodes.recoveryCodes.length, 10);
    assert.equal(await db.mfaRecoveryCode.count({ where: { userId, usedAt: null } }), 10);
    assert.equal(await db.mfaRecoveryCode.count({
      where: { userId, codeHash: createHash("sha256").update(confirmationBody.recoveryCodes[4]).digest("hex") }
    }), 0);

    const disableResponse = await fetch(`${origin}/api/auth/mfa/disable`, {
      method: "POST",
      headers: { ...requestHeaders, Cookie: disableCookie },
      body: JSON.stringify({ code: rotatedCodes.recoveryCodes[0] })
    });
    assert.equal(disableResponse.status, 200);
    assert.deepEqual(await disableResponse.json(), { mfaEnabled: false, authenticated: false });
    const disabledMfa = await db.userMfa.findUnique({ where: { userId } });
    assert.equal(disabledMfa?.enabledAt, null);
    assert.equal(disabledMfa?.secretCiphertext, null);
    assert.equal(await db.mfaRecoveryCode.count({ where: { userId } }), 0);
    const disabledSession = await db.session.findUnique({
      where: { tokenHash: createHash("sha256").update(disableCookie.split("=")[1]).digest("hex") }
    });
    assert.ok(disabledSession?.revokedAt);

    // Ordinary non-privileged users retain the password-only login path.
    const normalEmail = `mfa-normal-${suffix}@example.invalid`;
    const normalUser = await db.user.create({
      data: {
        email: normalEmail, passwordHash: await hashPassword(password),
        displayName: "Non-Privileged Integration User", emailVerifiedAt: new Date()
      }
    });
    normalUserId = normalUser.id;
    const normalResponse = await fetch(`${origin}/api/auth/login`, {
      method: "POST", headers: requestHeaders,
      body: JSON.stringify({ email: normalEmail, password })
    });
    assert.equal(normalResponse.status, 200);
    assert.equal((await normalResponse.json()).authenticated, true);
    const normalCookie = (normalResponse.headers.get("set-cookie") ?? "").split(";")[0];
    const normalSession = await db.session.findUnique({
      where: { tokenHash: createHash("sha256").update(normalCookie.split("=")[1]).digest("hex") }
    });
    assert.equal(normalSession?.assurance, "PASSWORD");
  } finally {
    if (normalUserId) {
      await db.session.deleteMany({ where: { userId: normalUserId } });
      await db.auditEvent.deleteMany({ where: { actorUserId: normalUserId } });
      await db.user.deleteMany({ where: { id: normalUserId } });
    }
    if (userId) {
      await db.mfaRecoveryCode.deleteMany({ where: { userId } });
      await db.authChallenge.deleteMany({ where: { userId } });
      await db.userMfa.deleteMany({ where: { userId } });
      await db.session.deleteMany({ where: { userId } });
      await db.auditEvent.deleteMany({ where: { actorUserId: userId } });
      await db.user.deleteMany({ where: { id: userId } });
    }
    await db.$disconnect();
  }
});

test("login returns the same denial for unknown, disabled, unverified and wrong-password accounts", async () => {
  const db = new PrismaClient();
  const suffix = randomUUID();
  const password = "CorrectHorseBatteryStaple!";
  const passwordHash = await hashPassword(password);
  const attemptedPassword = "DifferentHorseBatteryStaple!";
  const accounts = [];
  const cases = [
    { email: `login-unverified-${suffix}@example.invalid`, emailVerifiedAt: null, disabledAt: null, passwordHash },
    { email: `login-disabled-${suffix}@example.invalid`, emailVerifiedAt: new Date(), disabledAt: new Date(), passwordHash },
    { email: `login-wrong-password-${suffix}@example.invalid`, emailVerifiedAt: new Date(), disabledAt: null, passwordHash }
  ];

  try {
    await db.$connect();
    for (const account of cases) {
      const created = await db.user.create({
        data: {
          email: account.email,
          passwordHash: account.passwordHash,
          displayName: "Login denial parity test",
          emailVerifiedAt: account.emailVerifiedAt,
          disabledAt: account.disabledAt
        }
      });
      accounts.push(created.id);
    }

    const login = async (email, secret) => {
      const response = await fetch(`${origin}/api/auth/login`, {
        method: "POST",
        headers: {
          Origin: "http://localhost:" + port,
          Host: "localhost:" + port,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password: secret })
      });
      return {
        status: response.status,
        body: await response.json(),
        setCookie: response.headers.get("set-cookie")
      };
    };

    const outcomes = await Promise.all([
      login(`login-unknown-${suffix}@example.invalid`, attemptedPassword),
      login(cases[0].email, password),
      login(cases[1].email, password),
      login(cases[2].email, attemptedPassword)
    ]);

    for (const outcome of outcomes) {
      assert.equal(outcome.status, 401);
      assert.deepEqual(outcome.body, { error: "invalid_credentials" });
      assert.equal(outcome.setCookie, null, "denied login must not issue a session cookie");
    }
    assert.equal(await db.session.count({ where: { userId: { in: accounts } } }), 0);
  } finally {
    if (accounts.length) {
      await db.auditEvent.deleteMany({ where: { actorUserId: { in: accounts } } });
      await db.session.deleteMany({ where: { userId: { in: accounts } } });
      await db.user.deleteMany({ where: { id: { in: accounts } } });
    }
    await db.$disconnect();
  }
});


test("AI capability catalogue is public, read-only and validates its filters", async () => {
  const response = await fetch(`${origin}/api/ai-business-suite/capabilities`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(Array.isArray(body.products));
  assert.ok(Array.isArray(body.engines));
  assert.ok(Array.isArray(body.capabilities));
  assert.match(response.headers.get("cache-control") ?? "", /public/);

  const invalidProduct = await fetch(`${origin}/api/ai-business-suite/capabilities?product=NOT_A_PRODUCT`);
  assert.equal(invalidProduct.status, 400);
  assert.deepEqual(await invalidProduct.json(), { error: "invalid_product" });
});

test("DANA prompt studio and NEGAH creative brief reject cross-origin and unauthenticated requests", async () => {
  const routes = [
    ["/api/dana/prompt-studio", { business: "retail", goal: "plan", audience: "customers", tone: "clear", outputFormat: "steps" }],
    ["/api/negah/creative-brief", { project: "campaign", format: "instagram-post", audience: "customers", message: "launch", style: "minimal" }]
  ];

  for (const [route, payload] of routes) {
    const crossOrigin = await fetch(`${origin}${route}`, {
      method: "POST",
      headers: { Origin: "https://attacker.invalid", "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    assert.equal(crossOrigin.status, 403, `${route} must reject cross-origin requests`);

    const unauthenticated = await fetch(`${origin}${route}`, {
      method: "POST",
      headers: { Origin: `http://localhost:${port}`, Host: `localhost:${port}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    assert.equal(unauthenticated.status, 401, `${route} must require an active session`);
  }
});

test("password change rejects cross-origin and unauthenticated requests", async () => {
  const payload = { currentPassword: "old-password-for-test", newPassword: "new-password-for-test-123" };
  const crossOrigin = await fetch(`${origin}/api/auth/change-password`, {
    method: "POST",
    headers: { Origin: "https://attacker.invalid", "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  assert.equal(crossOrigin.status, 403);

  const unauthenticated = await fetch(`${origin}/api/auth/change-password`, {
    method: "POST",
    headers: { Origin: `http://localhost:${port}`, Host: `localhost:${port}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  assert.equal(unauthenticated.status, 401);
});
