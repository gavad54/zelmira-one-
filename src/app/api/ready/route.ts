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

async function databaseConfiguration(): Promise<Check> {
  try {
    const rows = await prisma.$queryRaw<Array<{
      isSuperuser: boolean;
      bypassesRls: boolean;
      canLogin: boolean;
    }>>`
      SELECT
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

// Verify the complete application schema before accepting traffic. This is a
// read-only catalog check; it never runs migrations or returns schema details.
async function schemaConfiguration(): Promise<Check> {
  try {
    const rows = await prisma.$queryRaw<Array<{
      missingTables: number;
      missingColumns: number;
      hasSessionAssurance: boolean;
      hasMigrationTable: boolean;
    }>>`
      WITH expected_tables(table_name) AS (
        VALUES
          ('User'), ('Tenant'), ('Membership'), ('Session'), ('Product'),
          ('License'), ('AuditEvent'), ('EmailContact'),
          ('EmailContactVerificationToken'), ('AuthActionToken'), ('AuthRateLimit'),
          ('MfaCredential'), ('MfaLoginChallenge'), ('MfaRecoveryCode')
      ),
      expected_columns(table_name, column_name) AS (
        VALUES
          ('Session', 'assurance'),
          ('Session', 'mfaAuthenticatedAt'),
          ('Session', 'revokedAt'),
          ('Session', 'lastSeenAt'),
          ('MfaCredential', 'secretCiphertext'),
          ('MfaCredential', 'secretIv'),
          ('MfaCredential', 'secretAuthTag'),
          ('MfaCredential', 'keyVersion'),
          ('MfaCredential', 'lastAcceptedStep'),
          ('MfaCredential', 'pendingSecretCiphertext'),
          ('MfaCredential', 'pendingSecretIv'),
          ('MfaCredential', 'pendingSecretAuthTag'),
          ('MfaCredential', 'pendingKeyVersion'),
          ('MfaCredential', 'pendingExpiresAt'),
          ('MfaLoginChallenge', 'tokenHash'),
          ('MfaLoginChallenge', 'userId'),
          ('MfaLoginChallenge', 'expiresAt'),
          ('MfaRecoveryCode', 'codeHash'),
          ('MfaRecoveryCode', 'userId'),
          ('MfaRecoveryCode', 'usedAt')
      )
      SELECT
        (SELECT count(*)::int
         FROM expected_tables e
         LEFT JOIN information_schema.tables t
           ON t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
          AND t.table_name = e.table_name
         WHERE t.table_name IS NULL) AS "missingTables",
        (SELECT count(*)::int
         FROM expected_columns e
         LEFT JOIN information_schema.columns c
           ON c.table_schema = 'public'
          AND c.table_name = e.table_name
          AND c.column_name = e.column_name
         WHERE c.column_name IS NULL) AS "missingColumns",
        to_regtype('public."SessionAssurance"') IS NOT NULL AS "hasSessionAssurance",
        to_regclass('public._prisma_migrations') IS NOT NULL AS "hasMigrationTable"
    `;
    const schema = rows[0];
    if (!schema) return "unavailable";
    return schema.missingTables === 0 &&
      schema.missingColumns === 0 &&
      schema.hasSessionAssurance &&
      schema.hasMigrationTable
      ? "ok"
      : "not_configured";
  } catch {
    return "unavailable";
  }
}

export async function GET() {
  const [database, schema] = await Promise.all([
    databaseConfiguration(),
    schemaConfiguration()
  ]);
  const checks = {
    database,
    schema,
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
