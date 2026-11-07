export function listActiveTenants(input: {
  db: unknown;
  userId: string;
}): Promise<Array<{
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: Date;
  role: string;
}>>;

export function createTenantWithOwnerAudit(input: {
  db: unknown;
  userId: string;
  name: string;
  slug: string;
}): Promise<{
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: Date;
  role: "OWNER";
}>;


export type TenantManagementResult = {
  id: string;
  name: string;
  slug: string;
  status: string;
  updatedAt: Date;
};

export function renameTenantWithOwnerAudit(input: {
  db: unknown;
  tenantId: string;
  actorUserId: string;
  name: string;
}): Promise<TenantManagementResult | null>;

export function closeTenantWithOwnerAudit(input: {
  db: unknown;
  tenantId: string;
  actorUserId: string;
}): Promise<TenantManagementResult | null>;
