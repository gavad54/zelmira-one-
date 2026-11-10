# VAYRO test evidence

## Exact checked head — 7d0edb71522c281b546011ae110f4501c6903c43
Date: 2026-11-10
- VAYRO CI run 42776421939: completed / success.
- CodeQL run 42776421968: completed / success.
- CI job 129695876471: all 45 steps completed successfully.
- Unit tests: 86 passed, 0 failed.
- PostgreSQL / production HTTP integration tests: 30 passed, 0 failed.
- Isolated PostgreSQL 17: role setup, real Prisma migration history, auth and platform least-privilege role isolation, dedicated tenant runtime RLS isolation passed.
- Locked dependency security audit, Prisma generate/validate, lint, typecheck, production build and Docker image build passed.
- PostgreSQL service logs recorded serializable conflicts during concurrent EmailContact.enabled UPDATE and AuditEvent INSERT in SQL function vayro_platform_actor_is_owner; PostgreSQL suggested retry. Workflow passed. This remains a source-level retry/concurrency review item, not proof of a production incident.

## Scope limitation
These results apply to the exact SHA above and disposable CI infrastructure. They do not prove live Supabase schema/policies, production secrets, offsite backup/restore, Railway deployment parity, real user UAT or public release.

## Latest branch state after governance docs
Six governance documents and refreshed project/release/test logs were committed after 7d0edb7. Therefore 7d0edb7 is no longer the latest branch SHA. Exact-head workflows for the final documentation commit must be rechecked before stating that the current head is verified.
