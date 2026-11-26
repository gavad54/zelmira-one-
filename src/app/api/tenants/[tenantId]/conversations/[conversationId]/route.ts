import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { z } from "zod";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { noStoreJson } from "@/lib/auth-service";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
import { getTenantPrisma } from "@/lib/tenant-prisma";
import { withTenantRequestTransaction } from "@/lib/tenant-request-transaction.mjs";
import { archiveConversationUpdate, restoreConversationUpdate, softDeleteConversationUpdate } from "@/lib/conversation-archive.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ tenantId: string; conversationId: string }> };
const patchSchema = z.object({ archived: z.boolean() }).strict();

export async function PATCH(request: NextRequest, context: RouteContext) {
  await assertAuthRuntimeRole();
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);
  const { tenantId, conversationId } = await context.params;
  const sessionToken = (await cookies()).get("vayro_session")?.value;
  try {
    const result = await withTenantRequestTransaction({
      authDb: authPrisma, tenantDb: getTenantPrisma(), sessionToken, tenantId,
      action: "conversation_archive",
      callback: async (tx, actor) => {
        const changed = await tx.conversation.updateMany({
          where: { id: conversationId, tenantId, deletedAt: null },
          data: parsed.data.archived ? archiveConversationUpdate() : restoreConversationUpdate()
        });
        if (changed.count !== 1) return false;
        await tx.auditEvent.create({
          data: {
            tenantId, actorUserId: actor.userId,
            action: parsed.data.archived ? "conversation.archive" : "conversation.restore",
            resource: "Conversation", resourceId: conversationId
          }
        });
        return true;
      }
    });
    if (!result.authorized) return noStoreJson({ error: "tenant_access_denied" }, 403);
    if (!result.value) return noStoreJson({ error: "conversation_not_found" }, 404);
    return noStoreJson({ archived: parsed.data.archived });
  } catch {
    return noStoreJson({ error: "conversation_archive_unavailable" }, 503);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  await assertAuthRuntimeRole();
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  const { tenantId, conversationId } = await context.params;
  const sessionToken = (await cookies()).get("vayro_session")?.value;
  try {
    const result = await withTenantRequestTransaction({
      authDb: authPrisma, tenantDb: getTenantPrisma(), sessionToken, tenantId,
      action: "conversation_archive",
      callback: async (tx, actor) => {
        const changed = await tx.conversation.updateMany({
          where: { id: conversationId, tenantId, deletedAt: null },
          data: softDeleteConversationUpdate()
        });
        if (changed.count !== 1) return false;
        await tx.auditEvent.create({
          data: { tenantId, actorUserId: actor.userId, action: "conversation.soft_delete", resource: "Conversation", resourceId: conversationId }
        });
        return true;
      }
    });
    if (!result.authorized) return noStoreJson({ error: "tenant_access_denied" }, 403);
    if (!result.value) return noStoreJson({ error: "conversation_not_found" }, 404);
    return noStoreJson({ deleted: true });
  } catch {
    return noStoreJson({ error: "conversation_delete_unavailable" }, 503);
  }
}
