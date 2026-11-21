import test from "node:test";
import assert from "node:assert/strict";
import { assertProductIntegrationEnvelope } from "./product-integration-contract.mjs";

const validEnvelope = () => ({
  eventId: "evt_01JTEST000000000000000001",
  eventType: "commerce.order.created",
  schemaVersion: "1.0.0",
  occurredAt: "2026-11-21T12:00:00.000Z",
  producer: { product: "CHARSU", service: "orders" },
  tenantId: "tenant_123",
  correlationId: "corr_123",
  idempotencyKey: "CHARSU:order_123:created:v1",
  actor: { type: "user", id: "user_123", scopes: ["orders:write"] },
  data: { orderId: "order_123" }
});

test("accepts a versioned, tenant-scoped product integration event", () => {
  assert.equal(assertProductIntegrationEnvelope(validEnvelope()), true);
});

test("rejects an event without a tenant boundary", () => {
  const event = validEnvelope();
  delete event.tenantId;
  assert.throws(
    () => assertProductIntegrationEnvelope(event),
    /INTEGRATION_TENANT_REQUIRED/
  );
});

test("rejects unknown product producers and unsupported schema versions", () => {
  const unknownProducer = validEnvelope();
  unknownProducer.producer.product = "UNKNOWN_APP";
  assert.throws(
    () => assertProductIntegrationEnvelope(unknownProducer),
    /INTEGRATION_PRODUCER_UNKNOWN/
  );

  const unsupportedVersion = validEnvelope();
  unsupportedVersion.schemaVersion = "latest";
  assert.throws(
    () => assertProductIntegrationEnvelope(unsupportedVersion),
    /INTEGRATION_SCHEMA_VERSION_INVALID/
  );
});

test("requires correlation, idempotency and an explicit actor scope", () => {
  const noCorrelation = validEnvelope();
  delete noCorrelation.correlationId;
  assert.throws(
    () => assertProductIntegrationEnvelope(noCorrelation),
    /INTEGRATION_CORRELATION_REQUIRED/
  );

  const noIdempotency = validEnvelope();
  delete noIdempotency.idempotencyKey;
  assert.throws(
    () => assertProductIntegrationEnvelope(noIdempotency),
    /INTEGRATION_IDEMPOTENCY_REQUIRED/
  );

  const noScopes = validEnvelope();
  noScopes.actor.scopes = [];
  assert.throws(
    () => assertProductIntegrationEnvelope(noScopes),
    /INTEGRATION_ACTOR_SCOPE_REQUIRED/
  );
});

test("rejects malformed timestamps and non-object event data", () => {
  const invalidTimestamp = validEnvelope();
  invalidTimestamp.occurredAt = "yesterday";
  assert.throws(
    () => assertProductIntegrationEnvelope(invalidTimestamp),
    /INTEGRATION_TIMESTAMP_INVALID/
  );

  const invalidData = validEnvelope();
  invalidData.data = [];
  assert.throws(
    () => assertProductIntegrationEnvelope(invalidData),
    /INTEGRATION_DATA_INVALID/
  );
});
