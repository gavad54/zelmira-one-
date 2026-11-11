import { cookies } from "next/headers";
import { z } from "zod";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { allowAttempt, noStoreJson, sha256 } from "@/lib/auth-service";
import { withPlatformOwnerTransaction } from "@/lib/platform-request-transaction";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  tenantId: z.string().min(1).max(128),
  productId: z.string().min(1).max(128),
  startsAt: z.string().datetime({ offset: true }).optional(),
  endsAt: z.string().datetime({ offset: true }).nullable().optional()
}).strict();
const updateSchema = z.object({
  licenseId: z.string().min(1).max(128),
  active: z.boolean(),
  endsAt: z.string().datetime({ offset: true }).nullable().optional()
}).strict();

async function sessionToken() { return (await cookies()).get("vayro_session")?.value; }

export async function GET() {
  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      callback: async tx => {
        const [licenses, tenants, products] = await Promise.all([
          tx.license.findMany({
            orderBy: { createdAt: "desc" },
            take: 500,
            select: {
              id: true, tenantId: true, productId: true, startsAt: true, endsAt: true, active: true, createdAt: true,
              tenant: { select: { name: true, slug: true, status: true } },
              product: { select: { key: true, name: true, status: true } }
            }
          }),
          tx.tenant.findMany({
            where: { status: "ACTIVE" }, orderBy: { name: "asc" },
            select: { id: true, name: true, slug: true }
          }),
          tx.product.findMany({
            where: { status: "ACTIVE", key: { not: "DANA" } }, orderBy: { name: "asc" },
            select: { id: true, key: true, name: true }
          })
        ]);
        return { licenses, tenants, products };
      }
    });
    if (!result.authorized) return noStoreJson({ error: "unauthorized" }, 401);
    return noStoreJson(result.value);
  } catch {
    return noStoreJson({ error: "license_list_unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);
  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      callback: async (tx, actor) => {
        if (!await allowAttempt(sha256("owner-license-create:" + actor.userId), 30, 60 * 60 * 1000)) {
          return { kind: "rate_limited" as const };
        }
        const [tenant, product] = await Promise.all([
          tx.tenant.findUnique({ where: { id: parsed.data.tenantId }, select: { id: true, status: true } }),
          tx.product.findUnique({ where: { id: parsed.data.productId }, select: { id: true, key: true, status: true } })
        ]);
        if (!tenant) return { kind: "tenant_not_found" as const };
        if (tenant.status !== "ACTIVE") return { kind: "tenant_unavailable" as const };
        if (!product) return { kind: "product_not_found" as const };
        if (product.status !== "ACTIVE") return { kind: "product_not_sellable" as const };
        const startsAt = parsed.data.startsAt ? new Date(parsed.data.startsAt) : new Date();
        const endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : null;
        if (endsAt && endsAt.getTime() <= startsAt.getTime()) return { kind: "invalid_date_range" as const };
        const license = await tx.license.create({
          data: { tenantId: tenant.id, productId: product.id, startsAt, endsAt, active: true },
          select: { id: true, tenantId: true, productId: true, startsAt: true, endsAt: true, active: true, createdAt: true }
        });
        await tx.auditEvent.create({
          data: {
            actorUserId: actor.userId,
            tenantId: tenant.id,
            action: "owner.license_issued",
            resource: "License",
            resourceId: license.id,
            metadata: { productKey: product.key, startsAt, endsAt }
          },
          select: { id: true }
        });
        return { kind: "created" as const, license };
      }
    });
    if (!result.authorized) return noStoreJson({ error: "unauthorized" }, 401);
    switch (result.value.kind) {
      case "rate_limited": return noStoreJson({ error: "rate_limited" }, 429);
      case "tenant_not_found": return noStoreJson({ error: "tenant_not_found" }, 404);
      case "tenant_unavailable": return noStoreJson({ error: "tenant_unavailable" }, 409);
      case "product_not_found": return noStoreJson({ error: "product_not_found" }, 404);
      case "product_not_sellable": return noStoreJson({ error: "product_not_sellable" }, 409);
      case "invalid_date_range": return noStoreJson({ error: "invalid_date_range" }, 400);
      case "created": return noStoreJson({ license: result.value.license }, 201);
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return noStoreJson({ error: "license_already_exists" }, 409);
    }
    return noStoreJson({ error: "license_create_failed" }, 503);
  }
}

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);
  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      callback: async (tx, actor) => {
        if (!await allowAttempt(sha256("owner-license-update:" + actor.userId), 60, 60 * 60 * 1000)) {
          return { kind: "rate_limited" as const };
        }
        const existing = await tx.license.findUnique({
          where: { id: parsed.data.licenseId },
          select: { id: true, tenantId: true, productId: true, startsAt: true, endsAt: true, active: true }
        });
        if (!existing) return { kind: "not_found" as const };
        const endsAt = parsed.data.endsAt === undefined ? existing.endsAt : parsed.data.endsAt ? new Date(parsed.data.endsAt) : null;
        if (endsAt && endsAt.getTime() <= existing.startsAt.getTime()) return { kind: "invalid_date_range" as const };
        const updated = await tx.license.update({
          where: { id: existing.id },
          data: { active: parsed.data.active, ...(parsed.data.endsAt === undefined ? {} : { endsAt }) },
          select: { id: true, tenantId: true, productId: true, startsAt: true, endsAt: true, active: true }
        });
        await tx.auditEvent.create({
          data: {
            actorUserId: actor.userId,
            tenantId: existing.tenantId,
            action: parsed.data.active ? "owner.license_reactivated" : "owner.license_revoked",
            resource: "License",
            resourceId: existing.id,
            metadata: { endsAt }
          },
          select: { id: true }
        });
        return { kind: "updated" as const, license: updated };
      }
    });
    if (!result.authorized) return noStoreJson({ error: "unauthorized" }, 401);
    if (result.value.kind === "rate_limited") return noStoreJson({ error: "rate_limited" }, 429);
    if (result.value.kind === "not_found") return noStoreJson({ error: "license_not_found" }, 404);
    if (result.value.kind === "invalid_date_range") return noStoreJson({ error: "invalid_date_range" }, 400);
    return noStoreJson({ license: result.value.license });
  } catch {
    return noStoreJson({ error: "license_update_failed" }, 503);
  }
}
