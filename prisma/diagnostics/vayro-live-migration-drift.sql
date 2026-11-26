-- VAYRO-CORE migration drift report (strictly READ ONLY).
-- Execute with a read-only catalog identity. Returns expected later-migration
-- objects and whether they are present in the live schema. No DDL/DML.

WITH expected(kind, object_name, source_migration) AS (
  VALUES
    ('TABLE','UserMfa','20261108000000_mfa_session_foundation'),
    ('TABLE','MfaRecoveryCode','20261108000000_mfa_session_foundation'),
    ('TABLE','AuthChallenge','20261108000000_mfa_session_foundation'),
    ('TABLE','AiGeneration','20261109150000_tenant_ai_generation_history'),
    ('TABLE','EngineeringTask','20261121130000_durable_task_engine'),
    ('TABLE','EngineeringTaskAttempt','20261121130000_durable_task_engine'),
    ('TABLE','EngineeringTaskDependency','20261122100000_task_dependency_graph'),
    ('COLUMN','Session.revokedAt','20261108000000_mfa_session_foundation'),
    ('COLUMN','Session.lastSeenAt','20261108000000_mfa_session_foundation'),
    ('COLUMN','Session.assurance','20261108000000_mfa_session_foundation'),
    ('COLUMN','Session.mfaAuthenticatedAt','20261108000000_mfa_session_foundation'),
    ('ENUM','SessionAssurance','20261108000000_mfa_session_foundation'),
    ('ENUM','AuthChallengePurpose','20261108000000_mfa_session_foundation'),
    ('ENUM','EngineeringTaskStatus','20261121130000_durable_task_engine'),
    ('CONSTRAINT','AuditEvent_tenantId_fkey','20261108170000_tenant_rls_runtime_boundary'),
    ('LEDGER','public._prisma_migrations','Prisma migration history')
),
observed AS (
  SELECT e.kind, e.object_name, e.source_migration,
    CASE e.kind
      WHEN 'TABLE' THEN
        CASE WHEN to_regclass(format('public.%I', e.object_name)) IS NULL THEN 'MISSING' ELSE 'PRESENT' END
      WHEN 'COLUMN' THEN
        CASE WHEN EXISTS (
          SELECT 1 FROM information_schema.columns c
          WHERE c.table_schema='public'
            AND c.table_name=split_part(e.object_name,'.',1)
            AND c.column_name=split_part(e.object_name,'.',2)
        ) THEN 'PRESENT' ELSE 'MISSING' END
      WHEN 'ENUM' THEN
        CASE WHEN EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON n.oid=t.typnamespace
          WHERE n.nspname='public' AND t.typname=e.object_name AND t.typtype='e'
        ) THEN 'PRESENT' ELSE 'MISSING' END
      WHEN 'CONSTRAINT' THEN
        CASE WHEN EXISTS (
          SELECT 1 FROM pg_constraint c
          JOIN pg_namespace n ON n.oid=c.connamespace
          WHERE n.nspname='public' AND c.conname=e.object_name
        ) THEN 'PRESENT' ELSE 'MISSING' END
      WHEN 'LEDGER' THEN
        CASE WHEN to_regclass('public."_prisma_migrations"') IS NULL THEN 'MISSING' ELSE 'PRESENT' END
    END AS live_status
  FROM expected e
)
SELECT kind, object_name, source_migration, live_status
FROM observed
ORDER BY CASE live_status WHEN 'MISSING' THEN 0 ELSE 1 END, kind, object_name;

-- Baseline inventory summary. It intentionally does not read application rows.
SELECT
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relkind IN ('r','p')) AS public_table_count,
  (SELECT count(*) FROM pg_policies WHERE schemaname='public') AS public_policy_count,
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relrowsecurity) AS rls_enabled_table_count,
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relforcerowsecurity) AS force_rls_table_count,
  (SELECT count(*) FROM pg_roles WHERE rolname LIKE 'vayro_%') AS vayro_role_count,
  to_regclass('public."_prisma_migrations"') IS NOT NULL AS prisma_ledger_present;
