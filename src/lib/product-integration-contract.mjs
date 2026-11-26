import { ALL_PRODUCTS } from "./product-directory.mjs";

const KNOWN_PRODUCERS = new Set(["VAYRO", ...ALL_PRODUCTS.map(({ name }) => name)]);
const SEMVER = /^\d+\.\d+\.\d+$/;
const EVENT_TYPE = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*){1,5}$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
const MAX_DATA_BYTES = 64 * 1024;
const MAX_DATA_DEPTH = 8;
const MAX_ARRAY_ITEMS = 500;
const MAX_OBJECT_KEYS = 100;
const UNSAFE_DATA_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function requireString(value, code, maxLength = 200) {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > maxLength) {
    throw new Error(code);
  }
}

function assertSafeJsonValue(value, depth, ancestors) {
  if (depth > MAX_DATA_DEPTH) throw new Error("INTEGRATION_DATA_TOO_DEEP");

  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("INTEGRATION_DATA_NOT_JSON");
    return;
  }
  if (typeof value !== "object") throw new Error("INTEGRATION_DATA_NOT_JSON");
  if (ancestors.has(value)) throw new Error("INTEGRATION_DATA_NOT_JSON");

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      if (value.length > MAX_ARRAY_ITEMS) throw new Error("INTEGRATION_DATA_ARRAY_LIMIT");
      for (const item of value) assertSafeJsonValue(item, depth + 1, ancestors);
      return;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error("INTEGRATION_DATA_NOT_JSON");
    }
    const keys = Object.keys(value);
    if (keys.length > MAX_OBJECT_KEYS) throw new Error("INTEGRATION_DATA_OBJECT_LIMIT");
    for (const key of keys) {
      if (UNSAFE_DATA_KEYS.has(key)) throw new Error("INTEGRATION_DATA_UNSAFE_KEY");
      assertSafeJsonValue(value[key], depth + 1, ancestors);
    }
  } finally {
    ancestors.delete(value);
  }
}

function assertBoundedJsonData(data) {
  assertSafeJsonValue(data, 0, new WeakSet());
  let serialized;
  try {
    serialized = JSON.stringify(data);
  } catch {
    throw new Error("INTEGRATION_DATA_NOT_JSON");
  }
  if (typeof serialized !== "string" || new TextEncoder().encode(serialized).byteLength > MAX_DATA_BYTES) {
    throw new Error("INTEGRATION_DATA_TOO_LARGE");
  }
}

export function assertProductIntegrationEnvelope(event) {
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    throw new Error("INTEGRATION_ENVELOPE_INVALID");
  }

  requireString(event.eventId, "INTEGRATION_EVENT_ID_REQUIRED");
  requireString(event.eventType, "INTEGRATION_EVENT_TYPE_INVALID");
  if (!EVENT_TYPE.test(event.eventType)) {
    throw new Error("INTEGRATION_EVENT_TYPE_INVALID");
  }
  requireString(event.schemaVersion, "INTEGRATION_SCHEMA_VERSION_INVALID", 32);
  if (!SEMVER.test(event.schemaVersion)) {
    throw new Error("INTEGRATION_SCHEMA_VERSION_INVALID");
  }

  requireString(event.occurredAt, "INTEGRATION_TIMESTAMP_INVALID", 40);
  if (!ISO_TIMESTAMP.test(event.occurredAt) || !Number.isFinite(Date.parse(event.occurredAt))) {
    throw new Error("INTEGRATION_TIMESTAMP_INVALID");
  }

  if (!event.producer || typeof event.producer !== "object" || Array.isArray(event.producer)) {
    throw new Error("INTEGRATION_PRODUCER_UNKNOWN");
  }
  requireString(event.producer.product, "INTEGRATION_PRODUCER_UNKNOWN", 40);
  if (!KNOWN_PRODUCERS.has(event.producer.product)) {
    throw new Error("INTEGRATION_PRODUCER_UNKNOWN");
  }
  requireString(event.producer.service, "INTEGRATION_PRODUCER_SERVICE_REQUIRED", 80);

  requireString(event.tenantId, "INTEGRATION_TENANT_REQUIRED");
  requireString(event.correlationId, "INTEGRATION_CORRELATION_REQUIRED");
  requireString(event.idempotencyKey, "INTEGRATION_IDEMPOTENCY_REQUIRED");

  if (!event.actor || typeof event.actor !== "object" || Array.isArray(event.actor) ||
      !["user", "service"].includes(event.actor.type)) {
    throw new Error("INTEGRATION_ACTOR_INVALID");
  }
  requireString(event.actor.id, "INTEGRATION_ACTOR_INVALID");
  if (!Array.isArray(event.actor.scopes) || event.actor.scopes.length === 0 ||
      event.actor.scopes.some(scope => typeof scope !== "string" || scope.trim().length === 0)) {
    throw new Error("INTEGRATION_ACTOR_SCOPE_REQUIRED");
  }

  if (!event.data || typeof event.data !== "object" || Array.isArray(event.data)) {
    throw new Error("INTEGRATION_DATA_INVALID");
  }
  assertBoundedJsonData(event.data);

  return true;
}
