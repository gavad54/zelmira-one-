import { cookies } from "next/headers";
import { noStoreJson } from "@/lib/auth-service";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
import { getTenantPrisma } from "@/lib/tenant-prisma";
import { withTenantRequestTransaction } from "@/lib/tenant-request-transaction.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ tenantId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  await assertAuthRuntimeRole();
  const { tenantId } = await context.params;
  const sessionToken = (await cookies()).get("vayro_session")?.value;
  try {
    const result = await withTenantRequestTransaction({
      authDb: authPrisma,
      tenantDb: getTenantPrisma(),
      sessionToken,
      tenantId,
      action: "ai_read",
      callback: tx => tx.aiGeneration.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, kind: true, prompt: true, output: true, createdAt: true, userId: true }
      })
    });
    if (!result.authorized) return noStoreJson({ error: "tenant_access_denied" }, 403);
    return noStoreJson({ generations: result.value });
  } catch {
    return noStoreJson({ error: "generation_history_unavailable" }, 503);
  }
}
