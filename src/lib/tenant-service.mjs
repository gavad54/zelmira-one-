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


/** List a tenant's members with a deliberately limited user projection. */
export async function listTenantMembers({ db, tenantId }) {
  if (!db || !tenantId) throw new TypeError("DB_AND_TENANT_ID_REQUIRED");

  const memberships = await db.membership.findMany({
    where: { tenantId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      role: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          displayName: true
        }
      }
    }
  });

  return memberships.map(({ role, createdAt, user }) => ({
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    role,
    joinedAt: createdAt
  }));
}

/** Tenant rename operation; caller must supply an already-authorized RLS transaction. */
export async function renameTenantInTransaction({ tx, tenantId, actorUserId, name }) {
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
}

/** Tenant close operation; caller must supply an already-authorized RLS transaction. */
export async function closeTenantInTransaction({ tx, tenantId, actorUserId }) {
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
}

/** Create a new tenant inside a user/session-bound RLS transaction. */
export async function createTenantInTransaction({ tx, userId, tenantId, name, slug }) {
  const created = await tx.tenant.create({
    data: {
      id: tenantId,
      name,
      slug,
      memberships: { create: { userId, role: "OWNER" } }
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
}
