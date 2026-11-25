export type RecurrenceUnit = "MINUTES" | "HOURS" | "DAYS" | "WEEKS";
export type MissedRunPolicy = "SKIP" | "CATCH_UP_ONCE";
export interface RecurringScheduleDefinition {
  scheduleId: string;
  projectKey: string;
  handlerKey: "report.generate" | "repo.audit" | "repo.test";
  title: string;
  interval: number;
  unit: RecurrenceUnit;
  startAt: string | Date;
  nextRunAt?: string | Date;
  endAt?: string | Date | null;
  maxRuns?: number | null;
  runCount?: number;
  enabled?: boolean;
  missedRunPolicy?: MissedRunPolicy;
}
export interface ValidatedRecurringSchedule {
  scheduleId: string;
  projectKey: string;
  handlerKey: RecurringScheduleDefinition["handlerKey"];
  title: string;
  interval: number;
  unit: RecurrenceUnit;
  intervalMs: number;
  startAt: Date;
  nextRunAt: Date;
  endAt: Date | null;
  maxRuns: number | null;
  runCount: number;
  enabled: boolean;
  missedRunPolicy: MissedRunPolicy;
}
export function validateRecurringSchedule(input: RecurringScheduleDefinition): ValidatedRecurringSchedule;
export function occurrenceIdempotencyKey(scheduleId: string, scheduledFor: string | Date): string;
export function materializeDueOccurrence(input: RecurringScheduleDefinition, now?: Date): Readonly<{
  projectKey: string;
  taskType: "REPORTING" | "ENGINEERING";
  handlerKey: RecurringScheduleDefinition["handlerKey"];
  title: string;
  priority: number;
  scheduledAt: Date;
  availableAt: Date;
  idempotencyKey: string;
  payload: { scheduleId: string; scheduledFor: string; recurrence: { interval: number; unit: RecurrenceUnit } };
}> | null;
export function advanceRecurringSchedule(input: RecurringScheduleDefinition, emittedOccurrence: string | Date, now?: string | Date): Readonly<ValidatedRecurringSchedule & { lastRunAt: Date }>;
