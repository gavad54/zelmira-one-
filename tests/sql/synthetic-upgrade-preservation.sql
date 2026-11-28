-- Verify synthetic rows survive an initial-schema-to-current-schema upgrade.
DO $$
DECLARE
  v_table TEXT;
  v_count BIGINT;
  v_expected TEXT[] := ARRAY[
    'User',
    'Tenant',
    'Membership',
    'Session',
    'Product',
    'License',
    'AuditEvent',
    'EmailContact',
    'EmailContactVerificationToken',
    'AuthActionToken',
    'AuthRateLimit'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_expected LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', v_table) INTO v_count;
    IF v_count <> 1 THEN
      RAISE EXCEPTION 'SYNTHETIC_UPGRADE_ROW_PRESERVATION_FAILED: table %, expected 1 row, found %',
        v_table, v_count;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Session'
      AND column_name = 'revokedAt'
  ) THEN
    RAISE EXCEPTION 'SYNTHETIC_UPGRADE_SESSION_LIFECYCLE_COLUMN_MISSING';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'AuditEvent_tenantId_fkey'
      AND conrelid = 'public."AuditEvent"'::regclass
  ) THEN
    RAISE EXCEPTION 'SYNTHETIC_UPGRADE_AUDIT_TENANT_FK_MISSING';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public."_prisma_migrations"
    WHERE migration_name = '20261126100000_conversation_archive_foundation'
      AND finished_at IS NOT NULL
      AND rolled_back_at IS NULL
  ) THEN
    RAISE EXCEPTION 'SYNTHETIC_UPGRADE_MIGRATION_LEDGER_INCOMPLETE';
  END IF;
END
$$;
