# VAYRO Security Report
Snapshot: 2026-11-10T17:10:47Z. Read-only production inspection.

## Findings
- CRITICAL/P0: 11 public tables have RLS enabled but no policies; FORCE RLS is false for all 11.
- All 11 tables are owned by postgres. No dedicated vayro_* database runtime roles were evidenced in the prior live audit; current snapshot reconfirms table ownership and policy state.
- Supabase Security Advisor reports 11 rls_enabled_no_policy findings.
- Prisma source includes MFA/session fields and models not present in live database; schema drift is unresolved.
- CodeQL analysis for PR #14 exact head completed successfully. This does not certify zero open alert inventory or production security.
- CI tenant/RLS tests use disposable isolated PostgreSQL; they do not prove live VAYRO-CORE tenant isolation.
- CSP/headers, production ingress/trusted-proxy settings, live email and payment security remain UNVERIFIED.

## Required controls
Do not change production schema/roles/policies until an encrypted backup and isolated restore are independently proven, schema drift is reconciled, and migration forward/rollback is rehearsed. Verify least-privilege runtime identity and cross-tenant negative tests before release.
