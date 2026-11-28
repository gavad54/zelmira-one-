-- Verify every VAYRO privilege-group role remains non-login and least-privileged.
DO $$
DECLARE
  r RECORD;
  v_role_oid OID;
BEGIN
  IF (
    SELECT count(*)
    FROM pg_roles
    WHERE rolname IN (
      'vayro_app',
      'vayro_auth',
      'vayro_platform',
      'vayro_platform_bootstrap',
      'vayro_task_worker',
      'vayro_task_scheduler'
    )
  ) <> 6 THEN
    RAISE EXCEPTION 'EXPECTED_VAYRO_GROUP_ROLES_MISSING';
  END IF;

  FOR r IN
    SELECT *
    FROM (VALUES
      ('vayro_app', true),
      ('vayro_auth', true),
      ('vayro_platform', true),
      ('vayro_platform_bootstrap', false),
      ('vayro_task_worker', true),
      ('vayro_task_scheduler', true)
    ) AS expected(role_name, inherit_expected)
  LOOP
    SELECT oid INTO v_role_oid FROM pg_roles WHERE rolname = r.role_name;

    IF EXISTS (
      SELECT 1 FROM pg_roles
      WHERE oid = v_role_oid
        AND (
          rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole
          OR rolreplication OR rolbypassrls
          OR rolinherit IS DISTINCT FROM r.inherit_expected
        )
    ) THEN
      RAISE EXCEPTION 'VAYRO_GROUP_ROLE_ATTRIBUTE_TEST_FAILED: %', r.role_name;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_auth_members WHERE member = v_role_oid) THEN
      RAISE EXCEPTION 'VAYRO_GROUP_ROLE_MEMBERSHIP_TEST_FAILED: %', r.role_name;
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_namespace
      WHERE nspname = 'public' AND nspowner = v_role_oid
    ) THEN
      RAISE EXCEPTION 'VAYRO_GROUP_ROLE_SCHEMA_OWNERSHIP_TEST_FAILED: %', r.role_name;
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typowner = v_role_oid
    ) THEN
      RAISE EXCEPTION 'VAYRO_GROUP_ROLE_TYPE_OWNERSHIP_TEST_FAILED: %', r.role_name;
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind IN ('r', 'p', 'v', 'm', 'S')
        AND c.relowner = v_role_oid
    ) THEN
      RAISE EXCEPTION 'VAYRO_GROUP_ROLE_OWNERSHIP_TEST_FAILED: %', r.role_name;
    END IF;
  END LOOP;
END
$$;
