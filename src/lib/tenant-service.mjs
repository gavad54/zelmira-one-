export async function listActiveTenants({ db, userId }) {
  const memberships = await db.membership.findMany({
    where: { userId, tenant: { status: "ACTIVE" } },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      tenant: {
        select: { id: true, name: true, slug: true, status: true, createdAt: true }
      }
    }
  });

  return memberships.map(({ role, tenant }) => ({ ...tenant, role }));
}

export async function createTenantWithOwnerAudit({ db, userId, name, slug }) {
  return db.$transaction(async tx => {
    const created = await tx.tenant.create({
      data: {
        name,
        slug,
        memberships: {
          create: { userId, role: "OWNER" }
        }
      },
      select: { id: true, name: true, slug: true, status: true, createdAt: true }
    });

    await tx.auditEvent.create({
      data: {
        actorUserId: userId,
        tenantId: created.id,
        action: "tenant.created",
        resource: "Tenant",
        resourceId: created.id
      }
    });

    return { ...created, role: "OWNER" };
  });
}
