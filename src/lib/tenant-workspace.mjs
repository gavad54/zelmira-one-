import { withTenantRequestTransaction } from "./tenant-request-transaction.mjs";

export async function getTenantWorkspace({
  sessionToken,
  tenantId,
  db,
  authDb = db,
  tenantDb = db,
  now = new Date()
}) {
  try {
    const result = await withTenantRequestTransaction({
      authDb,
      tenantDb,
      sessionToken,
      tenantId,
      action: "tenant_read",
      now,
      callback: async tx => {
        const tenant = await tx.tenant.findUnique({
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

        if (!tenant || tenant.status !== "ACTIVE") return null;
        return {
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
          }
        };
      }
    });

    if (!result.authorized) {
      return { status: 401, body: { error: "unauthorized" } };
    }
    if (!result.value) {
      return { status: 404, body: { error: "tenant_not_found" } };
    }
    return {
      status: 200,
      body: { ...result.value, role: result.role }
    };
  } catch {
    return { status: 503, body: { error: "workspace_unavailable" } };
  }
}
