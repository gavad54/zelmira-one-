-- Tighten the one-time owner bootstrap function's definer role.
-- The function only needs its explicit table privileges and schema USAGE;
-- it does not create schema objects.
DO $$
DECLARE
  bootstrap_oid OID;
BEGIN
  SELECT oid INTO bootstrap_oid
  FROM pg_roles
  WHERE rolname = 'vayro_platform_bootstrap';

  IF bootstrap_oid IS NULL THEN
    RAISE EXCEPTION 'vayro_platform_bootstrap role is missing';
  END IF;

  -- A SECURITY DEFINER owner must not inherit or be able to SET ROLE into
  -- unrelated privileges. Fail migration rather than silently accepting drift.
  IF EXISTS (
    SELECT 1
    FROM pg_auth_members
    WHERE member = bootstrap_oid
  ) THEN
    RAISE EXCEPTION 'vayro_platform_bootstrap has unexpected role memberships';
  END IF;
END
$$;

ALTER ROLE vayro_platform_bootstrap NOINHERIT;
REVOKE CREATE ON SCHEMA public FROM vayro_platform_bootstrap;
