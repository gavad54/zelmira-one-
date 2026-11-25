import { cookies } from "next/headers";
import { z } from "zod";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { allowAttempt, noStoreJson, sha256 } from "@/lib/auth-service";
import { withPlatformOwnerTransaction } from "@/lib/platform-request-transaction";
import { readJsonBody } from "@/lib/read-json-body.mjs";
import { validateAgentDefinition } from "@/engine/agent-registry.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9._-]{1,63}$/),
  version: z.number().int().min(1),
  displayName: z.string().trim().min(2).max(100),
  capabilities: z.array(z.enum(["REPORT_GENERATION", "REPOSITORY_AUDIT", "CI_OBSERVATION", "TASK_REVIEW"])).min(1).max(4),
  permissions: z.array(z.enum(["READ_TASK", "READ_REPOSITORY", "WRITE_TASK_RESULT", "REQUEST_OWNER_APPROVAL"])).default(["READ_TASK"]),
  projectKeys: z.array(z.string().regex(/^[A-Z][A-Z0-9_-]{1,39}$/)).max(100).default([]),
  enabled: z.boolean().default(false)
}).strict();

async function sessionToken() {
  return (await cookies()).get("vayro_session")?.value;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  let body: unknown;
  try {
    body = await readJsonBody(request, 16_000);
  } catch (error) {
    return error instanceof Error && error.message === "BODY_TOO_LARGE"
      ? noStoreJson({ error: "payload_too_large" }, 413)
      : noStoreJson({ error: "invalid_input" }, 400);
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);

  let agent: ReturnType<typeof validateAgentDefinition>;
  try {
    agent = validateAgentDefinition(parsed.data);
  } catch (error) {
    const code = error instanceof Error ? error.message : "AGENT_DEFINITION_INVALID";
    return noStoreJson({ error: code.toLowerCase() }, 400);
  }

  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      callback: async (tx, actor) => {
        if (!await allowAttempt(sha256("owner-agent-registry:" + actor.userId), 10, 60 * 60 * 1000)) {
          return { kind: "rate_limited" as const };
        }
        const existing = await tx.engineeringAgent.findUnique({ where: { agentKey: agent.key } });
        if (existing && existing.version >= agent.version) return { kind: "version_conflict" as const };
        const data = {
          version: agent.version,
          displayName: agent.displayName,
          capabilities: [...agent.capabilities],
          permissions: [...agent.permissions],
          projectKeys: [...agent.projectKeys],
          enabled: agent.enabled
        };
        const saved = existing
          ? await tx.engineeringAgent.update({ where: { id: existing.id }, data, select: { id: true, agentKey: true, version: true, enabled: true } })
          : await tx.engineeringAgent.create({ data: { agentKey: agent.key, ...data }, select: { id: true, agentKey: true, version: true, enabled: true } });
        await tx.auditEvent.create({
          data: {
            actorUserId: actor.userId,
            action: existing ? "owner.agent_definition_updated" : "owner.agent_definition_created",
            resource: "EngineeringAgent",
            resourceId: saved.id,
            metadata: { agentKey: saved.agentKey, version: saved.version, enabled: saved.enabled, capabilities: [...agent.capabilities] }
          },
          select: { id: true }
        });
        return { kind: "saved" as const, agent: saved };
      }
    });
    if (!result.authorized) return noStoreJson({ error: "unauthorized" }, 401);
    if (result.value.kind === "rate_limited") return noStoreJson({ error: "rate_limited" }, 429);
    if (result.value.kind === "version_conflict") return noStoreJson({ error: "agent_version_must_increase" }, 409);
    return noStoreJson({ agent: result.value.agent }, 201);
  } catch {
    return noStoreJson({ error: "agent_persistence_failed" }, 503);
  }
}
