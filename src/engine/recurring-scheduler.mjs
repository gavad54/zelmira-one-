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
  const runCount = input.runCount ?? 0;
  if (!Number.isSafeInteger(runCount) || runCount < 0 || (maxRuns !== null && runCount > maxRuns)) fail("SCHEDULE_RUN_COUNT_INVALID");
  const enabled = input.enabled ?? true;
  if (typeof enabled !== "boolean") fail("SCHEDULE_ENABLED_INVALID");
  const nextRunAt = input.nextRunAt == null ? startAt : date(input.nextRunAt, "SCHEDULE_NEXT_RUN_INVALID");
  if (nextRunAt < startAt) fail("SCHEDULE_NEXT_BEFORE_START");
  const missedRunPolicy = input.missedRunPolicy ?? "SKIP";
  if (!["SKIP", "CATCH_UP_ONCE"].includes(missedRunPolicy)) fail("SCHEDULE_MISSED_POLICY_INVALID");
  return Object.freeze({
    scheduleId: input.scheduleId, projectKey: input.projectKey, handlerKey: input.handlerKey,
    title: input.title.trim(), interval: input.interval, unit: input.unit, intervalMs,
    startAt, nextRunAt, endAt, maxRuns, runCount, enabled, missedRunPolicy
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
export function advanceRecurringSchedule(input, emittedOccurrence, now = emittedOccurrence) {
  const schedule = validateRecurringSchedule(input);
  const emittedAt = date(emittedOccurrence, "SCHEDULE_OCCURRENCE_INVALID");
  const clock = date(now, "SCHEDULE_CLOCK_INVALID");
  if (emittedAt < schedule.nextRunAt || (emittedAt - schedule.nextRunAt) % schedule.intervalMs !== 0) fail("SCHEDULE_OCCURRENCE_MISMATCH");
  const latestDue = new Date(schedule.nextRunAt.getTime() + Math.floor(Math.max(0, clock - schedule.nextRunAt) / schedule.intervalMs) * schedule.intervalMs);
  const nextRunAt = new Date((schedule.missedRunPolicy === "CATCH_UP_ONCE" ? latestDue : emittedAt).getTime() + schedule.intervalMs);
  const runCount = schedule.runCount + 1;
  const enabled = (schedule.maxRuns === null || runCount < schedule.maxRuns) && (!schedule.endAt || nextRunAt <= schedule.endAt);
  return Object.freeze({ ...schedule, nextRunAt, runCount, enabled, lastRunAt: emittedAt });
}

export function validateSchedulePayload(handlerKey, payload = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
      (Object.getPrototypeOf(payload) !== Object.prototype && Object.getPrototypeOf(payload) !== null)) {
    fail("SCHEDULE_PAYLOAD_INVALID");
  }
  const keys = Object.keys(payload);
  if (keys.some(key => ["__proto__", "prototype", "constructor"].includes(key))) fail("SCHEDULE_PAYLOAD_UNSAFE_KEY");
  if (handlerKey === "repo.audit" || handlerKey === "repo.test") {
    if (keys.length !== 1 || keys[0] !== "repo" || typeof payload.repo !== "string" ||
        !/^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/.test(payload.repo) ||
        payload.repo.split("/").some(part => part === "." || part === "..")) fail("SCHEDULE_REPOSITORY_INVALID");
    return Object.freeze({ repo: payload.repo });
  }
  if (handlerKey === "report.generate") {
    if (keys.some(key => key !== "reportType")) fail("SCHEDULE_REPORT_PAYLOAD_INVALID");
    if (payload.reportType !== undefined &&
        (typeof payload.reportType !== "string" || payload.reportType.trim().length < 2 || payload.reportType.length > 80)) {
      fail("SCHEDULE_REPORT_TYPE_INVALID");
    }
    return Object.freeze(payload.reportType === undefined ? {} : { reportType: payload.reportType.trim() });
  }
  fail("SCHEDULE_HANDLER_NOT_ALLOWED");
}
