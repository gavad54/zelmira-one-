import { PrismaClient } from "@prisma/client";

const globalForAuthPrisma = globalThis as unknown as {
  authPrisma?: PrismaClient;
};

let productionAuthPrisma: PrismaClient | undefined;

function getAuthPrisma(): PrismaClient {
  const cached = process.env.NODE_ENV === "production"
    ? productionAuthPrisma
    : globalForAuthPrisma.authPrisma;
  if (cached) return cached;

  const authUrl = process.env.AUTH_DATABASE_URL;
  if (!authUrl && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_DATABASE_URL is required in production; refusing the default database role");
  }

  const client = authUrl
    ? new PrismaClient({ datasources: { db: { url: authUrl } } })
    : new PrismaClient();

  if (process.env.NODE_ENV === "production") {
    productionAuthPrisma = client;
  } else {
    globalForAuthPrisma.authPrisma = client;
  }
  return client;
}

/**
 * Defer client creation until a request actually uses the auth data plane.
 * Next.js imports route modules while collecting build-time page data; the
 * production secret must be required at runtime, not during that import.
 * The lazy boundary never creates a default-role client in production.
 */
export const authPrisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getAuthPrisma();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
  set(_target, property, value) {
    const client = getAuthPrisma();
    return Reflect.set(client, property, value, client);
  }
});

/**
 * Re-check the effective database role for every protected auth operation.
 * Do not cache this assertion: role grants can change while an app process
 * remains alive, and a cached proof would survive a privilege escalation.
 */
export async function assertAuthRuntimeRole(): Promise<void> {
  const rows = await authPrisma.$queryRaw<Array<{
    role_name: string;
    is_superuser: boolean;
    bypasses_rls: boolean;
    can_use_vayro_auth: boolean;
    has_elevated_membership: boolean;
    has_other_role_membership: boolean;
    owns_protected_tables: boolean;
  }>>`
    SELECT
      current_user AS role_name,
      r.rolsuper AS is_superuser,
      r.rolbypassrls AS bypasses_rls,
      pg_has_role(current_user, 'vayro_auth', 'MEMBER') AS can_use_vayro_auth,
      EXISTS (
        SELECT 1 FROM pg_roles elevated
        WHERE (elevated.rolsuper OR elevated.rolbypassrls)
          AND pg_has_role(current_user, elevated.oid, 'MEMBER')
      ) AS has_elevated_membership,
      EXISTS (
        SELECT 1
        FROM pg_roles granted
        WHERE granted.rolname NOT IN ('vayro_auth', current_user)
          AND pg_has_role(current_user, granted.oid, 'MEMBER')
      ) AS has_other_role_membership,
      EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind IN ('r','p')
          AND c.relowner = r.oid
      ) AS owns_protected_tables
    FROM pg_roles r
    WHERE r.rolname = current_user
  `;
  const role = rows[0];
  if (
    !role ||
    role.is_superuser ||
    role.bypasses_rls ||
    !role.can_use_vayro_auth ||
    role.has_elevated_membership ||
    role.has_other_role_membership ||
    role.owns_protected_tables
  ) {
    throw new Error("UNSAFE_AUTH_DATABASE_ROLE");
  }
}
