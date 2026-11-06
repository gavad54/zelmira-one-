import { cookies } from "next/headers";
import { authorizeTenantRequest } from "@/lib/tenant-request-authorization.mjs";
import { noStoreJson } from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ tenantId: string }>;
};

/**
 * Returns only the workspace summary visible to a verified tenant member.
 * Membership and role are resolved from the server-side session and database.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { tenantId } = await context.params;
  const sessionToken = (await cookies()).get("vayro_session")?.value;

  const authorization = await authorizeTenantRequest({
    sessionToken,
    tenantId,
    action: "tenant_read",
    db: prisma
  });

  if (!authorization.authorized) {
    return noStoreJson({ error: "unauthorized" }, 401);
  }

  try {
    const now = new Date();
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        _count: { select: { memberships: true } },
        licenses: {
          where: {
            active: true,
            startsAt: { lte: now },
            OR: [{ endsAt: null }, { endsAt: { gt: now } }]
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            product: {
              select: {
                key: true,
                name: true,
                description: true,
                status: true,
                baseUrl: true
              }
            }
          }
        }
      }
    });

    if (!tenant || tenant.status !== "ACTIVE") {
      return noStoreJson({ error: "tenant_not_found" }, 404);
    }

    return noStoreJson({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        createdAt: tenant.createdAt,
        memberCount: tenant._count.memberships,
        products: tenant.licenses.map(license => ({
          licenseId: license.id,
          startsAt: license.startsAt,
          endsAt: license.endsAt,
          ...license.product
        }))
      },
      role: authorization.role
    });
  } catch {
    return noStoreJson({ error: "workspace_unavailable" }, 503);
  }
}
