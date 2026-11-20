-- VAYRO-CORE read-only schema and tenant-security diagnostic.
-- Safe for Supabase SQL Editor or psql using a read-only connection.
-- This script performs SELECTs only and explicitly opens a READ ONLY transaction.
-- It does not create, alter, grant, revoke, insert, update, delete, or expose row data.

BEGIN TRANSACTION READ ONLY;

-- 1) Expected Prisma models and live table presence.
WITH expected(table_name) AS (
  VALUES
    ('User'),('Tenant'),('Membership'),('Session'),('Product'),('License'),
    ('AuditEvent'),('EmailContact'),('EmailContactVerificationToken'),
    ('AuthActionToken'),('AuthRateLimit'),('UserMfa'),('MfaRecoveryCode'),
    ('AuthChallenge'),('AiGeneration')
)
SELECT e.table_name,
       CASE WHEN to_regclass(format('public.%I', e.table_name)) IS NULL
            THEN 'MISSING' ELSE 'PRESENT' END AS live_table_status
FROM expected e
ORDER BY e.table_name;

-- 2) Expected Prisma columns missing from the live public schema.
WITH expected(table_name, column_name) AS (
  VALUES
    ('User','id'),('User','email'),('User','passwordHash'),('User','displayName'),
    ('User','platformRole'),('User','emailVerifiedAt'),('User','disabledAt'),
    ('User','createdAt'),('User','updatedAt'),
    ('Tenant','id'),('Tenant','name'),('Tenant','slug'),('Tenant','status'),
    ('Tenant','createdAt'),('Tenant','updatedAt'),
    ('Membership','id'),('Membership','userId'),('Membership','tenantId'),
    ('Membership','role'),('Membership','createdAt'),
    ('Session','id'),('Session','tokenHash'),('Session','userId'),
    ('Session','expiresAt'),('Session','createdAt'),('Session','revokedAt'),
    ('Session','lastSeenAt'),('Session','assurance'),('Session','mfaAuthenticatedAt'),
    ('Product','id'),('Product','key'),('Product','name'),('Product','description'),
    ('Product','status'),('Product','baseUrl'),('Product','createdAt'),('Product','updatedAt'),
    ('License','id'),('License','tenantId'),('License','productId'),('License','startsAt'),
    ('License','endsAt'),('License','active'),('License','createdAt'),
    ('AuditEvent','id'),('AuditEvent','actorUserId'),('AuditEvent','tenantId'),
    ('AuditEvent','action'),('AuditEvent','resource'),('AuditEvent','resourceId'),
    ('AuditEvent','metadata'),('AuditEvent','createdAt'),
    ('EmailContact','id'),('EmailContact','email'),('EmailContact','label'),
    ('EmailContact','purposes'),('EmailContact','enabled'),('EmailContact','isPrimary'),
    ('EmailContact','verifiedAt'),('EmailContact','createdAt'),('EmailContact','updatedAt'),
    ('EmailContactVerificationToken','id'),('EmailContactVerificationToken','tokenHash'),
    ('EmailContactVerificationToken','contactId'),('EmailContactVerificationToken','expiresAt'),
    ('EmailContactVerificationToken','consumedAt'),('EmailContactVerificationToken','createdAt'),
    ('AuthActionToken','id'),('AuthActionToken','tokenHash'),('AuthActionToken','userId'),
    ('AuthActionToken','purpose'),('AuthActionToken','expiresAt'),
    ('AuthActionToken','consumedAt'),('AuthActionToken','createdAt'),
    ('AuthRateLimit','keyHash'),('AuthRateLimit','windowStartedAt'),
    ('AuthRateLimit','count'),('AuthRateLimit','expiresAt'),
    ('UserMfa','id'),('UserMfa','userId'),('UserMfa','secretCiphertext'),
    ('UserMfa','pendingSecretCiphertext'),('UserMfa','pendingExpiresAt'),
    ('UserMfa','enabledAt'),('UserMfa','lastTotpStep'),('UserMfa','createdAt'),
    ('UserMfa','updatedAt'),
    ('MfaRecoveryCode','id'),('MfaRecoveryCode','userId'),('MfaRecoveryCode','codeHash'),
    ('MfaRecoveryCode','usedAt'),('MfaRecoveryCode','createdAt'),
    ('AuthChallenge','id'),('AuthChallenge','challengeHash'),('AuthChallenge','userId'),
    ('AuthChallenge','purpose'),('AuthChallenge','expiresAt'),('AuthChallenge','consumedAt'),
    ('AuthChallenge','attempts'),('AuthChallenge','maxAttempts'),('AuthChallenge','createdAt'),
    ('AiGeneration','id'),('AiGeneration','tenantId'),('AiGeneration','userId'),
    ('AiGeneration','kind'),('AiGeneration','prompt'),('AiGeneration','output'),
    ('AiGeneration','createdAt')
)
SELECT e.table_name, e.column_name, 'MISSING' AS status
FROM expected e
LEFT JOIN information_schema.columns c
  ON c.table_schema='public'
 AND c.table_name=e.table_name
 AND c.column_name=e.column_name
WHERE c.column_name IS NULL
ORDER BY e.table_name, e.column_name;

-- 3) RLS, FORCE RLS, policy count and table ownership for every expected model.
WITH expected(table_name) AS (
  VALUES
    ('User'),('Tenant'),('Membership'),('Session'),('Product'),('License'),
    ('AuditEvent'),('EmailContact'),('EmailContactVerificationToken'),
    ('AuthActionToken'),('AuthRateLimit'),('UserMfa'),('MfaRecoveryCode'),
    ('AuthChallenge'),('AiGeneration')
)
SELECT e.table_name,
       COALESCE(c.relrowsecurity,false) AS rls_enabled,
       COALESCE(c.relforcerowsecurity,false) AS force_rls,
       COALESCE(pg_get_userbyid(c.relowner),'(missing)') AS table_owner,
       (SELECT count(*) FROM pg_policies p
        WHERE p.schemaname='public' AND p.tablename=e.table_name) AS policy_count
FROM expected e
LEFT JOIN pg_class c
  ON c.oid=to_regclass(format('public.%I',e.table_name))
ORDER BY e.table_name;

-- 4) Policies by table, role, command and predicate (policy expressions only).
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='public'
ORDER BY tablename, policyname;

-- 5) Dedicated runtime-role presence and privilege flags.
WITH expected(role_name) AS (
  VALUES ('vayro_app'),('vayro_auth'),('vayro_platform'),
         ('vayro_platform_bootstrap'),('service_role')
)
SELECT e.role_name,
       (r.oid IS NOT NULL) AS role_exists,
       COALESCE(r.rolcanlogin,false) AS can_login,
       COALESCE(r.rolsuper,false) AS is_superuser,
       COALESCE(r.rolbypassrls,false) AS bypasses_rls
FROM expected e
LEFT JOIN pg_roles r ON r.rolname=e.role_name
ORDER BY e.role_name;

-- 6) Foreign-key inventory for tenant-related records.
SELECT conrelid::regclass AS source_table,
       conname AS constraint_name,
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE contype='f'
  AND connamespace='public'::regnamespace
  AND (conrelid::regclass::text IN
       ('public."Tenant"','public."Membership"','public."License"',
        'public."AuditEvent"','public."AiGeneration"')
       OR confrelid=to_regclass('public."Tenant"'))
ORDER BY 1, 2;

-- 7) Migration ledger presence only. No migration rows or application data are read.
SELECT CASE
         WHEN to_regclass('public."_prisma_migrations"') IS NULL
           THEN 'MISSING'
         ELSE 'PRESENT'
       END AS prisma_migration_ledger_status;

ROLLBACK;
