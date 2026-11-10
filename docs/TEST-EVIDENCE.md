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

## Focused product-directory check — source commit 06f3e3528f12e1a76b801430788fa433ebeffef2
- Extracted the exact product-directory module and unit-test source from the branch into a temporary isolated Node test folder.
- Runtime: Node v22.16.0.
- Result: 3 tests passed, 0 failed. Assertions cover seven approved family modules, three independent products, DANA as platform capability, non-production status labels and linked route inventory.
- This is a local focused test of copied source, not a full repository checkout, GitHub Actions run, Next.js build or TypeScript check.

## Current candidate head
- Current PR head at evidence refresh: 87e940774dedd3adf64610d7f9fc431657195a12.
- Exact-head GitHub Actions query returned zero runs and combined status returned no checks. Current candidate remains UNVERIFIED by repository CI.

## Scope limitation
Successful prior CI applies only to 7d0edb7 and disposable CI infrastructure. It does not prove live Supabase schema/policies, production secrets, offsite backup/restore, Railway deployment parity, real user UAT or public release.
