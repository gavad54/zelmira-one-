import test from "node:test";
import assert from "node:assert/strict";
import { resolveProductAccess } from "../src/lib/product-access.mjs";

const now = new Date("2026-11-11T12:00:00.000Z");

test("grants product access only when product is active and license window is current", () => {
  assert.deepEqual(resolveProductAccess({
    productStatus: "ACTIVE",
    active: true,
    startsAt: new Date("2026-11-01T00:00:00.000Z"),
    endsAt: new Date("2026-12-01T00:00:00.000Z")
  }, now), { allowed: true, reason: "active" });
});

test("denies access for inactive product, inactive license, future start and expired end", () => {
  for (const input of [
    { productStatus: "PLANNED", active: true, startsAt: new Date("2026-11-01Z"), endsAt: null },
    { productStatus: "MAINTENANCE", active: true, startsAt: new Date("2026-11-01Z"), endsAt: null },
    { productStatus: "ACTIVE", active: false, startsAt: new Date("2026-11-01Z"), endsAt: null },
    { productStatus: "ACTIVE", active: true, startsAt: new Date("2026-11-12Z"), endsAt: null },
    { productStatus: "ACTIVE", active: true, startsAt: new Date("2026-11-01Z"), endsAt: new Date("2026-11-11T11:59:59Z") }
  ]) assert.equal(resolveProductAccess(input, now).allowed, false);
});

test("uses an exclusive end boundary and rejects malformed dates or unknown states", () => {
  assert.equal(resolveProductAccess({
    productStatus: "ACTIVE", active: true,
    startsAt: new Date("2026-11-01Z"), endsAt: new Date("2026-11-11T12:00:00Z")
  }, now).reason, "expired");
  assert.equal(resolveProductAccess({
    productStatus: "ACTIVE", active: true,
    startsAt: new Date("invalid"), endsAt: null
  }, now).reason, "invalid_license");
  assert.equal(resolveProductAccess({
    productStatus: "RETIRED", active: true,
    startsAt: new Date("2026-11-01Z"), endsAt: null
  }, now).reason, "product_unavailable");
});
