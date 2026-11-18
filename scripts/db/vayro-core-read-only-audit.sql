-- VAYRO-CORE read-only schema evidence collector.
-- Safe to run against the live database: SELECT-only, no DDL, DML, grants,
-- role changes, migration-history changes, or data-row inspection.
-- Output is a single JSON document suitable for offline baseline comparison.
-- Run with a read-only database role where available.

WITH
rels AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name,
         c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
),
cols AS (
  SELECT table_schema, table_name, column_name, ordinal_position, data_type,
         udt_name, character_maximum_length, datetime_precision, is_nullable,
         column_default
  FROM information_schema.columns
  WHERE table_schema = 'public'
),
cons AS (
  SELECT r.schema_name, r.table_name, con.conname AS constraint_name,
         con.contype AS constraint_type,
         pg_get_constraintdef(con.oid, true) AS definition
  FROM rels r
  JOIN pg_constraint con ON con.conrelid = r.oid
),
idx AS (
  SELECT schemaname AS schema_name, tablename AS table_name, indexname, indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'
),
pol AS (
  SELECT schemaname AS schema_name, tablename AS table_name, policyname,
         permissive, roles, cmd, qual, with_check
  FROM pg_policies
  WHERE schemaname = 'public'
),
gr AS (
  SELECT table_schema AS schema_name, table_name, grantee, privilege_type,
         is_grantable
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND grantee IN ('anon', 'authenticated', 'service_role')
),
roles AS (
  SELECT rolname, rolsuper, rolbypassrls, rolcanlogin
  FROM pg_roles
  WHERE rolname IN ('postgres', 'service_role', 'anon', 'authenticated')
)
SELECT jsonb_build_object(
  'tables', (
    SELECT jsonb_agg(to_jsonb(r) ORDER BY r.table_name) FROM rels r
  ),
  'columns', (
    SELECT jsonb_agg(to_jsonb(c) ORDER BY c.table_name, c.ordinal_position)
    FROM cols c
  ),
  'constraints', (
    SELECT jsonb_agg(to_jsonb(c) ORDER BY c.table_name, c.constraint_name)
    FROM cons c
  ),
  'indexes', (
    SELECT jsonb_agg(to_jsonb(i) ORDER BY i.table_name, i.indexname)
    FROM idx i
  ),
  'policies', (
    SELECT coalesce(
      jsonb_agg(to_jsonb(p) ORDER BY p.table_name, p.policyname),
      '[]'::jsonb
    )
    FROM pol p
  ),
  'client_role_table_grants', (
    SELECT coalesce(
      jsonb_agg(to_jsonb(g) ORDER BY g.grantee, g.table_name, g.privilege_type),
      '[]'::jsonb
    )
    FROM gr g
  ),
  'roles', (
    SELECT jsonb_agg(to_jsonb(r) ORDER BY r.rolname) FROM roles r
  )
) AS vayro_core_read_only_schema_audit;
