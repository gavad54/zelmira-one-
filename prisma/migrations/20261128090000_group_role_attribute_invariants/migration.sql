-- Fail closed if a privilege-group role has drifted from its intended attributes.
-- LOGIN identities must be separate roles granted membership in these groups.
DO $$
DECLARE
  r RECORD;
  v_role_oid OID;
BEGIN
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
    SELECT oid INTO v_role_oid
    FROM pg_roles
    WHERE rolname = r.role_name;

    IF v_role_oid IS NULL THEN
      RAISE EXCEPTION 'EXPECTED_GROUP_ROLE_MISSING: %', r.role_name;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE oid = v_role_oid
        AND (
          rolcanlogin
          OR rolsuper
          OR rolcreatedb
          OR rolcreaterole
          OR rolreplication
          OR rolbypassrls
          OR rolinherit IS DISTINCT FROM r.inherit_expected
        )
    ) THEN
      RAISE EXCEPTION 'GROUP_ROLE_ATTRIBUTE_DRIFT: %', r.role_name;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_auth_members
      WHERE member = v_role_oid
    ) THEN
      RAISE EXCEPTION 'GROUP_ROLE_INHERITS_UNEXPECTED_ROLE: %', r.role_name;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind IN ('r', 'p', 'v', 'm', 'S')
        AND c.relowner = v_role_oid
    ) THEN
      RAISE EXCEPTION 'GROUP_ROLE_OWNS_PUBLIC_OBJECT: %', r.role_name;
    END IF;
  END LOOP;
END
$$;
