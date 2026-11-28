-- Data API role isolation gate.
-- Runs only against the disposable PostgreSQL service in GitHub Actions.
-- The VAYRO server uses dedicated backend roles; Supabase Data API roles
-- must not receive direct privileges on VAYRO's public application tables.

\set ON_ERROR_STOP on

DO $vayro$
DECLARE
  client_role text;
  relation_record record;
  privilege_name text;
  protected_roles text[] := ARRAY['anon', 'authenticated', 'service_role'];
  table_privileges text[] := ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'];
BEGIN
  FOREACH client_role IN ARRAY protected_roles LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = client_role) THEN
      RAISE EXCEPTION 'Required Data API role % is missing from isolated CI', client_role;
    END IF;

    FOR relation_record IN
      SELECT n.nspname, c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
    LOOP
      FOREACH privilege_name IN ARRAY table_privileges LOOP
        IF has_table_privilege(
          client_role,
          format('%I.%I', relation_record.nspname, relation_record.relname),
          privilege_name
        ) OR (
          privilege_name IN ('SELECT', 'INSERT', 'UPDATE', 'REFERENCES')
          AND has_any_column_privilege(
            client_role,
            format('%I.%I', relation_record.nspname, relation_record.relname),
            privilege_name
          )
        ) THEN
          RAISE EXCEPTION 'Data API role % has forbidden % privilege on %.%',
            client_role, privilege_name, relation_record.nspname, relation_record.relname;
        END IF;
      END LOOP;
    END LOOP;

    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'S'
        AND (
          has_sequence_privilege(client_role, c.oid, 'USAGE')
          OR has_sequence_privilege(client_role, c.oid, 'SELECT')
          OR has_sequence_privilege(client_role, c.oid, 'UPDATE')
        )
    ) THEN
      RAISE EXCEPTION 'Data API role % has a public sequence privilege', client_role;
    END IF;

    IF pg_has_role(client_role, 'vayro_app', 'MEMBER')
       OR pg_has_role(client_role, 'vayro_auth', 'MEMBER')
       OR pg_has_role(client_role, 'vayro_platform', 'MEMBER')
       OR pg_has_role(client_role, 'vayro_platform_bootstrap', 'MEMBER')
       OR pg_has_role(client_role, 'vayro_task_worker', 'MEMBER')
       OR pg_has_role(client_role, 'vayro_task_scheduler', 'MEMBER') THEN
      RAISE EXCEPTION 'Data API role % inherits a privileged VAYRO capability', client_role;
    END IF;
  END LOOP;

  -- SECURITY DEFINER functions are privileged entry points. None may be
  -- executable by anon/authenticated through PUBLIC inheritance.
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND (
        has_function_privilege('anon', p.oid, 'EXECUTE')
        OR has_function_privilege('authenticated', p.oid, 'EXECUTE')
        OR has_function_privilege('service_role', p.oid, 'EXECUTE')
      )
  ) THEN
    RAISE EXCEPTION 'A public SECURITY DEFINER function is executable by a Data API role';
  END IF;

  -- No row-level policy should make public or Data API roles valid principals.
  IF EXISTS (
    SELECT 1
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND (
        'public'::name = ANY(p.roles)
        OR 'anon'::name = ANY(p.roles)
        OR 'authenticated'::name = ANY(p.roles)
        OR 'service_role'::name = ANY(p.roles)
      )
  ) THEN
    RAISE EXCEPTION 'A public or Data API role has an application RLS policy';
  END IF;
END
$vayro$;

SELECT 'VAYRO_DATA_API_ROLE_ISOLATION_PASS' AS result;
