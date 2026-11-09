const permissions = Object.freeze({
  tenant_read: Object.freeze(["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"]),
  tenant_manage: Object.freeze(["OWNER", "ADMIN"]),
  members_manage: Object.freeze(["OWNER", "ADMIN"]),
  billing_manage: Object.freeze(["OWNER"]),
  tenant_delete: Object.freeze(["OWNER"]),
  ai_generate: Object.freeze(["OWNER", "ADMIN", "MANAGER", "MEMBER"]),
  ai_read: Object.freeze(["OWNER", "ADMIN", "MANAGER", "MEMBER"])
});

const membershipRoles = new Set(["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"]);

/**
 * Evaluate a tenant permission using membership data loaded by trusted
 * server-side code. Never pass role or membership values supplied by a client.
 */
export function authorizeTenantAction({
  authenticatedUserId,
  requestedTenantId,
  membership,
  tenantStatus,
  action
}) {
  if (
    typeof authenticatedUserId !== "string" ||
    authenticatedUserId.length === 0 ||
    typeof requestedTenantId !== "string" ||
    requestedTenantId.length === 0 ||
    !membership ||
    typeof membership !== "object" ||
    membership.userId !== authenticatedUserId ||
    membership.tenantId !== requestedTenantId ||
    tenantStatus !== "ACTIVE" ||
    !membershipRoles.has(membership.role) ||
    typeof action !== "string" ||
    !Object.hasOwn(permissions, action)
  ) {
    return false;
  }

  return permissions[action].includes(membership.role);
}
