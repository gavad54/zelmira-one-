# VAYRO and product-family release audit — 2026-11-09

## Scope

This is a source, CI, and live infrastructure audit. It records verified state and does not declare the portfolio released.

- Mother app: VAYRO.
- Eight VAYRO product-family apps: ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM, DANA.
- Three independent child apps: LEADORA, ARIANA, ARIA.
- ARIA remains separate from accounting/ERP. Accounting and ERP remain in ARIANA.
- Main repository: `gavad54/zelmira-one-`.
- PR #2 (mother brand/product-family baseline): merged into `main` as commit `4e98a25503f94c2dc5d4ebc11a804f64d6568d5c`.
- PR #6 (security/MFA/session/tenant isolation/product catalog): open, ready for review, base `main`, latest head `ba3da559655b40f7680402f839726c06f1a5c5f3`; not merged. VAYRO CI and CodeQL for this exact head were still running at the time of this audit.
- The security branch's current file tree includes the same 132-file security/product foundation as the previously tested source, plus the latest 11-product directory, owner dashboard and documentation updates.

## VAYRO application code

Implemented in the current PR #6 branch:
- MFA/TOTP enrollment and verification, recovery codes and replay protection.
- Session lifecycle, idle/absolute expiry, revoke-one/revoke-all and MFA assurance.
- Server-side endpoint authorization and owner/platform role boundaries.
- Tenant request authorization and RLS migrations/tests.
- DANA and NEGAH structured workflow surfaces and provider adapters.
- Owner product-catalog initialization for all eleven child applications.
- The homepage now shows all eleven products with honest delivery states; only DANA and NEGAH are marked prototype, six VAYRO products remain planned, and the three independent products are marked blocked pending their separate release evidence.
- The owner dashboard count and catalog initialization text now use eleven, not the obsolete eight-product count.
- A dedicated product-directory test asserts all eleven product names, unique IDs and non-active delivery states.

The homepage directory is a product/status catalogue, not proof that the eleven applications are all feature-complete.

## VAYRO CI and security checks

- The earlier security source head `e086e1870e4dc9f171add890d74d6d0cf1e64f18` passed VAYRO CI and CodeQL.
- The clean integration commit `b88c8efaf9e203736bd38ba5c44e45bc6d4ad998` had an identical Git tree to that previously tested source.
- Latest exact head `ba3da559655b40f7680402f839726c06f1a5c5f3`: VAYRO CI and CodeQL were still running at audit time. Do not mark these latest checks passed until they complete.
- CI's isolated PostgreSQL tests are not production database evidence.

## VAYRO hosting and live database

Railway:
- The Railway workspace exposes a project named `ARIA Web` containing a `VAYRO` service and a separate `Postgres` service. The VAYRO service has public domain `vayro-production.up.railway.app`.
- The VAYRO service source is `gavad54/zelmira-one-`, branch `security/mfa-session-endpoint-gates`.
- The application service currently exposes Railway system variables only. No `DATABASE_URL`, `AUTH_DATABASE_URL`, `PLATFORM_DATABASE_URL`, or `MIGRATION_DATABASE_URL` is configured.
- The last successful deployment before the latest build was commit `2bfe5df2c9153f48e431a0ef953a7a57d8e68edd`. A new deployment for `ba3da559655b40f7680402f839726c06f1a5c5f3` was building at audit time.
- The service healthcheck configuration has been changed from liveness-only `/api/health` to readiness `/api/ready`. The setting applies on the next deployment; because database runtime URLs are absent, the new readiness check is expected to block promotion until the DB access path is configured.
- A second VAYRO-named service exists inside the LEADORA Railway project without a public domain or application variables; it is not the dedicated VAYRO deployment.

Supabase VAYRO-CORE:
- Project `wdqhdnhpgxhmmfeyxwxr`, region `eu-central-1`, PostgreSQL 17.11, previously reported `ACTIVE_HEALTHY`.
- Live catalog audit: 11 public tables, RLS enabled on all 11, zero policies, zero FORCE RLS, no VAYRO runtime roles, and no Prisma migration history. The observed tables were empty at the last catalog snapshot.
- `postgres` and `service_role` have BYPASSRLS and are not acceptable general application runtime identities.
- The production schema does not yet match the current Prisma migration history. No production migration or grants were applied.

**VAYRO production disposition:** no verified production DB connection, migration history, least-privilege runtime roles, tenant policies, or live end-to-end auth. The readiness healthcheck is now configured to fail closed on the next deploy.

## LEADORA

- Repository: `gavad54/LEADORA`.
- PR #50 (independent product/database boundary documentation) was merged.
- PR #46 remains open at head `5492218f2a05e3d95af0751fad5056f42000f8f4`.
- Exact-head LEADORA CI, regression/security tests, and Android test APK workflow completed successfully.
- Android emulator evidence: APK installed and launched on API 30; WebView produced visible DOM text and screenshot; no fatal runtime exception was detected.
- Test APK: 14,586 bytes, SHA-256 `0f54d52aee36fbf1021a0f2e107a336a9950ac508329fbd1d9c8250c5f396d70`. It is a debug/test WebView wrapper, not a signed commercial APK.
- Production smoke: API health returned `database=ok`, but the currently deployed homepage lacks the required public-home DOM contract, hidden auth/workspace state and startup public-home rendering. The live Railway deployment remains on commit `7d92398a8e8e9b457fdfbf5f4dd1b75250506df7`.
- The PR build workflow was separated from test-artifact publication; publishing a debug test APK now requires explicit manual dispatch. The signed commercial release workflow requires protected keystore secrets and a passing production homepage gate.
- No LEADORA production deployment, signing-key operation, database backup or restore was performed.

## ARIA

- Current web repository: `gavad54/aria-android`; PR #1 was merged and the web CI on main completed successfully.
- The separate Library Android source archive is ARIA 32.0.0, SHA-256 `9dcbb34ef98e4f11e661bd32bbd0573d4de7a3058743f45aa126322f44264f9f`, 503 ZIP entries.
- An isolated static-gate-repaired candidate was created: `ARIA_32.0.0_STATIC_GATE_REPAIRED_CANDIDATE.zip`, SHA-256 `97cf5d9e1c3e9b3446861bc848ccfa8c682940d6d59b85655917c6412a8ce02a`.
- Candidate static checks passed: 639-module registry, R9 gate, capability matrix, backend JS syntax, static schema check (201 declared tables), and corrected backend quality gate.
- No APK/AAB is included; no Android build, official signing, device UAT, live DB migration, production integration or store publication was verified.
- The Android workflow is pinned to the repaired candidate hash but the binary source archive is not yet present in the GitHub repository's `release-input` directory. The connected GitHub tools do not expose binary upload.

## ARIANA

- Source archive: `ariaana_android_app_v37_hardened_integrated.zip`, SHA-256 `a9a4146a57e899c04939728bc9669d81145d8a6f8789b7e8a807ff08e3fa6ccb`.
- Isolated hardened candidate: `ARIANA_v0.37.1_HARDENED_CANDIDATE.zip`, SHA-256 `26d0f5fcf77c9174489f800d2faa5fed34976a6537a96838119858030864c3d8`.
- Candidate verification: 94 pytest tests passed; Python backend compile check passed; ZIP integrity passed.
- No canonical ARIANA Git repository, Android build toolchain, APK/AAB, device acceptance, live database migrations, production auth/session configuration, tenant isolation, backup/restore or provider integrations were verified.
- Accounting/ERP remains isolated in ARIANA, not ARIA.

## Release blockers

| Area | Required evidence | State |
|---|---|---|
| VAYRO-CORE production schema | Independent backup, isolated restore, schema drift comparison, reviewed forward/rollback migration rehearsal | BLOCKED |
| VAYRO DB runtime roles | Dedicated auth/platform/tenant login identities, least-privilege grants and connection-level assertions | BLOCKED |
| Tenant isolation | RLS policies and FORCE RLS for all tenant-owned tables; cross-tenant negative tests on restored production clone | BLOCKED |
| VAYRO hosting | DB runtime URLs, readiness health, monitored deployment on a dedicated VAYRO environment | BLOCKED |
| Backup/DR | Encrypted off-provider backup, checksum, isolated restore, measured RPO/RTO | BLOCKED |
| Email | Verified sender/provider, delivery/retry/bounce/abuse tests | BLOCKED |
| AI services | Real provider secrets, metering, per-tenant quotas/cost limits, private output storage and retention | BLOCKED |
| Payments | Entitlements, append-only ledger, sandbox payment lifecycle, idempotent webhooks, refunds/reconciliation | BLOCKED |
| ARVAND/CHARSU/GANJINEH/SEPEHR/NAMA/PAYAM | Complete product MVPs, APIs, persistence, authorization, negative tests, UAT | BLOCKED |
| DANA/NEGAH | Provider configuration, persistence, usage ledger, quota, end-to-end acceptance | BLOCKED |
| ARIA/ARIANA mobile | Canonical source import, Android build, signed artifact, device UAT, release publication | BLOCKED |
| LEADORA production | Public-home smoke gate, backup/restore, UAT, official signing and controlled deployment | BLOCKED |
| Legal/security review | Privacy/terms/data retention, CSP/headers, independent security review, risk acceptance | BLOCKED |

## Release decision

`DEPLOYMENT BLOCKED — NOT RELEASED`.

No production database migration, role/grant or RLS write, backup/restore, public deployment, domain change, payment activation or app-store publication was performed. The changes above are repository, candidate-source, CI and readiness-gate work only.
