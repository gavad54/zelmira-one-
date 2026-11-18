-- VAYRO-CORE privilege and ownership inventory (READ ONLY)
-- Run with a read-only catalog inspection identity against the intended database.
-- No passwords, connection strings, secret values, or row data are selected.

-- 1) Ownership and explicit ACLs for application tables, views and materialized views.
SELECT n.nspname AS schema_name, c.relname AS object_name,
       c.relkind AS object_kind, pg_get_userbyid(c.relowner) AS owner,
       c.relacl::text AS explicit_acl, c.reloptions
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m','f')
ORDER BY c.relkind, c.relname;

-- 2) Effective schema privileges for the known Supabase and VAYRO roles.
SELECT r.rolname,
       has_schema_privilege(r.oid, 'public', 'USAGE') AS can_use_public,
       has_schema_privilege(r.oid, 'public', 'CREATE') AS can_create_public
FROM pg_roles r
WHERE r.rolname IN ('postgres','supabase_admin','service_role','anon','authenticated','vayro_app')
ORDER BY r.rolname;

-- 3) Effective table privileges; RLS is a separate control and is not inferred here.
SELECT r.rolname, c.relname AS object_name,
       has_table_privilege(r.oid, c.oid, 'SELECT') AS can_select,
       has_table_privilege(r.oid, c.oid, 'INSERT') AS can_insert,
       has_table_privilege(r.oid, c.oid, 'UPDATE') AS can_update,
       has_table_privilege(r.oid, c.oid, 'DELETE') AS can_delete,
       has_table_privilege(r.oid, c.oid, 'TRUNCATE') AS can_truncate,
       has_table_privilege(r.oid, c.oid, 'REFERENCES') AS can_reference,
       has_table_privilege(r.oid, c.oid, 'TRIGGER') AS can_trigger
FROM pg_roles r
CROSS JOIN pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m')
  AND r.rolname IN ('postgres','supabase_admin','service_role','anon','authenticated','vayro_app')
ORDER BY r.rolname, c.relname;

-- 4) Sequence ownership and effective sequence privileges.
SELECT r.rolname, c.relname AS sequence_name,
       pg_get_userbyid(c.relowner) AS owner,
       has_sequence_privilege(r.oid, c.oid, 'USAGE') AS can_use,
       has_sequence_privilege(r.oid, c.oid, 'SELECT') AS can_select,
       has_sequence_privilege(r.oid, c.oid, 'UPDATE') AS can_update,
       c.relacl::text AS explicit_acl
FROM pg_roles r
CROSS JOIN pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'S'
  AND r.rolname IN ('postgres','supabase_admin','service_role','anon','authenticated','vayro_app')
ORDER BY r.rolname, c.relname;

-- 5) Default privileges for objects created by each owner role.
SELECT d.defaclrole::regrole::text AS owner_role,
       CASE WHEN d.defaclnamespace = 0 THEN '(all schemas)'
            ELSE d.defaclnamespace::regnamespace::text END AS target_schema,
       d.defaclobjtype AS object_type,
       d.defaclacl::text AS default_acl
FROM pg_default_acl d
WHERE d.defaclnamespace = 0 OR d.defaclnamespace = 'public'::regnamespace
ORDER BY owner_role, target_schema, object_type;

-- 6) Role membership edges and whether membership permits SET ROLE.
SELECT parent.rolname AS granted_role,
       member.rolname AS member_role,
       grantor.rolname AS grantor_role,
       m.admin_option,
       m.inherit_option,
       m.set_option
FROM pg_auth_members m
JOIN pg_roles parent ON parent.oid = m.roleid
JOIN pg_roles member ON member.oid = m.member
JOIN pg_roles grantor ON grantor.oid = m.grantor
WHERE parent.rolname IN ('postgres','supabase_admin','service_role','anon','authenticated','vayro_app')
   OR member.rolname IN ('postgres','supabase_admin','service_role','anon','authenticated','vayro_app')
ORDER BY parent.rolname, member.rolname;

-- 7) Function ownership, SECURITY DEFINER status, configuration and execute ACL.
SELECT n.nspname AS schema_name, p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS identity_arguments,
       pg_get_userbyid(p.proowner) AS owner,
       p.prosecdef AS security_definer,
       p.proconfig AS function_settings,
       p.proacl::text AS execute_acl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY p.proname, identity_arguments;

-- 8) RLS policy inventory; this is not a substitute for behavioral isolation tests.
SELECT schemaname, tablename, policyname, permissive, roles,
       cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 9) Role attributes relevant to runtime privilege boundaries.
SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb,
       rolcanlogin, rolreplication, rolbypassrls
FROM pg_roles
WHERE rolname IN ('postgres','supabase_admin','service_role','anon','authenticated','vayro_app')
ORDER BY rolname;
