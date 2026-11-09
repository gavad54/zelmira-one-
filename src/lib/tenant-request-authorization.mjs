import { createHash } from "node:crypto";
import { authorizeTenantAction } from "./authorization.mjs";

const denied = Object.freeze({ authorized: false });
const IDLE_TTL_MS = 30 * 60 * 1000;
const ACTIVITY_WRITE_INTERVAL_MS = 5 * 60 * 1000;

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
    !/^[a-f0-9]{64}$/.test(sessionToken) ||
    typeof tenantId !== "string" ||
    tenantId.length === 0 ||
    typeof action !== "string" ||
    !(now instanceof Date) ||
    Number.isNaN(now.getTime()) ||
    !db?.session ||
    typeof db.session.findUnique !== "function" ||
    typeof db.session.updateMany !== "function" ||
    !db?.membership ||
    typeof db.membership.findUnique !== "function"
  ) {
    return denied;
  }

  try {
    const tokenHash = createHash("sha256").update(sessionToken, "utf8").digest("hex");
    const session = await db.session.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, emailVerifiedAt: true, disabledAt: true } } }
    });

    if (
      !session ||
      typeof session.id !== "string" ||
      !(session.createdAt instanceof Date) ||
      !(session.expiresAt instanceof Date) ||
      session.expiresAt.getTime() <= now.getTime() ||
      session.revokedAt ||
      !session.user ||
      typeof session.user.id !== "string" ||
      session.user.id.length === 0 ||
      !session.user.emailVerifiedAt ||
      session.user.disabledAt !== null
    ) {
      return denied;
    }

    const lastActivityAt = session.lastSeenAt instanceof Date ? session.lastSeenAt : session.createdAt;
    if (now.getTime() - lastActivityAt.getTime() > IDLE_TTL_MS) {
      await db.session.updateMany({ where: { id: session.id, revokedAt: null }, data: { revokedAt: now } });
      return denied;
    }
    if (now.getTime() - lastActivityAt.getTime() >= ACTIVITY_WRITE_INTERVAL_MS) {
      const touched = await db.session.updateMany({
        where: { id: session.id, revokedAt: null, expiresAt: { gt: now } },
        data: { lastSeenAt: now }
      });
      if (touched.count !== 1) return denied;
    }

    const membership = await db.membership.findUnique({
      where: { userId_tenantId: { userId: session.user.id, tenantId } },
      include: { tenant: { select: { id: true, status: true } } }
    });

    if (
      !membership ||
      membership.userId !== session.user.id ||
      membership.tenantId !== tenantId ||
      membership.tenant?.id !== tenantId ||
      membership.tenant.status !== "ACTIVE"
    ) return denied;

    if (
      (membership.role === "OWNER" || membership.role === "ADMIN") &&
      (session.assurance !== "MFA" || !(session.mfaAuthenticatedAt instanceof Date) ||
       session.mfaAuthenticatedAt.getTime() > now.getTime() ||
       now.getTime() - session.mfaAuthenticatedAt.getTime() > 12 * 60 * 60 * 1000)
    ) return denied;

    if (!authorizeTenantAction({
      authenticatedUserId: session.user.id,
      requestedTenantId: tenantId,
      membership: { userId: membership.userId, tenantId: membership.tenantId, role: membership.role },
      tenantStatus: membership.tenant.status,
      action
    })) return denied;

    return { authorized: true, userId: session.user.id, tenantId, role: membership.role };
  } catch {
    return denied;
  }
}
