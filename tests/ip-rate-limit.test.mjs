import test from "node:test";
import assert from "node:assert/strict";
import { allowIpRateLimit } from "../src/lib/ip-rate-limit.mjs";

test("denies IP throttling when trusted client fingerprint is unavailable", async () => {
  let calls = 0;
  const limiter = async () => { calls += 1; return true; };

  assert.equal(await allowIpRateLimit(null, 8, 900000, limiter), false);
  assert.equal(await allowIpRateLimit(undefined, 8, 900000, limiter), false);
  assert.equal(await allowIpRateLimit("", 8, 900000, limiter), false);
  assert.equal(calls, 0);
});

test("delegates a trusted fingerprint to the persistent limiter", async () => {
  const calls = [];
  const limiter = async (...args) => { calls.push(args); return false; };

  assert.equal(await allowIpRateLimit("sha256-client-key", 8, 900000, limiter), false);
  assert.deepEqual(calls, [["sha256-client-key", 8, 900000]]);
});

test("preserves the persistent limiter decision for a trusted fingerprint", async () => {
  const limiter = async () => true;
  assert.equal(await allowIpRateLimit("sha256-client-key", 8, 900000, limiter), true);
});
