import { cookies } from "next/headers";
import { noStoreJson } from "@/lib/auth-service";
import { authorizeTenantRequest } from "@/lib/tenant-request-authorization.mjs";
import { listTenantMembers } from "@/lib/tenant-service.mjs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ tenantId: string }>;
};

/**
 * Return the tenant directory only to verified OWNER/ADMIN members.
 * Membership and role are resolved server-side from the session cookie.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { tenantId } = await context.params;
  const sessionToken = (await cookies()).get("vayro_session")?.value;

  const authorization = await authorizeTenantRequest({
    sessionToken,
    tenantId,
    action: "members_manage",
    db: prisma
  });

  if (!authorization.authorized) {
    return noStoreJson({ error: "unauthorized" }, 401);
  }

  try {
    const members = await listTenantMembers({ db: prisma, tenantId });
    return noStoreJson({ members });
  } catch {
    return noStoreJson({ error: "tenant_members_unavailable" }, 503);
  }
}
