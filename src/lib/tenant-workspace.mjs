import { authorizeTenantRequest } from "./tenant-request-authorization.mjs";

export async function getTenantWorkspace({ sessionToken, tenantId, db, now = new Date() }) {
  const authorization = await authorizeTenantRequest({
    sessionToken,
    tenantId,
    action: "tenant_read",
    db,
    now
  });

  if (!authorization.authorized) {
    return { status: 401, body: { error: "unauthorized" } };
  }

  try {
    const tenant = await db.tenant.findUnique({
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
      return { status: 404, body: { error: "tenant_not_found" } };
    }

    return {
      status: 200,
      body: {
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
      }
    };
  } catch {
    return { status: 503, body: { error: "workspace_unavailable" } };
  }
}
