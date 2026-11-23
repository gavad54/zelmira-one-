import { createHash, randomUUID } from "node:crypto";
import { redactErrorMessage } from "../lib/redact-error-message.mjs";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const MAX_RESULT_BYTES = 65_536;
const WORKER_ID = process.env.TASK_WORKER_ID ?? `vayro-worker-${randomUUID()}`;
const LEASE_SECONDS = Number(process.env.TASK_WORKER_LEASE_SECONDS ?? 60);
const POLL_MS = Number(process.env.TASK_WORKER_POLL_MS ?? 2_000);
const TIMEOUT_MS = Number(process.env.TASK_WORKER_HANDLER_TIMEOUT_MS ?? 120_000);

function validateConfig() {
  if (!process.env.TASK_WORKER_DATABASE_URL) throw new Error("TASK_WORKER_DATABASE_URL_REQUIRED");
  if (!/^[A-Za-z0-9._:-]{3,100}$/.test(WORKER_ID)) throw new Error("TASK_WORKER_ID_INVALID");
  if (!Number.isInteger(LEASE_SECONDS) || LEASE_SECONDS < 10 || LEASE_SECONDS > 300) throw new Error("TASK_WORKER_LEASE_INVALID");
  if (!Number.isInteger(POLL_MS) || POLL_MS < 250 || POLL_MS > 30_000) throw new Error("TASK_WORKER_POLL_INVALID");
  if (!Number.isInteger(TIMEOUT_MS) || TIMEOUT_MS < 1_000 || TIMEOUT_MS > 900_000) throw new Error("TASK_WORKER_TIMEOUT_INVALID");
}

function taskError(code, message, retryable = false) {
  return Object.assign(new Error(message), { code, retryable });
}

export function safeFailure(error) {
  const rawMessage = String(error?.message ?? "Task handler failed");
  const knownRetryableMessage = rawMessage === "TASK_HANDLER_TIMEOUT" || rawMessage === "WORKER_SHUTTING_DOWN";
  const code = /^[A-Z0-9_]{2,80}$/.test(error?.code ?? "")
    ? error.code
    : knownRetryableMessage ? rawMessage
    : error?.name === "AbortError" ? "UPSTREAM_REQUEST_ABORTED"
    : "TASK_HANDLER_FAILED";
  const message = redactErrorMessage(rawMessage);
  return {
    code,
    message,
    retryable: error?.retryable === true || knownRetryableMessage || error?.name === "AbortError"
  };
}

function assertRepo(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/.test(value)) {
    throw taskError("REPOSITORY_REFERENCE_INVALID", "payload.repo must be owner/repository");
  }
  return value;
}

async function githubGet(path, signal) {
  const token = process.env.VAYRO_GITHUB_READ_TOKEN;
  let response;
  try {
    response = await fetch(`https://api.github.com${path}`, {
      method: "GET", redirect: "error", signal,
      headers: {
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        "user-agent": "VAYRO-read-only-engineering-worker",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      }
    });
  } catch (error) {
    if (signal?.aborted) throw signal.reason ?? error;
    throw taskError("GITHUB_NETWORK_ERROR", "GitHub API network request failed", true);
  }
  const body = await response.text();
  if (Buffer.byteLength(body, "utf8") > 262_144) throw taskError("UPSTREAM_RESPONSE_TOO_LARGE", "GitHub response exceeded 256 KiB");
  if (!response.ok) throw taskError(response.status === 404 ? "REPOSITORY_NOT_FOUND" : "GITHUB_API_ERROR", `GitHub API HTTP ${response.status}`, response.status === 429 || response.status >= 500);
  try { return JSON.parse(body); }
  catch { throw taskError("UPSTREAM_INVALID_JSON", "GitHub API returned invalid JSON", true); }
}

const handlers = Object.freeze({
  async "report.generate"(task) {
    const payload = task.payload ?? {};
    if (typeof payload !== "object" || Array.isArray(payload)) throw taskError("TASK_PAYLOAD_INVALID", "Payload must be an object");
    const serialized = JSON.stringify(payload);
    return {
      reportType: typeof payload.reportType === "string" ? payload.reportType.slice(0, 80) : "task-input-summary",
      taskId: task.task_id, projectKey: task.project_key, title: task.title,
      generatedAt: new Date().toISOString(),
      inputSha256: createHash("sha256").update(serialized).digest("hex"),
      inputBytes: Buffer.byteLength(serialized, "utf8"),
      executionMode: "deterministic-read-only"
    };
  },
  async "repo.audit"(task, { signal }) {
    const repo = assertRepo(task.payload?.repo);
    const [metadata, commits] = await Promise.all([
      githubGet(`/repos/${repo}`, signal),
      githubGet(`/repos/${repo}/commits?per_page=1`, signal)
    ]);
    return {
      repository: `${metadata.owner?.login ?? "unknown"}/${metadata.name ?? "unknown"}`,
      visibility: metadata.private ? "private" : "public",
      defaultBranch: metadata.default_branch ?? null,
      archived: metadata.archived === true,
      pushedAt: metadata.pushed_at ?? null,
      latestCommitSha: Array.isArray(commits) ? commits[0]?.sha ?? null : null,
      observedAt: new Date().toISOString(),
      source: "GitHub REST read-only API"
    };
  },
  async "repo.test"(task, { signal }) {
    const repo = assertRepo(task.payload?.repo);
    const data = await githubGet(`/repos/${repo}/actions/runs?per_page=10`, signal);
    return {
      repository: repo, mode: "read-only-existing-ci-observation",
      observedAt: new Date().toISOString(),
      runs: (Array.isArray(data.workflow_runs) ? data.workflow_runs : []).slice(0, 10).map(run => ({
        name: String(run.name ?? "unknown").slice(0, 120),
        status: String(run.status ?? "unknown").slice(0, 40),
        conclusion: run.conclusion ?? null, headSha: run.head_sha ?? null,
        event: run.event ?? null, updatedAt: run.updated_at ?? null
      }))
    };
  }
});

export const taskWorkerHandlers = handlers;

async function assertWorkerRole(db) {
  const rows = await db.$queryRaw`
    SELECT r.rolsuper AS superuser, r.rolbypassrls AS bypasses_rls, r.rolcanlogin AS can_login,
      pg_has_role(current_user, 'vayro_task_worker', 'MEMBER') AS worker_member,
      EXISTS (SELECT 1 FROM pg_roles x WHERE (x.rolsuper OR x.rolbypassrls)
        AND pg_has_role(current_user, x.oid, 'MEMBER')) AS elevated_membership,
      EXISTS (SELECT 1 FROM pg_roles x WHERE x.rolname NOT IN ('vayro_task_worker', current_user)
        AND pg_has_role(current_user, x.oid, 'MEMBER')) AS other_membership,
      EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relowner=r.oid) AS owns_tables
    FROM pg_roles r WHERE r.rolname=current_user
  `;
  const role = rows[0];
  if (!role || role.superuser || role.bypasses_rls || !role.can_login || !role.worker_member ||
      role.elevated_membership || role.other_membership || role.owns_tables) {
    throw new Error("UNSAFE_TASK_WORKER_DATABASE_ROLE");
  }
}

async function executeTask(db, task, shutdownSignal) {
  const controller = new AbortController();
  const abortFromShutdown = () => controller.abort(new Error("WORKER_SHUTTING_DOWN"));
  shutdownSignal.addEventListener("abort", abortFromShutdown, { once: true });
  const heartbeat = setInterval(async () => {
    try {
      const rows = await db.$queryRaw`
        SELECT public.vayro_heartbeat_engineering_task(${task.task_id}, ${WORKER_ID}, ${task.lease_token}, ${LEASE_SECONDS}) AS accepted
      `;
      if (rows[0]?.accepted !== true) controller.abort(new Error("TASK_LEASE_LOST"));
    } catch { /* A later heartbeat or lease expiry is the recovery boundary. */ }
  }, Math.max(3_000, Math.floor(LEASE_SECONDS * 1_000 / 3)));
  heartbeat.unref?.();
  const timeout = setTimeout(() => controller.abort(new Error("TASK_HANDLER_TIMEOUT")), TIMEOUT_MS);
  timeout.unref?.();
  try {
    const handler = handlers[task.handler_key];
    if (!handler) throw taskError("TASK_HANDLER_NOT_IMPLEMENTED", `No approved handler for ${task.handler_key}`);
    const aborted = new Promise((_, reject) => {
      if (controller.signal.aborted) reject(controller.signal.reason);
      else controller.signal.addEventListener("abort", () => reject(controller.signal.reason), { once: true });
    });
    const result = await Promise.race([handler(task, { signal: controller.signal }), aborted]);
    const serialized = JSON.stringify(result ?? null);
    if (Buffer.byteLength(serialized, "utf8") > MAX_RESULT_BYTES) throw taskError("TASK_RESULT_TOO_LARGE", "Result exceeded 64 KiB");
    const rows = await db.$queryRaw`
      SELECT public.vayro_complete_engineering_task(${task.task_id}, ${WORKER_ID}, ${task.lease_token}, ${serialized}::jsonb) AS accepted
    `;
    console.info(JSON.stringify({ event: rows[0]?.accepted ? "task_succeeded" : "task_completion_rejected", taskId: task.task_id, handlerKey: task.handler_key }));
  } catch (error) {
    if (error?.message === "TASK_LEASE_LOST") return;
    const failure = safeFailure(error);
    try {
      const rows = await db.$queryRaw`
        SELECT public.vayro_fail_engineering_task(${task.task_id}, ${WORKER_ID}, ${task.lease_token}, ${failure.code}, ${failure.message}, ${failure.retryable}) AS accepted
      `;
      console.error(JSON.stringify({ event: "task_failed", taskId: task.task_id, code: failure.code, accepted: rows[0]?.accepted === true }));
    } catch (persistError) {
      console.error(JSON.stringify({ event: "task_failure_persist_error", taskId: task.task_id, code: safeFailure(persistError).code }));
    }
  } finally {
    clearInterval(heartbeat); clearTimeout(timeout);
    shutdownSignal.removeEventListener("abort", abortFromShutdown);
  }
}

async function main() {
  validateConfig();
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient({ datasources: { db: { url: process.env.TASK_WORKER_DATABASE_URL } } });
  const shutdown = new AbortController();
  const stop = () => shutdown.abort();
  process.once("SIGTERM", stop); process.once("SIGINT", stop);
  try {
    await assertWorkerRole(db);
    console.info(JSON.stringify({ event: "worker_started", workerId: WORKER_ID, concurrency: 1 }));
    let backoff = POLL_MS;
    while (!shutdown.signal.aborted) {
      try {
        const rows = await db.$queryRaw`
          SELECT * FROM public.vayro_claim_engineering_task(${WORKER_ID}, ${LEASE_SECONDS})
        `;
        backoff = POLL_MS;
        if (rows[0]) await executeTask(db, rows[0], shutdown.signal);
        else await sleep(POLL_MS);
      } catch (error) {
        console.error(JSON.stringify({ event: "worker_loop_error", code: safeFailure(error).code, retryInMs: backoff }));
        await sleep(backoff);
        backoff = Math.min(30_000, backoff * 2);
      }
    }
  } finally {
    await db.$disconnect();
    process.removeListener("SIGTERM", stop); process.removeListener("SIGINT", stop);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(JSON.stringify({ event: "worker_fatal", code: safeFailure(error).code }));
    process.exitCode = 1;
  });
}
