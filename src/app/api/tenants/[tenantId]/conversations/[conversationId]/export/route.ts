import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { noStoreJson } from "@/lib/auth-service";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
import { getTenantPrisma } from "@/lib/tenant-prisma";
import { withTenantRequestTransaction } from "@/lib/tenant-request-transaction.mjs";
import { serializeConversationExport } from "@/lib/conversation-export.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ tenantId: string; conversationId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  await assertAuthRuntimeRole();
  const { tenantId, conversationId } = await context.params;
  const sessionToken = (await cookies()).get("vayro_session")?.value;

  try {
    const result = await withTenantRequestTransaction({
      authDb: authPrisma,
      tenantDb: getTenantPrisma(),
      sessionToken,
      tenantId,
      action: "conversation_read",
      callback: async (tx, actor) => {
        const conversation = await tx.conversation.findFirst({
          where: { id: conversationId, tenantId, deletedAt: null },
          select: {
            id: true, title: true, createdAt: true, updatedAt: true,
            archivedAt: true, createdByUserId: true
          }
        });
        if (!conversation) return { kind: "not_found" as const };

        const messages = await tx.conversationMessage.findMany({
          where: { tenantId, conversationId },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          take: 5001,
          select: {
            id: true, role: true, content: true, contentSha256: true,
            metadata: true, createdAt: true, senderUserId: true,
            attachments: {
              where: { deletedAt: null },
              select: {
                id: true, fileName: true, contentType: true,
                byteSize: true, sha256: true, createdAt: true
              }
            }
          }
        });
        if (messages.length > 5000) return { kind: "too_many_messages" as const };

        await tx.auditEvent.create({
          data: {
            tenantId,
            actorUserId: actor.userId,
            action: "conversation.export",
            resource: "Conversation",
            resourceId: conversationId,
            metadata: { messageCount: messages.length, format: "vayro.conversation-export.v1" }
          },
          select: { id: true }
        });
        return { kind: "export" as const, conversation, messages };
      }
    });

    if (!result.authorized) return noStoreJson({ error: "tenant_access_denied" }, 403);
    if (result.value.kind === "not_found") return noStoreJson({ error: "conversation_not_found" }, 404);
    if (result.value.kind === "too_many_messages") return noStoreJson({ error: "export_too_large" }, 413);

    let body: string;
    try {
      body = serializeConversationExport({
        conversation: result.value.conversation,
        messages: result.value.messages
      });
    } catch (error) {
      if (error instanceof Error && error.message === "CONVERSATION_EXPORT_TOO_LARGE") {
        return noStoreJson({ error: "export_too_large" }, 413);
      }
      throw error;
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="vayro-conversation-${encodeURIComponent(conversationId)}.json"`,
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return noStoreJson({ error: "conversation_export_unavailable" }, 503);
  }
}
