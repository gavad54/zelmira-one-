import { cookies } from "next/headers";
import { z } from "zod";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { allowAttempt, noStoreJson, sha256 } from "@/lib/auth-service";
import { withPlatformOwnerTransaction } from "@/lib/platform-request-transaction";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = {
  "repo.audit": "ENGINEERING",
  "repo.test": "ENGINEERING",
  "product.health_check": "OPERATIONS",
  "report.generate": "REPORTING"
} as const;

const createSchema = z.object({
  projectKey: z.string().regex(/^[A-Z][A-Z0-9_-]{1,39}$/),
  handlerKey: z.enum(["repo.audit", "repo.test", "product.health_check", "report.generate"]),
  title: z.string().trim().min(3).max(160),
  idempotencyKey: z.string().min(8).max(200),
  priority: z.number().int().min(0).max(100).default(50),
  maxAttempts: z.number().int().min(1).max(10).default(3),
  approvalRequired: z.boolean().default(false),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  deadline: z.string().datetime({ offset: true }).optional(),
  payload: z.record(z.string(), z.unknown()).default({})
}).strict();

async function sessionToken() {
  return (await cookies()).get("vayro_session")?.value;
}

export async function GET() {
  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      callback: async tx => tx.engineeringTask.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 100,
        select: {
          id: true, projectKey: true, taskType: true, handlerKey: true, title: true,
          priority: true, status: true, scheduledAt: true, deadline: true,
          approvalRequired: true, attemptCount: true, maxAttempts: true,
          availableAt: true, createdAt: true, startedAt: true, completedAt: true,
          lastErrorCode: true, lastErrorMessage: true
        }
      })
    });
    if (!result.authorized) return noStoreJson({ error: "unauthorized" }, 401);
    return noStoreJson({ tasks: result.value });
  } catch {
    return noStoreJson({ error: "task_list_unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);

  let serializedPayload: string;
  try {
    serializedPayload = JSON.stringify(parsed.data.payload);
    if (Buffer.byteLength(serializedPayload, "utf8") > 65_536) return noStoreJson({ error: "payload_too_large" }, 413);
    // Reject values JSON.stringify silently drops, such as undefined properties.
    if (JSON.stringify(JSON.parse(serializedPayload)) !== serializedPayload) return noStoreJson({ error: "invalid_payload" }, 400);
  } catch {
    return noStoreJson({ error: "invalid_payload" }, 400);
  }

  const scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null;
  const deadline = parsed.data.deadline ? new Date(parsed.data.deadline) : null;
  if (scheduledAt && deadline && deadline <= scheduledAt) return noStoreJson({ error: "deadline_before_schedule" }, 400);

  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      callback: async (tx, actor) => {
        if (!await allowAttempt(sha256("owner-task-create:" + actor.userId), 30, 60 * 60 * 1000)) {
          return { kind: "rate_limited" as const };
        }
        const existing = await tx.engineeringTask.findUnique({
          where: { idempotencyKey: parsed.data.idempotencyKey },
          select: { id: true, projectKey: true, handlerKey: true, title: true, status: true }
        });
        if (existing) return { kind: "duplicate" as const, task: existing };

        const task = await tx.engineeringTask.create({
          data: {
            projectKey: parsed.data.projectKey,
            taskType: handlers[parsed.data.handlerKey],
            handlerKey: parsed.data.handlerKey,
            title: parsed.data.title,
            idempotencyKey: parsed.data.idempotencyKey,
            priority: parsed.data.priority,
            maxAttempts: parsed.data.maxAttempts,
            approvalRequired: parsed.data.approvalRequired,
            scheduledAt,
            deadline,
            availableAt: scheduledAt ?? new Date(),
            status: parsed.data.approvalRequired ? "WAITING_APPROVAL" : "QUEUED",
            payload: JSON.parse(serializedPayload)
          },
          select: {
            id: true, projectKey: true, taskType: true, handlerKey: true,
            title: true, status: true, scheduledAt: true, createdAt: true
          }
        });
        await tx.auditEvent.create({
          data: {
            actorUserId: actor.userId,
            action: "owner.engineering_task_created",
            resource: "EngineeringTask",
            resourceId: task.id,
            metadata: {
              projectKey: task.projectKey,
              handlerKey: task.handlerKey,
              status: task.status,
              approvalRequired: parsed.data.approvalRequired
            }
          },
          select: { id: true }
        });
        return { kind: "created" as const, task };
      }
    });
    if (!result.authorized) return noStoreJson({ error: "unauthorized" }, 401);
    if (result.value.kind === "rate_limited") return noStoreJson({ error: "rate_limited" }, 429);
    if (result.value.kind === "duplicate") return noStoreJson({ error: "idempotency_key_already_used", task: result.value.task }, 409);
    return noStoreJson({ task: result.value.task }, 201);
  } catch {
    return noStoreJson({ error: "task_create_failed" }, 503);
  }
}


const approveSchema = z.object({ action: z.literal("approve"), taskId: z.string().min(1).max(100) }).strict();

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  const parsed = approveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);
  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      callback: async (tx, actor) => {
        const rows = await tx.$queryRaw<Array<{ approved: boolean }>>`
          SELECT public.vayro_approve_engineering_task(${parsed.data.taskId}) AS approved
        `;
        if (rows[0]?.approved !== true) return { kind: "not_awaiting_approval" as const };
        await tx.auditEvent.create({
          data: {
            actorUserId: actor.userId,
            action: "owner.engineering_task_approved",
            resource: "EngineeringTask",
            resourceId: parsed.data.taskId,
            metadata: { decision: "APPROVED" }
          },
          select: { id: true }
        });
        return { kind: "approved" as const };
      }
    });
    if (!result.authorized) return noStoreJson({ error: "unauthorized" }, 401);
    if (result.value.kind === "not_awaiting_approval") return noStoreJson({ error: "task_not_awaiting_approval" }, 409);
    return noStoreJson({ taskId: parsed.data.taskId, status: "QUEUED" });
  } catch {
    return noStoreJson({ error: "task_approval_failed" }, 503);
  }
}
