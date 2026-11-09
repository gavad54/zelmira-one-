import { PrismaClient } from "@prisma/client";

const globalForTenantPrisma = globalThis as unknown as {
  tenantPrisma?: PrismaClient;
};

/** Lazily connect using the dedicated NOBYPASSRLS, non-owner app role. */
export function getTenantPrisma(): PrismaClient {
  const url = process.env.TENANT_DATABASE_URL;
  if (!url) throw new Error("TENANT_DATABASE_URL is required for tenant data access");

  if (!globalForTenantPrisma.tenantPrisma) {
    globalForTenantPrisma.tenantPrisma = new PrismaClient({
      datasources: { db: { url } }
    });
  }
  return globalForTenantPrisma.tenantPrisma;
}
