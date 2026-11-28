const MAX_DEPTH = 8;
const MAX_ARRAY_ITEMS = 500;
const MAX_OBJECT_KEYS = 100;
const MAX_NODES = 10_000;
const MAX_BYTES = 65_536;
const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function taskResultError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function accountStringBytes(value, budget) {
  const bytes = Buffer.byteLength(value, "utf8");
  if (bytes > budget.maxBytes - budget.stringBytes) {
    throw taskResultError("TASK_RESULT_TOO_LARGE");
  }
  budget.stringBytes += bytes;
}

function assertDataProperty(value, key, depth, ancestors, budget) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, "value")) {
    throw taskResultError("TASK_RESULT_NOT_JSON");
  }
  assertJson(descriptor.value, depth + 1, ancestors, budget);
}

function assertJson(value, depth, ancestors, budget) {
  budget.visited += 1;
  if (budget.visited > MAX_NODES || depth > MAX_DEPTH) {
    throw taskResultError("TASK_RESULT_NOT_JSON");
  }
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") {
    accountStringBytes(value, budget);
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw taskResultError("TASK_RESULT_NOT_JSON");
    return;
  }
  if (typeof value !== "object" || ancestors.has(value)) throw taskResultError("TASK_RESULT_NOT_JSON");
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype || value.length > MAX_ARRAY_ITEMS) {
        throw taskResultError("TASK_RESULT_NOT_JSON");
      }
      const keys = Reflect.ownKeys(value);
      if (keys.length !== value.length + 1 || !keys.includes("length")) {
        throw taskResultError("TASK_RESULT_NOT_JSON");
      }
      for (let index = 0; index < value.length; index += 1) {
        const key = String(index);
        if (!keys.includes(key)) throw taskResultError("TASK_RESULT_NOT_JSON");
        assertDataProperty(value, key, depth, ancestors, budget);
      }
      return;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw taskResultError("TASK_RESULT_NOT_JSON");
    const keys = Reflect.ownKeys(value);
    if (keys.length > MAX_OBJECT_KEYS || keys.some((key) => typeof key !== "string")) {
      throw taskResultError("TASK_RESULT_NOT_JSON");
    }
    for (const key of keys) {
      if (UNSAFE_KEYS.has(key)) throw taskResultError("TASK_RESULT_NOT_JSON");
      accountStringBytes(key, budget);
      assertDataProperty(value, key, depth, ancestors, budget);
    }
  } finally {
    ancestors.delete(value);
  }
}

export function serializeTaskResult(value, maxBytes = MAX_BYTES) {
  if (!Number.isInteger(maxBytes) || maxBytes < 1 || maxBytes > MAX_BYTES) {
    throw taskResultError("TASK_RESULT_LIMIT_INVALID");
  }
  try {
    const budget = { visited: 0, stringBytes: 0, maxBytes };
    assertJson(value, 0, new WeakSet(), budget);
    const serialized = JSON.stringify(value);
    if (typeof serialized !== "string") throw taskResultError("TASK_RESULT_NOT_JSON");
    if (Buffer.byteLength(serialized, "utf8") > maxBytes) throw taskResultError("TASK_RESULT_TOO_LARGE");
    return serialized;
  } catch (error) {
    if (error?.code === "TASK_RESULT_TOO_LARGE" || error?.code === "TASK_RESULT_NOT_JSON") throw error;
    throw taskResultError("TASK_RESULT_NOT_JSON");
  }
}

// Preserve the database SQL NULL contract; JSONB null is a distinct value.
export function serializeTaskResultForDatabase(value, maxBytes = MAX_BYTES) {
  return value === null ? null : serializeTaskResult(value, maxBytes);
}
