import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
import { getTenantPrisma } from "@/lib/tenant-prisma";
import { withTenantRequestTransaction } from "@/lib/tenant-request-transaction.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ tenantId: string }>;
};

/** Prove tenant access through the dedicated RLS runtime connection. */
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
      action: "tenant_read",
      callback: async () => true
    });

    if (!result.authorized) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        tenantId: result.tenantId,
        role: result.role,
        access: "granted"
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "tenant_access_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
