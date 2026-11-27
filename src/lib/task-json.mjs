const MAX_DEPTH = 8;
const MAX_ARRAY_ITEMS = 500;
const MAX_OBJECT_KEYS = 100;
const MAX_BYTES = 65_536;
const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function assertJson(value, depth = 0, ancestors = new WeakSet()) {
  if (depth > MAX_DEPTH) throw new Error("TASK_RESULT_NOT_JSON");
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("TASK_RESULT_NOT_JSON");
    return;
  }
  if (typeof value !== "object" || ancestors.has(value)) throw new Error("TASK_RESULT_NOT_JSON");
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      if (value.length > MAX_ARRAY_ITEMS) throw new Error("TASK_RESULT_NOT_JSON");
      for (const item of value) assertJson(item, depth + 1, ancestors);
      return;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new Error("TASK_RESULT_NOT_JSON");
    const keys = Object.keys(value);
    if (keys.length > MAX_OBJECT_KEYS) throw new Error("TASK_RESULT_NOT_JSON");
    for (const key of keys) {
      if (UNSAFE_KEYS.has(key)) throw new Error("TASK_RESULT_NOT_JSON");
      assertJson(value[key], depth + 1, ancestors);
    }
  } finally {
    ancestors.delete(value);
  }
}

export function serializeTaskResult(value, maxBytes = MAX_BYTES) {
  if (!Number.isInteger(maxBytes) || maxBytes < 1 || maxBytes > MAX_BYTES) {
    throw new Error("TASK_RESULT_LIMIT_INVALID");
  }
  assertJson(value);
  const serialized = JSON.stringify(value);
  if (Buffer.byteLength(serialized, "utf8") > maxBytes) throw new Error("TASK_RESULT_TOO_LARGE");
  return serialized;
}
