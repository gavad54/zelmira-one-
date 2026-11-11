-- Owner-only tenant display fields required for license administration.\nGRANT SELECT ("id", "name", "slug", "status") ON public."Tenant" TO vayro_platform;\n\n-- Owner-governed license lifecycle. Tenant runtime retains tenant-scoped RLS;
-- the platform role receives only the columns required to issue/revoke licenses.
GRANT SELECT ("id", "tenantId", "productId", "startsAt", "endsAt", "active", "createdAt")
  ON public."License" TO vayro_platform;
GRANT INSERT ("id", "tenantId", "productId", "startsAt", "endsAt", "active", "createdAt")
  ON public."License" TO vayro_platform;
GRANT UPDATE ("active", "endsAt")
  ON public."License" TO vayro_platform;

CREATE POLICY vayro_platform_license_owner_read
ON public."License" FOR SELECT TO vayro_platform
USING (public.vayro_platform_actor_is_owner());

CREATE POLICY vayro_platform_license_owner_insert
ON public."License" FOR INSERT TO vayro_platform
WITH CHECK (public.vayro_platform_actor_is_owner());

CREATE POLICY vayro_platform_license_owner_update
ON public."License" FOR UPDATE TO vayro_platform
USING (public.vayro_platform_actor_is_owner())
WITH CHECK (public.vayro_platform_actor_is_owner());
