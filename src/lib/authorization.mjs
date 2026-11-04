const permissions = {
  tenant_read: ["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"],
  tenant_manage: ["OWNER", "ADMIN"],
  members_manage: ["OWNER", "ADMIN"],
  billing_manage: ["OWNER"],
  tenant_delete: ["OWNER"]
};

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
    membership.userId !== authenticatedUserId ||
    membership.tenantId !== requestedTenantId ||
    tenantStatus !== "ACTIVE"
  ) {
    return false;
  }

  const allowedRoles = permissions[action];
  if (!allowedRoles || typeof membership.role !== "string") {
    return false;
  }

  return allowedRoles.includes(membership.role);
}
