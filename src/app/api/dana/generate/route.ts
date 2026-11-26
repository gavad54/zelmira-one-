import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentSession, allowAttempt, sha256, noStoreJson } from "@/lib/auth-service";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { generateText } from "@/lib/ai-provider.mjs";
import { validateConversationMessage } from "@/lib/conversation-archive.mjs";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
import { getTenantPrisma } from "@/lib/tenant-prisma";
import { withTenantRequestTransaction } from "@/lib/tenant-request-transaction.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  tenantId: z.string().min(1).max(128),
  conversationId: z.string().min(1).max(128).optional(),
  prompt: z.string().trim().min(2).max(12000)
}).strict();

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  await assertAuthRuntimeRole();
  const session = await currentSession().catch(() => null);
  if (!session) return noStoreJson({ error: "unauthorized" }, 401);
  if (!session.user.emailVerifiedAt) return noStoreJson({ error: "email_verification_required" }, 403);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);

  let allowed: boolean;
  try {
    allowed = await allowAttempt(sha256("ai:dana:" + session.user.id), 12, 60000);
  } catch {
    return noStoreJson({ error: "generation_temporarily_unavailable" }, 503);
  }
  if (!allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60" } });

  const sessionToken = (await cookies()).get("vayro_session")?.value;
  try {
    const access = await withTenantRequestTransaction({
      authDb: authPrisma,
      tenantDb: getTenantPrisma(),
      sessionToken,
      tenantId: parsed.data.tenantId,
      action: "ai_generate",
      callback: async tx => {
        if (!parsed.data.conversationId) return { kind: "ready" as const, history: [] as Array<{ role: "user" | "assistant"; content: string }> };
        const conversation = await tx.conversation.findFirst({
          where: {
            id: parsed.data.conversationId,
            tenantId: parsed.data.tenantId,
            archivedAt: null,
            deletedAt: null
          },
          select: { id: true }
        });
        if (!conversation) return { kind: "not_found" as const, history: [] as Array<{ role: "user" | "assistant"; content: string }> };
        const prior = await tx.conversationMessage.findMany({
          where: { tenantId: parsed.data.tenantId, conversationId: conversation.id },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 20,
          select: { role: true, content: true }
        });
        const history = prior.reverse()
          .filter(item => item.role === "USER" || item.role === "ASSISTANT")
          .map(item => ({
            role: item.role === "USER" ? "user" as const : "assistant" as const,
            content: item.content.slice(0, 4000)
          }));
        return { kind: "ready" as const, history };
      }
    });
    if (!access.authorized) return noStoreJson({ error: "tenant_access_denied" }, 403);
    if (access.value.kind === "not_found") return noStoreJson({ error: "conversation_not_found_or_archived" }, 404);

    const generated = await generateText({
      prompt: parsed.data.prompt,
      history: access.value.history
    });
    const output = {
      text: generated.text,
      model: generated.model,
      usage: generated.usage
    };

    const stored = await withTenantRequestTransaction({
      authDb: authPrisma,
      tenantDb: getTenantPrisma(),
      sessionToken,
      tenantId: parsed.data.tenantId,
      action: parsed.data.conversationId ? "conversation_write" : "ai_generate",
      callback: async (tx, actor) => {
        if (parsed.data.conversationId) {
          const conversation = await tx.conversation.findFirst({
            where: {
              id: parsed.data.conversationId,
              tenantId: actor.tenantId,
              archivedAt: null,
              deletedAt: null
            },
            select: { id: true }
          });
          if (!conversation) return null;
        }

        const generation = await tx.aiGeneration.create({
          data: {
            tenantId: actor.tenantId,
            userId: actor.userId,
            kind: "DANA_TEXT",
            prompt: parsed.data.prompt,
            output
          },
          select: { id: true, createdAt: true }
        });

        if (!parsed.data.conversationId) return { generation, userMessageId: null, assistantMessageId: null };

        const userMessage = validateConversationMessage({
          role: "USER",
          senderUserId: actor.userId,
          content: parsed.data.prompt
        });
        const assistantMessage = validateConversationMessage({
          role: "ASSISTANT",
          senderUserId: null,
          content: generated.text
        });
        const [createdUser, createdAssistant] = await Promise.all([
          tx.conversationMessage.create({
            data: { tenantId: actor.tenantId, conversationId: parsed.data.conversationId, ...userMessage },
            select: { id: true, createdAt: true }
          }),
          tx.conversationMessage.create({
            data: {
              tenantId: actor.tenantId,
              conversationId: parsed.data.conversationId,
              ...assistantMessage,
              metadata: { model: generated.model, usage: generated.usage }
            },
            select: { id: true, createdAt: true }
          })
        ]);
        await tx.conversation.updateMany({
          where: { id: parsed.data.conversationId, tenantId: actor.tenantId, archivedAt: null, deletedAt: null },
          data: { updatedAt: createdAssistant.createdAt }
        });
        await tx.auditEvent.create({
          data: {
            tenantId: actor.tenantId,
            actorUserId: actor.userId,
            action: "dana.conversation_turn.create",
            resource: "Conversation",
            resourceId: parsed.data.conversationId,
            metadata: { generationId: generation.id, userMessageId: createdUser.id, assistantMessageId: createdAssistant.id }
          },
          select: { id: true }
        });
        return { generation, userMessageId: createdUser.id, assistantMessageId: createdAssistant.id };
      }
    });
    if (!stored.authorized) return noStoreJson({ error: "tenant_access_denied" }, 403);
    if (!stored.value) return noStoreJson({ error: "conversation_not_found_or_archived" }, 409);
    return noStoreJson({
      generationId: stored.value.generation.id,
      createdAt: stored.value.generation.createdAt,
      conversationMessageId: stored.value.assistantMessageId,
      userMessageId: stored.value.userMessageId,
      result: generated,
      billing: "NOT_CONNECTED",
      persisted: true
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "AI_PROVIDER_UNAVAILABLE";
    const status = code === "AI_PROVIDER_NOT_CONFIGURED" || code === "AI_TEXT_MODEL_NOT_CONFIGURED" ? 503 :
      code === "AI_INPUT_INVALID" || code === "AI_HISTORY_INVALID" ? 400 : 502;
    return noStoreJson({ error: status === 503 ? "provider_not_configured" :
      status === 400 ? "invalid_input" : "generation_failed" }, status);
  }
}
