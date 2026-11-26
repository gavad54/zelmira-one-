\set ON_ERROR_STOP on

-- Disposable PostgreSQL CI only. Never run this against VAYRO-CORE.
-- Reconcile the Prisma application model inventory and migration state with
-- the actual PostgreSQL catalogs before exercising tenant RLS behavior.

DO $vayro_catalog_gate$
DECLARE
  required_table text;
  required_tables text[] := ARRAY[
    'User','Tenant','Membership','Session','Product','License','AuditEvent',
    'EmailContact','EmailContactVerificationToken','AuthActionToken',
    'AuthRateLimit','UserMfa','MfaRecoveryCode','AuthChallenge','AiGeneration',
    'Conversation','ConversationMessage','ConversationAttachment',
    'EngineeringTask','EngineeringTaskAttempt','EngineeringTaskDependency',
    'GoalRecord','GoalEpic','GoalFeature','RecurringSchedule','EngineeringAgent','TaskReview'
  ];
  protected_table text;
  protected_tables text[] := ARRAY[
    'Tenant','Membership','License','Product','AuditEvent','User','Session','AiGeneration',
    'Conversation','ConversationMessage','ConversationAttachment'
  ];
  migration_count integer;
  failed_migration_count integer;
BEGIN
  -- Fail closed if Prisma migration deploy did not create a migration ledger.
  IF to_regclass('public."_prisma_migrations"') IS NULL THEN
    RAISE EXCEPTION 'Prisma migration ledger is missing after migrate deploy';
  END IF;

  SELECT count(*)::integer,
         count(*) FILTER (WHERE finished_at IS NULL AND rolled_back_at IS NULL)::integer
    INTO migration_count, failed_migration_count
  FROM public."_prisma_migrations";

  IF migration_count = 0 THEN
    RAISE EXCEPTION 'No applied Prisma migrations were recorded';
  END IF;
  IF failed_migration_count > 0 THEN
    RAISE EXCEPTION 'Unfinished Prisma migrations remain: %', failed_migration_count;
  END IF;

  -- Every Prisma model expected by the checked-in schema must exist as a
  -- physical public table in the disposable migrated database.
  FOREACH required_table IN ARRAY required_tables LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = required_table
        AND c.relkind IN ('r','p')
    ) THEN
      RAISE EXCEPTION 'Prisma model table public.% is missing after migrations', required_table;
    END IF;
  END LOOP;

  -- Tenant-owned and identity projections must have RLS + FORCE RLS and at
  -- least one policy. Detailed positive/negative tenant tests follow separately.
  FOREACH protected_table IN ARRAY protected_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname='public' AND c.relname=protected_table
        AND c.relkind IN ('r','p')
        AND c.relrowsecurity AND c.relforcerowsecurity
    ) THEN
      RAISE EXCEPTION 'RLS and FORCE RLS are required on public.%', protected_table;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename=protected_table
    ) THEN
      RAISE EXCEPTION 'No RLS policy exists on public.%', protected_table;
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid=c.relnamespace
      JOIN pg_roles r ON r.oid=c.relowner
      WHERE n.nspname='public' AND c.relname=protected_table
        AND r.rolname='vayro_app'
    ) THEN
      RAISE EXCEPTION 'Runtime tenant role vayro_app must not own public.%', protected_table;
    END IF;
  END LOOP;

  -- New VAYRO control-plane records must also exist with RLS enabled.
  IF EXISTS (
    SELECT 1 FROM unnest(ARRAY['GoalRecord','GoalEpic','GoalFeature','RecurringSchedule','EngineeringAgent','TaskReview']) AS t(name)
    LEFT JOIN pg_class c ON c.oid = to_regclass(format('public.%I', t.name))
    WHERE c.oid IS NULL OR NOT c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'VAYRO control-plane RLS coverage is incomplete';
  END IF;

  IF has_table_privilege('vayro_task_worker','public."EngineeringAgent"','SELECT')
     OR has_table_privilege('vayro_task_worker','public."TaskReview"','INSERT')
     OR has_table_privilege('vayro_task_scheduler','public."RecurringSchedule"','SELECT')
     OR has_table_privilege('vayro_task_scheduler','public."EngineeringTask"','INSERT') THEN
    RAISE EXCEPTION 'Worker roles have direct control-plane table access';
  END IF;

  -- The runtime tenant capability role must exist and must not bypass RLS.
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname='vayro_app'
      AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcanlogin
  ) THEN
    RAISE EXCEPTION 'vayro_app must exist as NOLOGIN, non-superuser, NOBYPASSRLS';
  END IF;

  -- Tenant application code must not be able to read credential material,
  -- MFA secrets, authentication challenges, or platform email verification.
  IF has_table_privilege('vayro_app','public."AuthActionToken"','SELECT')
     OR has_table_privilege('vayro_app','public."AuthRateLimit"','SELECT')
     OR has_table_privilege('vayro_app','public."UserMfa"','SELECT')
     OR has_table_privilege('vayro_app','public."MfaRecoveryCode"','SELECT')
     OR has_table_privilege('vayro_app','public."AuthChallenge"','SELECT')
     OR has_table_privilege('vayro_app','public."EmailContact"','SELECT')
     OR has_table_privilege('vayro_app','public."EmailContactVerificationToken"','SELECT')
     OR has_column_privilege('vayro_app','public."User"','passwordHash','SELECT')
     OR has_column_privilege('vayro_app','public."User"','platformRole','SELECT') THEN
    RAISE EXCEPTION 'vayro_app has forbidden access to authentication or platform secrets';
  END IF;

  RAISE NOTICE 'VAYRO catalog reconciliation passed: % Prisma tables, % applied migrations, % protected RLS tables',
    cardinality(required_tables), migration_count, cardinality(protected_tables);
END
$vayro_catalog_gate$;
