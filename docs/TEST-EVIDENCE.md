# VAYRO test evidence
## Exact source candidate b2b78f3a9171eeddd53c4f11d740b8c54abd6a7d
- VAYRO CI 42777954484 (#1160): completed / success.
- CodeQL 42777954612 (#1123): completed / success.
- CI validate job 129700930780: all 45 steps succeeded.
- Passed steps include unit tests, locked dependency audit, Prisma generate/validate, migration history on isolated PostgreSQL 17, auth/platform/tenant runtime-role isolation, tenant RLS SQL proof, lint, typecheck, production build, Docker build and PostgreSQL/production HTTP integration.
- Exact-run unit/integration test counts were not extracted from logs; do not copy counts from older runs.

## Prior exact source candidate 7d0edb71522c281b546011ae110f4501c6903c43
- CI 42776421939 and CodeQL 42776421968 passed.
- 86 unit tests and 30 PostgreSQL/production HTTP integration tests passed; all 45 steps succeeded. Historical evidence only.

## Product-directory focused test
- Source commit 06f3e3528f12e1a76b801430788fa433ebeffef2; Node v22.16.0.
- Three focused tests passed against exact extracted source/test files.
- Later exact candidate CI b2b78f3 passed.

## Scope limitations
CI uses disposable PostgreSQL, not live VAYRO-CORE. It does not prove production database policies/roles, backup/restore, production MFA key/configuration, Railway deployment parity, live email delivery, Android real-device behavior, UAT or public release.
