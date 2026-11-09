# VAYRO tenant RLS acceptance hardening — 2026-11-09

**Branch:** `security/mfa-session-endpoint-gates`  
**Latest source commit after SQL delimiter correction:** `7bb825c7ba7db883a072433c4d8ecd9795e104ad`  
**Scope:** tenant database role and RLS acceptance checks  
**Disposition:** TEST HARNESS STRENGTHENED — NOT EXECUTED IN THIS SESSION — PRODUCTION RLS NOT VERIFIED

## Implemented repository changes

1. Expanded `tests/sql/tenant-rls-isolation.sql` with catalog-level assertions for the tenant data plane:
   - all eight tenant/auth projection tables (`Tenant`, `Membership`, `License`, `Product`, `AuditEvent`, `User`, `Session`, `AiGeneration`) must have RLS enabled, FORCE RLS enabled, and at least one policy;
   - the `vayro_app` group role must remain NOLOGIN, non-superuser, NOBYPASSRLS, without CREATE on `public`, without memberships in auth/platform/bootstrap roles, and must not own protected tables;
   - tenant runtime must not receive table-level SELECT on auth-token, rate-limit, MFA, recovery-code, challenge, or owner email-contact tables;
   - password hashes and platform-role columns remain unavailable to the tenant role.
2. Preserved tenant-role access to session assurance fields because the current transaction boundary explicitly reads MFA assurance and freshness to authorize OWNER/ADMIN actions. These are required authorization inputs, not an accidental grant.
3. Expanded the runtime role ownership guard to include `AiGeneration`.
4. Updated GitHub Actions CI PostgreSQL service from major version 16 to **PostgreSQL 17**, matching the currently observed VAYRO-CORE major version.

## Verification and limitations

- GitHub read-back is required after each commit; see the branch and PR for current source.
- These are SQL/CI test-harness changes. No test run was executed from this session because no repository runtime/checkout or workflow-dispatch capability was available.
- The SQL fixture is explicitly marked for disposable GitHub Actions PostgreSQL only; it must never be run against VAYRO-CORE.
- Exact-head CI/CodeQL status must be inspected from GitHub Actions. A missing result from the available workflow-run connector is not a pass.
- The live VAYRO-CORE audit previously found zero RLS policies and zero FORCE RLS on the 11 inspected public tables. The new source migrations and test fixture do not change that live database state.

## Remaining gates

- Execute the full PostgreSQL 17 CI workflow on the latest branch head and inspect every job/log.
- Rehearse migrations and all SQL role/RLS tests against a separate verified restored clone.
- Verify the exact runtime LOGIN identities and effective grants.
- Only after independent encrypted backup, successful restore and approval may an authorized administrator schedule production migration and real two-tenant ingress tests.

**Decision: repository test coverage improved; production remains READ-ONLY, deployment BLOCKED, and VAYRO NOT RELEASED.**
