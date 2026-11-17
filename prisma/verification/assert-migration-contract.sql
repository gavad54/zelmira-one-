-- CI contract assertions for the complete VAYRO-CORE migration chain.
-- Runs only against the disposable PostgreSQL service created by GitHub Actions.
DO $$
DECLARE
  expected_tables text[] := ARRAY[
    'User','Tenant','Membership','Session','Product','License','AuditEvent',
    'EmailContact','EmailContactVerificationToken','AuthActionToken','AuthRateLimit',
    'MfaCredential','MfaLoginChallenge','MfaRecoveryCode'
  ];
  table_name text;
  actual_count integer;
  bad_count integer;
BEGIN
  SELECT count(*) INTO actual_count
  FROM information_schema.tables
  WHERE table_schema='public' AND table_type='BASE TABLE'
    AND table_name = ANY(expected_tables);
  IF actual_count <> cardinality(expected_tables) THEN
    RAISE EXCEPTION 'Expected % VAYRO tables, found %', cardinality(expected_tables), actual_count;
  END IF;

  SELECT count(*) INTO bad_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname = ANY(expected_tables)
    AND c.relkind='r' AND NOT c.relrowsecurity;
  IF bad_count <> 0 THEN
    RAISE EXCEPTION '% VAYRO tables have RLS disabled', bad_count;
  END IF;

  FOREACH table_name IN ARRAY expected_tables LOOP
    IF has_table_privilege('anon', format('%I.%I','public',table_name), 'SELECT')
       OR has_table_privilege('anon', format('%I.%I','public',table_name), 'INSERT')
       OR has_table_privilege('anon', format('%I.%I','public',table_name), 'UPDATE')
       OR has_table_privilege('anon', format('%I.%I','public',table_name), 'DELETE')
       OR has_table_privilege('authenticated', format('%I.%I','public',table_name), 'SELECT')
       OR has_table_privilege('authenticated', format('%I.%I','public',table_name), 'INSERT')
       OR has_table_privilege('authenticated', format('%I.%I','public',table_name), 'UPDATE')
       OR has_table_privilege('authenticated', format('%I.%I','public',table_name), 'DELETE')
       OR has_table_privilege('service_role', format('%I.%I','public',table_name), 'SELECT')
       OR has_table_privilege('service_role', format('%I.%I','public',table_name), 'INSERT')
       OR has_table_privilege('service_role', format('%I.%I','public',table_name), 'UPDATE')
       OR has_table_privilege('service_role', format('%I.%I','public',table_name), 'DELETE') THEN
      RAISE EXCEPTION 'Unexpected client/service-role table privilege on public.%', table_name;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Session' AND column_name='revokedAt'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Session' AND column_name='lastSeenAt'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Session' AND column_name='assurance'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Session' AND column_name='mfaAuthenticatedAt'
  ) THEN
    RAISE EXCEPTION 'Session MFA/revocation/idle-tracking columns are incomplete';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='MfaCredential_pending_factor_complete_check'
      AND conrelid='public."MfaCredential"'::regclass
  ) THEN
    RAISE EXCEPTION 'MFA pending-factor completeness constraint is missing';
  END IF;

  SELECT count(*) INTO actual_count
  FROM public."_prisma_migrations"
  WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL;
  IF actual_count <> 6 THEN
    RAISE EXCEPTION 'Expected six successfully applied migrations, found %', actual_count;
  END IF;
END $$;

SELECT 'VAYRO migration contract: PASS (14 tables, RLS, client grants, MFA/session columns, 6 migrations)' AS result;
