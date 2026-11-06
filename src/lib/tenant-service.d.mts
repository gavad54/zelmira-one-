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
