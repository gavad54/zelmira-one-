const UNITS = Object.freeze({ MINUTES: 60_000, HOURS: 3_600_000, DAYS: 86_400_000, WEEKS: 604_800_000 });
const HANDLERS = new Set(["report.generate", "repo.audit", "repo.test"]);
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,99}$/;

function fail(code) { throw new Error(code); }
function date(value, code) {
  const result = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!Number.isFinite(result.getTime())) fail(code);
  return result;
}

/** UTC-anchored interval schedules. Calendar-month and local-wall-clock recurrence are intentionally unsupported. */
export function validateRecurringSchedule(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) fail("SCHEDULE_INVALID");
  if (typeof input.scheduleId !== "string" || !ID.test(input.scheduleId)) fail("SCHEDULE_ID_INVALID");
  if (typeof input.projectKey !== "string" || !/^[A-Z][A-Z0-9_-]{1,39}$/.test(input.projectKey)) fail("PROJECT_KEY_INVALID");
  if (typeof input.handlerKey !== "string" || !HANDLERS.has(input.handlerKey)) fail("SCHEDULE_HANDLER_NOT_ALLOWED");
  if (typeof input.title !== "string" || input.title.trim().length < 2 || input.title.length > 160) fail("SCHEDULE_TITLE_INVALID");
  if (!Number.isSafeInteger(input.interval) || input.interval < 1 || input.interval > 10_000) fail("SCHEDULE_INTERVAL_INVALID");
  if (!Object.hasOwn(UNITS, input.unit)) fail("SCHEDULE_UNIT_INVALID");
  const intervalMs = input.interval * UNITS[input.unit];
  if (!Number.isSafeInteger(intervalMs) || intervalMs > 366 * UNITS.DAYS) fail("SCHEDULE_INTERVAL_TOO_LARGE");
  const startAt = date(input.startAt, "SCHEDULE_START_INVALID");
  const endAt = input.endAt == null ? null : date(input.endAt, "SCHEDULE_END_INVALID");
  if (endAt && endAt <= startAt) fail("SCHEDULE_END_BEFORE_START");
  const maxRuns = input.maxRuns ?? null;
  if (maxRuns !== null && (!Number.isSafeInteger(maxRuns) || maxRuns < 1 || maxRuns > 100_000)) fail("SCHEDULE_MAX_RUNS_INVALID");
  const missedRunPolicy = input.missedRunPolicy ?? "SKIP";
  if (!["SKIP", "CATCH_UP_ONCE"].includes(missedRunPolicy)) fail("SCHEDULE_MISSED_POLICY_INVALID");
  return Object.freeze({
    scheduleId: input.scheduleId, projectKey: input.projectKey, handlerKey: input.handlerKey,
    title: input.title.trim(), interval: input.interval, unit: input.unit, intervalMs,
    startAt, nextRunAt: input.nextRunAt == null ? startAt : date(input.nextRunAt, "SCHEDULE_NEXT_RUN_INVALID"),
    endAt, maxRuns, runCount: input.runCount ?? 0, enabled: input.enabled ?? true, missedRunPolicy
  });
}

export function occurrenceIdempotencyKey(scheduleId, scheduledFor) {
  if (typeof scheduleId !== "string" || !ID.test(scheduleId)) fail("SCHEDULE_ID_INVALID");
  const at = date(scheduledFor, "SCHEDULE_OCCURRENCE_INVALID");
  return `schedule:${scheduleId}:${at.toISOString()}`;
}

/** Returns one bounded due occurrence. Database uniqueness on idempotencyKey is the final concurrency fence. */
export function materializeDueOccurrence(input, now = new Date()) {
  const schedule = validateRecurringSchedule(input);
  const at = date(now, "SCHEDULE_CLOCK_INVALID");
  if (!schedule.enabled || (schedule.maxRuns !== null && schedule.runCount >= schedule.maxRuns)) return null;
  if (schedule.endAt && schedule.nextRunAt > schedule.endAt) return null;
  if (schedule.nextRunAt > at) return null;
  const scheduledFor = schedule.missedRunPolicy === "CATCH_UP_ONCE"
    ? schedule.nextRunAt
    : new Date(schedule.nextRunAt.getTime() + Math.floor((at - schedule.nextRunAt) / schedule.intervalMs) * schedule.intervalMs);
  if (schedule.endAt && scheduledFor > schedule.endAt) return null;
  return Object.freeze({
    projectKey: schedule.projectKey, taskType: schedule.handlerKey === "report.generate" ? "REPORTING" : "ENGINEERING",
    handlerKey: schedule.handlerKey, title: schedule.title, priority: 50,
    scheduledAt: scheduledFor, availableAt: at,
    idempotencyKey: occurrenceIdempotencyKey(schedule.scheduleId, scheduledFor),
    payload: { scheduleId: schedule.scheduleId, scheduledFor: scheduledFor.toISOString(), recurrence: { interval: schedule.interval, unit: schedule.unit } }
  });
}

/** Advances from the emitted occurrence, not from wall-clock now, preserving deterministic cadence. */
export function advanceRecurringSchedule(input, emittedOccurrence) {
  const schedule = validateRecurringSchedule(input);
  const emittedAt = date(emittedOccurrence, "SCHEDULE_OCCURRENCE_INVALID");
  if (emittedAt < schedule.nextRunAt || (emittedAt - schedule.nextRunAt) % schedule.intervalMs !== 0) fail("SCHEDULE_OCCURRENCE_MISMATCH");
  const nextRunAt = new Date(emittedAt.getTime() + schedule.intervalMs);
  const runCount = schedule.runCount + 1;
  const enabled = (schedule.maxRuns === null || runCount < schedule.maxRuns) && (!schedule.endAt || nextRunAt <= schedule.endAt);
  return Object.freeze({ ...schedule, nextRunAt, runCount, enabled, lastRunAt: emittedAt });
}
