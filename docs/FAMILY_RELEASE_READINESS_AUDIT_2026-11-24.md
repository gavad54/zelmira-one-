# VAYRO product-family release-readiness audit — 2026-11-24

## Executive decision

**FAMILY STATUS: ENGINEERING IN PROGRESS — PRODUCTION / COMMERCIAL RELEASE BLOCKED.**

This audit separates repository/CI evidence from actual runtime, database, mobile-device, backup/restore and UAT evidence. A green test workflow does not convert a draft repository into a live product.

No PR was merged. No production deployment, live database write, migration, grant, RLS policy change, secret update, DNS change, paid resource creation or release was performed.

## Cross-product verification matrix

| Product | Exact source evidence | Checks that passed | Remaining release blockers |
|---|---|---|---|
| VAYRO | PR #47 head `4a507c3057725040fcd38f4d2606e958281a0927`; PR #48 head `1d933290ae34def21f78ce265d5261727bfd8017` | PR #47 CI, CodeQL and lockfile validation pass; CI includes unit tests, locked dependency audit, Prisma validation, isolated PostgreSQL migration/RLS/role/worker tests, lint, typecheck, production/Docker builds and HTTP/PostgreSQL integration. PR #48 CI, CodeQL and lockfile checks previously passed on its exact head. | Dedicated hosting, Railway configuration and credentials, VAYRO-CORE live schema/roles/policies, R2 backup, isolated restore, Android release, UAT and explicit release approval. |
| ARIA | PR #3 source commit `387c6ad78100a5a187d50b423c49c0b6cadfe799`; 384 tracked entries | Main CI: 984 tests pass, zero failed/skipped; web catalog CI: 984 tests pass, zero failed/skipped; production dependency audit and CodeQL pass. TLS certificate-verification regression tests included. | No Android Gradle project or manifest in this repository; no native APK/device test. The preserved 191-record adapter inventory has zero provider mappings and all 191 are inactive/not approved. |
| ARIANA | PR #1 bootstrap head `d4e5b2d7d8c7c10a7c8b176cd08f52bbfc38bdc5`; source ZIP SHA `560597e85af9308bc21815a2642197d609d7c5e00b79b8c122d11d6616d7f6b2` | Isolated 215-file archive: 95/95 tests pass, compileall pass, 7 JS/CJS syntax checks pass, aggregate backend coverage with branch measurement: 85%. PR CI: 9 focused JWT tests pass plus dependency audit; CodeQL pass. | The 215-file application archive is not imported; current GitHub repository remains a bootstrap scaffold. Runtime smoke, PostgreSQL, migration replay, Android build/signing/device, backup/restore and UAT not verified. Archive has database/JWT/migration/version/default-secret defects documented in the source audit. |
| LEADORA | PR #54 head `e73e55605214a4f08a3e1585f3d20a1d0f06645a` | 102 tests pass, including local Chromium Playwright register/login/reload/settings/logout flow; regression/security checks, CodeQL, Python compile, browser JS syntax, PWA manifest, Docker Compose config and Docker image build pass. Android test APK packaging succeeds. | Android APK is a 13,515-byte WebView wrapper that loads the remote Railway URL; no signed release or real-device UAT. Railway production runtime not verified healthy. Duplicate Compose files cause CI to validate `compose.yaml`, not the richer worker configuration in `docker-compose.yml`. No dependency audit/lockfile gate. |
| ARMIN MARKET | PR #2 head `6b0c66432488667569afc2bd10cf4c59acf3d3a5` | Gradle `testDebugUnitTest` and debug APK build pass; CodeQL pass; APK artifact inspected and structurally valid (9.5 MB). | Offline UI prototype only: hard-coded demo catalog, SharedPreferences cart, no INTERNET permission or backend/API, no real listing/order/payment/shipping. Dependency Review fails because GitHub Dependency Graph is disabled. No emulator/device install or UAT; no signed release. |

## VAYRO — live hosting and database blockers

### Railway — read-only inspection

Only two projects are connected:
- `ARIA Web` (project `c936dddd-5aa7-46d9-bd04-aa77f2164586`)
- `LEADORA` (project `806faa38-6cdd-4a6a-bad4-0e94cf6070fa`)

The VAYRO service is not in a dedicated VAYRO project:
- In `ARIA Web`, service `VAYRO` has a failed latest deployment; healthcheck `/api/health` failed. Its domain is `vayro-production.up.railway.app`; no environment variable names or mounted volumes were exposed by the read-only service inspection.
- In `LEADORA`, a second service named `VAYRO` has a failed build. The earlier deployment diagnosis identifies missing `AUTH_DATABASE_URL`. No successful deployment URL is recorded.
- `ARIA Web` has staged, unapplied changes. They were not committed or deployed.

Required owner/runtime actions:
1. Approve and provision a dedicated VAYRO hosting project/service rather than reusing ARIA or LEADORA project boundaries.
2. Create the intended production and worker services with separate least-privilege runtime credentials.
3. Configure `DATABASE_URL`, `AUTH_DATABASE_URL`, `PLATFORM_DATABASE_URL` and `TASK_WORKER_DATABASE_URL` only in protected Railway variables after their role grants are proven in isolated PostgreSQL.
4. Set health/readiness checks and verify live application, auth DB, platform DB and worker connectivity.
5. Match the deployed commit to the approved PR commit and retain rollback evidence.

These steps require owner-controlled Railway configuration and were not performed.

### Supabase VAYRO-CORE — read-only inspection

Project `wdqhdnhpgxhmmfeyxwxr` is ACTIVE_HEALTHY on PostgreSQL 17.11, region `eu-central-1`.

Observed:
- 11 public tables, all with RLS enabled.
- Zero rows in the inspected tables.
- Zero applied migration records.
- Zero RLS policies across the 11 tables; Security Advisor reports 11 `rls_enabled_no_policy` findings.
- No dedicated `vayro_*` runtime roles were found.
- Seven repository Prisma model tables are absent from the live catalog: `UserMfa`, `MfaRecoveryCode`, `AuthChallenge`, `AiGeneration`, `EngineeringTask`, `EngineeringTaskAttempt`, `EngineeringTaskDependency`.
- Expected `AuditEvent_tenantId_fkey` is absent.
- Performance Advisor reports 10 unused indexes; with an empty inspected database these are not a basis for dropping indexes.
- Health Advisor reports no findings.

Interpretation: RLS with no policies is fail-closed for roles subject to RLS, but the current database has no provisioned application role/grant matrix and therefore is not ready for application runtime. Do not describe this as public read access. Do not apply migrations, roles, grants or policies directly to live.

Required sequence:
1. Provision an independent encrypted backup destination and complete an actual encrypted backup.
2. Restore it into a different-host isolated PostgreSQL instance and compare schema, object inventory, privileges, policies, row counts and invariants.
3. Reconcile the live 11-table catalog to the 18-model repository schema with an explicit baseline plan.
4. Create and test least-privilege migration, auth, platform, tenant and worker roles in isolated PostgreSQL.
5. Test positive and negative cross-tenant access for every protected route and DB operation.
6. Only after review and separate owner authorization, prepare the production migration/change window.

### Backup and restore

The current workflow target is Cloudflare R2. The read-only bucket-list request returned HTTP 403 / Cloudflare error 10042 because R2 is not enabled in the account. No bucket, key, encrypted object or restore artifact exists. Both backup and restore workflows remain NOT EXECUTED.

Required owner actions:
1. Review Cloudflare account eligibility, usage and billing prompts; enable R2 if approved.
2. Create a private bucket (no public access).
3. Create bucket-scoped least-privilege R2 credentials.
4. Configure the protected GitHub Environments `vayro-backup` and `vayro-restore` with the exact secret/variable names in `docs/BACKUP-RESTORE-RUNBOOK.md`.
5. Keep the age private identity in approved secret storage/offline escrow; do not commit it.
6. Provision a separate-host disposable PostgreSQL restore target.
7. Run backup, verify encrypted object/checksum, run restore, and record schema/data invariants, RPO and RTO.

## ARIA — adapter activation boundary

The preserved adapter inventories contain 191 requirements and 191 provider-mapping records. All 191 are:
- `NOT_MAPPED_TO_PROVIDER_IMPLEMENTATION`
- provider and region `NOT_SELECTED`
- `INACTIVE_FAIL_CLOSED`
- `NOT_APPROVED`

Maturity breakdown: 121 contract-routable but not E2E verified; 39 contract/static-runtime verified; 19 foundation runtime static/E2E pending; 12 surface runtime static/E2E pending.

Next steps per adapter: select provider/region, approve data and legal boundaries, define versioned contract, implement TLS/least privilege/tenant authorization/timeouts/retries/idempotency/rate limits/audit/redaction, then pass contract → mock → sandbox → E2E → owner approval. No adapter should be marked active before evidence exists.

## ARIANA — source archive and runtime defects

The archive is a recovered v0.37 baseline plus v0.38 tax/budget candidate, not a coherent release:
- README says candidate v0.38; FastAPI metadata says 0.37.0; health response says 0.34.0; Android Gradle version says 0.37.0.
- `DATABASE_URL` silently defaults to SQLite.
- `main.py` calls `create_all` at import/startup.
- No Alembic environment/version ledger exists despite Alembic being listed as a dependency.
- JWT decode does not require the complete claim set.
- Compose defaults include `POSTGRES_PASSWORD=change-me` and `JWT_SECRET=change-this-secret`.
- Backend dependency versions are floating and not locked.
- The local audit environment lacks `passlib`, so FastAPI runtime import and HTTP smoke test were blocked.
- Android SDK/Gradle runtime was unavailable in the isolated workspace; native build/install/signing/device checks are not proven.

Do not overwrite the bootstrap's hardened JWT configuration with the older archive version. Import additively after the fail-closed DB and migration design is repaired.

## LEADORA — Android and Compose boundary

The Android wrapper is online-dependent and loads `https://leadora-web-production.up.railway.app/`. Its successful build proves packaging, not that the remote product is usable. The Railway app has no confirmed healthy deployment. The Android app must be installed on a real device against a healthy staging backend, and the critical flows must be tested before release.

The two Compose files must be consolidated or both validated explicitly. Add a reproducible dependency lock and vulnerability/SBOM scan. Resolve deprecation warnings in the Starlette/httpx and Node dependencies.

## ARMIN MARKET — product completion boundary

The current native Compose app is a visual prototype. Replace hard-coded sample products with authenticated API data; add backend models for sellers, listings, buyer requests, quotations, order state and audit; enforce authorization and idempotency; then add mock/sandbox payment only after explicit owner/legal approval. Keep the current local demo cart clearly labeled and do not imply real payment or fulfillment.

## Family-wide required acceptance gates

Before any public or commercial release:
1. Clean build from a fresh checkout with locked dependencies.
2. Unit, integration, contract, regression, security and migration tests on the exact candidate SHA.
3. API route inventory with authentication, authorization and tenant-isolation positive/negative tests.
4. Database migration replay on an empty isolated DB and upgrade test from a representative prior schema.
5. Backup checksum, isolated restore, and application invariants.
6. Production-equivalent container build, health/readiness, restart recovery, monitoring and rollback rehearsal.
7. Android debug build, release signing, device installation, upgrade path and critical-flow E2E where applicable.
8. Browser responsive/RTL/accessibility checks and representative UAT.
9. Email, license and payment sandbox tests with idempotent callbacks and reconciliation.
10. Product boundary and cross-product integration contract tests.
11. Security review, dependency/container scans, secrets review and privacy/legal review.
12. Explicit owner release approval and deployed commit match.

## Status labels

- PASS: exact evidence exists for the stated check only.
- FAIL: check ran and failed.
- BLOCKED: a required external/owner-controlled prerequisite is absent.
- UNVERIFIED: no adequate execution evidence exists.

**Current family release posture: BLOCKED.** Repository-level checks are green for several development branches, but independent hosting, live database readiness, encrypted backup/restore, provider activation, native/device UAT and commercial operations are not proven.

## VAYRO product-directory and mobile-source reality check

The product directory in the reviewed branch explicitly marks ARVAND, CHARSU, GANJINEH, SEPEHR, NAMA and PAYAM as planned; NEGAH is a prototype requiring service integration. DANA is correctly classified as an internal VAYRO capability, not a standalone product. The four independent products are listed as blocked pending their own release readiness.

The VAYRO repository tree has 380 tracked entries and contains no Android Gradle wrapper, Android Gradle build files, settings.gradle or AndroidManifest.xml. The reviewed tree contains VAYRO shell/Command Center/auth/owner APIs and DANA/NEGAH surfaces, but not seven fully implemented, independently deployable product applications. VAYRO currently has a web application source, not a verified native Android package.

This does not change the approved product architecture; it clarifies that product catalogue entries and planned domain boundaries are not evidence of implemented standalone products.
