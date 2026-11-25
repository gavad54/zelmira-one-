import test from "node:test";
import assert from "node:assert/strict";
import { advanceRecurringSchedule, materializeDueOccurrence, occurrenceIdempotencyKey, validateRecurringSchedule } from "../src/engine/recurring-scheduler.mjs";

const base = {
  scheduleId: "daily-audit", projectKey: "VAYRO", handlerKey: "repo.audit", title: "Audit VAYRO",
  interval: 1, unit: "DAYS", startAt: "2026-11-20T10:00:00.000Z"
};

test("validates bounded UTC interval schedules and rejects unsafe handlers", () => {
  assert.equal(validateRecurringSchedule(base).intervalMs, 86_400_000);
  assert.throws(() => validateRecurringSchedule({ ...base, handlerKey: "shell.exec" }), /SCHEDULE_HANDLER_NOT_ALLOWED/);
  assert.throws(() => validateRecurringSchedule({ ...base, interval: 0 }), /SCHEDULE_INTERVAL_INVALID/);
  assert.throws(() => validateRecurringSchedule({ ...base, unit: "MONTHS" }), /SCHEDULE_UNIT_INVALID/);
});

test("materializes deterministic occurrence keys for a missed schedule", () => {
  const occurrence = materializeDueOccurrence(base, new Date("2026-11-23T10:00:00.000Z"));
  assert.equal(occurrence.scheduledAt.toISOString(), "2026-11-23T10:00:00.000Z");
  assert.equal(occurrence.idempotencyKey, occurrenceIdempotencyKey("daily-audit", occurrence.scheduledAt));
  assert.equal(occurrence.idempotencyKey, "schedule:daily-audit:2026-11-23T10:00:00.000Z");
});

test("skip policy emits latest due occurrence while catch-up emits only one oldest due occurrence", () => {
  const now = new Date("2026-11-23T10:00:00.000Z");
  assert.equal(materializeDueOccurrence(base, now).scheduledAt.toISOString(), now.toISOString());
  assert.equal(materializeDueOccurrence({ ...base, missedRunPolicy: "CATCH_UP_ONCE" }, now).scheduledAt.toISOString(), "2026-11-20T10:00:00.000Z");
});

test("advances cadence from occurrence and stops at maxRuns", () => {
  const first = materializeDueOccurrence({ ...base, maxRuns: 2 }, new Date("2026-11-20T10:00:00.000Z"));
  const next = advanceRecurringSchedule({ ...base, maxRuns: 2 }, first.scheduledAt);
  assert.equal(next.nextRunAt.toISOString(), "2026-11-21T10:00:00.000Z");
  assert.equal(next.runCount, 1);
  const final = advanceRecurringSchedule(next, next.nextRunAt);
  assert.equal(final.enabled, false);
  assert.equal(final.runCount, 2);
});

test("does not materialize disabled, future, exhausted or ended schedules", () => {
  assert.equal(materializeDueOccurrence({ ...base, enabled: false }, new Date("2026-11-30T00:00:00Z")), null);
  assert.equal(materializeDueOccurrence(base, new Date("2026-11-19T00:00:00Z")), null);
  assert.equal(materializeDueOccurrence({ ...base, maxRuns: 1, runCount: 1 }, new Date("2026-11-30T00:00:00Z")), null);
  assert.equal(materializeDueOccurrence({ ...base, endAt: "2026-11-21T00:00:00Z" }, new Date("2026-11-30T00:00:00Z")), null);
});

test("catch-up-once advances beyond the backlog instead of replaying every missed interval", () => {
  const now = new Date("2026-11-23T10:00:00.000Z");
  const schedule = { ...base, missedRunPolicy: "CATCH_UP_ONCE" };
  const occurrence = materializeDueOccurrence(schedule, now);
  const advanced = advanceRecurringSchedule(schedule, occurrence.scheduledAt, now);
  assert.equal(occurrence.scheduledAt.toISOString(), "2026-11-20T10:00:00.000Z");
  assert.equal(advanced.nextRunAt.toISOString(), "2026-11-24T10:00:00.000Z");
});
