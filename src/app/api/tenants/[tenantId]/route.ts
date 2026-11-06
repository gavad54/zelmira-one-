import { cookies } from "next/headers";
import { getTenantWorkspace } from "@/lib/tenant-workspace.mjs";
import { noStoreJson } from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ tenantId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { tenantId } = await context.params;
  const sessionToken = (await cookies()).get("vayro_session")?.value;

  const result = await getTenantWorkspace({
    sessionToken,
    tenantId,
    db: prisma
  });

  return noStoreJson(result.body, result.status);
}
