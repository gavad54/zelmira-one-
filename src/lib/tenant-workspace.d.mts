export function getTenantWorkspace(input: {
  sessionToken?: string | null;
  tenantId: string;
  db?: unknown;
  authDb?: unknown;
  tenantDb?: unknown;
  now?: Date;
}): Promise<{
  status: number;
  body: Record<string, unknown>;
}>;
