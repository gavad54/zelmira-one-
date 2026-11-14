import { cookies } from "next/headers";
import { z } from "zod";
import { ProductStatus } from "@prisma/client";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { authorizeOwnerSession } from "@/lib/owner-session.mjs";
import { PRODUCT_CATALOG, validateProductConfiguration } from "@/lib/product-catalog.mjs";
import { allowAttempt, noStoreJson, sha256 } from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";
import { currentActiveLicenseWhere } from "@/lib/owner-metrics.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authorizedOwnerId() {
  const token = (await cookies()).get("vayro_session")?.value;
  const result = await authorizeOwnerSession({ sessionToken: token, db: prisma });
  return result.authorized ? result.userId : null;
}

const updateSchema = z.object({
  productId: z.string().min(1).max(100),
  status: z.enum(Object.values(ProductStatus) as [string, ...string[]]),
  baseUrl: z.union([
    z.string().url().max(2048).refine(value => {
      try { return new URL(value).protocol === "https:" && !new URL(value).username && !new URL(value).password; }
      catch { return false; }
    }),
    z.null()
  ]).optional()
}).strict();

export async function GET() {
  const actorId = await authorizedOwnerId();
  if (!actorId) return noStoreJson({ error: "unauthorized" }, 401);

  try {
    const [products, tenants, activeLicenses, allLicenses] = await Promise.all([
      prisma.product.findMany({
        orderBy: { key: "asc" },
        select: {
          id: true, key: true, name: true, description: true, status: true,
          baseUrl: true, updatedAt: true, _count: { select: { licenses: true } }
        }
      }),
      prisma.tenant.count(),
      prisma.license.count({ where: currentActiveLicenseWhere(new Date()) }),
      prisma.license.count()
    ]);
    return noStoreJson({
      products: products.map(({ _count, ...product }) => ({ ...product, licenseCount: _count.licenses })),
      metrics: { totalProducts: products.length, totalTenants: tenants, activeLicenses, allLicenses }
    });
  } catch {
    return noStoreJson({ error: "dashboard_unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  const actorId = await authorizedOwnerId();
  if (!actorId) return noStoreJson({ error: "unauthorized" }, 401);
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  if (!await allowAttempt(sha256("owner-products-initialize:" + actorId), 20, 60 * 60 * 1000)) {
    return noStoreJson({ error: "rate_limited" }, 429);
  }

  const body = z.object({ action: z.literal("initialize_catalog") }).strict()
    .safeParse(await request.json().catch(() => null));
  if (!body.success) return noStoreJson({ error: "invalid_input" }, 400);

  try {
    const result = await prisma.$transaction(async tx => {
      for (const product of PRODUCT_CATALOG) {
        await tx.product.upsert({
          where: { key: product.key },
          create: { ...product, status: ProductStatus.PLANNED },
          update: {}
        });
      }
      await tx.auditEvent.create({
        data: {
          actorUserId: actorId,
          action: "owner.product_catalog_initialized",
          resource: "ProductCatalog",
          resourceId: "vayro-core",
          metadata: { productKeys: PRODUCT_CATALOG.map(product => product.key), operation: "idempotent_upsert" }
        }
      });
      return { initialized: PRODUCT_CATALOG.length };
    });
    return noStoreJson(result, 201);
  } catch {
    return noStoreJson({ error: "catalog_initialization_failed" }, 503);
  }
}

export async function PATCH(request: Request) {
  const actorId = await authorizedOwnerId();
  if (!actorId) return noStoreJson({ error: "unauthorized" }, 401);
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  if (!await allowAttempt(sha256("owner-products-update:" + actorId), 20, 60 * 60 * 1000)) {
    return noStoreJson({ error: "rate_limited" }, 429);
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);

  try {
    const result = await prisma.$transaction(async tx => {
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
          actorUserId: actorId,
          action: "owner.product_configuration_updated",
          resource: "Product",
          resourceId: updated.id,
          metadata: {
            productKey: updated.key,
            status: updated.status,
            baseUrlChanged: parsed.data.baseUrl !== undefined
          }
        }
      });
      return updated;
    });

    if (!result) return noStoreJson({ error: "product_not_found" }, 404);
    return noStoreJson({ product: result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (["invalid_status", "invalid_url", "https_url_required", "active_product_requires_url"].includes(code)) {
      return noStoreJson({ error: code }, 400);
    }
    return noStoreJson({ error: "product_update_failed" }, 503);
  }
}
