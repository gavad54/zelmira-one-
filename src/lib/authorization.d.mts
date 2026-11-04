export type TenantAction =
  | "tenant_read"
  | "tenant_manage"
  | "members_manage"
  | "billing_manage"
  | "tenant_delete";

export type TenantMembership = {
  userId: string;
  tenantId: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";
};

export function authorizeTenantAction(input: {
  authenticatedUserId: string | null | undefined;
  requestedTenantId: string | null | undefined;
  membership: TenantMembership | null | undefined;
  tenantStatus: "ACTIVE" | "SUSPENDED" | "CLOSED" | null | undefined;
  action: TenantAction;
}): boolean;
