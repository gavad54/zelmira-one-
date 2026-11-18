import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  emailConfiguration,
  mfaConfiguration,
  trustedProxyConfiguration
} from "@/lib/readiness-config.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Check = "ok" | "not_configured" | "unavailable";

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

// Read-only catalog and migration-history check. It never applies DDL or migrations.
async function schemaConfiguration(): Promise<Check> {
  try {
    const rows = await prisma.$queryRaw<Array<{
      missingTables: number;
      missingColumns: number;
      hasSessionAssurance: boolean;
      hasMigrationTable: boolean;
      missingMigrations: number;
      incompleteMigrations: number;
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
      ),
      expected_migrations(migration_name) AS (
        VALUES
          ('20261106055500_init_vayro_core'),
          ('20261111080000_add_mfa_persistence'),
          ('20261114080000_session_mfa_assurance'),
          ('20261114090000_add_session_revocation'),
          ('20261116080000_add_session_idle_tracking'),
          ('20261117080000_mfa_factor_replacement')
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
        to_regclass('public._prisma_migrations') IS NOT NULL AS "hasMigrationTable",
        (SELECT count(*)::int
         FROM expected_migrations e
         LEFT JOIN public."_prisma_migrations" m
           ON m.migration_name = e.migration_name
          AND m.finished_at IS NOT NULL
          AND m.rolled_back_at IS NULL
         WHERE m.migration_name IS NULL) AS "missingMigrations",
        (SELECT count(*)::int
         FROM public."_prisma_migrations"
         WHERE finished_at IS NULL AND rolled_back_at IS NULL) AS "incompleteMigrations"
    `;
    const schema = rows[0];
    if (!schema) return "unavailable";
    return schema.missingTables === 0 &&
      schema.missingColumns === 0 &&
      schema.hasSessionAssurance &&
      schema.hasMigrationTable &&
      schema.missingMigrations === 0 &&
      schema.incompleteMigrations === 0
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
