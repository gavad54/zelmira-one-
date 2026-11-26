import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { noStoreJson } from "@/lib/auth-service";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
import { getTenantPrisma } from "@/lib/tenant-prisma";
import { withTenantRequestTransaction } from "@/lib/tenant-request-transaction.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ tenantId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  await assertAuthRuntimeRole();
  const { tenantId } = await context.params;
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 200) {
    return noStoreJson({ error: "invalid_search_query" }, 400);
  }
  const requestedLimit = request.nextUrl.searchParams.get("limit");
  const limit = requestedLimit == null ? 20 : Number(requestedLimit);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 20) {
    return noStoreJson({ error: "invalid_search_limit" }, 400);
  }
  const includeArchived = request.nextUrl.searchParams.get("archived") === "1";
  const sessionToken = (await cookies()).get("vayro_session")?.value;
  try {
    const result = await withTenantRequestTransaction({
      authDb: authPrisma, tenantDb: getTenantPrisma(), sessionToken, tenantId,
      action: "conversation_read",
      callback: tx => tx.$queryRaw<Array<{
        id: string;
        conversationId: string;
        title: string | null;
        role: string;
        createdAt: Date;
        snippet: string;
        rank: number;
      }>>`
        SELECT
          m."id",
          m."conversationId",
          c."title",
          m."role",
          m."createdAt",
          ts_headline(
            'simple', m."content",
            websearch_to_tsquery('simple', ${query}),
            'MaxWords=24,MinWords=8,ShortWord=3'
          ) AS "snippet",
          ts_rank(
            to_tsvector('simple', m."content"),
            websearch_to_tsquery('simple', ${query})
          ) AS "rank"
        FROM public."ConversationMessage" m
        JOIN public."Conversation" c
          ON c."id" = m."conversationId"
         AND c."tenantId" = m."tenantId"
        WHERE m."tenantId" = ${tenantId}
          AND c."deletedAt" IS NULL
          AND (${includeArchived}::boolean OR c."archivedAt" IS NULL)
          AND to_tsvector('simple', m."content")
              @@ websearch_to_tsquery('simple', ${query})
        ORDER BY "rank" DESC, m."createdAt" DESC, m."id" DESC
        LIMIT ${limit}
      `
    });
    if (!result.authorized) return noStoreJson({ error: "tenant_access_denied" }, 403);
    return noStoreJson({ results: result.value });
  } catch {
    return noStoreJson({ error: "conversation_search_unavailable" }, 503);
  }
}
