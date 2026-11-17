-- VAYRO-CORE READ-ONLY PREFLIGHT
-- Run only against the intended VAYRO-CORE project.
-- This file contains SELECT statements only. It performs no DDL, DML, grants,
-- migration, role creation, secret access or data export.

-- 1. Current SQL identity and privilege flags.
SELECT current_database() AS database_name,
       current_user AS current_role,
       r.rolcanlogin,
       r.rolsuper,
       r.rolbypassrls
FROM pg_roles r
WHERE r.rolname = current_user;

-- 2. Expected VAYRO tables and actual public base tables.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. Session security columns currently present.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'Session'
ORDER BY ordinal_position;

-- 4. Presence of MFA and Prisma migration objects.
SELECT to_regclass('public."MfaCredential"') AS mfa_credential,
       to_regclass('public."MfaLoginChallenge"') AS mfa_login_challenge,
       to_regclass('public."MfaRecoveryCode"') AS mfa_recovery_code,
       to_regclass('public._prisma_migrations') AS prisma_migrations;

-- 5. Role existence and privilege flags. No credential material is selected.
SELECT rolname, rolcanlogin, rolsuper, rolbypassrls
FROM pg_roles
WHERE rolname IN ('vayro_app', 'postgres', 'service_role', 'anon', 'authenticated')
ORDER BY rolname;

-- 6. RLS status and table ownership.
SELECT c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS force_rls,
       pg_get_userbyid(c.relowner) AS table_owner
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;

-- 7. Explicit table grants for client/API roles.
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role', 'vayro_app')
ORDER BY grantee, table_name, privilege_type;

-- 8. Policies (empty result means no policy exists).
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 9. Enum types currently present in public.
SELECT t.typname,
       array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;
