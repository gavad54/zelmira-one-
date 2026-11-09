import { createHash } from "node:crypto";
import { authorizeTenantAction } from "./authorization.mjs";
import { authorizeTenantRequest } from "./tenant-request-authorization.mjs";

const IDLE_TTL_MS = 30 * 60 * 1000;
const MFA_FRESHNESS_MS = 12 * 60 * 60 * 1000;

export async function assertTenantRuntimeRole(tx) {
  const rows = await tx.$queryRaw`SELECT
    current_user AS role_name,
    r.rolsuper AS is_superuser,
    r.rolbypassrls AS bypasses_rls,
    pg_has_role(current_user, 'vayro_app', 'USAGE') AS can_use_vayro_app,
    EXISTS (
      SELECT 1 FROM pg_roles elevated
      WHERE (elevated.rolsuper OR elevated.rolbypassrls)
        AND pg_has_role(current_user, elevated.oid, 'MEMBER')
    ) AS has_elevated_membership,
    EXISTS (
      SELECT 1
      FROM pg_roles granted
      WHERE granted.rolname NOT IN ('vayro_app', current_user)
        AND pg_has_role(current_user, granted.oid, 'MEMBER')
    ) AS has_other_role_membership,
    EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname IN ('Tenant','Membership','License','AuditEvent','User','Session','Product','AiGeneration')
        AND (c.relowner = r.oid OR pg_has_role(current_user, c.relowner, 'MEMBER'))
    ) AS owns_protected_tables
  FROM pg_roles r
  WHERE r.rolname = current_user
  `;
  const role = rows?.[0];
  if (
    !role ||
    role.is_superuser ||
    role.bypasses_rls ||
    !role.can_use_vayro_app ||
    role.has_elevated_membership ||
    role.has_other_role_membership ||
    role.owns_protected_tables
  ) {
    throw new Error("UNSAFE_TENANT_DATABASE_ROLE");
  }
}

/**
 * Execute tenant data work only after session/membership authorization and
 * revalidation inside the same transaction that carries the RLS context.
 * The caller never supplies role claims or PostgreSQL context values.
 */
export async function withTenantRequestTransaction({
  authDb,
  tenantDb,
  sessionToken,
  tenantId,
  action,
  callback,
  now = new Date()
}) {
  if (
    typeof sessionToken !== "string" ||
    !/^[a-f0-9]{64}$/.test(sessionToken) ||
    typeof tenantId !== "string" ||
    tenantId.length === 0 ||
    typeof action !== "string" ||
    typeof callback !== "function" ||
    !(now instanceof Date) ||
    Number.isNaN(now.getTime()) ||
    !authDb ||
    !tenantDb ||
    typeof tenantDb.$transaction !== "function"
  ) return { authorized: false };

  const initial = await authorizeTenantRequest({
    sessionToken, tenantId, action, db: authDb, now
  });
  if (!initial.authorized) return { authorized: false };

  const tokenHash = createHash("sha256").update(sessionToken, "utf8").digest("hex");

  return tenantDb.$transaction(async tx => {
    await assertTenantRuntimeRole(tx);
    // These values are transaction-local and are derived only from the
    // validated cookie/session and requested tenant membership.
    await tx.$queryRaw`SELECT
      set_config('app.user_id', ${initial.userId}, true),
      set_config('app.tenant_id', ${tenantId}, true),
      set_config('app.session_token_hash', ${tokenHash}, true),
      set_config('app.user_role', '', true)
    `;

    // Revalidate the exact session and actor through RLS on this connection.
    const [session, user, membership] = await Promise.all([
      tx.session.findUnique({
        where: { tokenHash },
        select: {
          id: true, tokenHash: true, userId: true, expiresAt: true,
          createdAt: true, revokedAt: true, lastSeenAt: true,
          assurance: true, mfaAuthenticatedAt: true
        }
      }),
      tx.user.findUnique({
        where: { id: initial.userId },
        select: { id: true, emailVerifiedAt: true, disabledAt: true }
      }),
      tx.membership.findUnique({
        where: { userId_tenantId: { userId: initial.userId, tenantId } },
        include: { tenant: { select: { id: true, status: true } } }
      })
    ]);

    if (
      !session || session.userId !== initial.userId ||
      session.revokedAt || session.expiresAt.getTime() <= now.getTime() ||
      !user || user.id !== initial.userId || !user.emailVerifiedAt || user.disabledAt ||
      !membership || membership.userId !== initial.userId ||
      membership.tenantId !== tenantId || membership.tenant?.id !== tenantId ||
      membership.tenant.status !== "ACTIVE"
    ) return { authorized: false };

    const lastActivity = session.lastSeenAt ?? session.createdAt;
    if (now.getTime() - lastActivity.getTime() > IDLE_TTL_MS) {
      return { authorized: false };
    }

    if (
      (membership.role === "OWNER" || membership.role === "ADMIN") &&
      (session.assurance !== "MFA" ||
       !(session.mfaAuthenticatedAt instanceof Date) ||
       session.mfaAuthenticatedAt.getTime() > now.getTime() ||
       now.getTime() - session.mfaAuthenticatedAt.getTime() > MFA_FRESHNESS_MS)
    ) return { authorized: false };

    if (!authorizeTenantAction({
      authenticatedUserId: user.id,
      requestedTenantId: tenantId,
      membership: {
        userId: membership.userId,
        tenantId: membership.tenantId,
        role: membership.role
      },
      tenantStatus: membership.tenant.status,
      action
    })) return { authorized: false };

    await tx.$queryRaw`SELECT set_config('app.user_role', ${membership.role}, true)`;

    const value = await callback(tx, {
      userId: user.id,
      tenantId,
      role: membership.role
    });
    return {
      authorized: true,
      userId: user.id,
      tenantId,
      role: membership.role,
      value
    };
  }, { timeout: 10000 });
}

/**
 * User-scoped transaction for self-service tenant listing/creation.
 * The caller must not use this to read tenant business data without a
 * membership-scoped withTenantRequestTransaction boundary.
 */
export async function withAuthenticatedUserTransaction({
  authDb,
  tenantDb,
  sessionToken,
  tenantId = "",
  callback,
  now = new Date()
}) {
  if (
    typeof sessionToken !== "string" ||
    !/^[a-f0-9]{64}$/.test(sessionToken) ||
    typeof tenantId !== "string" ||
    typeof callback !== "function" ||
    !(now instanceof Date) ||
    Number.isNaN(now.getTime()) ||
    !authDb?.session?.findUnique ||
    !tenantDb?.$transaction
  ) return { authorized: false };

  const tokenHash = createHash("sha256").update(sessionToken, "utf8").digest("hex");
  const initial = await authDb.session.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, emailVerifiedAt: true, disabledAt: true } } }
  });
  if (
    !initial || initial.revokedAt || initial.expiresAt.getTime() <= now.getTime() ||
    !initial.user?.id || !initial.user.emailVerifiedAt || initial.user.disabledAt
  ) return { authorized: false };

  const lastActivity = initial.lastSeenAt ?? initial.createdAt;
  if (now.getTime() - lastActivity.getTime() > IDLE_TTL_MS) {
    return { authorized: false };
  }

  return tenantDb.$transaction(async tx => {
    await assertTenantRuntimeRole(tx);
    await tx.$queryRaw`SELECT
      set_config('app.user_id', ${initial.user.id}, true),
      set_config('app.tenant_id', ${tenantId}, true),
      set_config('app.session_token_hash', ${tokenHash}, true),
      set_config('app.user_role', '', true)
    `;

    const [session, user] = await Promise.all([
      tx.session.findUnique({
        where: { tokenHash },
        select: {
          id: true, tokenHash: true, userId: true, expiresAt: true,
          createdAt: true, revokedAt: true, lastSeenAt: true
        }
      }),
      tx.user.findUnique({
        where: { id: initial.user.id },
        select: { id: true, emailVerifiedAt: true, disabledAt: true }
      })
    ]);
    if (
      !session || session.userId !== initial.user.id || session.revokedAt ||
      session.expiresAt.getTime() <= now.getTime() ||
      !user || user.id !== initial.user.id || !user.emailVerifiedAt || user.disabledAt
    ) return { authorized: false };

    const activity = session.lastSeenAt ?? session.createdAt;
    if (now.getTime() - activity.getTime() > IDLE_TTL_MS) {
      return { authorized: false };
    }

    const value = await callback(tx, { userId: user.id, tenantId });
    return { authorized: true, userId: user.id, value };
  }, { timeout: 10000 });
}
