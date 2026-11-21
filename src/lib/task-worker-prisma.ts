import { PrismaClient } from "@prisma/client";

const globalForTaskWorkerPrisma = globalThis as unknown as {
  taskWorkerPrisma?: PrismaClient;
};
let productionTaskWorkerPrisma: PrismaClient | undefined;

function getTaskWorkerPrisma(): PrismaClient {
  const cached = process.env.NODE_ENV === "production" ? productionTaskWorkerPrisma : globalForTaskWorkerPrisma.taskWorkerPrisma;
  if (cached) return cached;
  const workerUrl = process.env.TASK_WORKER_DATABASE_URL;
  if (!workerUrl) throw new Error("TASK_WORKER_DATABASE_URL is required; worker must not fall back to an owner or application database role");
  const client = new PrismaClient({ datasources: { db: { url: workerUrl } } });
  if (process.env.NODE_ENV === "production") productionTaskWorkerPrisma = client;
  else globalForTaskWorkerPrisma.taskWorkerPrisma = client;
  return client;
}

export const taskWorkerPrisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getTaskWorkerPrisma();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
  set(_target, property, value) {
    const client = getTaskWorkerPrisma();
    return Reflect.set(client, property, value, client);
  }
});

export async function assertTaskWorkerRuntimeRole(): Promise<void> {
  const rows = await taskWorkerPrisma.$queryRaw<Array<{
    is_superuser: boolean;
    bypasses_rls: boolean;
    can_login: boolean;
    can_use_task_worker: boolean;
    has_elevated_membership: boolean;
    has_other_role_membership: boolean;
    owns_public_tables: boolean;
  }>>`
    SELECT
      r.rolsuper AS is_superuser,
      r.rolbypassrls AS bypasses_rls,
      r.rolcanlogin AS can_login,
      pg_has_role(current_user, 'vayro_task_worker', 'MEMBER') AS can_use_task_worker,
      EXISTS (
        SELECT 1 FROM pg_roles elevated
        WHERE (elevated.rolsuper OR elevated.rolbypassrls)
          AND pg_has_role(current_user, elevated.oid, 'MEMBER')
      ) AS has_elevated_membership,
      EXISTS (
        SELECT 1 FROM pg_roles granted
        WHERE granted.rolname NOT IN ('vayro_task_worker', current_user)
          AND pg_has_role(current_user, granted.oid, 'MEMBER')
      ) AS has_other_role_membership,
      EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relowner = r.oid
      ) AS owns_public_tables
    FROM pg_roles r
    WHERE r.rolname = current_user
  `;
  const role = rows[0];
  if (!role || role.is_superuser || role.bypasses_rls || !role.can_login ||
      !role.can_use_task_worker || role.has_elevated_membership ||
      role.has_other_role_membership || role.owns_public_tables) {
    throw new Error("UNSAFE_TASK_WORKER_DATABASE_ROLE");
  }
}
