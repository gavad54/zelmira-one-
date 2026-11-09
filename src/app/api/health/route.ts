import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Liveness only: this endpoint confirms that the web process can answer HTTP.
// It intentionally does not claim that PostgreSQL or external dependencies are healthy.
export async function GET() {
  return NextResponse.json(
    { status: "alive", service: "vayro-web", timestamp: new Date().toISOString() },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
