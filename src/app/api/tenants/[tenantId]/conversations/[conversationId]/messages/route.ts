import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { z } from "zod";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { noStoreJson } from "@/lib/auth-service";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
import { getTenantPrisma } from "@/lib/tenant-prisma";
import { withTenantRequestTransaction } from "@/lib/tenant-request-transaction.mjs";
import {
  decodeConversationCursor,
  encodeConversationCursor,
  normalizeConversationPageSize,
  validateConversationMessage
} from "@/lib/conversation-archive.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ tenantId: string; conversationId: string }> };
const messageSchema = z.object({ content: z.string().min(1).max(24_000) }).strict();

export async function GET(request: NextRequest, context: RouteContext) {
  await assertAuthRuntimeRole();
  const { tenantId, conversationId } = await context.params;
  const sessionToken = (await cookies()).get("vayro_session")?.value;
  let limit: number;
  let cursor: ReturnType<typeof decodeConversationCursor> | null = null;
  try {
    limit = normalizeConversationPageSize(request.nextUrl.searchParams.get("limit"));
    const rawCursor = request.nextUrl.searchParams.get("cursor");
    if (rawCursor) cursor = decodeConversationCursor(rawCursor);
  } catch {
    return noStoreJson({ error: "invalid_pagination" }, 400);
  }
  try {
    const result = await withTenantRequestTransaction({
      authDb: authPrisma, tenantDb: getTenantPrisma(), sessionToken, tenantId,
      action: "conversation_read",
      callback: tx => tx.conversationMessage.findMany({
        where: {
          tenantId, conversationId,
          ...(cursor ? { OR: [
            { createdAt: { lt: cursor.createdAt } },
            { createdAt: cursor.createdAt, id: { lt: cursor.id } }
          ] } : {})
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        select: { id: true, role: true, content: true, contentSha256: true, metadata: true, createdAt: true, senderUserId: true,
          attachments: { where: { deletedAt: null }, select: { id: true, fileName: true, contentType: true, byteSize: true, sha256: true, createdAt: true } }
        }
      })
    });
    if (!result.authorized) return noStoreJson({ error: "tenant_access_denied" }, 403);
    const rows = result.value;
    const hasMore = rows.length > limit;
    const messages = hasMore ? rows.slice(0, limit) : rows;
    const last = messages.at(-1);
    return noStoreJson({
      messages,
      nextCursor: hasMore && last ? encodeConversationCursor({ createdAt: last.createdAt, id: last.id }) : null
    });
  } catch {
    return noStoreJson({ error: "conversation_messages_unavailable" }, 503);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  await assertAuthRuntimeRole();
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);
  const { tenantId, conversationId } = await context.params;
  const sessionToken = (await cookies()).get("vayro_session")?.value;
  try {
    const result = await withTenantRequestTransaction({
      authDb: authPrisma, tenantDb: getTenantPrisma(), sessionToken, tenantId,
      action: "conversation_write",
      callback: async (tx, actor) => {
        const conversation = await tx.conversation.findFirst({
          where: { id: conversationId, tenantId, archivedAt: null, deletedAt: null },
          select: { id: true }
        });
        if (!conversation) return null;
        const message = validateConversationMessage({
          role: "USER", senderUserId: actor.userId, content: parsed.data.content
        });
        const created = await tx.conversationMessage.create({
          data: { tenantId, conversationId, ...message },
          select: { id: true, role: true, content: true, contentSha256: true, createdAt: true, senderUserId: true }
        });
        await tx.auditEvent.create({
          data: { tenantId, actorUserId: actor.userId, action: "conversation.message.create", resource: "ConversationMessage", resourceId: created.id }
        });
        return created;
      }
    });
    if (!result.authorized) return noStoreJson({ error: "tenant_access_denied" }, 403);
    if (!result.value) return noStoreJson({ error: "conversation_not_found_or_archived" }, 404);
    return noStoreJson({ message: result.value }, 201);
  } catch {
    return noStoreJson({ error: "conversation_message_create_unavailable" }, 503);
  }
}
