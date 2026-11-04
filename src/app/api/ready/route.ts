import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Readiness is separate from liveness: it verifies the database connection
// without exposing connection details or internal error messages.
export async function GET() {
  try {
    await prisma.$queryRaw\`SELECT 1\`;
    return NextResponse.json(
      {
        status: "ready",
        service: "vayro-web",
        checks: { database: "ok" },
        timestamp: new Date().toISOString()
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      {
        status: "not_ready",
        service: "vayro-web",
        checks: { database: "unavailable" },
        timestamp: new Date().toISOString()
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
