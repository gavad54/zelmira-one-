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
  normalizeConversationTitle
} from "@/lib/conversation-archive.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ tenantId: string }> };
const createSchema = z.object({ title: z.string().max(200).optional() }).strict();

export async function GET(request: NextRequest, context: RouteContext) {
  await assertAuthRuntimeRole();
  const { tenantId } = await context.params;
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
  const includeArchived = request.nextUrl.searchParams.get("archived") === "1";
  try {
    const result = await withTenantRequestTransaction({
      authDb: authPrisma, tenantDb: getTenantPrisma(), sessionToken, tenantId,
      action: "conversation_read",
      callback: tx => tx.conversation.findMany({
        where: {
          tenantId, deletedAt: null,
          archivedAt: includeArchived ? { not: null } : null,
          ...(cursor ? { OR: [
            { updatedAt: { lt: cursor.createdAt } },
            { updatedAt: cursor.createdAt, id: { lt: cursor.id } }
          ] } : {})
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        select: { id: true, title: true, archivedAt: true, createdAt: true, updatedAt: true }
      })
    });
    if (!result.authorized) return noStoreJson({ error: "tenant_access_denied" }, 403);
    const rows = result.value;
    const hasMore = rows.length > limit;
    const conversations = hasMore ? rows.slice(0, limit) : rows;
    const last = conversations.at(-1);
    return noStoreJson({
      conversations,
      nextCursor: hasMore && last ? encodeConversationCursor({ createdAt: last.updatedAt, id: last.id }) : null
    });
  } catch {
    return noStoreJson({ error: "conversation_history_unavailable" }, 503);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  await assertAuthRuntimeRole();
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);
  let title: string | null;
  try { title = normalizeConversationTitle(parsed.data.title); }
  catch { return noStoreJson({ error: "invalid_title" }, 400); }

  const { tenantId } = await context.params;
  const sessionToken = (await cookies()).get("vayro_session")?.value;
  try {
    const result = await withTenantRequestTransaction({
      authDb: authPrisma, tenantDb: getTenantPrisma(), sessionToken, tenantId,
      action: "conversation_write",
      callback: async (tx, actor) => {
        const conversation = await tx.conversation.create({
          data: { tenantId, createdByUserId: actor.userId, title },
          select: { id: true, title: true, createdAt: true, updatedAt: true }
        });
        await tx.auditEvent.create({
          data: { tenantId, actorUserId: actor.userId, action: "conversation.create", resource: "Conversation", resourceId: conversation.id }
        });
        return conversation;
      }
    });
    if (!result.authorized) return noStoreJson({ error: "tenant_access_denied" }, 403);
    return noStoreJson({ conversation: result.value }, 201);
  } catch {
    return noStoreJson({ error: "conversation_create_unavailable" }, 503);
  }
}
