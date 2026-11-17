import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Check = "ok" | "not_configured" | "unavailable";

function mfaConfiguration(): Check {
  return /^[a-f0-9]{64}$/i.test(process.env.VAYRO_MFA_ENCRYPTION_KEY ?? "")
    ? "ok"
    : "not_configured";
}

function trustedProxyConfiguration(): Check {
  const value = process.env.TRUSTED_PROXY_HOPS ?? "";
  if (!/^\\d+$/.test(value)) return "not_configured";
  const hops = Number(value);
  return Number.isSafeInteger(hops) && hops >= 1 && hops <= 10
    ? "ok"
    : "not_configured";
}

function emailConfiguration(): Check {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (provider === "resend") {
    const apiKey = process.env.EMAIL_API_KEY?.trim() ?? "";
    const from = process.env.EMAIL_FROM?.trim() ?? "";
    const validFrom = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(from);
    // Resend's shared test sender is deliberately not considered production-ready.
    return apiKey.length > 0 && validFrom && !from.toLowerCase().endsWith("@resend.dev")
      ? "ok"
      : "not_configured";
  }
  if (provider === "gmail") {
    const sender = process.env.GMAIL_SENDER_EMAIL?.trim() ?? "";
    const validSender = /^[^\\s@]+@gmail\\.com$/i.test(sender);
    return Boolean(
      process.env.GMAIL_CLIENT_ID?.trim() &&
      process.env.GMAIL_CLIENT_SECRET?.trim() &&
      process.env.GMAIL_REFRESH_TOKEN?.trim() &&
      validSender
    ) ? "ok" : "not_configured";
  }
  return "not_configured";
}

// A reachable database is not sufficient: the application must not connect
// as postgres, a superuser, or a BYPASSRLS role. Keep this check server-side.
async function databaseConfiguration(): Promise<Check> {
  try {
    const rows = await prisma.$queryRaw<Array<{
      roleName: string;
      isSuperuser: boolean;
      bypassesRls: boolean;
      canLogin: boolean;
    }>>`
      SELECT
        current_user AS "roleName",
        COALESCE(rolsuper, false) AS "isSuperuser",
        COALESCE(rolbypassrls, false) AS "bypassesRls",
        COALESCE(rolcanlogin, false) AS "canLogin"
      FROM pg_roles
      WHERE rolname = current_user
    `;
    const identity = rows[0];
    if (!identity) return "unavailable";
    return identity.canLogin && !identity.isSuperuser && !identity.bypassesRls
      ? "ok"
      : "not_configured";
  } catch {
    return "unavailable";
  }
}

// Readiness is separate from liveness. It verifies database reachability,
// least-privilege runtime identity and security-critical runtime configuration.
// Values, role names and provider credentials are never returned to callers.
export async function GET() {
  const [database] = await Promise.all([databaseConfiguration()]);
  const checks = {
    database,
    mfa: mfaConfiguration(),
    rateLimit: trustedProxyConfiguration(),
    email: emailConfiguration()
  };

  const ready = Object.values(checks).every(value => value === "ok");
  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      service: "vayro-web",
      checks,
      timestamp: new Date().toISOString()
    },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
