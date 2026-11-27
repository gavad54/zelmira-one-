const MAX_DEPTH = 8;
const MAX_ARRAY_ITEMS = 500;
const MAX_OBJECT_KEYS = 100;
const MAX_NODES = 10_000;
const MAX_BYTES = 65_536;
const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function assertDataProperty(value, key, depth, ancestors, budget) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, "value")) {
    throw new Error("TASK_RESULT_NOT_JSON");
  }
  assertJson(descriptor.value, depth + 1, ancestors, budget);
}

function assertJson(value, depth = 0, ancestors = new WeakSet(), budget = { visited: 0 }) {
  budget.visited += 1;
  if (budget.visited > MAX_NODES || depth > MAX_DEPTH) {
    throw new Error("TASK_RESULT_NOT_JSON");
  }
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("TASK_RESULT_NOT_JSON");
    return;
  }
  if (typeof value !== "object" || ancestors.has(value)) throw new Error("TASK_RESULT_NOT_JSON");
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype || value.length > MAX_ARRAY_ITEMS) {
        throw new Error("TASK_RESULT_NOT_JSON");
      }
      const keys = Reflect.ownKeys(value);
      if (keys.length !== value.length + 1 || !keys.includes("length")) {
        throw new Error("TASK_RESULT_NOT_JSON");
      }
      for (let index = 0; index < value.length; index += 1) {
        const key = String(index);
        if (!keys.includes(key)) throw new Error("TASK_RESULT_NOT_JSON");
        assertDataProperty(value, key, depth, ancestors, budget);
      }
      return;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new Error("TASK_RESULT_NOT_JSON");
    const keys = Reflect.ownKeys(value);
    if (keys.length > MAX_OBJECT_KEYS || keys.some((key) => typeof key !== "string")) {
      throw new Error("TASK_RESULT_NOT_JSON");
    }
    for (const key of keys) {
      if (UNSAFE_KEYS.has(key)) throw new Error("TASK_RESULT_NOT_JSON");
      assertDataProperty(value, key, depth, ancestors, budget);
    }
  } finally {
    ancestors.delete(value);
  }
}

export function serializeTaskResult(value, maxBytes = MAX_BYTES) {
  if (!Number.isInteger(maxBytes) || maxBytes < 1 || maxBytes > MAX_BYTES) {
    throw new Error("TASK_RESULT_LIMIT_INVALID");
  }
  try {
    assertJson(value);
    const serialized = JSON.stringify(value);
    if (typeof serialized !== "string") throw new Error("TASK_RESULT_NOT_JSON");
    if (Buffer.byteLength(serialized, "utf8") > maxBytes) throw new Error("TASK_RESULT_TOO_LARGE");
    return serialized;
  } catch (error) {
    if (error instanceof Error && error.message === "TASK_RESULT_TOO_LARGE") throw error;
    throw new Error("TASK_RESULT_NOT_JSON");
  }
}

// Preserve the database SQL NULL contract; JSONB null is a distinct value.
export function serializeTaskResultForDatabase(value, maxBytes = MAX_BYTES) {
  return value === null ? null : serializeTaskResult(value, maxBytes);
}
