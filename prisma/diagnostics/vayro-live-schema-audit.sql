-- VAYRO-CORE live schema reconciliation audit (READ ONLY).
-- Run only with a read-only database identity. No DDL, DML, role changes,
-- migration writes, or policy changes are performed by this file.
-- Capture the complete output before approving any baseline or migration.

-- 1) User-defined public tables, owners, RLS flags, and FORCE RLS.
SELECT n.nspname AS schema_name, c.relname AS table_name,
       pg_get_userbyid(c.relowner) AS owner,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS force_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
ORDER BY c.relname;

-- 2) Columns, types, nullability, and defaults.
SELECT table_name, ordinal_position, column_name, data_type,
       udt_schema, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 3) RLS policies and their exact roles/commands/expressions.
SELECT schemaname, tablename, policyname, permissive, roles,
       cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4) Roles: LOGIN, superuser, BYPASSRLS, and connection limits.
SELECT rolname, rolcanlogin, rolsuper, rolbypassrls, rolinherit,
       rolcreaterole, rolcreatedb, rolconnlimit
FROM pg_roles
WHERE rolname LIKE 'vayro_%'
   OR rolname IN ('postgres', 'authenticated', 'anon', 'service_role')
ORDER BY rolname;

-- 5) Membership graph for VAYRO roles (detect unexpected inheritance).
SELECT parent.rolname AS granted_role,
       member.rolname AS member_role,
       m.admin_option, m.inherit_option, m.set_option
FROM pg_auth_members m
JOIN pg_roles parent ON parent.oid = m.roleid
JOIN pg_roles member ON member.oid = m.member
WHERE parent.rolname LIKE 'vayro_%'
   OR member.rolname LIKE 'vayro_%'
ORDER BY granted_role, member_role;

-- 6) Explicit table privileges for VAYRO roles.
SELECT grantee, table_schema, table_name, privilege_type,
       is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee LIKE 'vayro_%'
ORDER BY grantee, table_name, privilege_type;

-- 7) Prisma migration history. An absent table or zero rows is a STOP condition,
-- not permission to mark migrations applied or to baseline automatically.
SELECT to_regclass('public."_prisma_migrations"') AS prisma_migrations_table;

SELECT migration_name, started_at, finished_at, rolled_back_at,
       logs
FROM public."_prisma_migrations"
ORDER BY started_at, migration_name;

-- 8) Public enum types and labels.
SELECT t.typname AS enum_name, e.enumsortorder, e.enumlabel
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
JOIN pg_enum e ON e.enumtypid = t.oid
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

-- 9) Extensions and versions.
SELECT e.extname, e.extversion, n.nspname AS schema_name
FROM pg_extension e
JOIN pg_namespace n ON n.oid = e.extnamespace
ORDER BY e.extname;

-- 10) Constraints and indexes (including unique constraints).
SELECT conrelid::regclass AS table_name, conname,
       contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, conname;

SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 11) Object counts for restore-vs-source comparison.
SELECT 'tables' AS object_type, count(*)::bigint AS object_count
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p')
UNION ALL
SELECT 'views', count(*)::bigint
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='v'
UNION ALL
SELECT 'sequences', count(*)::bigint
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='S'
UNION ALL
SELECT 'functions', count(*)::bigint
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
UNION ALL
SELECT 'types', count(*)::bigint
FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
WHERE n.nspname='public' AND t.typtype IN ('e','d','c');
