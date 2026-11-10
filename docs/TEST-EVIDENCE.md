# VAYRO Test Evidence
Snapshot: 2026-11-10T17:10:47Z.

## Exact PR #14 head
SHA: a534563598d3d4eb5fe25f1e3ab1b6731fb75060
- VAYRO CI run 42858663326: PASS. All steps completed successfully, including locked dependency security audit, unit tests, Prisma generate/validate, isolated PostgreSQL auth/platform/tenant role-boundary and RLS tests, lint, TypeScript, production build, Docker build, PostgreSQL and production-HTTP integration tests.
- CodeQL run 42858663153: PASS. JavaScript/TypeScript analysis completed successfully.
- Combined status endpoint returned no status contexts; workflow runs above provide the direct evidence.
- PASS here is scoped to this exact PR head and workflow execution only.

## Production/live checks
- Railway environment: VAYRO service online, 1/1 replicas, no recent deployment failures reported; 24-hour HTTP totals 18 2xx, 3 4xx, 0 5xx.
- Supabase: 11 public tables; no migration history; 0 policies; 0 FORCE RLS. These are blockers, not passing tests.
- Backup/restore: NOT VERIFIED. No successful live backup object/checksum or isolated restore drill evidence.
- Android/device, owner UAT, production email/payment: NOT RUN / NOT VERIFIED.
