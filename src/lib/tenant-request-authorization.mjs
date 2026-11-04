import { createHash } from "node:crypto";
import { authorizeTenantAction } from "./authorization.mjs";

const denied = Object.freeze({ authorized: false });

/**
 * Authorize a tenant request using a hashed opaque session token and
 * membership/tenant records loaded directly from the database.
 *
 * The caller must supply only the raw cookie token and requested tenant ID.
 * Roles and membership objects are never accepted from client input.
 */
export async function authorizeTenantRequest({
  sessionToken,
  tenantId,
  action,
  db,
  now = new Date()
}) {
  if (
    typeof sessionToken !== "string" ||
    sessionToken.length < 32 ||
    sessionToken.length > 4096 ||
    typeof tenantId !== "string" ||
    tenantId.length === 0 ||
    typeof action !== "string" ||
    !(now instanceof Date) ||
    Number.isNaN(now.getTime()) ||
    !db?.session ||
    typeof db.session.findUnique !== "function" ||
    !db?.membership ||
    typeof db.membership.findUnique !== "function"
  ) {
    return denied;
  }

  try {
    const tokenHash = createHash("sha256").update(sessionToken, "utf8").digest("hex");
    const session = await db.session.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, disabledAt: true } } }
    });

    if (
      !session ||
      !(session.expiresAt instanceof Date) ||
      session.expiresAt.getTime() <= now.getTime() ||
      !session.user ||
      typeof session.user.id !== "string" ||
      session.user.id.length === 0 ||
      session.user.disabledAt !== null
    ) {
      return denied;
    }

    const membership = await db.membership.findUnique({
      where: {
        userId_tenantId: {
          userId: session.user.id,
          tenantId
        }
      },
      include: { tenant: { select: { id: true, status: true } } }
    });

    if (
      !membership ||
      membership.userId !== session.user.id ||
      membership.tenantId !== tenantId ||
      membership.tenant?.id !== tenantId ||
      membership.tenant.status !== "ACTIVE"
    ) {
      return denied;
    }

    if (!authorizeTenantAction({
      authenticatedUserId: session.user.id,
      requestedTenantId: tenantId,
      membership: {
        userId: membership.userId,
        tenantId: membership.tenantId,
        role: membership.role
      },
      tenantStatus: membership.tenant.status,
      action
    })) {
      return denied;
    }

    return {
      authorized: true,
      userId: session.user.id,
      tenantId,
      role: membership.role
    };
  } catch {
    // Fail closed; do not leak database or session details to the caller.
    return denied;
  }
}
