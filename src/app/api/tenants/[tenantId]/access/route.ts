import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authorizeTenantRequest } from "@/lib/tenant-request-authorization.mjs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ tenantId: string }>;
};

/**
 * Minimal protected proof endpoint. It does not create sessions or expose
 * tenant data; it verifies that the current session can read this tenant.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { tenantId } = await context.params;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("vayro_session")?.value;

  const authorization = await authorizeTenantRequest({
    sessionToken,
    tenantId,
    action: "tenant_read",
    db: prisma
  });

  if (!authorization.authorized) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      tenantId: authorization.tenantId,
      role: authorization.role,
      access: "granted"
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
