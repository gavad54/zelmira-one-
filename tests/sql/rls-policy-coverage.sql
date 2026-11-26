-- VAYRO core RLS coverage gate.
-- Runs only after all Prisma migrations on disposable CI PostgreSQL.
-- Read-only: catalog assertions only; no data or schema changes.

DO $vayro$
DECLARE
  v_missing text;
  v_bad_role text;
  v_bad_table text;
  v_public_policy text;
BEGIN
  -- The 18 identity, tenant, platform, AI and conversation tables must all enforce RLS,
  -- including table-owner access, and must have at least one scoped policy.
  WITH required(table_name) AS (
    VALUES
      ('User'), ('Tenant'), ('Membership'), ('Session'), ('Product'),
      ('License'), ('AuditEvent'), ('EmailContact'),
      ('EmailContactVerificationToken'), ('AuthActionToken'),
      ('AuthRateLimit'), ('UserMfa'), ('MfaRecoveryCode'),
      ('AuthChallenge'), ('AiGeneration'), ('Conversation'), ('ConversationMessage'), ('ConversationAttachment')
  )
  SELECT string_agg(r.table_name, ', ' ORDER BY r.table_name)
    INTO v_missing
  FROM required r
  LEFT JOIN pg_class c
    ON c.oid = to_regclass(format('public.%I', r.table_name))
  LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.oid IS NULL
     OR n.nspname <> 'public'
     OR NOT c.relrowsecurity
     OR NOT c.relforcerowsecurity
     OR NOT EXISTS (
       SELECT 1 FROM pg_policies p
       WHERE p.schemaname = 'public' AND p.tablename = r.table_name
     );

  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'RLS_POLICY_COVERAGE_MISSING_OR_NOT_FORCED: %', v_missing;
  END IF;

  -- Each runtime capability must have a policy on the tables it is designed
  -- to access. These are explicit expected role/table pairs, not a count-only
  -- check that could pass with unrelated policies.
  WITH expected(table_name, role_name) AS (
    VALUES
      ('User','vayro_app'), ('User','vayro_auth'), ('User','vayro_platform'), ('User','vayro_platform_bootstrap'),
      ('Tenant','vayro_app'), ('Tenant','vayro_auth'), ('Tenant','vayro_platform'),
      ('Membership','vayro_app'), ('Membership','vayro_auth'),
      ('Session','vayro_app'), ('Session','vayro_auth'), ('Session','vayro_platform'),
      ('Product','vayro_app'), ('Product','vayro_platform'),
      ('License','vayro_app'), ('License','vayro_platform'),
      ('AuditEvent','vayro_app'), ('AuditEvent','vayro_auth'),
      ('AuditEvent','vayro_platform'), ('AuditEvent','vayro_platform_bootstrap'),
      ('EmailContact','vayro_platform'), ('EmailContact','vayro_platform_bootstrap'),
      ('EmailContactVerificationToken','vayro_platform'),
      ('AuthActionToken','vayro_auth'), ('AuthRateLimit','vayro_auth'),
      ('UserMfa','vayro_auth'), ('MfaRecoveryCode','vayro_auth'),
      ('AuthChallenge','vayro_auth'), ('AiGeneration','vayro_app'),
      ('Conversation','vayro_app'), ('ConversationMessage','vayro_app'), ('ConversationAttachment','vayro_app')
  )
  SELECT string_agg(e.table_name || ':' || e.role_name, ', ' ORDER BY e.table_name, e.role_name)
    INTO v_missing
  FROM expected e
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = e.table_name
      AND e.role_name::name = ANY(p.roles)
  );

  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'EXPECTED_ROLE_POLICY_MISSING: %', v_missing;
  END IF;

  -- No application policy may grant the pseudo-role PUBLIC or the Supabase
  -- Data API roles. Public Data API access is intentionally not the VAYRO
  -- server-side session/authentication boundary.
  SELECT string_agg(p.tablename || ':' || p.policyname, ', ' ORDER BY p.tablename, p.policyname)
    INTO v_public_policy
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND (
      'public'::name = ANY(p.roles)
      OR 'anon'::name = ANY(p.roles)
      OR 'authenticated'::name = ANY(p.roles)
    );

  IF v_public_policy IS NOT NULL THEN
    RAISE EXCEPTION 'UNEXPECTED_PUBLIC_OR_DATA_API_RLS_POLICY: %', v_public_policy;
  END IF;

  -- Runtime capability roles must remain non-login, non-owner, non-superuser
  -- and NOBYPASSRLS. Login credentials are provisioned separately.
  SELECT string_agg(r.rolname, ', ' ORDER BY r.rolname)
    INTO v_bad_role
  FROM pg_roles r
  WHERE r.rolname IN ('vayro_app','vayro_auth','vayro_platform','vayro_platform_bootstrap')
    AND (r.rolcanlogin OR r.rolsuper OR r.rolbypassrls);

  IF v_bad_role IS NOT NULL THEN
    RAISE EXCEPTION 'RUNTIME_CAPABILITY_ROLE_ATTRIBUTES_UNSAFE: %', v_bad_role;
  END IF;

  -- None of the runtime capability roles may own a protected table; table
  -- ownership bypasses ordinary RLS unless FORCE RLS is used and still grants
  -- DDL authority that these application roles must not have.
  SELECT string_agg(c.relname || ':' || r.rolname, ', ' ORDER BY c.relname)
    INTO v_bad_table
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_roles r ON r.oid = c.relowner
  WHERE n.nspname = 'public'
    AND c.relname IN (
      'User','Tenant','Membership','Session','Product','License','AuditEvent',
      'EmailContact','EmailContactVerificationToken','AuthActionToken',
      'AuthRateLimit','UserMfa','MfaRecoveryCode','AuthChallenge','AiGeneration',
      'Conversation','ConversationMessage','ConversationAttachment'
    )
    AND r.rolname IN ('vayro_app','vayro_auth','vayro_platform','vayro_platform_bootstrap');

  IF v_bad_table IS NOT NULL THEN
    RAISE EXCEPTION 'RUNTIME_ROLE_OWNS_PROTECTED_TABLE: %', v_bad_table;
  END IF;
END
$vayro$;

SELECT 'VAYRO_CORE_RLS_POLICY_COVERAGE_PASS' AS result;
