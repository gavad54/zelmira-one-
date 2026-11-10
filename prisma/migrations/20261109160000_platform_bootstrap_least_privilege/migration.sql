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

  -- A SECURITY DEFINER owner must have no memberships in either direction:
  -- no inherited roles and no other role may SET ROLE into this capability.
  -- Checking only "member = bootstrap_oid" misses grants OF bootstrap TO another role.
  IF EXISTS (
    SELECT 1
    FROM pg_auth_members
    WHERE member = bootstrap_oid OR roleid = bootstrap_oid
  ) THEN
    RAISE EXCEPTION 'vayro_platform_bootstrap must have no role memberships';
  END IF;
END
$$;

ALTER ROLE vayro_platform_bootstrap NOINHERIT;
REVOKE CREATE ON SCHEMA public FROM vayro_platform_bootstrap;
