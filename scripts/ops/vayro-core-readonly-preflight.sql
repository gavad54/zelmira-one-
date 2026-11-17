-- VAYRO-CORE READ-ONLY PREFLIGHT
-- Run only against the intended VAYRO-CORE project.
-- SELECT-only: no DDL, DML, grants, migration, role creation or secret access.

-- 1. Current SQL identity and privilege flags.
SELECT current_database() AS database_name,
       current_user AS current_role,
       r.rolcanlogin,
       r.rolsuper,
       r.rolbypassrls
FROM pg_roles r
WHERE r.rolname = current_user;

-- 2. Expected application tables vs actual public base tables.
WITH expected(table_name) AS (
  VALUES ('User'), ('Tenant'), ('Membership'), ('Session'), ('Product'),
         ('License'), ('AuditEvent'), ('EmailContact'),
         ('EmailContactVerificationToken'), ('AuthActionToken'), ('AuthRateLimit'),
         ('MfaCredential'), ('MfaLoginChallenge'), ('MfaRecoveryCode')
)
SELECT e.table_name,
       CASE WHEN t.table_name IS NULL THEN 'MISSING' ELSE 'present' END AS status
FROM expected e
LEFT JOIN information_schema.tables t
  ON t.table_schema = 'public'
 AND t.table_type = 'BASE TABLE'
 AND t.table_name = e.table_name
ORDER BY e.table_name;

-- 3. Required security-sensitive Session columns vs actual columns.
WITH expected(column_name) AS (
  VALUES ('id'), ('tokenHash'), ('userId'), ('expiresAt'), ('createdAt'),
         ('assurance'), ('mfaAuthenticatedAt'), ('revokedAt'), ('lastSeenAt')
)
SELECT e.column_name,
       CASE WHEN c.column_name IS NULL THEN 'MISSING' ELSE 'present' END AS status
FROM expected e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = 'Session'
 AND c.column_name = e.column_name
ORDER BY e.column_name;

-- 4. Required enum type and Prisma migration ledger.
SELECT to_regtype('public."SessionAssurance"') AS session_assurance_enum,
       to_regclass('public._prisma_migrations') AS prisma_migrations_table;

-- 5. Presence of MFA tables.
SELECT to_regclass('public."MfaCredential"') AS mfa_credential,
       to_regclass('public."MfaLoginChallenge"') AS mfa_login_challenge,
       to_regclass('public."MfaRecoveryCode"') AS mfa_recovery_code;

-- 6. Role existence and privilege flags. No credential material is selected.
SELECT rolname, rolcanlogin, rolsuper, rolbypassrls
FROM pg_roles
WHERE rolname IN ('vayro_app', 'postgres', 'service_role', 'anon', 'authenticated')
ORDER BY rolname;

-- 7. RLS status and table ownership.
SELECT c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS force_rls,
       pg_get_userbyid(c.relowner) AS table_owner
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;

-- 8. Explicit table grants for client/API roles.
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role', 'vayro_app')
ORDER BY grantee, table_name, privilege_type;

-- 9. Policies (empty result means no policy exists).
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 10. Enum types currently present in public.
SELECT t.typname,
       array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;
