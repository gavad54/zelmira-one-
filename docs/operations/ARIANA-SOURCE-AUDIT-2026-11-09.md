# ARIANA source and implementation audit — 2026-11-09

## 1. Source discovery

A source archive was located in the user's Library:

- Library path: `/ARIA/آریانا/ariaana_android_app_v37_hardened_integrated.zip`
- Archive SHA-256: `a9a4146a57e899c04939728bc9669d81145d8a6f8789b7e8a807ff08e3fa6ccb`
- ZIP integrity: passed (`ZipFile.testzip() = None`)
- Entries: 385
- Extracted files: 319
- Product identity: ARIANA / آریانا, package `ir.aria.hesab`
- Android version in `app/build.gradle`: versionCode 37, versionName 0.37.0
- Canonical ARIANA GitHub repository: not found in the connected account inventory. The source archive is located, but it has not been imported into a canonical Git repository.

This supersedes the older `SOURCE_NOT_LOCATED` label: the source archive is now located; canonical repository/production deployment are still not located.

## 2. Tests actually executed in the isolated extracted workspace

| Check | Result |
|---|---|
| ZIP integrity | PASS |
| `python -m pytest -q` | **89 passed** |
| `node --check` for every top-level bundled JavaScript asset | PASS |
| `python -m compileall -q backend` | PASS |
| Android Gradle build | NOT RUN — no `gradlew`, system Gradle or Android SDK in this execution environment |
| APK/AAB artifact | NOT FOUND in the archive |
| Real-device install/run | NOT VERIFIED |
| Production database/API/email/payment connection | NOT VERIFIED |

The 89 passing tests are source-level tests in this archive. They are not a production acceptance test and do not establish correctness of every workflow, financial rule, tenant boundary or current tax/insurance regulation.

## 3. Implemented scope found in source

- Persian RTL PWA/UI assets and an Android WebView shell.
- FastAPI backend and SQLAlchemy data models.
- Account/journal posting and trial-balance/profit-and-loss reports.
- Sales, purchasing, inventory, treasury, payroll, fixed assets and project modules.
- Tax and insurance preparation engines.
- CFO/voice/AI orchestration and proposal-first workflow foundations.
- Audit event model, approvals, role checks and tenant_id fields across business models.
- PostgreSQL schema/migration starter files and Docker Compose.
- A v0.37 readiness registry and historical version changelogs.

The archive's own architecture document describes the package as a mobile-first/PWA prototype and states that production still needs a real backend/database deployment, authentication hardening, official tax/insurance rules and integrations. The Android README in the same archive is stale (v0.5) relative to the Gradle version 0.37.0.

## 4. Confirmed defects and release risks

1. **Insecure container defaults:** root `docker-compose.yml` hardcodes a PostgreSQL password and `JWT_SECRET=change-this-secret`; it does not set `APP_ENV=production`. The auth module only enforces the minimum JWT secret length when `APP_ENV=production`, so the sample Compose configuration can start with a known signing secret.
2. **JWT lifecycle:** tokens are HS256 bearer tokens with a 12-hour expiry. No token identifier/session record, revocation flow, refresh rotation, MFA or email-verification gate was found in the inspected auth implementation.
3. **Readiness endpoint path defect:** `backend/app/services/system_readiness.py` calculates assets under `ROOT.parent / app / src / ...`. In the extracted project this resolves outside the project. A direct invocation from the backend working directory imported all 16 modules successfully but incorrectly reported all 11 UI assets as MISSING.
4. **Version mismatch:** FastAPI is declared as version `0.37.0`, while `GET /health` returns `0.34.0`.
5. **Schema lifecycle:** `init_db()` calls SQLAlchemy `Base.metadata.create_all` during module import. A reviewed Alembic migration chain and production migration/rollback process are not demonstrated by the archive.
6. **Tenant security:** business models carry `tenant_id` and several critical services filter by tenant, but there is no database RLS/policy proof in this archive. Every route and service must be audited for tenant-scoped reads/writes, exports, joins and object access before production.
7. **Financial concurrency/idempotency:** several journal-number paths calculate `max(entry_no)+1`; production uniqueness, concurrency serialization and client-operation idempotency must be proven. A passing unit suite is not proof against duplicate concurrent financial postings.
8. **Operational integrations:** official tax/insurance sources, payment gateway, email/SMS, external accounting/banking, durable object storage, backup/restore, monitoring and production credentials are not verified.
9. **Android release:** an Android Gradle project exists, but no wrapper, build artifact or device acceptance evidence is included. No signed APK/AAB is present.

## 5. Required engineering work before ARIANA can be VERIFIED

- Establish a canonical private Git repository and import this exact archive with its SHA-256 recorded; preserve the original archive.
- Fix Compose secrets so production cannot start with a known JWT secret; fail closed on missing/placeholder secrets.
- Implement server-side session lifecycle, MFA for privileged roles, account verification/recovery, rate limiting and audit events.
- Reconcile all tenant-owned routes and queries; implement database-level tenant isolation or prove an equally strong reviewed boundary using dedicated non-owner roles.
- Fix the readiness path and version reporting; add tests that call the readiness endpoint from the deployed runtime.
- Replace import-time schema creation with reviewed versioned migrations and forward/rollback tests.
- Add financial idempotency keys, uniqueness constraints and concurrent posting tests around journal numbering and stock/balance changes.
- Validate current Iranian tax/insurance rules against official sources and obtain domain review before treating calculations as authoritative.
- Build Android with a pinned Gradle wrapper and SDK, run on real devices, and sign through protected release secrets.
- Configure production hosting, database, email, payment sandbox, monitoring, encrypted off-provider backups and isolated restore.
- Complete UAT and legal/privacy review.

**Disposition: SOURCE ARCHIVE LOCATED — 89 TESTS PASS IN ISOLATED WORKSPACE — SECURITY/PRODUCTION/MOBILE RELEASE NOT VERIFIED — NOT RELEASED.**


## 6. Isolated hardening patch produced after the source audit

A separate candidate archive was created from the located v0.37 source without modifying the original Library archive:

- Candidate: `ARIANA_v0.37.1_hardened_source.zip`
- Candidate ZIP reopened and integrity-checked successfully.
- Candidate artifact contains 208 source/documentation entries; no APK/AAB is included.
- Verification was repeated against the extracted candidate artifact: **94 tests passed**, all bundled JavaScript syntax checks passed, and Python compile checks passed.
- Runtime readiness check from the backend working directory: **16/16 modules READY and 11/11 UI assets READY**.

Changes in the candidate:
- Fixed readiness asset path resolution.
- Aligned backend health/version metadata and Android package metadata to v0.37.1 / versionCode 38.
- Added a dependency-free production JWT secret validator that rejects missing, short and known placeholder secrets.
- Production database config now refuses SQLite fallback and requires PostgreSQL.
- Reworked Docker Compose to require protected database/JWT environment values, avoid baked-in credentials, keep PostgreSQL off the host-published ports, bind API to loopback and wait for database health.
- Added regression tests for each correction and refreshed the Android deployment note.

**Important boundary:** this is an isolated candidate archive, not a GitHub commit, canonical repository update, production deployment or Android release. The original v0.37 Library archive remains unchanged. Do not deploy this candidate until the remaining migration/session/MFA/tenant/financial/backup and Android gates are closed.


## Re-verification of the Library archive (2026-11-09)
- Original source archive: `ariaana_android_app_v37_hardened_integrated.zip`
- Original SHA-256: `a9a4146a57e899c04939728bc9669d81145d8a6f8789b7e8a807ff08e3fa6ccb`
- Original size: 660,622 bytes; ZIP integrity passed.
- Isolated hardened candidate: `ARIANA_v0.37.1_hardened_source.zip`
- Candidate SHA-256: `0a19f5e8976d2d1bbcbf6e3a43d0d768bfcb41bd0ab3878fb755264018ce112c`
- Candidate size: 334,192 bytes; ZIP integrity passed.
- Re-extracted candidate verification: `python -m pytest -q` — **94 passed**; `python -m compileall -q backend` — PASS.
- Android build is still not verified: this environment has no system Gradle, Gradle wrapper JAR, or Android SDK. No APK/AAB is present in the source archive.
- The candidate is a local isolated artifact, not yet imported into a canonical ARIANA Git repository and not deployed. The current backend remains a prototype until database migrations, production authentication/session policy, tenant isolation, backup/restore, and external service integrations are operationally verified.
