import type { Prisma } from "@prisma/client";
import { assertTaskWorkerRuntimeRole, taskWorkerPrisma } from "@/lib/task-worker-prisma";

export type ClaimedEngineeringTask = {
  task_id: string;
  project_key: string;
  task_type: string;
  handler_key: string;
  title: string;
  payload: Prisma.JsonValue | null;
  attempt_number: number;
  lease_token: string;
  deadline: Date | null;
};

const WORKER_ID = /^[A-Za-z0-9._:-]{3,100}$/;
const LEASE_TOKEN = /^[a-f0-9-]{16,80}$/i;

function assertWorkerId(workerId: string): void {
  if (!WORKER_ID.test(workerId)) throw new Error("TASK_WORKER_ID_INVALID");
}

function assertLease(taskId: string, workerId: string, leaseToken: string): void {
  if (!taskId || taskId.length > 100) throw new Error("TASK_ID_INVALID");
  assertWorkerId(workerId);
  if (!LEASE_TOKEN.test(leaseToken)) throw new Error("TASK_LEASE_TOKEN_INVALID");
}

function redactErrorMessage(message: string): string {
  return message
    .replace(/(password|token|secret|authorization|api[_-]?key)\s*[:=]\s*\S+/gi, "$1=[REDACTED]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [REDACTED]")
    .replace(/([?&](?:token|key|secret|password)=)[^&\s]+/gi, "$1[REDACTED]")
    .slice(0, 500);
}

export async function claimNextEngineeringTask({
  workerId, leaseSeconds = 60
}: {
  workerId: string; leaseSeconds?: number;
}): Promise<ClaimedEngineeringTask | null> {
  assertWorkerId(workerId);
  if (!Number.isInteger(leaseSeconds) || leaseSeconds < 10 || leaseSeconds > 300) throw new Error("TASK_LEASE_DURATION_INVALID");
  await assertTaskWorkerRuntimeRole();
  const tasks = await taskWorkerPrisma.$queryRaw<ClaimedEngineeringTask[]>\`
    SELECT * FROM public.vayro_claim_engineering_task(\${workerId}, \${leaseSeconds})
  \`;
  return tasks[0] ?? null;
}

export async function heartbeatEngineeringTask({
  taskId, workerId, leaseToken, leaseSeconds = 60
}: {
  taskId: string; workerId: string; leaseToken: string; leaseSeconds?: number;
}): Promise<boolean> {
  assertLease(taskId, workerId, leaseToken);
  if (!Number.isInteger(leaseSeconds) || leaseSeconds < 10 || leaseSeconds > 300) throw new Error("TASK_LEASE_DURATION_INVALID");
  await assertTaskWorkerRuntimeRole();
  const rows = await taskWorkerPrisma.$queryRaw<Array<{ accepted: boolean }>>\`
    SELECT public.vayro_heartbeat_engineering_task(\${taskId}, \${workerId}, \${leaseToken}, \${leaseSeconds}) AS accepted
  \`;
  return rows[0]?.accepted === true;
}

export async function completeEngineeringTask({
  taskId, workerId, leaseToken, result = null
}: {
  taskId: string; workerId: string; leaseToken: string; result?: unknown;
}): Promise<boolean> {
  assertLease(taskId, workerId, leaseToken);
  let serialized: string | null;
  try { serialized = result === null ? null : JSON.stringify(result) ?? null; }
  catch { throw new Error("TASK_RESULT_NOT_JSON"); }
  if (serialized !== null && Buffer.byteLength(serialized, "utf8") > 65_536) throw new Error("TASK_RESULT_TOO_LARGE");
  await assertTaskWorkerRuntimeRole();
  const rows = await taskWorkerPrisma.$queryRaw<Array<{ accepted: boolean }>>\`
    SELECT public.vayro_complete_engineering_task(\${taskId}, \${workerId}, \${leaseToken}, \${serialized}::jsonb) AS accepted
  \`;
  return rows[0]?.accepted === true;
}

export async function failEngineeringTask({
  taskId, workerId, leaseToken, errorCode, errorMessage, retryable = true
}: {
  taskId: string; workerId: string; leaseToken: string;
  errorCode: string; errorMessage: string; retryable?: boolean;
}): Promise<boolean> {
  assertLease(taskId, workerId, leaseToken);
  if (!/^[A-Z0-9_]{2,80}$/.test(errorCode)) throw new Error("TASK_ERROR_CODE_INVALID");
  if (typeof errorMessage !== "string") throw new Error("TASK_ERROR_MESSAGE_INVALID");
  if (typeof retryable !== "boolean") throw new Error("TASK_RETRY_FLAG_INVALID");
  await assertTaskWorkerRuntimeRole();
  const safeMessage = redactErrorMessage(errorMessage);
  const rows = await taskWorkerPrisma.$queryRaw<Array<{ accepted: boolean }>>\`
    SELECT public.vayro_fail_engineering_task(\${taskId}, \${workerId}, \${leaseToken}, \${errorCode}, \${safeMessage}, \${retryable}) AS accepted
  \`;
  return rows[0]?.accepted === true;
}
