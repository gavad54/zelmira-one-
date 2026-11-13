import test from "node:test";
import assert from "node:assert/strict";
import { currentActiveLicenseWhere } from "../src/lib/owner-metrics.mjs";

test("current active license predicate excludes licenses that have not started", () => {
  const now = new Date("2026-11-13T09:00:00.000Z");

  assert.deepEqual(currentActiveLicenseWhere(now), {
    active: true,
    startsAt: { lte: now },
    OR: [{ endsAt: null }, { endsAt: { gt: now } }]
  });
});

test("current active license predicate rejects an invalid evaluation time", () => {
  assert.throws(
    () => currentActiveLicenseWhere(new Date("invalid")),
    { name: "TypeError", message: "INVALID_LICENSE_EVALUATION_TIME" }
  );
});
