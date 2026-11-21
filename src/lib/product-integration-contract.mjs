import { ALL_PRODUCTS } from "./product-directory.mjs";

const KNOWN_PRODUCERS = new Set(["VAYRO", ...ALL_PRODUCTS.map(({ name }) => name)]);
const SEMVER = /^\d+\.\d+\.\d+$/;
const EVENT_TYPE = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*){1,5}$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

function requireString(value, code, maxLength = 200) {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > maxLength) {
    throw new Error(code);
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

  return true;
}
