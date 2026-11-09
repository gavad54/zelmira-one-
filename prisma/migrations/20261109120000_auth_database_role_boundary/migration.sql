-- Dedicated global identity/authentication data plane.
-- This role is intentionally separate from tenant RLS and platform administration.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vayro_auth') THEN
    CREATE ROLE vayro_auth NOLOGIN NOBYPASSRLS;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname = 'vayro_auth' AND (rolsuper OR rolbypassrls)
  ) THEN
    RAISE EXCEPTION 'vayro_auth must remain non-superuser and NOBYPASSRLS';
  END IF;

  IF pg_has_role('vayro_auth', 'vayro_app', 'MEMBER') THEN
    RAISE EXCEPTION 'vayro_auth must not inherit the tenant runtime role';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r','p')
      AND c.relowner = (SELECT oid FROM pg_roles WHERE rolname = 'vayro_auth')
  ) THEN
    RAISE EXCEPTION 'vayro_auth must not own public tables';
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO vayro_auth;

-- Identity records are global by design; this role is the only application
-- data-plane role allowed to access password hashes, MFA material and sessions.
GRANT SELECT ON public."User" TO vayro_auth;
GRANT INSERT ("id", "email", "passwordHash", "displayName", "updatedAt") ON public."User" TO vayro_auth;
GRANT UPDATE ("passwordHash", "emailVerifiedAt", "updatedAt") ON public."User" TO vayro_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."Session" TO vayro_auth;
GRANT SELECT ON public."Membership" TO vayro_auth;
GRANT SELECT ("id", "status") ON public."Tenant" TO vayro_auth;
GRANT INSERT ON public."AuditEvent" TO vayro_auth;
GRANT SELECT ("id") ON public."AuditEvent" TO vayro_auth;

GRANT SELECT, INSERT, UPDATE, DELETE ON public."AuthActionToken" TO vayro_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."AuthRateLimit" TO vayro_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."UserMfa" TO vayro_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."MfaRecoveryCode" TO vayro_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."AuthChallenge" TO vayro_auth;

-- Keep the auth role within the identity domain. No product, license,
-- tenant mutation, email-contact administration, or migration privileges.
REVOKE ALL ON public."Product", public."License", public."EmailContact",
  public."EmailContactVerificationToken" FROM vayro_auth;

-- FORCE RLS already protects User, Session, Membership, Tenant and AuditEvent.
-- These explicit policies allow the dedicated auth service to perform its
-- global identity operations while tenant runtime remains denied.
CREATE POLICY vayro_auth_user_identity
ON public."User" FOR ALL TO vayro_auth
USING (true) WITH CHECK (true);

CREATE POLICY vayro_auth_session_identity
ON public."Session" FOR ALL TO vayro_auth
USING (true) WITH CHECK (true);

CREATE POLICY vayro_auth_membership_read
ON public."Membership" FOR SELECT TO vayro_auth
USING (true);

CREATE POLICY vayro_auth_tenant_status_read
ON public."Tenant" FOR SELECT TO vayro_auth
USING (true);

CREATE POLICY vayro_auth_audit_insert
ON public."AuditEvent" FOR INSERT TO vayro_auth
WITH CHECK (true);

CREATE POLICY vayro_auth_audit_id_read
ON public."AuditEvent" FOR SELECT TO vayro_auth
USING (true);

ALTER TABLE public."AuthActionToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuthActionToken" FORCE ROW LEVEL SECURITY;
CREATE POLICY vayro_auth_action_tokens
ON public."AuthActionToken" FOR ALL TO vayro_auth
USING (true) WITH CHECK (true);

ALTER TABLE public."AuthRateLimit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuthRateLimit" FORCE ROW LEVEL SECURITY;
CREATE POLICY vayro_auth_rate_limits
ON public."AuthRateLimit" FOR ALL TO vayro_auth
USING (true) WITH CHECK (true);

ALTER TABLE public."UserMfa" FORCE ROW LEVEL SECURITY;
CREATE POLICY vayro_auth_mfa_secrets
ON public."UserMfa" FOR ALL TO vayro_auth
USING (true) WITH CHECK (true);

ALTER TABLE public."MfaRecoveryCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MfaRecoveryCode" FORCE ROW LEVEL SECURITY;
CREATE POLICY vayro_auth_recovery_codes
ON public."MfaRecoveryCode" FOR ALL TO vayro_auth
USING (true) WITH CHECK (true);

ALTER TABLE public."AuthChallenge" FORCE ROW LEVEL SECURITY;
CREATE POLICY vayro_auth_challenges
ON public."AuthChallenge" FOR ALL TO vayro_auth
USING (true) WITH CHECK (true);
