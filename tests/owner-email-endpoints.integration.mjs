import test, { before, after } from "node:test";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PrismaClient, PlatformRole, EmailPurpose } from "@prisma/client";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const port = 43180;
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

test("owner email APIs enforce authorization, same-origin writes, audit, throttling and concurrent owner-contact protection", async () => {
  const db = new PrismaClient();
  const suffix = randomUUID();
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  let userId;
  let contactId;
  const ownerContactIds = [];
  const createdContactIds = [];

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

    await db.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        assurance: "MFA",
        mfaAuthenticatedAt: new Date()
      }
    });
    const cookie = `vayro_session=${token}`;
    const writeHeaders = {
      Origin: origin,
      Host: `localhost:${port}`,
      Cookie: cookie,
      "Content-Type": "application/json"
    };

    const crossOrigin = await fetch(`${origin}/api/owner/email-contacts`, {
      method: "POST",
      headers: { ...writeHeaders, Origin: "https://attacker.invalid" },
      body: JSON.stringify({ email: `blocked-${suffix}@example.invalid`, label: "Blocked", purposes: ["SUPPORT"] })
    });
    assert.equal(crossOrigin.status, 403);

    const created = await fetch(`${origin}/api/owner/email-contacts`, {
      method: "POST",
      headers: writeHeaders,
      body: JSON.stringify({ email: `support-${suffix}@example.invalid`, label: "Support inbox", purposes: [EmailPurpose.SUPPORT] })
    });
    assert.equal(created.status, 201);
    const createdBody = await created.json();
    contactId = createdBody.contact.id;
    createdContactIds.push(contactId);
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

    const createLimitKey = createHash("sha256").update("owner-email-contact-create:" + userId).digest("hex");
    for (let attempt = 0; attempt < 9; attempt += 1) {
      const repeatedCreate = await fetch(origin + "/api/owner/email-contacts", {
        method: "POST",
        headers: writeHeaders,
        body: JSON.stringify({
          email: "support-" + attempt + "-" + suffix + "@example.invalid",
          label: "Support inbox " + attempt,
          purposes: [EmailPurpose.SUPPORT]
        })
      });
      assert.equal(repeatedCreate.status, 201, "the first ten owner email-contact creations should be allowed");
      createdContactIds.push((await repeatedCreate.json()).contact.id);
    }
    const throttledCreate = await fetch(origin + "/api/owner/email-contacts", {
      method: "POST",
      headers: writeHeaders,
      body: JSON.stringify({
        email: "support-blocked-" + suffix + "@example.invalid",
        label: "Blocked support inbox",
        purposes: [EmailPurpose.SUPPORT]
      })
    });
    assert.equal(throttledCreate.status, 429, "the eleventh owner email-contact creation must be rate limited");
    assert.equal((await db.authRateLimit.findUnique({ where: { keyHash: createLimitKey } }))?.count, 11,
      "the owner creation throttle must count attempts atomically");

    const userLimitKey = createHash("sha256").update("owner-email-verify-user:" + userId).digest("hex");
    const contactLimitKey = createHash("sha256").update("owner-email-verify-contact:" + userId + ":" + contactId).digest("hex");
    const verify = () => fetch(`${origin}/api/owner/email-contacts/${contactId}/verify`, {
      method: "POST",
      headers: { Origin: origin, Host: `localhost:${port}`, Cookie: cookie }
    });

    const firstVerify = await verify();
    const firstVerifyBody = await firstVerify.clone().json().catch(() => ({}));
    assert.equal(firstVerify.status, 503, "delivery must fail closed when no email provider is configured");
    assert.equal(await db.emailContactVerificationToken.count({ where: { contactId } }), 0, "failed delivery must remove the unused token");

    const firstContactLimit = await db.authRateLimit.findUnique({ where: { keyHash: contactLimitKey } });
    const firstUserLimit = await db.authRateLimit.findUnique({ where: { keyHash: userLimitKey } });
    const recentRateLimits = await db.authRateLimit.findMany({
      orderBy: { windowStartedAt: "desc" },
      take: 20,
      select: { keyHash: true, count: true, windowStartedAt: true }
    });
    assert.equal(firstContactLimit?.count, 1, `first verification request must persist the contact throttle; body=${JSON.stringify(firstVerifyBody)}; matchingRows=${JSON.stringify([firstContactLimit, firstUserLimit])}; recentRateLimits=${JSON.stringify(recentRateLimits)}`);
    assert.equal(firstUserLimit?.count, 1, "first verification request must persist the owner throttle");

    const secondVerify = await verify();
    const secondBody = await secondVerify.clone().json().catch(() => ({}));
    const secondContactLimit = await db.authRateLimit.findUnique({ where: { keyHash: contactLimitKey } });
    assert.equal(secondVerify.status, 429, `the atomic contact throttle must reject a repeated request; body=${JSON.stringify(secondBody)}; persistedCount=${secondContactLimit?.count ?? "missing"}`);

    const updated = await fetch(`${origin}/api/owner/email-contacts/${contactId}`, {
      method: "PATCH",
      headers: writeHeaders,
      body: JSON.stringify({ label: "Support mailbox" })
    });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).contact.label, "Support mailbox");

    for (let attempt = 0; attempt < 9; attempt += 1) {
      const repeatedUpdate = await fetch(`${origin}/api/owner/email-contacts/${contactId}`, {
        method: "PATCH",
        headers: writeHeaders,
        body: JSON.stringify({ label: "Support mailbox " + attempt })
      });
      assert.equal(repeatedUpdate.status, 200, "the first ten owner contact updates should be allowed");
    }
    const throttledUpdate = await fetch(`${origin}/api/owner/email-contacts/${contactId}`, {
      method: "PATCH",
      headers: writeHeaders,
      body: JSON.stringify({ label: "Support mailbox blocked" })
    });
    assert.equal(throttledUpdate.status, 429, "repeated owner contact updates must be rate limited");

    const deleted = await fetch(`${origin}/api/owner/email-contacts/${contactId}`, {
      method: "DELETE",
      headers: { Origin: origin, Host: `localhost:${port}`, Cookie: cookie }
    });
    assert.equal(deleted.status, 200);
    assert.deepEqual(await deleted.json(), { deleted: true });

    const ownerContactA = await db.emailContact.create({
      data: {
        email: `owner-a-${suffix}@example.invalid`,
        label: "Owner A",
        purposes: [EmailPurpose.OWNER],
        enabled: true,
        verifiedAt: new Date()
      }
    });
    const ownerContactB = await db.emailContact.create({
      data: {
        email: `owner-b-${suffix}@example.invalid`,
        label: "Owner B",
        purposes: [EmailPurpose.OWNER],
        enabled: true,
        verifiedAt: new Date()
      }
    });
    ownerContactIds.push(ownerContactA.id, ownerContactB.id);

    const updateLimitKey = createHash("sha256").update("owner-email-contact-update:" + userId).digest("hex");
    await db.authRateLimit.deleteMany({ where: { keyHash: updateLimitKey } });
    const concurrentDisables = await Promise.all(ownerContactIds.map(id => fetch(`${origin}/api/owner/email-contacts/${id}`, {
      method: "PATCH",
      headers: writeHeaders,
      body: JSON.stringify({ enabled: false })
    })));
    assert.deepEqual(concurrentDisables.map(response => response.status).sort((a, b) => a - b), [200, 409],
      "concurrent disables must not remove every verified OWNER contact");
    let remainingOwnerContacts = await db.emailContact.findMany({
      where: { enabled: true, verifiedAt: { not: null }, purposes: { has: EmailPurpose.OWNER } }
    });
    assert.equal(remainingOwnerContacts.length, 1, "exactly one verified OWNER contact must remain after concurrent disables");

    const blockedLastDisable = await fetch(`${origin}/api/owner/email-contacts/${remainingOwnerContacts[0].id}`, {
      method: "PATCH",
      headers: writeHeaders,
      body: JSON.stringify({ enabled: false })
    });
    assert.equal(blockedLastDisable.status, 409, "the final verified OWNER contact cannot be disabled");

    const ownerContactC = await db.emailContact.create({
      data: {
        email: `owner-c-${suffix}@example.invalid`,
        label: "Owner C",
        purposes: [EmailPurpose.OWNER],
        enabled: true,
        verifiedAt: new Date()
      }
    });
    ownerContactIds.push(ownerContactC.id);
    const concurrentDeletes = await Promise.all([remainingOwnerContacts[0].id, ownerContactC.id].map(id =>
      fetch(`${origin}/api/owner/email-contacts/${id}`, {
        method: "DELETE",
        headers: { Origin: origin, Host: `localhost:${port}`, Cookie: cookie }
      })
    ));
    assert.deepEqual(concurrentDeletes.map(response => response.status).sort((a, b) => a - b), [200, 409],
      "concurrent deletes must not remove every verified OWNER contact");
    remainingOwnerContacts = await db.emailContact.findMany({
      where: { enabled: true, verifiedAt: { not: null }, purposes: { has: EmailPurpose.OWNER } }
    });
    assert.equal(remainingOwnerContacts.length, 1, "exactly one verified OWNER contact must remain after concurrent deletes");

    const blockedLastDelete = await fetch(`${origin}/api/owner/email-contacts/${remainingOwnerContacts[0].id}`, {
      method: "DELETE",
      headers: { Origin: origin, Host: `localhost:${port}`, Cookie: cookie }
    });
    assert.equal(blockedLastDelete.status, 409, "the final verified OWNER contact cannot be deleted");
  } finally {
    if (contactId) await db.emailContactVerificationToken.deleteMany({ where: { contactId } });
    await db.emailContact.deleteMany({ where: { id: { in: [...createdContactIds, ...ownerContactIds].filter(Boolean) } } });
    if (userId) {
      await db.auditEvent.deleteMany({ where: { actorUserId: userId } });
      await db.session.deleteMany({ where: { userId } });
      await db.user.deleteMany({ where: { id: userId } });
      await db.authRateLimit.deleteMany({ where: { keyHash: { in: [
        createHash("sha256").update("owner-email-verify-user:" + userId).digest("hex"),
        ...(contactId ? [createHash("sha256").update("owner-email-verify-contact:" + userId + ":" + contactId).digest("hex")] : []),
        createHash("sha256").update("owner-email-contact-create:" + userId).digest("hex"),
        createHash("sha256").update("owner-email-contact-update:" + userId).digest("hex"),
        createHash("sha256").update("owner-email-contact-delete:" + userId).digest("hex")
      ] } } });
    }
    await db.$disconnect();
  }
});
