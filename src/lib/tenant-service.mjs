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


/** Rename an active tenant and write its audit event in the same transaction. */
export async function renameTenantWithOwnerAudit({ db, tenantId, actorUserId, name }) {
  return db.$transaction(async tx => {
    const updated = await tx.tenant.updateMany({
      where: { id: tenantId, status: "ACTIVE" },
      data: { name }
    });
    if (updated.count !== 1) return null;

    const tenant = await tx.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, slug: true, status: true, updatedAt: true }
    });
    if (!tenant) throw new Error("TENANT_UPDATE_NOT_FOUND");

    await tx.auditEvent.create({
      data: {
        actorUserId,
        tenantId,
        action: "tenant.renamed",
        resource: "Tenant",
        resourceId: tenantId,
        metadata: { name }
      }
    });
    return tenant;
  });
}

/** Close an active tenant without deleting its data, preserving an audit trail. */
export async function closeTenantWithOwnerAudit({ db, tenantId, actorUserId }) {
  return db.$transaction(async tx => {
    const updated = await tx.tenant.updateMany({
      where: { id: tenantId, status: "ACTIVE" },
      data: { status: "CLOSED" }
    });
    if (updated.count !== 1) return null;

    const tenant = await tx.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, slug: true, status: true, updatedAt: true }
    });
    if (!tenant) throw new Error("TENANT_CLOSE_NOT_FOUND");

    await tx.auditEvent.create({
      data: {
        actorUserId,
        tenantId,
        action: "tenant.closed",
        resource: "Tenant",
        resourceId: tenantId
      }
    });
    return tenant;
  });
}
