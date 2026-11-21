export const TASK_STATUSES = Object.freeze([
  "DRAFT", "QUEUED", "RUNNING", "BLOCKED", "WAITING_APPROVAL",
  "RETRYING", "SUCCEEDED", "FAILED", "CANCELLED", "EXPIRED"
]);

export const TASK_HANDLERS = Object.freeze([
  "repo.audit", "repo.test", "product.health_check", "report.generate"
]);

const TERMINAL = new Set(["SUCCEEDED", "FAILED", "CANCELLED", "EXPIRED"]);
const MAX_PAYLOAD_BYTES = 64 * 1024;
const MAX_DEPTH = 8;
const MAX_ARRAY_ITEMS = 500;
const MAX_OBJECT_KEYS = 100;
const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function assertJson(value, depth = 0, ancestors = new WeakSet()) {
  if (depth > MAX_DEPTH) throw new Error("TASK_PAYLOAD_TOO_DEEP");
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("TASK_PAYLOAD_NOT_JSON");
    return;
  }
  if (typeof value !== "object" || ancestors.has(value)) throw new Error("TASK_PAYLOAD_NOT_JSON");
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      if (value.length > MAX_ARRAY_ITEMS) throw new Error("TASK_PAYLOAD_ARRAY_LIMIT");
      for (const item of value) assertJson(item, depth + 1, ancestors);
      return;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new Error("TASK_PAYLOAD_NOT_JSON");
    const keys = Object.keys(value);
    if (keys.length > MAX_OBJECT_KEYS) throw new Error("TASK_PAYLOAD_OBJECT_LIMIT");
    for (const key of keys) {
      if (UNSAFE_KEYS.has(key)) throw new Error("TASK_PAYLOAD_UNSAFE_KEY");
      assertJson(value[key], depth + 1, ancestors);
    }
  } finally {
    ancestors.delete(value);
  }
}

function validDate(value, code) {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(code);
  return date;
}

export function validateTaskDefinition(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("TASK_INPUT_INVALID");
  const { projectKey, handlerKey, title, idempotencyKey } = input;
  if (typeof projectKey !== "string" || !/^[A-Z][A-Z0-9_-]{1,39}$/.test(projectKey)) throw new Error("TASK_PROJECT_INVALID");
  if (typeof handlerKey !== "string" || !TASK_HANDLERS.includes(handlerKey)) throw new Error("TASK_HANDLER_NOT_ALLOWED");
  if (typeof title !== "string" || title.trim().length < 3 || title.length > 160) throw new Error("TASK_TITLE_INVALID");
  if (typeof idempotencyKey !== "string" || idempotencyKey.length < 8 || idempotencyKey.length > 200) throw new Error("TASK_IDEMPOTENCY_KEY_INVALID");
  const priority = input.priority ?? 50;
  if (!Number.isInteger(priority) || priority < 0 || priority > 100) throw new Error("TASK_PRIORITY_INVALID");
  const maxAttempts = input.maxAttempts ?? 3;
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) throw new Error("TASK_MAX_ATTEMPTS_INVALID");
  if (input.approvalRequired != null && typeof input.approvalRequired !== "boolean") throw new Error("TASK_APPROVAL_FLAG_INVALID");
  const scheduledAt = validDate(input.scheduledAt, "TASK_SCHEDULE_INVALID");
  const deadline = validDate(input.deadline, "TASK_DEADLINE_INVALID");
  if (scheduledAt && deadline && deadline <= scheduledAt) throw new Error("TASK_DEADLINE_BEFORE_SCHEDULE");
  const payload = input.payload ?? {};
  assertJson(payload);
  if (Buffer.byteLength(JSON.stringify(payload), "utf8") > MAX_PAYLOAD_BYTES) throw new Error("TASK_PAYLOAD_TOO_LARGE");
  return Object.freeze({
    projectKey, handlerKey, title: title.trim(), idempotencyKey, priority, maxAttempts,
    approvalRequired: input.approvalRequired === true, scheduledAt, deadline, payload
  });
}

export function createTaskRecord(definition, now = new Date()) {
  const valid = validateTaskDefinition(definition);
  const createdAt = validDate(now, "TASK_CLOCK_INVALID");
  const status = valid.approvalRequired ? "WAITING_APPROVAL" : "QUEUED";
  return {
    ...valid, status, attemptCount: 0, availableAt: valid.scheduledAt ?? createdAt,
    leaseOwner: null, leaseToken: null, leaseExpiresAt: null, heartbeatAt: null,
    result: null, lastErrorCode: null, lastErrorMessage: null,
    createdAt, updatedAt: createdAt, startedAt: null, completedAt: null
  };
}

export function approveTask(task, now = new Date()) {
  if (task.status !== "WAITING_APPROVAL") throw new Error("TASK_NOT_WAITING_APPROVAL");
  const at = validDate(now, "TASK_CLOCK_INVALID");
  return { ...task, status: "QUEUED", availableAt: task.scheduledAt ?? at, updatedAt: at };
}

export function claimTask(task, { workerId, leaseToken, now = new Date(), leaseMs = 60_000 }) {
  const at = validDate(now, "TASK_CLOCK_INVALID");
  if (typeof workerId !== "string" || !/^[a-zA-Z0-9._:-]{3,100}$/.test(workerId)) throw new Error("TASK_WORKER_ID_INVALID");
  if (typeof leaseToken !== "string" || !/^[a-f0-9-]{16,80}$/i.test(leaseToken)) throw new Error("TASK_LEASE_TOKEN_INVALID");
  if (!Number.isInteger(leaseMs) || leaseMs < 10_000 || leaseMs > 300_000) throw new Error("TASK_LEASE_DURATION_INVALID");
  if (task.deadline instanceof Date && task.deadline <= at) throw new Error("TASK_DEADLINE_EXPIRED");
  const due = task.availableAt instanceof Date && task.availableAt <= at;
  const claimable = (task.status === "QUEUED" || task.status === "RETRYING") && due;
  const expiredLease = task.status === "RUNNING" && task.leaseExpiresAt instanceof Date && task.leaseExpiresAt <= at;
  if (!claimable && !expiredLease) throw new Error("TASK_NOT_CLAIMABLE");
  if (task.attemptCount >= task.maxAttempts) throw new Error("TASK_ATTEMPTS_EXHAUSTED");
  return {
    ...task, status: "RUNNING", attemptCount: task.attemptCount + 1,
    leaseOwner: workerId, leaseToken, leaseExpiresAt: new Date(at.getTime() + leaseMs),
    heartbeatAt: at, startedAt: task.startedAt ?? at, updatedAt: at
  };
}

function assertLease(task, workerId, leaseToken, now) {
  const at = validDate(now, "TASK_CLOCK_INVALID");
  if (task.status !== "RUNNING" || task.leaseOwner !== workerId || task.leaseToken !== leaseToken) throw new Error("TASK_LEASE_MISMATCH");
  if (!(task.leaseExpiresAt instanceof Date) || task.leaseExpiresAt <= at) throw new Error("TASK_LEASE_EXPIRED");
  return at;
}

export function heartbeatTask(task, { workerId, leaseToken, now = new Date(), leaseMs = 60_000 }) {
  const at = assertLease(task, workerId, leaseToken, now);
  if (!Number.isInteger(leaseMs) || leaseMs < 10_000 || leaseMs > 300_000) throw new Error("TASK_LEASE_DURATION_INVALID");
  return { ...task, heartbeatAt: at, leaseExpiresAt: new Date(at.getTime() + leaseMs), updatedAt: at };
}

export function completeTask(task, { workerId, leaseToken, result = null, now = new Date() }) {
  const at = assertLease(task, workerId, leaseToken, now);
  assertJson(result);
  if (Buffer.byteLength(JSON.stringify(result), "utf8") > MAX_PAYLOAD_BYTES) throw new Error("TASK_RESULT_TOO_LARGE");
  return {
    ...task, status: "SUCCEEDED", result, completedAt: at, updatedAt: at,
    leaseOwner: null, leaseToken: null, leaseExpiresAt: null, heartbeatAt: null
  };
}

export function failTask(task, { workerId, leaseToken, errorCode, errorMessage, retryable = true, now = new Date() }) {
  const at = assertLease(task, workerId, leaseToken, now);
  if (typeof errorCode !== "string" || !/^[A-Z0-9_]{2,80}$/.test(errorCode)) throw new Error("TASK_ERROR_CODE_INVALID");
  if (typeof errorMessage !== "string" || errorMessage.length > 500) throw new Error("TASK_ERROR_MESSAGE_INVALID");
  if (typeof retryable !== "boolean") throw new Error("TASK_RETRY_FLAG_INVALID");
  const shouldRetry = retryable && task.attemptCount < task.maxAttempts;
  const backoffMs = Math.min(60 * 60_000, 5_000 * (2 ** Math.max(0, task.attemptCount - 1)));
  return {
    ...task, status: shouldRetry ? "RETRYING" : "FAILED",
    availableAt: shouldRetry ? new Date(at.getTime() + backoffMs) : task.availableAt,
    lastErrorCode: errorCode, lastErrorMessage: errorMessage,
    completedAt: shouldRetry ? null : at, updatedAt: at,
    leaseOwner: null, leaseToken: null, leaseExpiresAt: null, heartbeatAt: null
  };
}

export function cancelTask(task, now = new Date()) {
  if (TERMINAL.has(task.status)) throw new Error("TASK_ALREADY_TERMINAL");
  const at = validDate(now, "TASK_CLOCK_INVALID");
  return {
    ...task, status: "CANCELLED", completedAt: at, updatedAt: at,
    leaseOwner: null, leaseToken: null, leaseExpiresAt: null, heartbeatAt: null
  };
}
