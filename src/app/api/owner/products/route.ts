import { cookies } from "next/headers";
import { z } from "zod";
import { ProductStatus } from "@prisma/client";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { authorizeOwnerSession } from "@/lib/owner-session.mjs";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
import { withPlatformOwnerTransaction } from "@/lib/platform-request-transaction";
import { allowAttempt, noStoreJson, sha256 } from "@/lib/auth-service";
import { PRODUCT_CATALOG, validateProductConfiguration } from "@/lib/product-catalog.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function sessionToken() {
  return (await cookies()).get("vayro_session")?.value;
}

async function authorizedOwnerId() {
  await assertAuthRuntimeRole();
  const result = await authorizeOwnerSession({
    sessionToken: await sessionToken(),
    db: authPrisma
  });
  return result.authorized ? result.userId : null;
}

function unauthorized() {
  return noStoreJson({ error: "unauthorized" }, 401);
}

const updateSchema = z.object({
  productId: z.string().min(1).max(100),
  status: z.enum(Object.values(ProductStatus) as [string, ...string[]]),
  baseUrl: z.union([
    z.string().url().max(2048).refine(value => {
      try {
        const url = new URL(value);
        return url.protocol === "https:" && !url.username && !url.password;
      } catch {
        return false;
      }
    }),
    z.null()
  ]).optional()
}).strict();

export async function GET() {
  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      callback: async tx => {
        const [products, tenants, activeLicenses, allLicenses] = await Promise.all([
          tx.product.findMany({
            orderBy: { key: "asc" },
            select: {
              id: true, key: true, name: true, description: true, status: true,
              baseUrl: true, updatedAt: true, _count: { select: { licenses: true } }
            }
          }),
          tx.tenant.count(),
          tx.license.count({ where: { active: true, OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] } }),
          tx.license.count()
        ]);
        return {
          products: products.map(({ _count, ...product }) => ({ ...product, licenseCount: _count.licenses })),
          metrics: { totalProducts: products.length, totalTenants: tenants, activeLicenses, allLicenses }
        };
      }
    });
    if (!result.authorized) return unauthorized();
    return noStoreJson(result.value);
  } catch {
    return noStoreJson({ error: "dashboard_unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  const actorId = await authorizedOwnerId();
  if (!actorId) return unauthorized();
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  if (!await allowAttempt(sha256("owner-products-initialize:" + actorId), 20, 60 * 60 * 1000)) {
    return noStoreJson({ error: "rate_limited" }, 429);
  }

  const body = z.object({ action: z.literal("initialize_catalog") }).strict()
    .safeParse(await request.json().catch(() => null));
  if (!body.success) return noStoreJson({ error: "invalid_input" }, 400);

  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      callback: async (tx, actor) => {
        // Insert missing catalogue entries only. Existing statuses/configuration are never overwritten.
        await tx.product.createMany({
          data: PRODUCT_CATALOG.map(product => ({ ...product, status: ProductStatus.PLANNED })),
          skipDuplicates: true
        });
        await tx.auditEvent.create({
          data: {
            actorUserId: actor.userId,
            action: "owner.product_catalog_initialized",
            resource: "ProductCatalog",
            resourceId: "vayro-core",
            metadata: { productKeys: PRODUCT_CATALOG.map(product => product.key), operation: "insert_missing_only" }
          },
          select: { id: true }
        });
        return { initialized: PRODUCT_CATALOG.length };
      }
    });
    if (!result.authorized) return unauthorized();
    return noStoreJson(result.value, 201);
  } catch {
    return noStoreJson({ error: "catalog_initialization_failed" }, 503);
  }
}

export async function PATCH(request: Request) {
  const actorId = await authorizedOwnerId();
  if (!actorId) return unauthorized();
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  if (!await allowAttempt(sha256("owner-products-update:" + actorId), 20, 60 * 60 * 1000)) {
    return noStoreJson({ error: "rate_limited" }, 429);
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);

  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      callback: async (tx, actor) => {
        const existing = await tx.product.findUnique({ where: { id: parsed.data.productId } });
        if (!existing) return null;

        const nextBaseUrl = parsed.data.baseUrl === undefined ? existing.baseUrl : parsed.data.baseUrl;
        const validation = validateProductConfiguration({ status: parsed.data.status, baseUrl: nextBaseUrl });
        if (!validation.valid) throw new Error(validation.error);

        const updated = await tx.product.update({
          where: { id: existing.id },
          data: {
            status: parsed.data.status as ProductStatus,
            ...(parsed.data.baseUrl === undefined ? {} : { baseUrl: parsed.data.baseUrl })
          },
          select: { id: true, key: true, name: true, status: true, baseUrl: true, updatedAt: true }
        });
        await tx.auditEvent.create({
          data: {
            actorUserId: actor.userId,
            action: "owner.product_configuration_updated",
            resource: "Product",
            resourceId: updated.id,
            metadata: {
              productKey: updated.key,
              status: updated.status,
              baseUrlChanged: parsed.data.baseUrl !== undefined
            }
          },
          select: { id: true }
        });
        return updated;
      }
    });
    if (!result.authorized) return unauthorized();
    if (!result.value) return noStoreJson({ error: "product_not_found" }, 404);
    return noStoreJson({ product: result.value });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (["invalid_status", "invalid_url", "https_url_required", "active_product_requires_url"].includes(code)) {
      return noStoreJson({ error: code }, 400);
    }
    return noStoreJson({ error: "product_update_failed" }, 503);
  }
}
