import { PrismaClient } from "@prisma/client";

const globalForPlatformPrisma = globalThis as unknown as {
  platformPrisma?: PrismaClient;
};

let productionPlatformPrisma: PrismaClient | undefined;

function getPlatformPrisma(): PrismaClient {
  const cached = process.env.NODE_ENV === "production"
    ? productionPlatformPrisma
    : globalForPlatformPrisma.platformPrisma;
  if (cached) return cached;

  const platformUrl = process.env.PLATFORM_DATABASE_URL;
  if (!platformUrl && process.env.NODE_ENV === "production") {
    throw new Error("PLATFORM_DATABASE_URL is required in production; refusing the default database role");
  }

  const client = platformUrl
    ? new PrismaClient({ datasources: { db: { url: platformUrl } } })
    : new PrismaClient();

  if (process.env.NODE_ENV === "production") {
    productionPlatformPrisma = client;
  } else {
    globalForPlatformPrisma.platformPrisma = client;
  }
  return client;
}

/**
 * Defer client creation until a request actually uses the platform control
 * plane. Build-time route imports must not require production-only secrets.
 * Runtime use still fails closed and never falls back to DATABASE_URL.
 */
export const platformPrisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPlatformPrisma();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
  set(_target, property, value) {
    const client = getPlatformPrisma();
    return Reflect.set(client, property, value, client);
  }
});

type RawQueryClient = Pick<PrismaClient, "$queryRaw">;

/**
 * Verify the effective platform login role on the same connection used for
 * platform work. The login must inherit only vayro_platform and own no tables.
 */
export async function assertPlatformRuntimeRole(db: RawQueryClient = platformPrisma): Promise<void> {
  const rows = await db.$queryRaw<Array<{
    is_superuser: boolean;
    bypasses_rls: boolean;
    can_login: boolean;
    can_use_vayro_platform: boolean;
    has_elevated_membership: boolean;
    has_other_role_membership: boolean;
    owns_public_tables: boolean;
  }>>`
    SELECT
      r.rolsuper AS is_superuser,
      r.rolbypassrls AS bypasses_rls,
      r.rolcanlogin AS can_login,
      pg_has_role(current_user, 'vayro_platform', 'MEMBER') AS can_use_vayro_platform,
      EXISTS (
        SELECT 1 FROM pg_roles elevated
        WHERE (elevated.rolsuper OR elevated.rolbypassrls)
          AND pg_has_role(current_user, elevated.oid, 'MEMBER')
      ) AS has_elevated_membership,
      EXISTS (
        SELECT 1
        FROM pg_roles granted
        WHERE granted.rolname NOT IN ('vayro_platform', current_user)
          AND pg_has_role(current_user, granted.oid, 'MEMBER')
      ) AS has_other_role_membership,
      EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind IN ('r','p')
          AND c.relowner = r.oid
      ) AS owns_public_tables
    FROM pg_roles r
    WHERE r.rolname = current_user
  `;
  const role = rows[0];
  if (
    !role ||
    role.is_superuser ||
    role.bypasses_rls ||
    !role.can_login ||
    !role.can_use_vayro_platform ||
    role.has_elevated_membership ||
    role.has_other_role_membership ||
    role.owns_public_tables
  ) {
    throw new Error("UNSAFE_PLATFORM_DATABASE_ROLE");
  }
}
