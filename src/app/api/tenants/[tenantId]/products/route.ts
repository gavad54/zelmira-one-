import { cookies } from "next/headers";
import { noStoreJson } from "@/lib/auth-service";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
import { getTenantPrisma } from "@/lib/tenant-prisma";
import { withTenantRequestTransaction } from "@/lib/tenant-request-transaction.mjs";
import { resolveProductAccess } from "@/lib/product-access.mjs";\nimport { PRODUCT_CATALOG } from "@/lib/product-catalog.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ tenantId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  await assertAuthRuntimeRole();
  const { tenantId } = await context.params;
  const sessionToken = (await cookies()).get("vayro_session")?.value;
  try {
    const result = await withTenantRequestTransaction({
      authDb: authPrisma,
      tenantDb: getTenantPrisma(),
      sessionToken,
      tenantId,
      action: "tenant_read",
      callback: async tx => {
        const [products, licenses] = await Promise.all([
          tx.product.findMany({
            where: { key: { in: PRODUCT_CATALOG.map(product => product.key) } },
            orderBy: { key: "asc" },
            select: { id: true, key: true, name: true, description: true, status: true, baseUrl: true }
          }),
          tx.license.findMany({
            where: { tenantId },
            select: { id: true, productId: true, active: true, startsAt: true, endsAt: true }
          })
        ]);
        const byProduct = new Map(licenses.map(license => [license.productId, license]));
        const now = new Date();
        return products.map(product => {
          const license = byProduct.get(product.id);
          const access = resolveProductAccess(license ? { ...license, productStatus: product.status } : null, now);
          return {
            ...product,
            licensed: Boolean(license),
            license: license ? { id: license.id, startsAt: license.startsAt, endsAt: license.endsAt, active: license.active } : null,
            access: access.allowed,
            accessReason: access.reason,
            launchUrl: access.allowed ? product.baseUrl : null
          };
        });
      }
    });
    if (!result.authorized) return noStoreJson({ error: "tenant_access_denied" }, 403);
    return noStoreJson({ tenantId: result.tenantId, role: result.role, products: result.value });
  } catch {
    return noStoreJson({ error: "tenant_products_unavailable" }, 503);
  }
}
