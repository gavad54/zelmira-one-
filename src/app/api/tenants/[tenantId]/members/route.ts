import { cookies } from "next/headers";
import { noStoreJson } from "@/lib/auth-service";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
import { getTenantPrisma } from "@/lib/tenant-prisma";
import { listTenantMembers } from "@/lib/tenant-service.mjs";
import { withTenantRequestTransaction } from "@/lib/tenant-request-transaction.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ tenantId: string }>;
};

/** Return member profiles only to verified OWNER/ADMIN members under RLS. */
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
      action: "members_manage",
      callback: tx => listTenantMembers({ db: tx, tenantId })
    });

    if (!result.authorized) return noStoreJson({ error: "unauthorized" }, 401);
    return noStoreJson({ members: result.value });
  } catch {
    return noStoreJson({ error: "tenant_members_unavailable" }, 503);
  }
}
