import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const port = 43184;
const origin = `http://localhost:${port}`;
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
    if (server.exitCode !== null) throw new Error(`Next.js server exited: ${serverError}`);
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch {}
    await delay(500);
  }
  server.kill("SIGTERM");
  throw new Error(`Next.js server did not become ready: ${serverError}`);
});

after(async () => {
  if (server && server.exitCode === null) server.kill("SIGTERM");
  await db.$disconnect();
});

test("DANA and NEGAH template endpoints enforce tenant roles and NEGAH license boundaries", async () => {
  const suffix = randomUUID();
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const user = await db.user.create({
    data: {
      email: `ai-template-${suffix}@example.invalid`,
      passwordHash: "integration-only-hash",
      displayName: "AI Template Integration",
      emailVerifiedAt: new Date()
    }
  });
  const tenant = await db.tenant.create({
    data: { name: "AI Template Tenant", slug: `ai-template-${suffix}` }
  });
  const foreignTenant = await db.tenant.create({
    data: { name: "Foreign AI Tenant", slug: `foreign-ai-${suffix}` }
  });
  await db.membership.create({
    data: { userId: user.id, tenantId: tenant.id, role: "MEMBER" }
  });
  await db.session.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      lastSeenAt: new Date(),
      assurance: "PASSWORD"
    }
  });

  let product = await db.product.findUnique({ where: { key: "NEGAH" } });
  let createdProduct = false;
  const originalProductStatus = product?.status;
  let licenseId;
  const headers = {
    Cookie: `vayro_session=${token}`,
    Origin: origin,
    Host: `localhost:${port}`,
    "Content-Type": "application/json"
  };
  const danaPayload = {
    tenantId: tenant.id,
    business: "فروشگاه آنلاین",
    goal: "افزایش درخواست مشتری",
    audience: "مشتریان محلی",
    tone: "حرفه‌ای",
    context: "",
    constraints: "",
    outputFormat: "طرح اجرایی"
  };
  const negahPayload = {
    tenantId: tenant.id,
    project: "معرفی محصول",
    format: "instagram-post",
    audience: "مشتریان فروشگاه",
    message: "معرفی خدمات",
    style: "مدرن",
    brandColors: "",
    requiredElements: "",
    avoid: ""
  };
  const rateKeys = [
    createHash("sha256").update("ai:dana-prompt-studio:" + user.id).digest("hex"),
    createHash("sha256").update("ai:negah-creative-brief:" + user.id).digest("hex"),
    createHash("sha256").update("ai:dana:" + user.id).digest("hex"),
    createHash("sha256").update("ai:negah:" + user.id).digest("hex")
  ];

  try {
    const danaAllowed = await fetch(`${origin}/api/dana/prompt-studio`, {
      method: "POST", headers, body: JSON.stringify(danaPayload)
    });
    assert.equal(danaAllowed.status, 200, "active MEMBER can use DANA template in its own tenant");
    const danaBody = await danaAllowed.json();
    assert.equal(danaBody.aiProviderUsed, false);
    assert.equal(danaBody.persisted, false);

    const crossTenant = await fetch(`${origin}/api/dana/prompt-studio`, {
      method: "POST", headers, body: JSON.stringify({ ...danaPayload, tenantId: foreignTenant.id })
    });
    assert.equal(crossTenant.status, 403, "a member cannot use DANA against a tenant without membership");

    await db.membership.update({
      where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
      data: { role: "VIEWER" }
    });
    const viewerDenied = await fetch(`${origin}/api/dana/prompt-studio`, {
      method: "POST", headers, body: JSON.stringify(danaPayload)
    });
    assert.equal(viewerDenied.status, 403, "VIEWER cannot invoke AI generation templates");

    await db.membership.update({
      where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
      data: { role: "MEMBER" }
    });
    const unlicensedNegahGeneration = await fetch(`${origin}/api/negah/generate`, {
      method: "POST", headers, body: JSON.stringify({ tenantId: tenant.id, prompt: "Create a clean product image" })
    });
    assert.equal(unlicensedNegahGeneration.status, 403, "NEGAH image generation requires a valid product license");
    assert.equal((await unlicensedNegahGeneration.json()).error, "negah_license_required");

    const unlicensedNegah = await fetch(`${origin}/api/negah/creative-brief`, {
      method: "POST", headers, body: JSON.stringify(negahPayload)
    });
    assert.equal(unlicensedNegah.status, 403, "NEGAH brief requires an active tenant product license");

    if (!product) {
      product = await db.product.create({
        data: {
          key: "NEGAH",
          name: "NEGAH",
          description: "Integration test product",
          status: "ACTIVE"
        }
      });
      createdProduct = true;
    } else if (product.status !== "ACTIVE") {
      product = await db.product.update({
        where: { id: product.id },
        data: { status: "ACTIVE" }
      });
    }
    const license = await db.license.create({
      data: {
        tenantId: tenant.id,
        productId: product.id,
        startsAt: new Date(Date.now() - 60_000),
        endsAt: new Date(Date.now() + 60 * 60 * 1000),
        active: true
      }
    });
    licenseId = license.id;

    const licensedNegah = await fetch(`${origin}/api/negah/creative-brief`, {
      method: "POST", headers, body: JSON.stringify(negahPayload)
    });
    assert.equal(licensedNegah.status, 200, "licensed MEMBER can create a NEGAH creative brief");
    const negahBody = await licensedNegah.json();
    assert.equal(negahBody.imageProviderUsed, false);
    assert.equal(negahBody.assetRendered, false);
    assert.equal(negahBody.persisted, false);

    const danaGenerationBefore = await db.aiGeneration.count({ where: { tenantId: tenant.id, kind: "DANA_TEXT" } });
    const danaGeneration = await fetch(`${origin}/api/dana/generate`, {
      method: "POST", headers, body: JSON.stringify({ tenantId: tenant.id, prompt: "Create a business plan" })
    });
    assert.equal(danaGeneration.status, 503, "DANA provider execution must remain blocked until usage billing is implemented");
    assert.equal((await danaGeneration.json()).error, "billing_not_configured");
    assert.equal(await db.aiGeneration.count({ where: { tenantId: tenant.id, kind: "DANA_TEXT" } }), danaGenerationBefore,
      "blocked DANA execution must not call or persist a provider result");

    const negahGenerationBefore = await db.aiGeneration.count({ where: { tenantId: tenant.id, kind: "NEGAH_IMAGE" } });
    const negahGeneration = await fetch(`${origin}/api/negah/generate`, {
      method: "POST", headers, body: JSON.stringify({ tenantId: tenant.id, prompt: "Create a clean product image" })
    });
    assert.equal(negahGeneration.status, 503, "NEGAH provider execution must remain blocked until usage billing is implemented");
    assert.equal((await negahGeneration.json()).error, "billing_not_configured");
    assert.equal(await db.aiGeneration.count({ where: { tenantId: tenant.id, kind: "NEGAH_IMAGE" } }), negahGenerationBefore,
      "blocked NEGAH execution must not call or persist a provider result");

    const crossOrigin = await fetch(`${origin}/api/negah/creative-brief`, {
      method: "POST",
      headers: { ...headers, Origin: "https://attacker.invalid" },
      body: JSON.stringify(negahPayload)
    });
    assert.equal(crossOrigin.status, 403);
  } finally {
    if (licenseId) await db.license.deleteMany({ where: { id: licenseId } });
    if (product && !createdProduct && originalProductStatus && product.status !== originalProductStatus) {
      await db.product.update({ where: { id: product.id }, data: { status: originalProductStatus } });
    }
    if (createdProduct && product) await db.product.deleteMany({ where: { id: product.id } });
    await db.authRateLimit.deleteMany({ where: { keyHash: { in: rateKeys } } });
    await db.session.deleteMany({ where: { userId: user.id } });
    await db.membership.deleteMany({ where: { tenantId: { in: [tenant.id, foreignTenant.id] } } });
    await db.tenant.deleteMany({ where: { id: { in: [tenant.id, foreignTenant.id] } } });
    await db.user.delete({ where: { id: user.id } });
  }
});
