# VAYRO test evidence

## Last exact checked source head — 7d0edb71522c281b546011ae110f4501c6903c43
Date: 2026-11-10
- VAYRO CI run 42776421939: completed / success.
- CodeQL run 42776421968: completed / success.
- CI job 129695876471: all 45 steps succeeded.
- Unit tests: 86 passed, 0 failed.
- PostgreSQL / production HTTP integration tests: 30 passed, 0 failed.
- Isolated PostgreSQL 17 migration history, auth/platform least-privilege role isolation, dedicated tenant runtime RLS isolation, locked dependency audit, Prisma generate/validate, lint, typecheck, production build and Docker image build passed.
- PostgreSQL service logs recorded serializable conflicts during concurrent EmailContact.enabled UPDATE and AuditEvent INSERT in vayro_platform_actor_is_owner. Owner-contact PATCH/DELETE maps P2034 to HTTP 409; no automatic retry was added.

## Current candidate head
- Source commit 06f3e3528f12e1a76b801430788fa433ebeffef2 updates product-directory membership, DANA platform classification, homepage display, declaration and unit test.
- This current candidate has no exact-head CI or CodeQL evidence in the latest connector response. Treat it as IMPLEMENTED / UNVERIFIED until fresh tests run.

## Scope limitation
All successful results above apply to 7d0edb7 and disposable CI infrastructure only. They do not prove live Supabase schema/policies, production secrets, offsite backup/restore, Railway deployment parity, real user UAT or public release.
