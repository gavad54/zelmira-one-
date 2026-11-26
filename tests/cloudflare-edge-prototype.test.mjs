import test from "node:test";
import assert from "node:assert/strict";
import { handleRequest } from "../cloudflare/prototype/worker.mjs";

test("health endpoint reports isolated mode without production connections", async () => {
  const response = await handleRequest(new Request("https://example.test/health"));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, "alive");
  assert.equal(body.service, "vayro-cloudflare-edge-prototype");
  assert.equal(body.mode, "isolated");
  assert.equal(body.productionConnected, false);
  assert.equal(body.databaseConnected, false);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("root endpoint returns a non-production marker and security headers", async () => {
  const response = await handleRequest(new Request("https://example.test/"));

  assert.equal(response.status, 200);
  assert.match(await response.text(), /not the production application/i);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(response.headers.get("content-security-policy"), /default-src 'none'/);
});

test("unknown paths return 404", async () => {
  const response = await handleRequest(new Request("https://example.test/private"));
  assert.equal(response.status, 404);
});

test("non-GET methods return 405 and advertise the allowed method", async () => {
  const response = await handleRequest(
    new Request("https://example.test/health", { method: "POST" })
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET");
});
