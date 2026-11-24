# Family Engineering Evidence — 2026-11-24

Observation window: 2026-11-24 10:02–10:08 UTC  
Scope: five reference pull requests, connected Railway projects, and Supabase VAYRO-CORE.  
This is an evidence snapshot, not a release approval or a claim of production readiness.

## GitHub pull requests and exact heads

| Product | PR | Base ← head | Exact head SHA | PR state | Changed files |
|---|---:|---|---|---|---:|
| VAYRO | [#47](https://github.com/gavad54/zelmira-one-/pull/47) | `main` ← `upgrade/full-independent-product-family-modules-2026-11-20` | `9b88def1959a06405b60ee1df2b326e01dfdfc96` | open, Draft, unmerged | 55 |
| ARIA | [#3](https://github.com/gavad54/aria-android/pull/3) | `engineering/aria-functional-redesign-2026-11-19` ← `engineering/aria-preserve-all-capabilities-2026-11-19` | `fe596a8f77cd02feced32741c2285c01941d54d6` | open, Draft, unmerged | 100 |
| ARIANA | [#1](https://github.com/gavad54/ARIANA/pull/1) | `main` ← `engineering/ariana-v0.38-standalone-bootstrap` | `49171795aba248118b365f7f16a3e602c998d9a2` | open, Draft, unmerged | 11 |
| LEADORA | [#54](https://github.com/gavad54/LEADORA/pull/54) | `main` ← `fix/disable-participation-contracts-2026-11-20` | `6efd6cac6eae2021483c0f3ecd683791ab39b97a` | open, Draft, unmerged | 10 |
| ARMIN MARKET | [#2](https://github.com/gavad54/Armin_market/pull/2) | `main` ← `architecture/market-intelligence-integration-2026-11-19` | `6b0c66432488667569afc2bd10cf4c59acf3d3a5` | open, Draft, unmerged | 11 |

All checks below are tied to the exact head SHA shown above; they do not establish production health.

## CI, CodeQL and dependency audit

| Product | Exact-head evidence | Result |
|---|---|---|
| VAYRO | [Push CI run 45370932019](https://github.com/gavad54/zelmira-one-/actions/runs/45370932019) | PASS. Includes `npm audit --audit-level=moderate`, unit tests, Prisma validation, disposable PostgreSQL migrations, RLS/role checks, task dependency and lease-recovery SQL tests, lint, typecheck, production build, Docker build and HTTP integration tests. |
| VAYRO | [PR CI run 45370938684](https://github.com/gavad54/zelmira-one-/actions/runs/45370938684); [CodeQL run 45370938513](https://github.com/gavad54/zelmira-one-/actions/runs/45370938513); [lockfile validation 45370938509](https://github.com/gavad54/zelmira-one-/actions/runs/45370938509) | PR CI was pending and CodeQL in progress at observation time; lockfile validation PASS. The successful push run does not turn the pending PR run or CodeQL into PASS. |
| ARIA | [PR CI 45369785132](https://github.com/gavad54/aria-android/actions/runs/45369785132); [web catalog 45369785182](https://github.com/gavad54/aria-android/actions/runs/45369785182); [CodeQL 45369785467](https://github.com/gavad54/aria-android/actions/runs/45369785467) | PASS. CI includes production dependency `npm audit --omit=dev`. The separate Android archive build was not part of these exact-head PR checks; Android device/release signing remains unverified. |
| ARIANA | [CI 45369928669](https://github.com/gavad54/ARIANA/actions/runs/45369928669); [CodeQL 45369928691](https://github.com/gavad54/ARIANA/actions/runs/45369928691) | PASS. CI includes `pip-audit` and authentication configuration tests. |
| LEADORA | [CI 45369535541](https://github.com/gavad54/LEADORA/actions/runs/45369535541); [regression/security 45369535520](https://github.com/gavad54/LEADORA/actions/runs/45369535520); [CodeQL 45369535529](https://github.com/gavad54/LEADORA/actions/runs/45369535529) | PASS. Regression/security workflow includes `pip-audit`, Python tests and browser regression tests. |
| ARMIN MARKET | [Android build workflow 45370414494](https://github.com/gavad54/Armin_market/actions/runs/45370414494); [CodeQL 45370414555](https://github.com/gavad54/Armin_market/actions/runs/45370414555) | Android domain tests and debug APK build PASS; CodeQL PASS. The separate dependency-review job FAILS because GitHub reports that Dependency Graph is not enabled for this repository. This is a repository-setting blocker, not a reported vulnerable package. Mark dependency review WAITING_FOR_OWNER; do not convert it to a false PASS. |

## Railway — read-only observation

Connected account exposes two projects only: `ARIA Web` and `LEADORA`; no separately named VAYRO project is visible.

- **ARIA Web / production / service `VAYRO`:** sourced from `gavad54/zelmira-one-` branch `main`; latest deployment `6354aa02-a334-4457-a46d-5f41188845a5` is FAILED at HEALTHCHECK (path `/api/health`, 2026-11-09); environment status is Offline. The domain `vayro-production.up.railway.app` exists. A separate service creation remains STAGED, sourced from branch `brand/vayro-name-only` at `6602c54eea9312589129b79304c38e25c9d338c4`; it is not live and was not deployed.
- **LEADORA / production / service `VAYRO`:** sourced from the VAYRO repository branch `security/mfa-session-endpoint-gates`; latest deployment `f2f67daf-5d15-4dc1-91e2-3596fe521d6d` is FAILED at BUILD_IMAGE (2026-11-09); environment status is Offline; no service domain was returned.
- **LEADORA / production / service `leadora-web`:** sourced from `gavad54/LEADORA` branch `main`; Offline, with no latest deployment record returned. A live 500 MB volume `leadora-data` is mounted at `/data`; domain `leadora-web-production.up.railway.app` exists.
- Railway HTTP telemetry returned zero requests and zero samples for each of the three services over the last 24 hours. This is not proof that an endpoint is reachable. A separate direct probe could not resolve Railway hostnames from the inspection runtime, so external HTTP reachability is UNVERIFIED.
- Project webhooks: none returned. Monitor inspection: UNVERIFIED because the connected Railway account reports that Railway Automations is not enabled.

No staged Railway change was accepted; no deploy, restart, service edit, volume edit, or variable read was performed.

## Supabase VAYRO-CORE — read-only observation

Project `wdqhdnhpgxhmmfeyxwxr` returned `ACTIVE_HEALTHY`, PostgreSQL `17.11.0.018`, region `eu-central-1`.

| Check | Result |
|---|---:|
| Public application tables | 11 |
| Rows across the 11 public tables | 0 at query time |
| Public tables with RLS enabled | 11 |
| FORCE RLS | 0 |
| Public RLS policies | 0 |
| `vayro_%` runtime roles | 0 |
| Direct grants to PUBLIC / anon / authenticated on public tables | 0 in inspected grant view |
| Public foreign keys | 8 |
| Missing `AuditEvent_tenantId_fkey` | 1 |
| Public `_prisma_migrations` table | absent |
| Supabase migration registry | empty |

Security Advisor: 11 informational `rls_enabled_no_policy` findings. Performance Advisor: 10 `unused_index` findings. Health Advisor: no findings. No policy or index was changed; findings require table-by-table design review, not blanket remediation.

The task-engine tables, MFA additions and related enums present in the development branch are not present in the live public schema. No production SQL write, DDL, migration or data mutation was performed.

## Durable task-engine status

The VAYRO branch contains the PostgreSQL task/attempt migration, owner-only enqueue/list/approval APIs, deterministic goal planner, dependency graph, bounded worker loop, fixed handler registry, leases, heartbeats, retry/dead-letter transitions and least-privilege worker database boundary.

The exact-head CI run above passed the isolated PostgreSQL tests. The restart-recovery SQL test simulates process loss by expiring a lease and checking reclaim plus stale-worker fencing; it is **not** evidence of an actual worker process restart in a deployed runtime.

The worker is not deployed, `TASK_WORKER_DATABASE_URL` is not provisioned, and the task-engine migration is not applied to VAYRO-CORE. Thus the durable queue is implemented in the development branch but is not operational. The worker has only three approved handlers: deterministic report generation and read-only GitHub audit/test observation. Arbitrary shell execution, deployments, merges, migrations, billing and secret mutation are not supported.

The backup and isolated-restore workflows exist only on the unmerged VAYRO branch and are guarded for `main`. No encrypted off-site backup artifact, checksum evidence or successful isolated restore was observed.

## Change versus the previous stored VAYRO checkpoint

VAYRO PR #47 advanced from `5f53415f8b1a95cec2d2a250cd32582f03b96957` to `9b88def1959a06405b60ee1df2b326e01dfdfc96`. The current PR now includes the task-worker runtime, goal/owner task APIs, dependency/restart-recovery SQL tests and backup/restore workflow files. Exact prior head SHAs for the other four products were not retained in the previous checkpoint, so no numerical delta is asserted for them.

## Explicit non-claims

- No product is declared released or production-ready by this evidence.
- No independent VAYRO runtime, DANA worker, recurring external scheduler or cross-product parallel worker has been proven running.
- No live DB migration, production deploy, PR merge, backup/restore drill, Android device test or UAT is claimed.
- ChatGPT scheduled inspection is an audit/orchestration layer, not a permanent worker or an always-running scheduler.
---

## Fresh cross-repository re-verification — 2026-11-24

This section supersedes the earlier observation rows above where their heads, deployment records, or CI runs differ. Historical evidence is retained for audit lineage.

### Exact current PR heads and checks

| Product | PR | Exact current head | Fresh CI / security evidence | Current PR state |
|---|---:|---|---|---|
| VAYRO | #47 | e37b21c7979ab65cc3bc9f7f9786e47c27e84d1d | VAYRO CI PASS; CodeQL PASS; npm lockfile validation PASS | Open, Draft, unmerged |
| VAYRO dependency patch | #48 | 1d933290ae34def21f78ce265d5261727bfd8017 | VAYRO CI PASS; CodeQL PASS; npm lockfile validation PASS | Open, Draft, unmerged |
| ARIA | #3 | 387c6ad78100a5a187d50b423c49c0b6cadfe799 | ARIA CI PASS (984/984 tests); web catalog CI PASS; CodeQL PASS | Open, Draft, unmerged |
| ARIA duplicate TLS PR | #4 | 42260d4e617b66612e48c0f9c8f68b9487372e6d | Closed as superseded; TLS changes and regression coverage are in PR #3 | Closed, unmerged |
| ARIANA | #1 | 4bff9a8ee7575b8b4482cc6a8c83038785c271a9 | Latest source-audit doc commit added; exact-head CI/CodeQL rerun is required | Open, Draft, unmerged |
| LEADORA | #54 | e73e55605214a4f08a3e1585f3d20a1d0f06645a | New Android PR/push build workflow was added; exact-head runs are in progress | Open, Draft, unmerged |
| ARMIN MARKET | #2 | 6b0c66432488667569afc2bd10cf4c59acf3d3a5 | Android domain tests and debug APK build PASS; CodeQL PASS; Dependency Review FAIL because GitHub Dependency Graph is disabled | Open, Draft, unmerged |

#### Test evidence inspected

- VAYRO exact-head CI: 137/137 unit tests and 30/30 integration tests passed; 18 Prisma models reconciled against 13 migrations in disposable PostgreSQL; isolated catalog, RLS, auth/platform/worker role, task dependency and lease-recovery checks passed; lint, typecheck, Next.js production build and Docker build completed. One lint warning remains (createHash unused in one source file); it did not fail the gate. PostgreSQL test logs also contain serialization-conflict messages; the overall integration suite completed successfully.
- ARIA exact-head CI: 984/984 tests passed. The database TLS change requires the exact DATABASE_SSL=true opt-in, keeps certificate verification enabled, and normalizes escaped PEM line breaks. The Android archive workflow has not run and its source archive is absent from the repository.
- ARIANA archive was independently re-tested outside GitHub: 215 clean source files; ZIP integrity PASS; 95/95 pytest tests PASS; Python compileall PASS; 7 JavaScript/CommonJS syntax checks PASS. Exact archive SHA-256: 560597e85af9308bc21815a2642197d609d7c5e00b79b8c122d11d6616d7f6b2. The repository still contains only a 19-entry bootstrap tree; the tested archive is not imported. Version markers remain inconsistent: FastAPI metadata 0.37.0, health response 0.34.0, candidate README v0.38.
- LEADORA exact earlier PR head passed 102 Python tests and the Docker image build. The Android debug build workflow was changed to run on pull requests and on the verification branch, while publishing a test release only from main. New APK CI is in progress; this does not prove a real-device install or signed commercial release.
- ARMIN MARKET Android build job passed domain unit tests and produced a 9,170,917-byte debug APK, SHA-256 e350d0d33c4dd1f4bc1afab31060b1d9bada0496f17e9974c9c93232d1257c46. The overall workflow is red only because Dependency Review cannot run while Dependency Graph is disabled.

### Product-family implementation reality

The VAYRO portal currently registers seven planned sub-products: ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA and PAYAM. NEGAH is marked prototype requiring service integration; the other six are marked planned. DANA is a central VAYRO capability, not an independent product. The four independent product entries are LEADORA, ARIANA, ARIA and ARMIN MARKET; each is still marked blocked in the VAYRO directory.

The current VAYRO repository has 23 Next.js page routes, but that is not evidence of 11 complete independent applications. Separate data stores, authentication boundaries, APIs, deployments and end-to-end product acceptance remain required for each independent product. No separate live repositories/services were found in the connected deployment inventory for ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA or PAYAM.

ARIA's repository contains a large catalog/runtime and passes its 984-test contract/API suite, but its 191-adapter requirements inventory still marks provider implementation as NOT_MAPPED_TO_PROVIDER_IMPLEMENTATION; provider selection is not complete and the rows remain fail-closed/inactive pending provider, sandbox and E2E evidence. Contract/runtime tests must not be represented as live provider integrations.

### Fresh Railway observation

The connected Railway account still exposes only two projects: ARIA Web and LEADORA.

- ARIA Web / production / VAYRO: latest deployment 6354aa02-a334-4457-a46d-5f41188845a5 FAILED at healthcheck /api/health. The service has a public Railway domain, no live volume, and no variable names exposed in the current service configuration. In the last 168 hours the HTTP telemetry showed 52 responses in the 4xx class, zero 2xx, zero 3xx and zero 5xx; this does not prove application readiness. A staged Railway patch is still pending and was not accepted.
- LEADORA / production / VAYRO: latest deployment f2f67daf-5d15-4dc1-91e2-3596fe521d6d FAILED at image build. Its build log explicitly reports AUTH_DATABASE_URL is required in production while collecting page data for /api/auth/forgot-password. Current service configuration exposes no variable names and no public domain. The source branch/commit recorded by the failed deployment differs from the current service configuration; reconcile the deployment source before retrying.
- LEADORA / production / leadora-web: service domain and live 500 MB volume mounted at /data exist. No latest deployment or HTTP request samples were returned in the fresh inspection; runtime availability remains UNVERIFIED.
- Railway Automation/monitor tools are unavailable because Railway Automations is not enabled for this account.

No Railway configuration, secret, domain, volume, deployment or staged patch was changed.

### Fresh VAYRO-CORE and backup findings

A new read-only Supabase inspection returned project ACTIVE_HEALTHY, PostgreSQL 17.11, 11 public tables, all 11 with RLS enabled, zero rows reported, zero migration-history entries and 11 rls_enabled_no_policy advisor findings. The seven missing model tables remain UserMfa, MfaRecoveryCode, AuthChallenge, AiGeneration, EngineeringTask, EngineeringTaskAttempt and EngineeringTaskDependency. The AuditEvent.tenantId foreign key is absent. No production SQL or schema write was performed.

Cloudflare R2 remains unavailable until enabled in the account dashboard: the read-only bucket-list request returned HTTP 403 / error 10042. No private bucket, access key, encrypted backup artifact, checksum or restore proof exists. The backup and restore workflows remain feature-branch code only.

### Owner actions — exact blockers

1. Cloudflare R2: enable R2 after reviewing any billing prompt; create a private bucket vayro-core-backups; create a bucket-scoped least-privilege key; add the exact vayro-backup and vayro-restore GitHub Environments and required secrets/variables from docs/operations/VAYRO-R2-OWNER-SETUP-FA.md. Never paste credentials into chat or Git.
2. VAYRO-CORE: provision an isolated PostgreSQL 17 restore target on a different host. Only after a checksum-verified off-provider backup and full isolated restore can a reviewed schema/role/RLS reconciliation plan proceed. Do not apply migrations, grants, policies or DDL to live now.
3. Railway VAYRO service: the owner must configure protected runtime variables for the exact deployment architecture, including AUTH_DATABASE_URL, PLATFORM_DATABASE_URL, TENANT_DATABASE_URL, DATABASE_URL, MIGRATION_DATABASE_URL, public app URL and required email/bootstrap settings. The runtime identities and grants must first be provisioned and verified against an isolated schema. Do not substitute the migration owner credential for runtime roles.
4. Railway source alignment: choose one canonical VAYRO Railway project/service, reconcile the service's configured branch with the failed deployment's branch/commit, inspect the staged patch, then authorize one controlled deploy only after all gates pass. The existing two VAYRO service entries are not proof of independent hosting.
5. ARIA Android: upload the exact missing ARIA_32_RUNTIME_FIXES_RELEASE_READINESS_SOURCE.zip whose expected SHA-256 is 6ebe65d8058ef83c9b8a0845054dd4fd01068cf249cdf29492d8fa6d451e0be9, then run the archive's static, contract and Android build gates. The current GitHub repository contains only checksum/README placeholders for that archive.
6. ARIA integrations: select real providers and regions for the 191 required adapter families, then pass contract, mock, sandbox, E2E, tenant-isolation, idempotency and owner-approval gates. Until then keep them inactive.
7. ARIANA: import the 215-file clean archive additively into the existing development branch; do not overwrite the hardened JWT bootstrap. Resolve the SQLite fallback, startup create_all, missing executable migration chain, JWT required-claim validation, floating dependency lock and version mismatch before staging.
8. LEADORA Android: wait for the new debug APK workflow, then install and test on a real Android device. A commercial APK still requires owner-controlled signing secrets and a protected keystore; do not generate or store those in chat.
9. ARMIN MARKET: owner enables GitHub Settings → Code security and analysis → Dependency graph, then reruns Dependency Review. Its current app remains a UI/demo with local sample data; no real catalog, accounts, seller backend, server-side orders or payment integration is evidenced.
10. All products: no merge, production deployment, customer onboarding or commercial release until product-specific UAT, security, data separation, backup/restore, Android signing/device tests where applicable and owner approval have passed.

Current family decision: DEVELOPMENT CI IS GREEN FOR THE LISTED WEB/BACKEND BRANCHES EXCEPT THE EXPLICIT ARMIN DEPENDENCY-REVIEW SETTING; PRODUCTION, BACKUP/RESTORE, AND COMMERCIAL RELEASE REMAIN BLOCKED.
