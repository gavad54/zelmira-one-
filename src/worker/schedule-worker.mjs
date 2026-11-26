import { randomUUID } from "node:crypto";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const SCHEDULER_ID = process.env.TASK_SCHEDULER_ID ?? `vayro-scheduler-${randomUUID()}`;
const POLL_MS = Number(process.env.TASK_SCHEDULER_POLL_MS ?? 5_000);
const BATCH_SIZE = Number(process.env.TASK_SCHEDULER_BATCH_SIZE ?? 10);

function validateConfig() {
  if (!process.env.TASK_SCHEDULER_DATABASE_URL) throw new Error("TASK_SCHEDULER_DATABASE_URL_REQUIRED");
  if (!/^[A-Za-z0-9._:-]{3,100}$/.test(SCHEDULER_ID)) throw new Error("SCHEDULER_ID_INVALID");
  if (!Number.isInteger(POLL_MS) || POLL_MS < 500 || POLL_MS > 60_000) throw new Error("SCHEDULER_POLL_INVALID");
  if (!Number.isInteger(BATCH_SIZE) || BATCH_SIZE < 1 || BATCH_SIZE > 100) throw new Error("SCHEDULER_BATCH_SIZE_INVALID");
}

async function assertSchedulerRole(db) {
  const rows = await db.$queryRaw`
    SELECT r.rolsuper AS superuser, r.rolbypassrls AS bypasses_rls, r.rolcanlogin AS can_login,
      pg_has_role(current_user, 'vayro_task_scheduler', 'MEMBER') AS scheduler_member,
      EXISTS (SELECT 1 FROM pg_roles x WHERE (x.rolsuper OR x.rolbypassrls)
        AND pg_has_role(current_user, x.oid, 'MEMBER')) AS elevated_membership,
      EXISTS (SELECT 1 FROM pg_roles x WHERE x.rolname NOT IN ('vayro_task_scheduler', current_user)
        AND pg_has_role(current_user, x.oid, 'MEMBER')) AS other_membership,
      EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relowner=r.oid) AS owns_tables
    FROM pg_roles r WHERE r.rolname=current_user
  `;
  const role = rows[0];
  if (!role || role.superuser || role.bypasses_rls || !role.can_login || !role.scheduler_member ||
      role.elevated_membership || role.other_membership || role.owns_tables) {
    throw new Error("UNSAFE_TASK_SCHEDULER_DATABASE_ROLE");
  }
}

async function main() {
  validateConfig();
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient({ datasources: { db: { url: process.env.TASK_SCHEDULER_DATABASE_URL } } });
  const shutdown = new AbortController();
  const stop = () => shutdown.abort();
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
  try {
    await assertSchedulerRole(db);
    console.info(JSON.stringify({ event: "scheduler_started", schedulerId: SCHEDULER_ID, batchSize: BATCH_SIZE }));
    let backoff = POLL_MS;
    while (!shutdown.signal.aborted) {
      try {
        const rows = await db.$queryRaw`
          SELECT public.vayro_materialize_due_engineering_schedules(${SCHEDULER_ID}, ${BATCH_SIZE}) AS created
        `;
        const reconciled = await db.$queryRaw`
          SELECT public.vayro_reconcile_goal_progress(1000) AS updated
        `;
        const created = Number(rows[0]?.created ?? 0);
        const updated = Number(reconciled[0]?.updated ?? 0);
        console.info(JSON.stringify({ event: "scheduler_cycle", schedulerId: SCHEDULER_ID, created, reconciled: updated }));
        backoff = POLL_MS;
        if (created === 0) await sleep(POLL_MS);
      } catch (error) {
        console.error(JSON.stringify({
          event: "scheduler_loop_error",
          code: /^[A-Z0-9_]{2,80}$/.test(error?.message ?? "") ? error.message : "SCHEDULER_DATABASE_ERROR",
          retryInMs: backoff
        }));
        await sleep(backoff);
        backoff = Math.min(60_000, backoff * 2);
      }
    }
  } finally {
    await db.$disconnect();
    process.removeListener("SIGTERM", stop);
    process.removeListener("SIGINT", stop);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(JSON.stringify({
      event: "scheduler_fatal",
      code: /^[A-Z0-9_]{2,80}$/.test(error?.message ?? "") ? error.message : "SCHEDULER_START_FAILED"
    }));
    process.exitCode = 1;
  });
}
