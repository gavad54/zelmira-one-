-- VAYRO-CORE live schema inventory (READ ONLY)
-- Run only against the intended database with a read-only inspection identity.
-- This file intentionally contains SELECT statements only.

-- 1) Tables, RLS and forced-RLS state.
SELECT n.nspname AS schema_name, c.relname AS table_name,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;

-- 2) Columns, types, nullability, defaults and timestamp precision.
SELECT table_name, ordinal_position, column_name, data_type, udt_name,
       is_nullable, column_default, datetime_precision,
       character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 3) Primary, unique, foreign-key and check constraints.
SELECT n.nspname AS schema_name, c.relname AS table_name,
       con.conname AS constraint_name, con.contype AS constraint_type,
       pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
ORDER BY c.relname, con.conname;

-- 4) Index definitions.
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5) Enum labels in order.
SELECT n.nspname AS schema_name, t.typname AS enum_name,
       e.enumsortorder, e.enumlabel
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

-- 6) RLS policies (an empty result is not proof of safe tenant isolation).
SELECT schemaname, tablename, policyname, permissive, roles,
       cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 7) Role attributes only; never select password hashes or credentials.
SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb,
       rolcanlogin, rolreplication, rolbypassrls
FROM pg_roles
WHERE rolname IN ('postgres', 'service_role', 'anon', 'authenticated', 'vayro_app')
ORDER BY rolname;

-- 8) Table privileges visible through information_schema.
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
ORDER BY table_name, grantee, privilege_type;

-- 9) Migration history.
SELECT migration_name, started_at, finished_at, rolled_back_at, logs
FROM public."_prisma_migrations"
ORDER BY started_at;
