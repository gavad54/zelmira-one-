# VAYRO security status report
Snapshot: 2026-11-10 11:22:46 +03:30; exact source candidate b2b78f3a9171eeddd53c4f11d740b8c54abd6a7d.

## Verified repository evidence
- CodeQL 42777954612 (#1123): success on exact source candidate.
- VAYRO CI 42777954484 (#1160): success; all 45 steps passed.
- CI included unit tests, dependency audit, Prisma generation/validation, PostgreSQL 17 migration in disposable CI, auth/platform/tenant runtime-role isolation, tenant RLS SQL proof, lint, typecheck, production build, Docker build and PostgreSQL/production HTTP integration.
- Endpoint authorization inventory contains 42 operations. It is a source inventory; separate positive/negative evidence for every row remains incomplete.
- Source includes MFA/TOTP enrollment/login/recovery/disable, opaque sessions, password reset/change, single/all-session revocation, audit events and tenant transaction/RLS boundary. Source/CI does not prove production enforcement.
- Password-change route verifies current password, requires recent MFA for privileged or MFA-enabled accounts, transactionally updates password, revokes all user sessions and records an audit event.

## Critical production findings — last verified live inspection
- VAYRO-CORE: 11 public tables; all RLS-enabled, zero policies, zero FORCE RLS; migration history empty.
- Live schema lacks UserMfa, MfaRecoveryCode, AuthChallenge and AiGeneration; Session lacks revokedAt, lastSeenAt, assurance and mfaAuthenticatedAt.
- Security Advisor reported 11 RLS-enabled/no-policy findings.
- Dedicated roles vayro_app, vayro_auth, vayro_platform and vayro_platform_bootstrap were absent at last inspection.
- No independently verified encrypted backup/restore or production MFA encryption key/configuration.
- Production readiness previously returned 503; exact internal dependency remains unproven.

## Risk disposition
P0: live RLS policies absent; schema drift; no backup/restore; production tenant isolation and MFA/session enforcement unverified.
P1: per-operation endpoint evidence, CSP/headers/CORS/rate limits, email recovery and independent security review incomplete.
CI results are disposable-environment evidence only.

## Containment
Keep onboarding, production data collection and real payments disabled until release gates pass. No production DB changes before independent backup/restore and schema/recovery rehearsal. Never expose secrets in source/logs/issues/chat. No public release or gate bypass.


## Additional least-privilege hardening — 2026-11-10
- Review of the SECURITY DEFINER owner role found the migration/test checked only memberships held BY `vayro_platform_bootstrap`, but did not check grants OF that role TO another role.
- Tightened migration `20261109160000_platform_bootstrap_least_privilege` to reject membership edges in either direction (`pg_auth_members.roleid` or `member`).
- Tightened the isolated PostgreSQL platform-role test to assert no role can inherit/SET ROLE into the bootstrap capability.
- This is a repository-only hardening change; exact-head CI/CodeQL for the new commit is pending. No live database role or grant was changed.


## Owner dashboard API trust-boundary correction — 2026-11-10
- Source review found `/api/owner/products` used the default Prisma client directly, unlike owner email-contact routes which use `withPlatformOwnerTransaction`.
- Current candidate refactors GET/POST/PATCH to `withPlatformOwnerTransaction`, which revalidates the MFA-assured owner session inside the transaction and uses the dedicated `PLATFORM_DATABASE_URL` role. Rate limiting and initial owner identity lookup use the dedicated auth role.
- Catalog initialization uses INSERT-only `createMany(skipDuplicates)`, preserving existing product status/configuration rather than upserting/overwriting.
- The new route, owner dashboard page, login redirect and integration assertions are committed but await exact-head CI/CodeQL. No production role or database was changed.
- Repository branch-protection audit: main and all listed branches were unprotected. No settings changed; enforce branch protection before production release.
