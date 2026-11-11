import { cookies } from "next/headers";
import { z } from "zod";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { noStoreJson, allowAttempt, sha256 } from "@/lib/auth-service";
import { withPlatformOwnerTransaction } from "@/lib/platform-request-transaction";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().trim().min(4).max(120),
  summary: z.string().trim().min(20).max(5000),
  area: z.enum(["PRODUCT", "PLATFORM", "SECURITY", "COMMERCIAL", "UX", "AI"]),
  impact: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
}).strict();
const decisionSchema = z.object({
  proposalId: z.string().min(1).max(128),
  decision: z.enum(["APPROVED_FOR_RESEARCH", "NEEDS_REVISION", "REJECTED"]),
  note: z.string().trim().max(2000).optional()
}).strict();

async function sessionToken() {
  return (await cookies()).get("vayro_session")?.value;
}
async function withinLimit(userId: string) {
  return allowAttempt(sha256("owner-future-lab:" + userId), 40, 60 * 60 * 1000);
}

type ProposalView = {
  id: string;
  title: string;
  summary: string;
  area: string;
  impact: string;
  createdAt: Date;
  decision?: string;
  decisionNote?: string;
};

export async function GET() {
  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      callback: async tx => {
        const rows = await tx.auditEvent.findMany({
          where: {
            resource: "FutureDevelopmentProposal",
            action: { in: ["future_lab.proposal_submitted", "future_lab.owner_decision"] }
          },
          orderBy: { createdAt: "desc" },
          take: 300,
          select: { action: true, resourceId: true, metadata: true, createdAt: true }
        });
        const grouped = new Map<string, ProposalView>();
        for (const row of rows) {
          const metadata = row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
            ? row.metadata as Record<string, unknown> : {};
          const id = row.action === "future_lab.proposal_submitted" ? row.resourceId :
            (typeof metadata.proposalId === "string" ? metadata.proposalId : null);
          if (!id) continue;
          if (!grouped.has(id)) grouped.set(id, { id, title: "", summary: "", area: "", impact: "", createdAt: row.createdAt });
          const proposal = grouped.get(id);
          if (!proposal) continue;
          if (row.action === "future_lab.proposal_submitted") {
            proposal.title = typeof metadata.title === "string" ? metadata.title : "";
            proposal.summary = typeof metadata.summary === "string" ? metadata.summary : "";
            proposal.area = typeof metadata.area === "string" ? metadata.area : "";
            proposal.impact = typeof metadata.impact === "string" ? metadata.impact : "";
            proposal.createdAt = row.createdAt;
          } else if (!proposal.decision) {
            proposal.decision = typeof metadata.decision === "string" ? metadata.decision : "";
            proposal.decisionNote = typeof metadata.note === "string" ? metadata.note : "";
          }
        }
        return [...grouped.values()].filter(item => item.title).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
    });
    if (!result.authorized) return noStoreJson({ error: "unauthorized" }, 401);
    return noStoreJson({ proposals: result.value });
  } catch {
    return noStoreJson({ error: "future_lab_unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);
  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      callback: async (tx, actor) => {
        if (!await withinLimit(actor.userId)) return { kind: "rate_limited" as const };
        const id = "FL-" + crypto.randomUUID();
        await tx.auditEvent.create({
          data: {
            actorUserId: actor.userId,
            action: "future_lab.proposal_submitted",
            resource: "FutureDevelopmentProposal",
            resourceId: id,
            metadata: { ...parsed.data, stage: "SUBMITTED", productionAccess: false }
          },
          select: { id: true }
        });
        return { kind: "created" as const, id };
      }
    });
    if (!result.authorized) return noStoreJson({ error: "unauthorized" }, 401);
    if (result.value.kind === "rate_limited") return noStoreJson({ error: "rate_limited" }, 429);
    return noStoreJson({ proposalId: result.value.id, recorded: true, productionAccess: false }, 201);
  } catch {
    return noStoreJson({ error: "proposal_creation_failed" }, 503);
  }
}

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);
  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      callback: async (tx, actor) => {
        if (!await withinLimit(actor.userId)) return { kind: "rate_limited" as const };
        const rows = await tx.auditEvent.findMany({
          where: {
            resource: "FutureDevelopmentProposal",
            resourceId: parsed.data.proposalId,
            action: { in: ["future_lab.proposal_submitted", "future_lab.owner_decision"] }
          },
          orderBy: { createdAt: "asc" },
          select: { action: true }
        });
        if (!rows.some(row => row.action === "future_lab.proposal_submitted")) return { kind: "not_found" as const };
        if (rows.some(row => row.action === "future_lab.owner_decision")) return { kind: "already_decided" as const };
        await tx.auditEvent.create({
          data: {
            actorUserId: actor.userId,
            action: "future_lab.owner_decision",
            resource: "FutureDevelopmentProposal",
            resourceId: parsed.data.proposalId,
            metadata: {
              proposalId: parsed.data.proposalId,
              decision: parsed.data.decision,
              note: parsed.data.note ?? "",
              executionAuthorized: false
            }
          },
          select: { id: true }
        });
        return { kind: "recorded" as const };
      }
    });
    if (!result.authorized) return noStoreJson({ error: "unauthorized" }, 401);
    if (result.value.kind === "rate_limited") return noStoreJson({ error: "rate_limited" }, 429);
    if (result.value.kind === "not_found") return noStoreJson({ error: "proposal_not_found" }, 404);
    if (result.value.kind === "already_decided") return noStoreJson({ error: "proposal_already_decided" }, 409);
    return noStoreJson({ recorded: true, executionAuthorized: false });
  } catch {
    return noStoreJson({ error: "proposal_decision_failed" }, 503);
  }
}
