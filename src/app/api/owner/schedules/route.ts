import { cookies } from "next/headers";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { allowAttempt, noStoreJson, sha256 } from "@/lib/auth-service";
import { withPlatformOwnerTransaction } from "@/lib/platform-request-transaction";
import { readJsonBody } from "@/lib/read-json-body.mjs";
import { validateRecurringSchedule, validateSchedulePayload } from "@/engine/recurring-scheduler.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  scheduleId: z.string().trim().min(2).max(100),
  projectKey: z.string().regex(/^[A-Z][A-Z0-9_-]{1,39}$/),
  handlerKey: z.enum(["repo.audit", "repo.test", "report.generate"]),
  title: z.string().trim().min(2).max(160),
  payload: z.record(z.string(), z.unknown()).optional(),
  interval: z.number().int().min(1).max(10_000),
  unit: z.enum(["MINUTES", "HOURS", "DAYS", "WEEKS"]),
  missedRunPolicy: z.enum(["SKIP", "CATCH_UP_ONCE"]).default("SKIP"),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }).optional(),
  maxRuns: z.number().int().min(1).max(100_000).optional()
}).strict();

async function sessionToken() {
  return (await cookies()).get("vayro_session")?.value;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  let body: unknown;
  try {
    body = await readJsonBody(request, 32_000);
  } catch (error) {
    return error instanceof Error && error.message === "BODY_TOO_LARGE"
      ? noStoreJson({ error: "payload_too_large" }, 413)
      : noStoreJson({ error: "invalid_input" }, 400);
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);

  let schedule: ReturnType<typeof validateRecurringSchedule>;
  let safePayload: Readonly<Record<string, string>>;
  try {
    safePayload = validateSchedulePayload(parsed.data.handlerKey, parsed.data.payload);
    schedule = validateRecurringSchedule({
      ...parsed.data,
      scheduleId: parsed.data.scheduleId,
      nextRunAt: parsed.data.startAt,
      enabled: true,
      runCount: 0
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SCHEDULE_INVALID";
    return noStoreJson({ error: code.toLowerCase() }, 400);
  }

  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      callback: async (tx, actor) => {
        if (!await allowAttempt(sha256("owner-recurring-schedule:" + actor.userId), 10, 60 * 60 * 1000)) {
          return { kind: "rate_limited" as const };
        }
        const existing = await tx.recurringSchedule.findUnique({
          where: { scheduleKey: schedule.scheduleId },
          select: { id: true, scheduleKey: true, enabled: true, nextRunAt: true }
        });
        if (existing) return { kind: "duplicate" as const, schedule: existing };
        const created = await tx.recurringSchedule.create({
          data: {
            scheduleKey: schedule.scheduleId,
            projectKey: schedule.projectKey,
            handlerKey: schedule.handlerKey,
            title: schedule.title,
            payload: safePayload as Prisma.InputJsonValue,
            interval: schedule.interval,
            unit: schedule.unit,
            missedRunPolicy: schedule.missedRunPolicy,
            startAt: schedule.startAt,
            nextRunAt: schedule.nextRunAt,
            endAt: schedule.endAt,
            maxRuns: schedule.maxRuns,
            runCount: 0,
            enabled: true,
            createdByUserId: actor.userId
          },
          select: { id: true, scheduleKey: true, enabled: true, nextRunAt: true }
        });
        await tx.auditEvent.create({
          data: {
            actorUserId: actor.userId,
            action: "owner.recurring_schedule_created",
            resource: "RecurringSchedule",
            resourceId: created.id,
            metadata: {
              scheduleKey: schedule.scheduleId,
              projectKey: schedule.projectKey,
              handlerKey: schedule.handlerKey,
              interval: schedule.interval,
              unit: schedule.unit,
              missedRunPolicy: schedule.missedRunPolicy
            }
          },
          select: { id: true }
        });
        return { kind: "created" as const, schedule: created };
      }
    });
    if (!result.authorized) return noStoreJson({ error: "unauthorized" }, 401);
    if (result.value.kind === "rate_limited") return noStoreJson({ error: "rate_limited" }, 429);
    if (result.value.kind === "duplicate") return noStoreJson({ schedule: result.value.schedule, replayed: true });
    return noStoreJson({ schedule: result.value.schedule, replayed: false }, 201);
  } catch {
    return noStoreJson({ error: "schedule_persistence_failed" }, 503);
  }
}

const patchSchema = z.object({
  scheduleId: z.string().trim().min(2).max(100),
  enabled: z.boolean()
}).strict();

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  let body: unknown;
  try {
    body = await readJsonBody(request, 8_000);
  } catch (error) {
    return error instanceof Error && error.message === "BODY_TOO_LARGE"
      ? noStoreJson({ error: "payload_too_large" }, 413)
      : noStoreJson({ error: "invalid_input" }, 400);
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);
  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      callback: async (tx, actor) => {
        if (!await allowAttempt(sha256("owner-recurring-schedule:" + actor.userId), 10, 60 * 60 * 1000)) {
          return { kind: "rate_limited" as const };
        }
        const existing = await tx.recurringSchedule.findUnique({ where: { scheduleKey: parsed.data.scheduleId } });
        if (!existing) return { kind: "not_found" as const };
        if (parsed.data.enabled && (
          (existing.maxRuns !== null && existing.runCount >= existing.maxRuns) ||
          (existing.endAt !== null && existing.nextRunAt > existing.endAt)
        )) return { kind: "exhausted" as const };
        const updated = await tx.recurringSchedule.update({
          where: { id: existing.id },
          data: { enabled: parsed.data.enabled },
          select: { id: true, scheduleKey: true, enabled: true, nextRunAt: true, runCount: true }
        });
        await tx.auditEvent.create({
          data: {
            actorUserId: actor.userId,
            action: parsed.data.enabled ? "owner.recurring_schedule_enabled" : "owner.recurring_schedule_paused",
            resource: "RecurringSchedule",
            resourceId: existing.id,
            metadata: { scheduleKey: existing.scheduleKey, enabled: parsed.data.enabled }
          },
          select: { id: true }
        });
        return { kind: "updated" as const, schedule: updated };
      }
    });
    if (!result.authorized) return noStoreJson({ error: "unauthorized" }, 401);
    if (result.value.kind === "rate_limited") return noStoreJson({ error: "rate_limited" }, 429);
    if (result.value.kind === "not_found") return noStoreJson({ error: "schedule_not_found" }, 404);
    if (result.value.kind === "exhausted") return noStoreJson({ error: "schedule_exhausted" }, 409);
    return noStoreJson({ schedule: result.value.schedule });
  } catch {
    return noStoreJson({ error: "schedule_update_failed" }, 503);
  }
}

export async function GET() {
  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      callback: async (tx, actor) => {
        if (!await allowAttempt(sha256("owner-schedule-read:" + actor.userId), 60, 60 * 60 * 1000)) {
          return { kind: "rate_limited" as const };
        }
        const schedules = await tx.recurringSchedule.findMany({
          orderBy: [{ enabled: "desc" }, { nextRunAt: "asc" }],
          take: 100,
          select: {
            id: true, scheduleKey: true, projectKey: true, handlerKey: true, title: true,
            interval: true, unit: true, missedRunPolicy: true, startAt: true, nextRunAt: true,
            lastRunAt: true, endAt: true, maxRuns: true, runCount: true, enabled: true
          }
        });
        return { kind: "ok" as const, schedules };
      }
    });
    if (!result.authorized) return noStoreJson({ error: "unauthorized" }, 401);
    if (result.value.kind === "rate_limited") return noStoreJson({ error: "rate_limited" }, 429);
    return noStoreJson({ schedules: result.value.schedules });
  } catch {
    return noStoreJson({ error: "schedule_read_failed" }, 503);
  }
}
