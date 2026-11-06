import test, { before, after } from "node:test";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PrismaClient, PlatformRole, EmailPurpose } from "@prisma/client";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const port = 43180;
const origin = `http://127.0.0.1:${port}`;
const requestOrigin = `http://localhost:${port}`;
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

test("owner email contact APIs enforce owner authorization, same-origin writes, audit and atomic verification throttling", async () => {
  const db = new PrismaClient();
  const suffix = randomUUID();
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const userLimitHash = createHash("sha256").update("owner-email-verify-user:" + "OWNER_ID_PLACEHOLDER").digest("hex");
  let userId;
  let contactId;
  let userLimitKey;
  let contactLimitKey;

  try {
    await db.$connect();
    const anonymous = await fetch(`${origin}/api/owner/email-contacts`);
    assert.equal(anonymous.status, 401);

    const user = await db.user.create({
      data: {
        email: `owner-email-${suffix}@example.invalid`,
        passwordHash: "integration-test-only-hash",
        displayName: "Owner Email Test",
        platformRole: PlatformRole.OWNER,
        emailVerifiedAt: new Date()
      }
    });
    userId = user.id;
    userLimitKey = createHash("sha256").update("owner-email-verify-user:" + userId).digest("hex");

    await db.session.create({
      data: { userId, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) }
    });
    const cookie = `vayro_session=${token}`;

    const crossOrigin = await fetch(`${origin}/api/owner/email-contacts`, {
      method: "POST",
      headers: {
        Origin: "https://attacker.invalid",
        Host: `localhost:${port}`,
        Cookie: cookie,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: `blocked-${suffix}@example.invalid`, label: "Blocked", purposes: ["SUPPORT"] })
    });
    assert.equal(crossOrigin.status, 403);

    const created = await fetch(`${origin}/api/owner/email-contacts`, {
      method: "POST",
      headers: {
        Origin: requestOrigin,
        Host: `localhost:${port}`,
        Cookie: cookie,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: `support-${suffix}@example.invalid`, label: "Support inbox", purposes: [EmailPurpose.SUPPORT] })
    });
    assert.equal(created.status, 201);
    const createdBody = await created.json();
    contactId = createdBody.contact.id;
    assert.equal(createdBody.verification, "required");

    const audit = await db.auditEvent.findFirst({
      where: { actorUserId: userId, action: "email_contact.created", resourceId: contactId }
    });
    assert.ok(audit, "contact creation must be audited");

    const list = await fetch(`${origin}/api/owner/email-contacts`, {
      headers: { Cookie: cookie }
    });
    assert.equal(list.status, 200);
    assert.ok((await list.json()).contacts.some(contact => contact.id === contactId));

    const contactLimitHash = createHash("sha256").update("owner-email-verify-contact:" + userId + ":" + contactId).digest("hex");
    const verify = () => fetch(`${origin}/api/owner/email-contacts/${contactId}/verify`, {
      method: "POST",
      headers: {
        Origin: requestOrigin,
        Host: `localhost:${port}`,
        Cookie: cookie
      }
    });

    const firstVerify = await verify();
    assert.equal(firstVerify.status, 503, "delivery must fail closed when no email provider is configured");
    assert.equal(await db.emailContactVerificationToken.count({ where: { contactId } }), 0, "failed delivery must remove the unused token");

    const secondVerify = await verify();
    assert.equal(secondVerify.status, 429, "the atomic contact throttle must reject a repeated request");

    const updated = await fetch(`${origin}/api/owner/email-contacts/${contactId}`, {
      method: "PATCH",
      headers: {
        Origin: requestOrigin,
        Host: `localhost:${port}`,
        Cookie: cookie,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ label: "Support mailbox" })
    });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).contact.label, "Support mailbox");

    const deleted = await fetch(`${origin}/api/owner/email-contacts/${contactId}`, {
      method: "DELETE",
      headers: {
        Origin: requestOrigin,
        Host: `localhost:${port}`,
        Cookie: cookie
      }
    });
    assert.equal(deleted.status, 200);
    assert.deepEqual(await deleted.json(), { deleted: true });
  } finally {
    if (contactId) await db.emailContactVerificationToken.deleteMany({ where: { contactId } });
    if (contactId) await db.emailContact.deleteMany({ where: { id: contactId } });
    if (userId) {
      await db.auditEvent.deleteMany({ where: { actorUserId: userId } });
      await db.session.deleteMany({ where: { userId } });
      await db.user.deleteMany({ where: { id: userId } });
      await db.authRateLimit.deleteMany({ where: { keyHash: { in: [
        createHash("sha256").update("owner-email-verify-user:" + userId).digest("hex"),
        ...(contactId ? [createHash("sha256").update("owner-email-verify-contact:" + userId + ":" + contactId).digest("hex")] : [])
      ] } } });
    }
    await db.$disconnect();
  }
});
