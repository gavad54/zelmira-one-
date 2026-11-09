-- Dedicated platform control-plane database boundary.
-- The platform role is intentionally separate from tenant and authentication roles.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vayro_platform') THEN
    CREATE ROLE vayro_platform NOLOGIN NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vayro_platform_bootstrap') THEN
    CREATE ROLE vayro_platform_bootstrap NOLOGIN NOBYPASSRLS;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname IN ('vayro_platform','vayro_platform_bootstrap')
      AND (rolsuper OR rolbypassrls OR rolcanlogin)
  ) THEN
    RAISE EXCEPTION 'platform roles must be NOLOGIN, non-superuser and NOBYPASSRLS';
  END IF;
  IF pg_has_role('vayro_platform', 'vayro_app', 'MEMBER')
     OR pg_has_role('vayro_platform', 'vayro_auth', 'MEMBER')
     OR pg_has_role('vayro_platform_bootstrap', 'vayro_app', 'MEMBER')
     OR pg_has_role('vayro_platform_bootstrap', 'vayro_auth', 'MEMBER') THEN
    RAISE EXCEPTION 'platform roles must not inherit tenant or auth roles';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r','p')
      AND c.relowner IN (
        SELECT oid FROM pg_roles
        WHERE rolname IN ('vayro_platform','vayro_platform_bootstrap')
      )
  ) THEN
    RAISE EXCEPTION 'platform roles must not own public tables';
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO vayro_platform, vayro_platform_bootstrap;

-- Platform owner identity proof is read-only and limited to the exact fields
-- needed to validate the actor and their current MFA-assured session.
GRANT SELECT ("id", "email", "platformRole", "emailVerifiedAt", "disabledAt")
  ON public."User" TO vayro_platform;
GRANT SELECT ("id", "tokenHash", "userId", "expiresAt", "revokedAt", "assurance", "mfaAuthenticatedAt")
  ON public."Session" TO vayro_platform;

-- Platform catalogue and aggregate-only reporting surface.
GRANT SELECT ON public."Product" TO vayro_platform;
GRANT INSERT ("id", "key", "name", "description", "status", "baseUrl", "updatedAt")
  ON public."Product" TO vayro_platform;
GRANT UPDATE ("status", "baseUrl", "updatedAt")
  ON public."Product" TO vayro_platform;
GRANT SELECT ("id") ON public."Tenant" TO vayro_platform;
GRANT SELECT ("id", "productId", "active", "endsAt") ON public."License" TO vayro_platform;

-- Owner-managed contact book and its one-time verification capabilities.
GRANT SELECT, INSERT, UPDATE, DELETE ON public."EmailContact" TO vayro_platform;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."EmailContactVerificationToken" TO vayro_platform;

-- Audit writes return only an identifier; event contents are not readable by
-- the platform runtime role.
GRANT INSERT ON public."AuditEvent" TO vayro_platform;
GRANT SELECT ("id") ON public."AuditEvent" TO vayro_platform;

-- The platform role may verify a matching account email, but cannot change
-- passwords, account status, or platform privileges.
GRANT UPDATE ("emailVerifiedAt", "updatedAt") ON public."User" TO vayro_platform;

-- Explicitly deny identity secrets and tenant business data.
REVOKE ALL ON public."AuthActionToken", public."AuthRateLimit", public."UserMfa",
  public."MfaRecoveryCode", public."AuthChallenge" FROM vayro_platform;
REVOKE ALL ON public."Membership", public."License" FROM vayro_platform;
GRANT SELECT ("id", "productId", "active", "endsAt") ON public."License" TO vayro_platform;

-- The platform bootstrap helper is a non-login, non-bypass capability role.
-- It is never inherited by the application connection.
GRANT CREATE ON SCHEMA public TO vayro_platform_bootstrap;
GRANT SELECT ON public."User" TO vayro_platform_bootstrap;
GRANT INSERT ("id", "email", "passwordHash", "displayName", "platformRole", "updatedAt")
  ON public."User" TO vayro_platform_bootstrap;
GRANT INSERT ON public."EmailContact", public."AuditEvent" TO vayro_platform_bootstrap;

-- RLS actor check. The function is SECURITY INVOKER: User and Session RLS
-- policies below still apply to the calling platform role.
CREATE OR REPLACE FUNCTION public.vayro_platform_actor_is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."User" u
    JOIN public."Session" s ON s."userId" = u."id"
    WHERE u."id" = NULLIF(current_setting('app.platform_actor_id', true), '')
      AND u."platformRole" = 'OWNER'
      AND u."emailVerifiedAt" IS NOT NULL
      AND u."disabledAt" IS NULL
      AND s."tokenHash" = NULLIF(current_setting('app.platform_session_token_hash', true), '')
      AND s."revokedAt" IS NULL
      AND s."expiresAt" > now()
      AND s."assurance" = 'MFA'
      AND s."mfaAuthenticatedAt" IS NOT NULL
      AND s."mfaAuthenticatedAt" <= now()
      AND s."mfaAuthenticatedAt" >= now() - interval '12 hours'
  )
$$;
REVOKE ALL ON FUNCTION public.vayro_platform_actor_is_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vayro_platform_actor_is_owner() TO vayro_platform;

-- Owner-only identity projections used by the policy function.
CREATE POLICY vayro_platform_owner_user_read
ON public."User" FOR SELECT TO vayro_platform
USING (
  "id" = NULLIF(current_setting('app.platform_actor_id', true), '')
  AND "platformRole" = 'OWNER'
  AND "emailVerifiedAt" IS NOT NULL
  AND "disabledAt" IS NULL
);

CREATE POLICY vayro_platform_owner_session_read
ON public."Session" FOR SELECT TO vayro_platform
USING (
  "userId" = NULLIF(current_setting('app.platform_actor_id', true), '')
  AND "tokenHash" = NULLIF(current_setting('app.platform_session_token_hash', true), '')
  AND "revokedAt" IS NULL
  AND "expiresAt" > now()
  AND "assurance" = 'MFA'
  AND "mfaAuthenticatedAt" IS NOT NULL
  AND "mfaAuthenticatedAt" <= now()
  AND "mfaAuthenticatedAt" >= now() - interval '12 hours'
);

CREATE POLICY vayro_platform_product_read
ON public."Product" FOR SELECT TO vayro_platform
USING (public.vayro_platform_actor_is_owner());
CREATE POLICY vayro_platform_product_insert
ON public."Product" FOR INSERT TO vayro_platform
WITH CHECK (public.vayro_platform_actor_is_owner());
CREATE POLICY vayro_platform_product_update
ON public."Product" FOR UPDATE TO vayro_platform
USING (public.vayro_platform_actor_is_owner())
WITH CHECK (public.vayro_platform_actor_is_owner());

CREATE POLICY vayro_platform_tenant_aggregate_read
ON public."Tenant" FOR SELECT TO vayro_platform
USING (public.vayro_platform_actor_is_owner());
CREATE POLICY vayro_platform_license_aggregate_read
ON public."License" FOR SELECT TO vayro_platform
USING (public.vayro_platform_actor_is_owner());

CREATE POLICY vayro_platform_email_contact_owner
ON public."EmailContact" FOR ALL TO vayro_platform
USING (public.vayro_platform_actor_is_owner())
WITH CHECK (public.vayro_platform_actor_is_owner());

CREATE POLICY vayro_platform_email_token_owner
ON public."EmailContactVerificationToken" FOR ALL TO vayro_platform
USING (public.vayro_platform_actor_is_owner())
WITH CHECK (public.vayro_platform_actor_is_owner());

-- Public email confirmation is a separate bearer-token capability. The token
-- hash is transaction-local; it can expose/update only its linked contact and
-- matching account's emailVerifiedAt field.
CREATE POLICY vayro_platform_email_token_public_read
ON public."EmailContactVerificationToken" FOR SELECT TO vayro_platform
USING ("tokenHash" = NULLIF(current_setting('app.email_verification_token_hash', true), ''));

CREATE POLICY vayro_platform_email_token_public_update
ON public."EmailContactVerificationToken" FOR UPDATE TO vayro_platform
USING ("tokenHash" = NULLIF(current_setting('app.email_verification_token_hash', true), ''))
WITH CHECK ("tokenHash" = NULLIF(current_setting('app.email_verification_token_hash', true), ''));

CREATE POLICY vayro_platform_email_contact_public_read
ON public."EmailContact" FOR SELECT TO vayro_platform
USING (EXISTS (
  SELECT 1 FROM public."EmailContactVerificationToken" t
  WHERE t."contactId" = "EmailContact"."id"
    AND t."tokenHash" = NULLIF(current_setting('app.email_verification_token_hash', true), '')
));

CREATE POLICY vayro_platform_email_contact_public_update
ON public."EmailContact" FOR UPDATE TO vayro_platform
USING (EXISTS (
  SELECT 1 FROM public."EmailContactVerificationToken" t
  WHERE t."contactId" = "EmailContact"."id"
    AND t."tokenHash" = NULLIF(current_setting('app.email_verification_token_hash', true), '')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public."EmailContactVerificationToken" t
  WHERE t."contactId" = "EmailContact"."id"
    AND t."tokenHash" = NULLIF(current_setting('app.email_verification_token_hash', true), '')
));

CREATE POLICY vayro_platform_user_public_email_read
ON public."User" FOR SELECT TO vayro_platform
USING (EXISTS (
  SELECT 1
  FROM public."EmailContactVerificationToken" t
  JOIN public."EmailContact" c ON c."id" = t."contactId"
  WHERE t."tokenHash" = NULLIF(current_setting('app.email_verification_token_hash', true), '')
    AND c."email" = "User"."email"
));

CREATE POLICY vayro_platform_user_public_email_update
ON public."User" FOR UPDATE TO vayro_platform
USING (EXISTS (
  SELECT 1
  FROM public."EmailContactVerificationToken" t
  JOIN public."EmailContact" c ON c."id" = t."contactId"
  WHERE t."tokenHash" = NULLIF(current_setting('app.email_verification_token_hash', true), '')
    AND c."email" = "User"."email"
))
WITH CHECK (EXISTS (
  SELECT 1
  FROM public."EmailContactVerificationToken" t
  JOIN public."EmailContact" c ON c."id" = t."contactId"
  WHERE t."tokenHash" = NULLIF(current_setting('app.email_verification_token_hash', true), '')
    AND c."email" = "User"."email"
));

CREATE POLICY vayro_platform_audit_owner_insert
ON public."AuditEvent" FOR INSERT TO vayro_platform
WITH CHECK (
  public.vayro_platform_actor_is_owner()
  AND "actorUserId" = NULLIF(current_setting('app.platform_actor_id', true), '')
);
CREATE POLICY vayro_platform_audit_owner_id_read
ON public."AuditEvent" FOR SELECT TO vayro_platform
USING (public.vayro_platform_actor_is_owner());

CREATE POLICY vayro_platform_audit_public_insert
ON public."AuditEvent" FOR INSERT TO vayro_platform
WITH CHECK (
  "actorUserId" IS NULL
  AND NULLIF(current_setting('app.email_verification_token_hash', true), '') IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public."EmailContactVerificationToken" t
    WHERE t."tokenHash" = NULLIF(current_setting('app.email_verification_token_hash', true), '')
  )
);
CREATE POLICY vayro_platform_audit_public_id_read
ON public."AuditEvent" FOR SELECT TO vayro_platform
USING (
  NULLIF(current_setting('app.email_verification_token_hash', true), '') IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public."EmailContactVerificationToken" t
    WHERE t."tokenHash" = NULLIF(current_setting('app.email_verification_token_hash', true), '')
  )
);

-- Bootstrap role policies. This role can be used only as the SECURITY DEFINER
-- owner of the one-time function below and cannot log in or be inherited.
CREATE POLICY vayro_platform_bootstrap_user_read
ON public."User" FOR SELECT TO vayro_platform_bootstrap
USING (true);
CREATE POLICY vayro_platform_bootstrap_user_insert
ON public."User" FOR INSERT TO vayro_platform_bootstrap
WITH CHECK ("platformRole" = 'OWNER');
CREATE POLICY vayro_platform_bootstrap_email_contact_insert
ON public."EmailContact" FOR INSERT TO vayro_platform_bootstrap
WITH CHECK (true);
CREATE POLICY vayro_platform_bootstrap_audit_insert
ON public."AuditEvent" FOR INSERT TO vayro_platform_bootstrap
WITH CHECK ("actorUserId" IS NOT NULL);

CREATE OR REPLACE FUNCTION public.vayro_bootstrap_owner(
  p_email text,
  p_display_name text,
  p_password_hash text
)
RETURNS TABLE (
  id text,
  email text,
  "displayName" text,
  "platformRole" public."PlatformRole"
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id text := gen_random_uuid()::text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('vayro-owner-bootstrap'));

  IF EXISTS (
    SELECT 1 FROM public."User"
    WHERE public."User"."platformRole" IN ('OWNER', 'PLATFORM_ADMIN')
  ) THEN
    RAISE EXCEPTION 'BOOTSTRAP_ALREADY_USED';
  END IF;

  INSERT INTO public."User" (
    "id", "email", "passwordHash", "displayName", "platformRole", "updatedAt"
  ) VALUES (
    v_user_id, lower(trim(p_email)), p_password_hash, trim(p_display_name), 'OWNER', now()
  );

  INSERT INTO public."EmailContact" (
    "id", "email", "label", "purposes", "enabled", "isPrimary", "verifiedAt", "updatedAt"
  ) VALUES (
    gen_random_uuid()::text, lower(trim(p_email)), 'ایمیل اولیه مالک',
    ARRAY['OWNER']::public."EmailPurpose"[], true, false, NULL, now()
  );

  INSERT INTO public."AuditEvent" (
    "id", "actorUserId", "action", "resource", "resourceId", "metadata"
  ) VALUES (
    gen_random_uuid()::text, v_user_id, 'owner.bootstrap_completed', 'User', v_user_id,
    jsonb_build_object('method', 'one_time_deployment_secret', 'emailVerificationRequired', true)
  );

  RETURN QUERY
  SELECT u."id", u."email", u."displayName", u."platformRole"
  FROM public."User" u
  WHERE u."id" = v_user_id;
END
$$;

ALTER FUNCTION public.vayro_bootstrap_owner(text, text, text) OWNER TO vayro_platform_bootstrap;
REVOKE ALL ON FUNCTION public.vayro_bootstrap_owner(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vayro_bootstrap_owner(text, text, text) TO vayro_platform;

ALTER TABLE public."EmailContact" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."EmailContactVerificationToken" FORCE ROW LEVEL SECURITY;
