# VAYRO family — engineering evidence snapshot
Date: 2026-11-25
Scope: reference PRs #47, #3, #1, #54 and #2; connected Railway projects; Supabase VAYRO-CORE; Cloudflare R2 availability.
This is a read-only production/infrastructure audit plus development-branch CI maintenance. It is not a release approval.

## 1. Exact pull-request heads

All five reference PRs are **OPEN / DRAFT / UNMERGED**. No merge was performed.

| Product | PR | Base ← head | Exact head SHA | Commits | Changed files |
|---|---:|---|---|---:|---:|
| VAYRO | [#47](https://github.com/gavad54/zelmira-one-/pull/47) | `main` ← `upgrade/full-independent-product-family-modules-2026-11-20` | `909e7f147d1b4fb78b1b59207af9c3568a803b26` | 160 | 59 |
| ARIA | [#3](https://github.com/gavad54/aria-android/pull/3) | `engineering/aria-functional-redesign-2026-11-19` ← `engineering/aria-preserve-all-capabilities-2026-11-19` | `392c55d981af5a9ff2eccf01c68ecce256d28459` | 1498 | 356 |
| ARIANA | [#1](https://github.com/gavad54/ARIANA/pull/1) | `main` ← `engineering/ariana-v0.38-standalone-bootstrap` | `b0b80c8f7bf595961c4a7aaeb51216c5d1ab6852` | 28 | 12 |
| LEADORA | [#54](https://github.com/gavad54/LEADORA/pull/54) | `main` ← `fix/disable-participation-contracts-2026-11-20` | `22de5ef401d567118dcc697bdfe61b74bfd34fcd` | 20 | 13 |
| ARMIN MARKET | [#2](https://github.com/gavad54/Armin_market/pull/2) | `main` ← `architecture/market-intelligence-integration-2026-11-19` | `4101cffa36a26b42625928c9f7c99318f76f1d0a` | 27 | 12 |

## 2. Exact-SHA CI and security evidence

| Product | Run evidence | Result on the exact SHA above |
|---|---|---|
| VAYRO | [CI 45540519910](https://github.com/gavad54/zelmira-one-/actions/runs/45540519910), [CodeQL 45540519678](https://github.com/gavad54/zelmira-one-/actions/runs/45540519678), [lockfile 45540519714](https://github.com/gavad54/zelmira-one-/actions/runs/45540519714) | PASS: 137/137 unit tests and 30/30 PostgreSQL/HTTP integration tests; isolated migration, schema/RLS/role, dependency-gated task claim and worker lease-recovery checks; lint, typecheck, production/Docker builds. CodeQL and lockfile validation PASS. |
| ARIA | [CI 45592771472](https://github.com/gavad54/aria-android/actions/runs/45592771472), [web catalog 45592771532](https://github.com/gavad54/aria-android/actions/runs/45592771532), [CodeQL 45592771491](https://github.com/gavad54/aria-android/actions/runs/45592771491) | PASS: 984/984 tests, zero failed; web catalog integrity/API checks PASS; CodeQL PASS. |
| ARIANA | [CI 45592776772](https://github.com/gavad54/ARIANA/actions/runs/45592776772), [CodeQL 45592776764](https://github.com/gavad54/ARIANA/actions/runs/45592776764) | PASS: 9/9 focused JWT configuration tests; `pip-audit` reported no known vulnerabilities; CodeQL PASS. This is still bootstrap CI, not the full accounting application suite. |
| LEADORA | [CI 45592572048](https://github.com/gavad54/LEADORA/actions/runs/45592572048), [regression/security 45592572038](https://github.com/gavad54/LEADORA/actions/runs/45592572038), [Android test APK 45592572147](https://github.com/gavad54/LEADORA/actions/runs/45592572147), [CodeQL 45592572045](https://github.com/gavad54/LEADORA/actions/runs/45592572045) | PASS: 102 Python tests; regression/security suite and `pip-audit` PASS (no known vulnerabilities); both Compose configurations validated; Docker image build, Android debug APK packaging and CodeQL PASS. One Starlette/httpx deprecation warning remains. |
| ARMIN MARKET | [Android workflow 45592931348](https://github.com/gavad54/Armin_market/actions/runs/45592931348), [CodeQL 45592931330](https://github.com/gavad54/Armin_market/actions/runs/45592931330) | Build job PASS: domain unit tests, debug APK build and artifact upload succeeded. CodeQL PASS. Overall Android workflow remains FAIL because the separate Dependency Review job cannot run while GitHub Dependency Graph is disabled; this is a repository-setting blocker, not a reported package vulnerability. Artifact ID `15011099964`, ZIP size 9,170,917 bytes, artifact SHA-256 `c4e7c3d55dc49bc099f975aa7e4691c3204776af4983f59bbff27f0e4bf7542f`. |

## 3. Development-branch changes made

- **LEADORA:** CI now validates both `compose.yaml` and `docker-compose.yml` explicitly; regression/security workflow uses `actions/checkout@v5` and `actions/setup-python@v6`. Exact-head CI and regression/security runs passed.
- **ARIA:** CodeQL checkout action upgraded from v4 to v5. Exact-head CI, catalog checks and CodeQL passed.
- **ARIANA:** CodeQL checkout action upgraded from v4 to v5. Exact-head security tests, dependency audit and CodeQL passed.
- **ARMIN MARKET:** Android and CodeQL workflows use checkout v5, setup-java v5 and upload-artifact v5. Build and CodeQL passed; Dependency Review still correctly fails closed pending the owner setting.
- **VAYRO:** no source change in this run; current exact-head CI/CodeQL/lockfile evidence was rechecked.

No production configuration, secrets, DNS, database schema/data, permissions, deployments or PR merge state was changed.

## 4. Railway — live read-only inventory

The connected Railway account exposes only two projects:

- **ARIA Web**, production environment `468fda02-2199-4520-8c7e-6b589d3ceb0a`.
  - Service **VAYRO** (`ea06b2d7-b28e-462e-9251-2613af769d8e`) sources `gavad54/zelmira-one-` branch `main`; latest deployment `6354aa02-a334-4457-a46d-5f41188845a5` is **FAILED**. Build completed, but readiness endpoint `/api/ready` returned HTTP 503 throughout the healthcheck retry window. Domain `vayro-production.up.railway.app` exists. No volume is attached.
  - A separate service remains **STAGED, not live**: branch `brand/vayro-name-only`, commit `6602c54eea9312589129b79304c38e25c9d338c4`. The staged patch was not accepted.
- **LEADORA**, production environment `c3587e3a-9ff5-4749-bd91-2afdda4d5f77`.
  - Service **VAYRO** (`cfe90ccf-580f-48fc-a984-17aa071a4f2a`) sources `security/mfa-session-endpoint-gates` at `47792d4a891795d60a4b65c11c4a4ffb8cab2f74`; latest deployment `f2f67daf-5d15-4dc1-91e2-3596fe521d6d` is **FAILED** during image build. The build log identifies missing `AUTH_DATABASE_URL` as the cause. No public domain or volume is attached.
  - Service **leadora-web** (`13aa3d75-48b6-4ad1-8064-a7846ffe6739`) sources `gavad54/LEADORA` branch `main` at `7d92398a8e8e9b457fdfbf5f4dd1b75250506df7`. Runtime status is **OFFLINE** and no latest deployment record is returned. The live 500 MB volume `leadora-data` is mounted at `/data`; domain `leadora-web-production.up.railway.app` exists.

Railway environment status reports all three live service entries offline. HTTP telemetry returned zero requests/samples for the last 24 hours; separate external HTTP opens were inaccessible from the inspection runtime, so public reachability is **UNVERIFIED**. No webhooks were returned. Monitor inspection is unavailable because Railway Automations is not enabled. No staged change was committed and no variable values were read.

## 5. Supabase VAYRO-CORE — live read-only audit

Project `wdqhdnhpgxhmmfeyxwxr` is `ACTIVE_HEALTHY`, PostgreSQL 17.11, region `eu-central-1`.

- 11 public application tables; the table inventory reports zero rows in each.
- RLS enabled on all 11 tables; **zero policies**; `FORCE ROW LEVEL SECURITY` disabled on all 11.
- Supabase migration history is empty.
- No dedicated `vayro_*`, `platform_*`, `auth_*` or `task_*` application runtime roles were found in the filtered role inspection.
- Security Advisor: 11 `rls_enabled_no_policy` findings.
- Performance Advisor: 10 unused-index findings; no indexes were dropped.
- Health Advisor: no findings.
- Seven repository Prisma model tables remain absent from the live 11-table catalog: `UserMfa`, `MfaRecoveryCode`, `AuthChallenge`, `AiGeneration`, `EngineeringTask`, `EngineeringTaskAttempt`, `EngineeringTaskDependency`.

RLS enabled with no policies is a configuration gap; it is not, by itself, proof of public read access. No SQL write, DDL, DML, migration, grant, role or policy change was performed.

## 6. Off-site backup and runtime independence

A read-only Cloudflare R2 bucket-list request returned HTTP 403, error 10042: **R2 must be enabled through the Cloudflare Dashboard**. No bucket, credential, encrypted backup object, checksum-verified backup or isolated restore artifact exists.

VAYRO's development branch contains a durable task queue and worker code, with isolated PostgreSQL tests for leases, retry, dependency gating and stale-worker fencing. However:
- no dedicated VAYRO Railway project/worker service is running;
- the task-engine migration is not applied to VAYRO-CORE;
- the worker runtime credential is not provisioned;
- no actual deployed process restart drill or recurring external scheduler is proven.

ChatGPT scheduled inspections are not a permanent Worker or independent scheduler.

## 7. Product boundaries and WAITING_FOR_OWNER

- DANA remains an internal VAYRO coordination capability, not an independent product.
- ARIA remains without accounting/ERP; ARIANA owns accounting/ERP/tax; LEADORA owns distribution/operations.
- ARVAND, CHARSU, GANJINEH, SEPEHR, NAMA and PAYAM remain planned; NEGAH remains a prototype. No independent repository/runtime/E2E evidence was found for those modules.
- ARIANA's repository remains a bootstrap; the complete accounting application archive is not imported. No full-app runtime or PostgreSQL acceptance is claimed.
- ARMIN MARKET remains an offline UI/demo prototype; no production marketplace backend, seller/order/payment lifecycle or device UAT is established.

**WAITING_FOR_OWNER**
1. Enable GitHub Dependency Graph for ARMIN MARKET, then rerun Dependency Review.
2. Enable Cloudflare R2 if approved, then provision a private bucket and owner-controlled least-privilege credentials; perform backup and restore only with a separate-host isolated target.
3. Approve the dedicated VAYRO Railway project/service and protected runtime-variable configuration after isolated role-boundary tests.
4. Approve a reviewed VAYRO-CORE schema/role/RLS reconciliation plan only after off-site backup and isolated restore evidence.
5. Surface/confirm the complete ARIANA source archive for additive import and full-suite verification.

**Decision:** development CI is green for VAYRO, ARIA, ARIANA and LEADORA on the exact heads listed above. ARMIN's build and CodeQL pass, but its overall workflow remains blocked by Dependency Graph configuration. Production hosting, live database reconciliation, off-site backup/restore, native-device UAT and commercial release remain blocked.


## Live verification addendum — 2026-11-25 20:01 UTC

This addendum supersedes earlier VAYRO PR-head and live-infrastructure observations in this file where they conflict.

### Exact VAYRO repository head

- PR #47 is **OPEN / DRAFT / UNMERGED**. Exact head: `2f973b3d23aa13469bb27f245f565c89852f88e0`.
- VAYRO CI [45647054177](https://github.com/gavad54/zelmira-one-/actions/runs/45647054177): **SUCCESS**.
- Duplicate VAYRO CI [45647045728](https://github.com/gavad54/zelmira-one-/actions/runs/45647045728): **SUCCESS**.
- CodeQL [45647054199](https://github.com/gavad54/zelmira-one-/actions/runs/45647054199): **SUCCESS**.
- npm lockfile validation [45647054527](https://github.com/gavad54/zelmira-one-/actions/runs/45647054527): **SUCCESS**.
- All four workflow runs identify the exact SHA above. These results establish repository/CI checks only, not deployment or production acceptance.

### Railway — fresh read-only inventory

- The connected Railway workspace currently lists exactly two projects: **ARIA Web** and **LEADORA**. There is **no dedicated VAYRO project**.
- In **ARIA Web / production**, the live service named VAYRO sources `gavad54/zelmira-one-` on `main`; its latest deployment `6354aa02-a334-4457-a46d-5f41188845a5` is **FAILED**. The service has no attached volume. Environment status reports it **OFFLINE**.
- The ARIA Web environment also has a pending staged patch containing a staged-create service sourced from `brand/vayro-name-only`. It is not live and was not accepted or deployed.
- In **LEADORA / production**, the second service named VAYRO sources `gavad54/zelmira-one-` on `security/mfa-session-endpoint-gates`; latest deployment `f2f67daf-5d15-4dc1-91e2-3596fe521d6d` is **FAILED** and environment status reports **OFFLINE**.
- LEADORA's own web service is also reported **OFFLINE**. Its existing `leadora-data` volume remains attached only to the LEADORA service.
- No staged Railway changes were accepted, no variables or secret values were read, and no deploy, rollback, volume or project mutation was performed.

### VAYRO-CORE — fresh read-only database inspection

- Supabase project `VAYRO-CORE` (`wdqhdnhpgxhmmfeyxwxr`) reports **ACTIVE_HEALTHY**, PostgreSQL **17.11.0.018**, region `eu-central-1`.
- The live `public` schema contains **11 tables**; the table inventory reports **zero rows** in each.
- All 11 tables have RLS enabled; **0 policies** and **0 FORCE RLS** tables were found in the live catalog.
- No `vayro%` database roles were found. The inspected catalog also returned **0 table grants** to `anon`, `authenticated` or `service_role`.
- Supabase migration history is **empty**.
- Security Advisor reports **11** `rls_enabled_no_policy` findings. Performance Advisor reports **10** unused-index findings; with the inspected tables empty, these are not grounds to drop indexes. Health Advisor returned **no findings**.
- RLS enabled without policies is fail-closed for roles subject to RLS; it is not evidence of public read access. However, the absence of the migration ledger, dedicated roles and policies means production application access is not ready.
- All database inspection was read-only. No DDL, DML, migration, role, grant, policy, credential or data change was performed.

### Current operational decision

**REPOSITORY CI / CODEQL / LOCKFILE: PASS ON EXACT SHA — PRODUCTION HOSTING: BLOCKED — LIVE DATABASE BASELINE / ROLES / POLICIES: BLOCKED — BACKUP / RESTORE: UNVERIFIED — NOT RELEASED.**

The next safe sequence is: obtain an owner-approved independent backup destination, complete a checksum-verified encrypted backup and isolated restore, reconcile the restored live catalog against the repository migrations, then prepare a reviewed role/policy/migration plan. Do not apply live migrations or reuse ARIA/LEADORA infrastructure.


## Live verification addendum — 2026-11-26 05:15 UTC

### VAYRO repository
- PR #47 remains OPEN / DRAFT / UNMERGED at exact head `c1dc326d7dd483cafb67b5fc769ca90ee6e8a485`.
- VAYRO CI [45691131869](https://github.com/gavad54/zelmira-one-/actions/runs/45691131869): SUCCESS; duplicate CI [45691118417](https://github.com/gavad54/zelmira-one-/actions/runs/45691118417): SUCCESS.
- CodeQL [45691132030](https://github.com/gavad54/zelmira-one-/actions/runs/45691132030): SUCCESS.
- npm lockfile validation [45691131853](https://github.com/gavad54/zelmira-one-/actions/runs/45691131853): SUCCESS.

### Fresh Railway status
- Connected workspace lists only ARIA Web and LEADORA; there is no independent VAYRO project.
- ARIA Web production VAYRO service is OFFLINE and has no attached volume. A staged environment patch remains pending and was not accepted.
- LEADORA production VAYRO service is OFFLINE and has no attached volume. LEADORA web is also OFFLINE; its existing data volume remains attached only to that service.
- No service was restarted, deployed, reconfigured or repurposed.

### Fresh VAYRO-CORE catalog status
Read-only catalog query returned: 11 public tables; 11 RLS-enabled; 0 FORCE RLS; 0 policies; 0 `vayro%` roles; 0 migration-history tables. Supabase project status remains ACTIVE_HEALTHY. No DDL, DML, grants, policies, roles or migration changes were made.

**Current decision: SOURCE CI / CODEQL / LOCKFILE PASS ON EXACT SHA — RAILWAY HOSTING OFFLINE — LIVE DATABASE BASELINE / SECURITY CONFIGURATION BLOCKED — BACKUP / RESTORE UNVERIFIED — NOT RELEASED.**
