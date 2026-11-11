import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
import { platformPrisma, assertPlatformRuntimeRole } from "@/lib/platform-prisma";
import { getTenantPrisma } from "@/lib/tenant-prisma";
import { assertTenantRuntimeRole } from "@/lib/tenant-request-transaction.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Readiness is separate from liveness: it verifies every required database
// connection and the least-privilege role used by tenant data operations.
// Never expose connection details or internal error messages.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await assertAuthRuntimeRole();
    await authPrisma.$queryRaw`SELECT 1`;
    await assertPlatformRuntimeRole();
    await platformPrisma.$queryRaw`SELECT 1`;

    const tenantPrisma = getTenantPrisma();
    await assertTenantRuntimeRole(tenantPrisma);
    await tenantPrisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ready",
        service: "vayro-web",
        checks: {
          database: "ok",
          authentication: "ok",
          platform: "ok",
          tenant: "ok"
        },
        timestamp: new Date().toISOString()
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      {
        status: "not_ready",
        service: "vayro-web",
        checks: {
          database: "unavailable",
          authentication: "unavailable",
          platform: "unavailable",
          tenant: "unavailable"
        },
        timestamp: new Date().toISOString()
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
