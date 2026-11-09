-- Database-enforced tenant boundary for the current VAYRO core tables.
-- This migration creates a NOLOGIN group role. Provision a dedicated LOGIN
-- connection role as a member of vayro_app outside migrations; never use the
-- table owner, postgres, service_role, or a BYPASSRLS principal for tenant queries.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vayro_app') THEN
    CREATE ROLE vayro_app NOLOGIN NOBYPASSRLS;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname = 'vayro_app' AND (rolsuper OR rolbypassrls)
  ) THEN
    RAISE EXCEPTION 'vayro_app must remain non-superuser and NOBYPASSRLS';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r','p')
      AND c.relowner = (SELECT oid FROM pg_roles WHERE rolname = 'vayro_app')
  ) THEN
    RAISE EXCEPTION 'vayro_app must not own public tables';
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO vayro_app;

-- Only grant the current tenant data plane. Authentication, MFA, rate-limit,
-- email-contact and platform administration tables remain unavailable here.
GRANT SELECT ON public."Tenant", public."Membership", public."License", public."Product" TO vayro_app;
GRANT INSERT ON public."Tenant", public."Membership" TO vayro_app;
GRANT UPDATE ("name", "status", "updatedAt") ON public."Tenant" TO vayro_app;
GRANT INSERT, UPDATE, DELETE ON public."License" TO vayro_app;
GRANT SELECT, INSERT ON public."AuditEvent" TO vayro_app;
GRANT SELECT ("id", "emailVerifiedAt", "disabledAt", "email", "displayName") ON public."User" TO vayro_app;
GRANT SELECT ("id", "tokenHash", "userId", "expiresAt", "createdAt", "revokedAt", "lastSeenAt", "assurance", "mfaAuthenticatedAt")
  ON public."Session" TO vayro_app;

CREATE POLICY vayro_app_tenant_scope
ON public."Tenant"
FOR SELECT TO vayro_app
USING (
  CASE
    WHEN NULLIF(current_setting('app.tenant_id', true), '') IS NOT NULL
      THEN "id" = NULLIF(current_setting('app.tenant_id', true), '')
    ELSE EXISTS (
      SELECT 1 FROM public."Membership" m
      WHERE m."tenantId" = "Tenant"."id"
        AND m."userId" = NULLIF(current_setting('app.user_id', true), '')
    )
  END
);

CREATE POLICY vayro_app_tenant_update
ON public."Tenant"
FOR UPDATE TO vayro_app
USING ("id" = NULLIF(current_setting('app.tenant_id', true), ''))
WITH CHECK ("id" = NULLIF(current_setting('app.tenant_id', true), ''));

CREATE POLICY vayro_app_tenant_insert
ON public."Tenant"
FOR INSERT TO vayro_app
WITH CHECK ("id" = NULLIF(current_setting('app.tenant_id', true), ''));

CREATE POLICY vayro_app_membership_scope
ON public."Membership"
FOR SELECT TO vayro_app
USING (
  CASE
    WHEN NULLIF(current_setting('app.tenant_id', true), '') IS NOT NULL
      THEN "tenantId" = NULLIF(current_setting('app.tenant_id', true), '')
    ELSE "userId" = NULLIF(current_setting('app.user_id', true), '')
  END
);

CREATE POLICY vayro_app_membership_insert
ON public."Membership"
FOR INSERT TO vayro_app
WITH CHECK (
  "tenantId" = NULLIF(current_setting('app.tenant_id', true), '')
  AND "userId" = NULLIF(current_setting('app.user_id', true), '')
  AND "role" = 'OWNER'
);

CREATE POLICY vayro_app_license_scope
ON public."License"
FOR ALL TO vayro_app
USING ("tenantId" = NULLIF(current_setting('app.tenant_id', true), ''))
WITH CHECK ("tenantId" = NULLIF(current_setting('app.tenant_id', true), ''));

CREATE POLICY vayro_app_product_catalog_read
ON public."Product"
FOR SELECT TO vayro_app
USING (true);

CREATE POLICY vayro_app_audit_scope
ON public."AuditEvent"
FOR SELECT TO vayro_app
USING ("tenantId" = NULLIF(current_setting('app.tenant_id', true), ''));

CREATE POLICY vayro_app_audit_insert
ON public."AuditEvent"
FOR INSERT TO vayro_app
WITH CHECK (
  "tenantId" = NULLIF(current_setting('app.tenant_id', true), '')
  AND "actorUserId" = NULLIF(current_setting('app.user_id', true), '')
);

CREATE POLICY vayro_app_user_self_read
ON public."User"
FOR SELECT TO vayro_app
USING (
  "id" = NULLIF(current_setting('app.user_id', true), '')
  OR (
    NULLIF(current_setting('app.user_role', true), '') IN ('OWNER', 'ADMIN')
    AND EXISTS (
      SELECT 1 FROM public."Membership" m
      WHERE m."tenantId" = NULLIF(current_setting('app.tenant_id', true), '')
        AND m."userId" = "User"."id"
    )
  )
);

CREATE POLICY vayro_app_session_self_read
ON public."Session"
FOR SELECT TO vayro_app
USING (
  "userId" = NULLIF(current_setting('app.user_id', true), '')
  AND "tokenHash" = NULLIF(current_setting('app.session_token_hash', true), '')
);

ALTER TABLE public."Tenant" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."Membership" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."License" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."Product" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."AuditEvent" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."User" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."Session" FORCE ROW LEVEL SECURITY;

-- Tenant audit records must reference a real tenant; deletion anonymizes the scope.
ALTER TABLE public."AuditEvent"
  ADD CONSTRAINT "AuditEvent_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
