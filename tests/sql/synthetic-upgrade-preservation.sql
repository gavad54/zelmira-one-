-- Verify synthetic fixture values survive an initial-schema-to-current-schema upgrade.
-- This is an isolated PostgreSQL 17 rehearsal; it is not a production backup restore.
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

  -- Assert stable fixture values, not only row counts.
  IF NOT EXISTS (
    SELECT 1 FROM public."User"
    WHERE id = 'upgrade-user'
      AND email = 'upgrade@example.invalid'
      AND "passwordHash" = 'synthetic-hash'
      AND "displayName" = 'Synthetic Upgrade User'
      AND "platformRole" = 'USER'
  ) THEN
    RAISE EXCEPTION 'SYNTHETIC_UPGRADE_USER_FIXTURE_CHANGED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public."Tenant"
    WHERE id = 'upgrade-tenant'
      AND name = 'Synthetic Upgrade Tenant'
      AND slug = 'synthetic-upgrade-tenant'
      AND status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'SYNTHETIC_UPGRADE_TENANT_FIXTURE_CHANGED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public."Membership"
    WHERE id = 'upgrade-membership'
      AND "userId" = 'upgrade-user'
      AND "tenantId" = 'upgrade-tenant'
      AND role = 'MEMBER'
  ) THEN
    RAISE EXCEPTION 'SYNTHETIC_UPGRADE_MEMBERSHIP_FIXTURE_CHANGED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public."Session"
    WHERE id = 'upgrade-session'
      AND "tokenHash" = 'synthetic-session-token-hash'
      AND "userId" = 'upgrade-user'
      AND "expiresAt" > CURRENT_TIMESTAMP + INTERVAL '23 hours'
      AND "expiresAt" < CURRENT_TIMESTAMP + INTERVAL '25 hours'
  ) THEN
    RAISE EXCEPTION 'SYNTHETIC_UPGRADE_SESSION_FIXTURE_CHANGED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public."Product"
    WHERE id = 'upgrade-product'
      AND key = 'UPGRADE_FIXTURE'
      AND name = 'Synthetic Upgrade Product'
      AND description = 'Synthetic migration fixture'
      AND status = 'PLANNED'
  ) THEN
    RAISE EXCEPTION 'SYNTHETIC_UPGRADE_PRODUCT_FIXTURE_CHANGED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public."License"
    WHERE id = 'upgrade-license'
      AND "tenantId" = 'upgrade-tenant'
      AND "productId" = 'upgrade-product'
      AND active IS TRUE
      AND "startsAt" <= CURRENT_TIMESTAMP
      AND ("endsAt" IS NULL OR "endsAt" > CURRENT_TIMESTAMP)
  ) THEN
    RAISE EXCEPTION 'SYNTHETIC_UPGRADE_LICENSE_FIXTURE_CHANGED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public."AuditEvent"
    WHERE id = 'upgrade-audit'
      AND "actorUserId" = 'upgrade-user'
      AND "tenantId" = 'upgrade-tenant'
      AND action = 'synthetic.upgrade.fixture'
      AND resource = 'SyntheticFixture'
  ) THEN
    RAISE EXCEPTION 'SYNTHETIC_UPGRADE_AUDIT_FIXTURE_CHANGED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public."EmailContact"
    WHERE id = 'upgrade-email-contact'
      AND email = 'upgrade-contact@example.invalid'
      AND label = 'Synthetic contact'
      AND purposes = ARRAY['OWNER']::public."EmailPurpose"[]
      AND enabled IS TRUE
      AND "isPrimary" IS FALSE
  ) THEN
    RAISE EXCEPTION 'SYNTHETIC_UPGRADE_EMAIL_CONTACT_FIXTURE_CHANGED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public."EmailContactVerificationToken"
    WHERE id = 'upgrade-email-token'
      AND "tokenHash" = 'synthetic-email-token-hash'
      AND "contactId" = 'upgrade-email-contact'
      AND "expiresAt" > CURRENT_TIMESTAMP + INTERVAL '23 hours'
      AND "expiresAt" < CURRENT_TIMESTAMP + INTERVAL '25 hours'
  ) THEN
    RAISE EXCEPTION 'SYNTHETIC_UPGRADE_EMAIL_TOKEN_FIXTURE_CHANGED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public."AuthActionToken"
    WHERE id = 'upgrade-auth-token'
      AND "tokenHash" = 'synthetic-auth-token-hash'
      AND "userId" = 'upgrade-user'
      AND purpose = 'EMAIL_VERIFY'
      AND "expiresAt" > CURRENT_TIMESTAMP + INTERVAL '23 hours'
      AND "expiresAt" < CURRENT_TIMESTAMP + INTERVAL '25 hours'
      AND "consumedAt" IS NULL
  ) THEN
    RAISE EXCEPTION 'SYNTHETIC_UPGRADE_AUTH_TOKEN_FIXTURE_CHANGED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public."AuthRateLimit"
    WHERE "keyHash" = 'synthetic-rate-limit-key'
      AND count = 1
      AND "windowStartedAt" <= CURRENT_TIMESTAMP
      AND "expiresAt" > CURRENT_TIMESTAMP
  ) THEN
    RAISE EXCEPTION 'SYNTHETIC_UPGRADE_RATE_LIMIT_FIXTURE_CHANGED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Session'
      AND column_name = 'revokedAt'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Session'
      AND column_name = 'lastSeenAt'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Session'
      AND column_name = 'assurance'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Session'
      AND column_name = 'mfaAuthenticatedAt'
  ) THEN
    RAISE EXCEPTION 'SYNTHETIC_UPGRADE_SESSION_LIFECYCLE_COLUMNS_MISSING';
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
