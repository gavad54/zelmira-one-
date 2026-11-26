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
  id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{1,99}$/),
  title: z.string().trim().min(2).max(160),
  handlerKey: z.enum(["repo.audit", "repo.test", "report.generate"]),
  repo: z.string().regex(/^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/).optional(),
  dependsOn: z.array(z.string().min(2).max(100)).max(200).default([])
}).strict();

const epicSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{1,99}$/),
  title: z.string().trim().min(2).max(160),
  features: z.array(criterionSchema).min(1).max(200)
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
    acceptanceCriteria: z.array(criterionSchema).max(200).optional(),
    epics: z.array(epicSchema).min(1).max(50).optional()
  }).strict().superRefine((goal, ctx) => {
    const hasFlat = Boolean(goal.acceptanceCriteria?.length);
    const hasEpics = Boolean(goal.epics?.length);
    if (hasFlat === hasEpics) ctx.addIssue({ code: "custom", message: "Provide either acceptanceCriteria or epics", path: ["acceptanceCriteria"] });
    const ids = (goal.epics ? goal.epics.flatMap(epic => epic.features) : goal.acceptanceCriteria ?? []).map(feature => feature.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", message: "Feature IDs must be unique across the goal", path: ["epics"] });
    const epicIds = (goal.epics ?? []).map(epic => epic.id);
    if (new Set(epicIds).size !== epicIds.length) ctx.addIssue({ code: "custom", message: "Epic IDs must be unique within the goal", path: ["epics"] });
  })
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

  const goalInput = parsed.data.goal;
  const epicDefinitions = goalInput.epics ?? [{ id: "execution-plan", title: "Execution plan", features: goalInput.acceptanceCriteria ?? [] }];
  const acceptanceCriteria = epicDefinitions.flatMap(epic => epic.features);
  let plan: ReturnType<typeof planGoal>;
  try {
    plan = planGoal({ ...goalInput, acceptanceCriteria });
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

        const existingGoal = await tx.goalRecord.findUnique({
          where: { goalKey_version: { goalKey: plan.goalId, version: plan.version } },
          select: { id: true }
        });
        if (existingGoal) return { kind: "goal_conflict" as const };

        const goalRecord = await tx.goalRecord.create({
          data: {
            goalKey: plan.goalId, projectKey: plan.projectKey, title: plan.title,
            version: plan.version, status: "PLANNED", priority: plan.tasks[0]?.priority ?? 50,
            approvalRequired: plan.approvalRequired, scheduledAt: plan.scheduledAt,
            deadline: plan.deadline, createdByUserId: actor.userId
          },
          select: { id: true }
        });
        const epicByFeature = new Map<string, string>();
        const featureOrder = new Map<string, number>();
        for (const [epicIndex, definition] of epicDefinitions.entries()) {
          const epic = await tx.goalEpic.create({
            data: { goalId: goalRecord.id, epicKey: definition.id, title: definition.title, status: "PLANNED", sortOrder: epicIndex },
            select: { id: true }
          });
          definition.features.forEach((feature, index) => {
            epicByFeature.set(feature.id, epic.id);
            featureOrder.set(feature.id, index);
          });
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
          await tx.goalFeature.create({
            data: {
              epicId: epicByFeature.get(item.criterionId) ?? (() => { throw new Error("GOAL_PLAN_EPIC_ID_MISSING"); })(), featureKey: item.criterionId, title: item.title,
              acceptanceCriteria: item.title, handlerKey: item.handlerKey,
              status: item.approvalRequired ? "WAITING_APPROVAL" : "QUEUED",
              taskId: task.id, sortOrder: featureOrder.get(item.criterionId) ?? 0
            },
            select: { id: true }
          });
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
              epicCount: epicDefinitions.length,
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
    if (result.value.kind === "goal_conflict") return noStoreJson({ error: "goal_version_already_exists" }, 409);
    if (result.value.kind === "duplicate") return noStoreJson({ goalId: plan.goalId, replayed: true, tasks: result.value.tasks });
    return noStoreJson({ goalId: plan.goalId, replayed: false, tasks: result.value.tasks }, 201);
  } catch {
    return noStoreJson({ error: "goal_plan_persistence_failed" }, 503);
  }
}
