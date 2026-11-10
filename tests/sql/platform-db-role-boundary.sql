-- Execute after migrations as the isolated CI database administrator.
DO $$
DECLARE
  platform_oid OID;
  bootstrap_oid OID;
BEGIN
  SELECT oid INTO platform_oid FROM pg_roles WHERE rolname = 'vayro_platform';
  SELECT oid INTO bootstrap_oid FROM pg_roles WHERE rolname = 'vayro_platform_bootstrap';
  IF platform_oid IS NULL OR bootstrap_oid IS NULL THEN
    RAISE EXCEPTION 'platform roles missing';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname IN ('vayro_platform','vayro_platform_bootstrap')
      AND (rolsuper OR rolbypassrls OR rolcanlogin)
  ) THEN
    RAISE EXCEPTION 'platform roles must be NOLOGIN, non-superuser and NOBYPASSRLS';
  END IF;
  IF pg_has_role('vayro_platform','vayro_app','MEMBER')
     OR pg_has_role('vayro_platform','vayro_auth','MEMBER')
     OR pg_has_role('vayro_platform_bootstrap','vayro_app','MEMBER')
     OR pg_has_role('vayro_platform_bootstrap','vayro_auth','MEMBER') THEN
    RAISE EXCEPTION 'platform role inheritance is too broad';
  END IF;
  IF NOT has_table_privilege('vayro_platform','public."Product"','SELECT')
     OR NOT has_column_privilege('vayro_platform','public."Product"','id','INSERT')
     OR NOT has_column_privilege('vayro_platform','public."Product"','key','INSERT')
     OR NOT has_column_privilege('vayro_platform','public."Product"','createdAt','INSERT')
     OR NOT has_column_privilege('vayro_platform','public."Product"','updatedAt','INSERT')
     OR NOT has_column_privilege('vayro_platform','public."Session"','id','SELECT')
     OR NOT has_column_privilege('vayro_platform','public."Tenant"','id','SELECT')
     OR NOT has_column_privilege('vayro_platform','public."License"','productId','SELECT')
     OR NOT has_table_privilege('vayro_platform','public."EmailContact"','INSERT')
     OR NOT has_table_privilege('vayro_platform','public."EmailContactVerificationToken"','UPDATE')
     OR NOT has_table_privilege('vayro_platform','public."AuditEvent"','INSERT') THEN
    RAISE EXCEPTION 'required platform privileges missing';
  END IF;
  IF has_column_privilege('vayro_platform','public."User"','passwordHash','SELECT')
     OR has_table_privilege('vayro_platform','public."Session"','UPDATE')
     OR has_table_privilege('vayro_platform','public."Membership"','SELECT')
     OR has_table_privilege('vayro_platform','public."License"','UPDATE')
     OR has_table_privilege('vayro_platform','public."UserMfa"','SELECT')
     OR has_table_privilege('vayro_platform','public."MfaRecoveryCode"','SELECT')
     OR has_table_privilege('vayro_platform','public."AuthChallenge"','SELECT')
     OR has_table_privilege('vayro_platform','public."AuthActionToken"','SELECT')
     OR has_table_privilege('vayro_platform','public."AuthRateLimit"','SELECT') THEN
    RAISE EXCEPTION 'platform role has out-of-domain privileges';
  END IF;
  IF has_column_privilege('vayro_platform','public."User"','platformRole','UPDATE')
     OR has_column_privilege('vayro_platform','public."User"','passwordHash','UPDATE')
     OR NOT has_column_privilege('vayro_platform','public."User"','emailVerifiedAt','UPDATE') THEN
    RAISE EXCEPTION 'platform identity mutation privileges are too broad or incomplete';
  END IF;
  IF NOT has_column_privilege('vayro_platform','public."AuditEvent"','id','SELECT')
     OR has_column_privilege('vayro_platform','public."AuditEvent"','action','SELECT') THEN
    RAISE EXCEPTION 'platform audit return privileges are too broad';
  END IF;
  IF NOT has_function_privilege('vayro_platform','public.vayro_bootstrap_owner(text,text,text)','EXECUTE')
     OR has_function_privilege('vayro_auth','public.vayro_bootstrap_owner(text,text,text)','EXECUTE')
     OR has_function_privilege('vayro_app','public.vayro_bootstrap_owner(text,text,text)','EXECUTE') THEN
    RAISE EXCEPTION 'one-time bootstrap function grants are incorrect';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
      AND c.relowner IN (platform_oid, bootstrap_oid)
  ) THEN
    RAISE EXCEPTION 'platform roles must not own public tables';
  END IF;
  IF has_schema_privilege('vayro_platform_bootstrap', 'public', 'CREATE')
     OR (SELECT rolinherit FROM pg_roles WHERE oid = bootstrap_oid)
     OR EXISTS (
       SELECT 1 FROM pg_auth_members
       WHERE member = bootstrap_oid OR roleid = bootstrap_oid
     )
     OR pg_has_role('vayro_platform', 'vayro_platform_bootstrap', 'MEMBER') THEN
    RAISE EXCEPTION 'bootstrap definer role has unnecessary schema or role memberships';
  END IF;
END $$;

SET ROLE vayro_platform;
SELECT id FROM public."Product" LIMIT 0;
SELECT id FROM public."Tenant" LIMIT 0;
SELECT id FROM public."License" LIMIT 0;
SELECT email FROM public."EmailContact" LIMIT 0;
SELECT "tokenHash" FROM public."EmailContactVerificationToken" LIMIT 0;
SELECT id FROM public."AuditEvent" LIMIT 0;
SELECT "platformRole" FROM public."User" LIMIT 0;
SELECT "tokenHash" FROM public."Session" LIMIT 0;
RESET ROLE;
