import { cookies } from "next/headers";
import { z } from "zod";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { allowAttempt, noStoreJson, sha256 } from "@/lib/auth-service";
import { withPlatformOwnerTransaction } from "@/lib/platform-request-transaction";
import { readJsonBody } from "@/lib/read-json-body.mjs";
import { planGoal } from "@/engine/goal-planner.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const criterionSchema = z.object({
  id: z.string().trim().min(2).max(100),
  title: z.string().trim().min(2).max(160),
  handlerKey: z.enum(["repo.audit", "repo.test", "report.generate"]),
  dependsOn: z.array(z.string().min(2).max(100)).max(200).default([])
}).strict();

const requestSchema = z.object({
  goal: z.object({
    goalId: z.string().trim().min(2).max(100),
    projectKey: z.string().regex(/^[A-Z][A-Z0-9_-]{1,39}$/),
    title: z.string().trim().min(2).max(160),
    version: z.number().int().min(1).max(1_000_000).default(1),
    priority: z.number().int().min(0).max(100).default(50),
    approvalRequired: z.boolean().default(true),
    scheduledAt: z.string().datetime({ offset: true }).optional(),
    deadline: z.string().datetime({ offset: true }).optional(),
    acceptanceCriteria: z.array(criterionSchema).min(1).max(200)
  }).strict()
}).strict();

async function sessionToken() {
  return (await cookies()).get("vayro_session")?.value;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);

  let body: unknown;
  try {
    body = await readJsonBody(request, 80_000);
  } catch (error) {
    return error instanceof Error && error.message === "BODY_TOO_LARGE"
      ? noStoreJson({ error: "payload_too_large" }, 413)
      : noStoreJson({ error: "invalid_input" }, 400);
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);

  let plan: ReturnType<typeof planGoal>;
  try {
    plan = planGoal(parsed.data.goal);
  } catch (error) {
    const code = error instanceof Error ? error.message : "GOAL_PLAN_INVALID";
    return noStoreJson({ error: code.toLowerCase() }, 400);
  }

  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      callback: async (tx, actor) => {
        if (!await allowAttempt(sha256("owner-goal-plan:" + actor.userId), 10, 60 * 60 * 1000)) {
          return { kind: "rate_limited" as const };
        }

        const keys = plan.tasks.map(task => task.idempotencyKey);
        const existing = await tx.engineeringTask.findMany({
          where: { idempotencyKey: { in: keys } },
          select: { id: true, idempotencyKey: true, projectKey: true, handlerKey: true, title: true, status: true }
        });

        if (existing.length > 0) {
          if (existing.length !== keys.length) return { kind: "partial_conflict" as const };
          return { kind: "duplicate" as const, tasks: existing };
        }

        const taskIds = new Map<string, string>();
        const created = [];
        for (const item of plan.tasks) {
          const task = await tx.engineeringTask.create({
            data: {
              projectKey: item.projectKey,
              taskType: item.taskType,
              handlerKey: item.handlerKey,
              title: item.title,
              idempotencyKey: item.idempotencyKey,
              priority: item.priority,
              scheduledAt: item.scheduledAt,
              deadline: item.deadline,
              availableAt: item.scheduledAt ?? new Date(),
              approvalRequired: item.approvalRequired,
              status: item.approvalRequired ? "WAITING_APPROVAL" : "QUEUED",
              payload: item.payload
            },
            select: { id: true, projectKey: true, handlerKey: true, title: true, status: true }
          });
          taskIds.set(item.criterionId, task.id);
          created.push(task);
        }

        for (const item of plan.tasks) {
          const taskId = taskIds.get(item.criterionId);
          if (!taskId) throw new Error("GOAL_PLAN_TASK_ID_MISSING");
          for (const dependencyId of item.dependsOn) {
            const dependencyTaskId = taskIds.get(dependencyId);
            if (!dependencyTaskId) throw new Error("GOAL_PLAN_DEPENDENCY_ID_MISSING");
            await tx.$queryRaw<Array<{ added: boolean }>>`
              SELECT public.vayro_add_engineering_task_dependency(${taskId}, ${dependencyTaskId}) AS added
            `;
          }
        }

        await tx.auditEvent.create({
          data: {
            actorUserId: actor.userId,
            action: "owner.engineering_goal_planned",
            resource: "EngineeringGoal",
            resourceId: plan.goalId,
            metadata: {
              projectKey: plan.projectKey,
              goalVersion: plan.version,
              taskCount: created.length,
              approvalRequired: plan.approvalRequired,
              scheduledAt: plan.scheduledAt?.toISOString() ?? null,
              deadline: plan.deadline?.toISOString() ?? null,
              taskIds: created.map(task => task.id)
            }
          },
          select: { id: true }
        });

        return { kind: "created" as const, tasks: created };
      }
    });

    if (!result.authorized) return noStoreJson({ error: "unauthorized" }, 401);
    if (result.value.kind === "rate_limited") return noStoreJson({ error: "rate_limited" }, 429);
    if (result.value.kind === "partial_conflict") return noStoreJson({ error: "goal_plan_partially_exists" }, 409);
    if (result.value.kind === "duplicate") return noStoreJson({ goalId: plan.goalId, replayed: true, tasks: result.value.tasks });
    return noStoreJson({ goalId: plan.goalId, replayed: false, tasks: result.value.tasks }, 201);
  } catch {
    return noStoreJson({ error: "goal_plan_persistence_failed" }, 503);
  }
}
