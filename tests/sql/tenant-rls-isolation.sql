-- End-to-end RLS proof against VAYRO's real current tenant/auth tables.
-- Disposable PostgreSQL in GitHub Actions only. Never run against VAYRO-CORE.

\set ON_ERROR_STOP on

INSERT INTO public."User" ("id","email","passwordHash","displayName","emailVerifiedAt","createdAt","updatedAt")
VALUES
 ('rls-user-a','rls-a@example.invalid','test-only','RLS User A',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('rls-user-b','rls-b@example.invalid','test-only','RLS User B',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO public."Tenant" ("id","name","slug","status","createdAt","updatedAt")
VALUES
 ('rls-tenant-a','Tenant A','rls-tenant-a','ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('rls-tenant-b','Tenant B','rls-tenant-b','ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO public."Membership" ("id","userId","tenantId","role","createdAt")
VALUES
 ('rls-membership-a','rls-user-a','rls-tenant-a','OWNER',CURRENT_TIMESTAMP),
 ('rls-membership-a-b','rls-user-a','rls-tenant-b','MEMBER',CURRENT_TIMESTAMP),
 ('rls-membership-b-a','rls-user-b','rls-tenant-a','MEMBER',CURRENT_TIMESTAMP),
 ('rls-membership-b','rls-user-b','rls-tenant-b','OWNER',CURRENT_TIMESTAMP);

INSERT INTO public."Product" ("id","key","name","description","status","createdAt","updatedAt")
VALUES
 ('rls-product','RLS_TEST','RLS Test Product','CI-only fixture','ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('rls-product-new','RLS_TEST_NEW','RLS Test Product New','CI-only fixture','ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO public."License" ("id","tenantId","productId","startsAt","active","createdAt")
VALUES
 ('rls-license-a','rls-tenant-a','rls-product',CURRENT_TIMESTAMP,true,CURRENT_TIMESTAMP),
 ('rls-license-b','rls-tenant-b','rls-product',CURRENT_TIMESTAMP,true,CURRENT_TIMESTAMP);

INSERT INTO public."AuditEvent" ("id","actorUserId","tenantId","action","resource","resourceId","createdAt")
VALUES
 ('rls-audit-a','rls-user-a','rls-tenant-a','ci.fixture','Tenant','rls-tenant-a',CURRENT_TIMESTAMP),
 ('rls-audit-b','rls-user-b','rls-tenant-b','ci.fixture','Tenant','rls-tenant-b',CURRENT_TIMESTAMP);

INSERT INTO public."AiGeneration" ("id","tenantId","userId","kind","prompt","output","createdAt")
VALUES
 ('rls-ai-a-owner','rls-tenant-a','rls-user-a','DANA_TEXT','tenant A owner prompt','{"text":"A owner output"}'::jsonb,CURRENT_TIMESTAMP),
 ('rls-ai-a-member','rls-tenant-a','rls-user-b','DANA_TEXT','tenant A member prompt','{"text":"A member output"}'::jsonb,CURRENT_TIMESTAMP),
 ('rls-ai-b-owner','rls-tenant-b','rls-user-b','NEGAH_IMAGE','tenant B prompt','{"imageUrl":"https://images.example.invalid/b"}'::jsonb,CURRENT_TIMESTAMP);

INSERT INTO public."Session" ("id","tokenHash","userId","expiresAt","createdAt")
VALUES
 ('rls-session-a','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','rls-user-a',CURRENT_TIMESTAMP + interval '1 hour',CURRENT_TIMESTAMP),
 ('rls-session-b','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','rls-user-b',CURRENT_TIMESTAMP + interval '1 hour',CURRENT_TIMESTAMP);

DO $vayro$
DECLARE
  role_bypass boolean;
  role_super boolean;
  table_owner name;
BEGIN
  SELECT rolbypassrls, rolsuper INTO role_bypass, role_super
  FROM pg_roles WHERE rolname = 'vayro_app';
  IF role_bypass OR role_super THEN
    RAISE EXCEPTION 'vayro_app must be NOBYPASSRLS and non-superuser';
  END IF;
  SELECT pg_get_userbyid(relowner)::name INTO table_owner
  FROM pg_class WHERE oid = 'public."Tenant"'::regclass;
  IF table_owner = 'vayro_app' THEN
    RAISE EXCEPTION 'vayro_app must not own Tenant';
  END IF;
  IF NOT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public."Tenant"'::regclass) THEN
    RAISE EXCEPTION 'Tenant must FORCE ROW LEVEL SECURITY';
  END IF;
END $vayro$;

-- Catalog-level least-privilege invariants: every tenant/auth projection table
-- must have both RLS and FORCE RLS, and the tenant role must not gain auth secrets.
DO $vayro$
DECLARE
  required_table text;
  protected_tables text[] := ARRAY[
    'Tenant','Membership','License','Product','AuditEvent','User','Session','AiGeneration'
  ];
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname = 'vayro_app' AND (rolsuper OR rolbypassrls OR rolcanlogin)
  ) THEN
    RAISE EXCEPTION 'vayro_app group role must be NOLOGIN, non-superuser and NOBYPASSRLS';
  END IF;

  IF has_schema_privilege('vayro_app','public','CREATE') THEN
    RAISE EXCEPTION 'vayro_app must not have CREATE on public schema';
  END IF;

  IF pg_has_role('vayro_app','vayro_auth','MEMBER')
     OR pg_has_role('vayro_app','vayro_platform','MEMBER')
     OR pg_has_role('vayro_app','vayro_platform_bootstrap','MEMBER') THEN
    RAISE EXCEPTION 'tenant role must not inherit auth/platform capabilities';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname = 'vayro_tenant_ci'
      AND rolcanlogin AND NOT rolsuper AND NOT rolbypassrls
  ) THEN
    RAISE EXCEPTION 'vayro_tenant_ci must be a LOGIN, non-superuser and NOBYPASSRLS';
  END IF;
  IF NOT pg_has_role('vayro_tenant_ci','vayro_app','MEMBER') THEN
    RAISE EXCEPTION 'vayro_tenant_ci must inherit only the vayro_app tenant capability role';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_auth_members m
    JOIN pg_roles member_role ON member_role.oid = m.member
    JOIN pg_roles granted_role ON granted_role.oid = m.roleid
    WHERE member_role.rolname = 'vayro_tenant_ci'
      AND granted_role.rolname <> 'vayro_app'
  ) THEN
    RAISE EXCEPTION 'vayro_tenant_ci has an unexpected role membership';
  END IF;

  FOREACH required_table IN ARRAY protected_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname=required_table
        AND c.relkind IN ('r','p') AND c.relrowsecurity AND c.relforcerowsecurity
    ) THEN
      RAISE EXCEPTION 'RLS and FORCE RLS must both be enabled on public.%', required_table;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename=required_table
    ) THEN
      RAISE EXCEPTION 'No RLS policy exists on public.%', required_table;
    END IF;
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid=c.relnamespace
      JOIN pg_roles r ON r.oid=c.relowner
      WHERE n.nspname='public' AND c.relname=required_table AND r.rolname='vayro_app'
    ) THEN
      RAISE EXCEPTION 'vayro_app must not own public.%', required_table;
    END IF;
  END LOOP;

  IF has_table_privilege('vayro_app','public."AuthActionToken"','SELECT')
     OR has_table_privilege('vayro_app','public."AuthRateLimit"','SELECT')
     OR has_table_privilege('vayro_app','public."UserMfa"','SELECT')
     OR has_table_privilege('vayro_app','public."MfaRecoveryCode"','SELECT')
     OR has_table_privilege('vayro_app','public."AuthChallenge"','SELECT')
     OR has_table_privilege('vayro_app','public."EmailContact"','SELECT')
     OR has_table_privilege('vayro_app','public."EmailContactVerificationToken"','SELECT') THEN
    RAISE EXCEPTION 'tenant role has access to auth secrets or platform contact data';
  END IF;

  IF has_column_privilege('vayro_app','public."User"','passwordHash','SELECT')
     OR has_column_privilege('vayro_app','public."User"','platformRole','SELECT')
 THEN
    RAISE EXCEPTION 'tenant role has access to password or MFA assurance columns';
  END IF;
END $vayro$;

SET ROLE vayro_tenant_ci;

-- Tenant A context: own identity, session, membership, tenant, license and audit only.
BEGIN;
SET LOCAL app.user_id = 'rls-user-a';
SET LOCAL app.tenant_id = 'rls-tenant-a';
SET LOCAL app.session_token_hash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
SET LOCAL app.user_role = 'OWNER';
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public."Tenant";
  IF n <> 1 OR NOT EXISTS (SELECT 1 FROM public."Tenant" WHERE id='rls-tenant-a') THEN
    RAISE EXCEPTION 'Tenant A can see an incorrect tenant set';
  END IF;
  SELECT count(*) INTO n FROM public."Membership";
  IF n <> 2 OR NOT EXISTS (SELECT 1 FROM public."Membership" WHERE id='rls-membership-a') OR NOT EXISTS (SELECT 1 FROM public."Membership" WHERE id='rls-membership-b-a') THEN
    RAISE EXCEPTION 'Tenant A can see an incorrect membership set';
  END IF;
  SELECT count(*) INTO n FROM public."License";
  IF n <> 1 OR NOT EXISTS (SELECT 1 FROM public."License" WHERE id='rls-license-a') THEN
    RAISE EXCEPTION 'Tenant A can see an incorrect license set';
  END IF;
  SELECT count(*) INTO n FROM public."AuditEvent";
  IF n <> 1 OR NOT EXISTS (SELECT 1 FROM public."AuditEvent" WHERE id='rls-audit-a') THEN
    RAISE EXCEPTION 'Tenant A can see an incorrect audit set';
  END IF;
  SELECT count(*) INTO n FROM public."AiGeneration";
  IF n <> 2 OR NOT EXISTS (SELECT 1 FROM public."AiGeneration" WHERE id='rls-ai-a-owner')
     OR NOT EXISTS (SELECT 1 FROM public."AiGeneration" WHERE id='rls-ai-a-member') THEN
    RAISE EXCEPTION 'Tenant A OWNER cannot see exactly its tenant AI history';
  END IF;
  SELECT count("id") INTO n FROM public."User";
  IF n <> 2 OR NOT EXISTS (SELECT 1 FROM public."User" WHERE id='rls-user-a') OR NOT EXISTS (SELECT 1 FROM public."User" WHERE id='rls-user-b') THEN
    RAISE EXCEPTION 'Tenant A OWNER cannot see the tenant member directory';
  END IF;
  SELECT count("id") INTO n FROM public."Session";
  IF n <> 1 OR NOT EXISTS (SELECT 1 FROM public."Session" WHERE id='rls-session-a') THEN
    RAISE EXCEPTION 'Tenant A can see another session';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public."Product" WHERE id='rls-product') THEN
    RAISE EXCEPTION 'Global product catalog must remain readable';
  END IF;
END $$;

-- Cross-tenant update is filtered to zero rows; cross-tenant deletes are also no-ops.
DO $$
DECLARE n integer;
BEGIN
  UPDATE public."Tenant" SET name='forged' WHERE id='rls-tenant-b';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'Tenant A updated Tenant B'; END IF;
  UPDATE public."License" SET active=false WHERE id='rls-license-b';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'Tenant A updated Tenant B license'; END IF;
  DELETE FROM public."License" WHERE id='rls-license-b';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'Tenant A deleted Tenant B license'; END IF;
END $$;

-- Positive same-tenant write.
UPDATE public."Tenant" SET name='Tenant A Updated' WHERE id='rls-tenant-a';
INSERT INTO public."License" ("id","tenantId","productId","startsAt","active","createdAt")
VALUES ('rls-license-a-new','rls-tenant-a','rls-product-new',CURRENT_TIMESTAMP,true,CURRENT_TIMESTAMP);

-- Negative cross-tenant writes must be rejected by WITH CHECK.
DO $$
BEGIN
  BEGIN
    INSERT INTO public."License" ("id","tenantId","productId","startsAt","active","createdAt")
    VALUES ('rls-license-forged','rls-tenant-b','rls-product',CURRENT_TIMESTAMP,true,CURRENT_TIMESTAMP);
    RAISE EXCEPTION 'cross-tenant License INSERT unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO public."AuditEvent" ("id","actorUserId","tenantId","action","resource","createdAt")
    VALUES ('rls-audit-forged','rls-user-a','rls-tenant-b','forged','Tenant',CURRENT_TIMESTAMP);
    RAISE EXCEPTION 'cross-tenant AuditEvent INSERT unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO public."Membership" ("id","userId","tenantId","role","createdAt")
    VALUES ('rls-membership-forged','rls-user-b','rls-tenant-a','OWNER',CURRENT_TIMESTAMP);
    RAISE EXCEPTION 'cross-user owner Membership INSERT unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO public."AiGeneration" ("id","tenantId","userId","kind","prompt","output")
    VALUES ('rls-ai-forged','rls-tenant-b','rls-user-a','DANA_TEXT','forged','{"text":"forged"}'::jsonb);
    RAISE EXCEPTION 'cross-tenant AI generation INSERT unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
COMMIT;

-- User-scoped tenant listing must expose only the caller's own memberships.
BEGIN;
SET LOCAL app.user_id='rls-user-a';
SET LOCAL app.session_token_hash='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
DO $body$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public."Membership";
  IF n <> 2 OR NOT EXISTS (SELECT 1 FROM public."Membership" WHERE id='rls-membership-a') OR NOT EXISTS (SELECT 1 FROM public."Membership" WHERE id='rls-membership-a-b') THEN
    RAISE EXCEPTION 'user-scoped tenant list exposed incorrect memberships';
  END IF;
  SELECT count(*) INTO n FROM public."Tenant";
  IF n <> 2 OR NOT EXISTS (SELECT 1 FROM public."Tenant" WHERE id='rls-tenant-a') OR NOT EXISTS (SELECT 1 FROM public."Tenant" WHERE id='rls-tenant-b') THEN
    RAISE EXCEPTION 'user-scoped tenant list did not return exactly the authenticated tenant set';
  END IF;
END $body$;
COMMIT;

-- Self-service provisioning: a verified actor may create only a tenant
-- whose ID is bound to this transaction, and may add only their own OWNER row.
BEGIN;
SET LOCAL app.user_id='rls-user-a';
SET LOCAL app.tenant_id='rls-tenant-created';
SET LOCAL app.session_token_hash='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
INSERT INTO public."Tenant" ("id","name","slug","status","createdAt","updatedAt")
VALUES ('rls-tenant-created','Created Tenant','rls-tenant-created','ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT INTO public."Membership" ("id","userId","tenantId","role","createdAt")
VALUES ('rls-membership-created','rls-user-a','rls-tenant-created','OWNER',CURRENT_TIMESTAMP);
INSERT INTO public."AuditEvent" ("id","actorUserId","tenantId","action","resource","resourceId","createdAt")
VALUES ('rls-audit-created','rls-user-a','rls-tenant-created','tenant.created','Tenant','rls-tenant-created',CURRENT_TIMESTAMP);
DO $body$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public."Tenant" WHERE id='rls-tenant-created') THEN
    RAISE EXCEPTION 'tenant creation did not persist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public."Membership" WHERE id='rls-membership-created') THEN
    RAISE EXCEPTION 'owner membership creation did not persist';
  END IF;
END $body$;
COMMIT;

-- A regular MEMBER can see only their own profile, not the tenant directory.
BEGIN;
SET LOCAL app.user_id='rls-user-b';
SET LOCAL app.tenant_id='rls-tenant-a';
SET LOCAL app.session_token_hash='bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
SET LOCAL app.user_role='MEMBER';
DO $$
DECLARE n integer;
BEGIN
  SELECT count("id") INTO n FROM public."User";
  IF n <> 1 OR NOT EXISTS (SELECT 1 FROM public."User" WHERE id='rls-user-b') THEN
    RAISE EXCEPTION 'Tenant MEMBER can see another member profile';
  END IF;
  SELECT count(*) INTO n FROM public."AiGeneration";
  IF n <> 1 OR NOT EXISTS (SELECT 1 FROM public."AiGeneration" WHERE id='rls-ai-a-member') THEN
    RAISE EXCEPTION 'Tenant MEMBER can read another user AI generation';
  END IF;
END $$;
COMMIT;

-- Transaction-local context must not survive connection reuse.
BEGIN;
SET LOCAL app.user_id='rls-user-a';
SET LOCAL app.tenant_id='rls-tenant-a';
SET LOCAL app.session_token_hash='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
COMMIT;
BEGIN;
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public."Tenant";
  IF n <> 0 THEN RAISE EXCEPTION 'tenant context leaked after COMMIT'; END IF;
  SELECT count("id") INTO n FROM public."Session";
  IF n <> 0 THEN RAISE EXCEPTION 'session context leaked after COMMIT'; END IF;
END $$;
COMMIT;

-- Same connection reused for Tenant B must now expose B only.
BEGIN;
SET LOCAL app.user_id='rls-user-b';
SET LOCAL app.tenant_id='rls-tenant-b';
SET LOCAL app.session_token_hash='bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
SET LOCAL app.user_role='OWNER';
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public."Tenant";
  IF n <> 1 OR NOT EXISTS (SELECT 1 FROM public."Tenant" WHERE id='rls-tenant-b') THEN
    RAISE EXCEPTION 'Tenant B context is incorrect or contaminated';
  END IF;
  SELECT count(*) INTO n FROM public."License";
  IF n <> 1 OR NOT EXISTS (SELECT 1 FROM public."License" WHERE id='rls-license-b') THEN
    RAISE EXCEPTION 'Tenant B license scope is incorrect';
  END IF;
  SELECT count(*) INTO n FROM public."AiGeneration";
  IF n <> 1 OR NOT EXISTS (SELECT 1 FROM public."AiGeneration" WHERE id='rls-ai-b-owner') THEN
    RAISE EXCEPTION 'Tenant B AI history is incorrect or contaminated';
  END IF;
  IF EXISTS (SELECT 1 FROM public."Session" WHERE id='rls-session-a') THEN
    RAISE EXCEPTION 'Tenant B can read Tenant A session';
  END IF;
END $$;
COMMIT;

-- Missing context is fail-closed for every tenant-owned/auth-identity table.
BEGIN;
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public."Tenant";
  IF n <> 0 THEN RAISE EXCEPTION 'Tenant visible without context'; END IF;
  SELECT count(*) INTO n FROM public."Membership";
  IF n <> 0 THEN RAISE EXCEPTION 'Membership visible without context'; END IF;
  SELECT count(*) INTO n FROM public."License";
  IF n <> 0 THEN RAISE EXCEPTION 'License visible without context'; END IF;
  SELECT count(*) INTO n FROM public."AiGeneration";
  IF n <> 0 THEN RAISE EXCEPTION 'AI history visible without tenant context'; END IF;
  SELECT count("id") INTO n FROM public."User";
  IF n <> 0 THEN RAISE EXCEPTION 'User visible without context'; END IF;
  SELECT count("id") INTO n FROM public."Session";
  IF n <> 0 THEN RAISE EXCEPTION 'Session visible without context'; END IF;
END $$;
DO $$
BEGIN
  BEGIN
    INSERT INTO public."License" ("id","tenantId","productId","startsAt","active","createdAt")
    VALUES ('rls-license-no-context','rls-tenant-a','rls-product',CURRENT_TIMESTAMP,true,CURRENT_TIMESTAMP);
    RAISE EXCEPTION 'License INSERT without context unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
COMMIT;

RESET ROLE;

-- Cleanup fixtures as the CI migration owner (superuser in this disposable service).
DELETE FROM public."Session" WHERE id IN ('rls-session-a','rls-session-b');
DELETE FROM public."AiGeneration" WHERE id IN ('rls-ai-a-owner','rls-ai-a-member','rls-ai-b-owner','rls-ai-forged');
DELETE FROM public."AuditEvent" WHERE id IN ('rls-audit-a','rls-audit-b','rls-audit-forged','rls-audit-created');
DELETE FROM public."License" WHERE id IN ('rls-license-a','rls-license-b','rls-license-a-new','rls-license-forged','rls-license-no-context');
DELETE FROM public."Membership" WHERE id IN ('rls-membership-a','rls-membership-a-b','rls-membership-b-a','rls-membership-b','rls-membership-created','rls-membership-forged');
DELETE FROM public."Tenant" WHERE id IN ('rls-tenant-a','rls-tenant-b','rls-tenant-created');
DELETE FROM public."Product" WHERE id IN ('rls-product','rls-product-new');
DELETE FROM public."User" WHERE id IN ('rls-user-a','rls-user-b');

SELECT 'VAYRO real-table tenant RLS isolation proof passed' AS result;
