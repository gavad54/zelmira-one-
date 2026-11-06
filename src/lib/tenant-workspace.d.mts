export function getTenantWorkspace(input: {
  sessionToken?: string;
  tenantId: string;
  db: unknown;
  now?: Date;
}): Promise<{
  status: number;
  body: Record<string, unknown>;
}>;
