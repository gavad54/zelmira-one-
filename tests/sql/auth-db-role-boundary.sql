-- Execute after migrations as the isolated CI database administrator.
DO $$
DECLARE
  auth_role_oid OID;
BEGIN
  SELECT oid INTO auth_role_oid FROM pg_roles WHERE rolname = 'vayro_auth';
  IF auth_role_oid IS NULL THEN RAISE EXCEPTION 'vayro_auth role missing'; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE oid = auth_role_oid AND (rolsuper OR rolbypassrls OR rolcanlogin)) THEN
    RAISE EXCEPTION 'vayro_auth must be NOLOGIN, non-superuser and NOBYPASSRLS';
  END IF;
  IF pg_has_role('vayro_auth', 'vayro_app', 'MEMBER') THEN
    RAISE EXCEPTION 'auth role must not inherit tenant role';
  END IF;
  IF NOT has_table_privilege('vayro_auth', 'public."User"', 'SELECT')
     OR NOT has_table_privilege('vayro_auth', 'public."Session"', 'INSERT')
     OR NOT has_table_privilege('vayro_auth', 'public."UserMfa"', 'UPDATE')
     OR NOT has_table_privilege('vayro_auth', 'public."AuthChallenge"', 'UPDATE') THEN
    RAISE EXCEPTION 'required identity privileges missing';
  END IF;
  IF has_column_privilege('vayro_auth', 'public."User"', 'platformRole', 'INSERT')
     OR has_column_privilege('vayro_auth', 'public."User"', 'platformRole', 'UPDATE') THEN
    RAISE EXCEPTION 'auth role must not assign platform roles';
  END IF;
  IF NOT has_column_privilege('vayro_auth', 'public."AuditEvent"', 'id', 'SELECT')
     OR has_column_privilege('vayro_auth', 'public."AuditEvent"', 'action', 'SELECT') THEN
    RAISE EXCEPTION 'auth role audit return privileges are too broad';
  END IF;
  IF has_table_privilege('vayro_auth', 'public."Product"', 'SELECT')
     OR has_table_privilege('vayro_auth', 'public."License"', 'SELECT')
     OR has_table_privilege('vayro_auth', 'public."EmailContact"', 'SELECT')
     OR has_table_privilege('vayro_auth', 'public."EmailContactVerificationToken"', 'SELECT') THEN
    RAISE EXCEPTION 'auth role has out-of-domain privileges';
  END IF;
  IF has_table_privilege('vayro_app', 'public."UserMfa"', 'SELECT')
     OR has_table_privilege('vayro_app', 'public."MfaRecoveryCode"', 'SELECT')
     OR has_table_privilege('vayro_app', 'public."AuthChallenge"', 'SELECT')
     OR has_table_privilege('vayro_app', 'public."AuthActionToken"', 'SELECT')
     OR has_table_privilege('vayro_app', 'public."AuthRateLimit"', 'SELECT') THEN
    RAISE EXCEPTION 'tenant role can access authentication secrets';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
      AND c.relowner = auth_role_oid
  ) THEN RAISE EXCEPTION 'auth role owns public tables'; END IF;
END $$;

SET ROLE vayro_auth;
SELECT id FROM public."User" LIMIT 0;
SELECT id FROM public."Session" LIMIT 0;
SELECT id FROM public."UserMfa" LIMIT 0;
SELECT id FROM public."MfaRecoveryCode" LIMIT 0;
SELECT id FROM public."AuthChallenge" LIMIT 0;
SELECT "keyHash" FROM public."AuthRateLimit" LIMIT 0;
SELECT id FROM public."AuthActionToken" LIMIT 0;
RESET ROLE;
