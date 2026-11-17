# VAYRO live release-gate audit — 2026-11-17

**Observation time:** 2026-11-17 09:38 UTC / 13:08 Asia/Tehran  
**Repository:** `gavad54/zelmira-one-` (historical repository name; application name remains VAYRO)  
**Main commit:** `f0d31804e695cd3d73b452c7507affdca9573740`  
**Scope:** read-only GitHub, Railway and Supabase verification, plus a documentation-only update on the existing backup/recovery PR branch.  
**Safety:** no production database writes, DDL, migrations, grants, policies, secret reads/changes, Railway changes, deployments, merges, purchases or releases.

## Executive result

**ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**

The primary blockers remain independent hosting/runtime configuration, live database migration/schema reconciliation and least-privilege access, encrypted off-host backup, and a successful isolated restore. The current backup workflow fails before creating a dump because its first required protected configuration check reports `BACKUP_DATABASE_URL` missing. No restore was run.

## GitHub

- Main remains at `f0d31804e695cd3d73b452c7507affdca9573740`: [commit](https://github.com/gavad54/zelmira-one-/commit/f0d31804e695cd3d73b452c7507affdca9573740).
- Live PR search returned **16 open** and **8 closed** PRs; six of the closed PRs are merged and two are closed unmerged.
- PR #2 is merged; PR #24 is merged. PR #23 and PR #4 are closed without merge.
- PR #5 is OPEN/DRAFT, head `f836b026c3c476493492d184e736d9a1e1eeab86`, based on `experiment/cloudflare-free-hosting-audit` rather than main, with 147 commits. It is a parallel experimental dashboard branch, not a current mainline merge candidate: [PR #5](https://github.com/gavad54/zelmira-one-/pull/5).
- PR #30 is OPEN/DRAFT, based on current main `f0d31804...`, head `c2d0e62d56c7ddb1c09a4bda0f03bd305432caac`. Its CI run [43690934818](https://github.com/gavad54/zelmira-one-/actions/runs/43690934818) and CodeQL run [43690934804](https://github.com/gavad54/zelmira-one-/actions/runs/43690934804) succeeded on that exact head. It is the more directly reviewable dashboard candidate; keep it separate from PR #5 until overlap is reconciled.
- PR #27 remains OPEN/DRAFT, head `8e5a1e8f3b904cdd3a188c9be7beccd7afe833cd`; this audit is being added to its existing documentation branch.
- Main exact-head CI [43048676444](https://github.com/gavad54/zelmira-one-/actions/runs/43048676444) succeeded on `f0d31804...`; the `npm audit --audit-level=moderate` step reported **0 vulnerabilities**. No newer main CI run was present at observation time.
- Main exact-head CodeQL [43870595208](https://github.com/gavad54/zelmira-one-/actions/runs/43870595208) succeeded on `f0d31804...` on 2026-11-16. The log records analysis of 94/94 TypeScript files, 46/46 JavaScript files and 5/5 GitHub Actions files.
- Dependabot job [43844715110](https://github.com/gavad54/zelmira-one-/actions/runs/43844715110) succeeded on the same SHA. This is a Dependabot update job, not a substitute for the exact-head `npm audit` result or a complete security-alert inventory.
- Backup job [43841905808](https://github.com/gavad54/zelmira-one-/actions/runs/43841905808) failed on the same SHA. Its log reports `Missing protected configuration: BACKUP_DATABASE_URL` during validation. Dump, encryption and upload steps did not run.
- The GitHub API denied branch-protection inspection with HTTP 403. Code-scanning and Dependabot alert-list endpoints were not available through the connected GitHub read interface. Branch protection and open alert disposition are therefore **NOT VERIFIED**, not assumed absent or clear.

## Documentation consistency

The latest main versions remain old relative to the live platform snapshot:

- [RELEASE-GATES.md](https://github.com/gavad54/zelmira-one-/blob/main/docs/RELEASE-GATES.md), blob `0c4ed89bb32d52a3df7bcbe19eefe92d2dfa72c2`, ends with an 2026-11-11 infrastructure addendum and still contains historical statements that PR #2 is open. That conflicts with the current merged state of PR #2 and the current main SHA.
- [ARCHITECTURE.md](https://github.com/gavad54/zelmira-one-/blob/main/docs/ARCHITECTURE.md), blob `225dafc8d901a29f06e47eea7022df9e89854feb`, correctly says the Railway VAYRO service is inside ARIA Web, but its release-boundary wording should consistently distinguish “a service deployment exists” from “independent VAYRO hosting is absent.”
- [PRODUCT-BOUNDARIES.md](https://github.com/gavad54/zelmira-one-/blob/main/docs/PRODUCT-BOUNDARIES.md), blob `d8debb4cc718471e6262980844a1a4d9357760ce`, defines eleven independent products including ARMIN MARKET and explicitly classifies DANA as a central capability, not a product. The currently supplied family list names DANA but omits ARMIN MARKET. This is an unresolved product-catalogue decision; no product was removed or reclassified.

## Railway

The live workspace contains only two projects: `ARIA Web` and `LEADORA`. There is no dedicated VAYRO project.

### Primary VAYRO service in ARIA Web

- Project: `ARIA Web`; environment: `production`.
- Service: `VAYRO`, ID `ea06b2d7-b28e-462e-9251-2613af769d8e`.
- Live state: Online, 1/1 replicas; no current Railway warning/critical notification and no failed deployment counted in the last seven days.
- Latest deployment: SUCCESS, 2026-11-11, commit `f0d31804e695cd3d73b452c7507affdca9573740`, branch `main`.
- Generated domain: `vayro-production.up.railway.app`; no custom domain.
- Runtime variable-name list: empty. Mounted volumes: none.
- Existing staged patch `b9d85124-4dfe-42fe-8fe2-136f239987b0` remains STAGED with three changes, including an update to another service. It was not accepted or modified.
- Last 24-hour Railway HTTP counters: 1 request, 1 response 2xx, 0 4xx and 0 5xx. HTTP log records `GET /` → 200 at 2026-11-17 08:12:31 UTC. Historical logs include 404s for `/vayro-mark.svg` and `/manifest.webmanifest`, plus client-aborted 499 requests.
- Runtime logs show Next.js “Ready”, but this does not prove DB connectivity or readiness. A direct probe from the audit environment could not obtain an HTTP response (curl returned HTTP 000 / DNS resolution error); `/api/health` and `/api/ready` remain **NOT VERIFIED**.

### Secondary VAYRO service in LEADORA

A second service named VAYRO is present inside the LEADORA project, on branch `security/mfa-session-endpoint-gates`, commit `47792d4a891795d60a4b65c11c4a4ffb8cab2f74`. It reports Online with 1/1 replicas but has no public domain, runtime variable names or mounted volume. It is not an independent VAYRO project.

## Supabase VAYRO-CORE — read-only

Project `wdqhdnhpgxhmmfeyxwxr` is `ACTIVE_HEALTHY`, PostgreSQL 17.11, region `eu-central-1`.

- Live public tables: 11; reported rows: zero in all 11.
- Prisma schema on main contains 15 models. Live catalog is missing `UserMfa`, `MfaRecoveryCode`, `AuthChallenge` and `AiGeneration`.
- Live `Session` lacks Prisma fields `revokedAt`, `lastSeenAt`, `assurance` and `mfaAuthenticatedAt`.
- Live `AuditEvent` contains `tenantId`, but its Prisma-declared `tenantId` foreign-key constraint is absent.
- Migration history: empty.
- RLS enabled: 11/11 tables; policies: 0; FORCE RLS: 0.
- No `vayro_app`, `vayro_auth`, `vayro_platform` or `vayro_platform_bootstrap` roles were found. `postgres` has BYPASSRLS; `service_role` also has BYPASSRLS. Table grants observed: only `postgres` (77 privilege rows across the 11 public tables). No role memberships involving `vayro_%` roles were returned.
- Security Advisor: 11 informational `rls_enabled_no_policy` findings. Performance Advisor: 10 unused-index notices. Health Advisor: no findings.

These observations establish live schema/security drift. They do not authorize a production migration, role creation, grant or policy change. No database mutation was performed.

## Backup and restore

- Latest observed backup run: [43841905808](https://github.com/gavad54/zelmira-one-/actions/runs/43841905808), failed on `f0d31804...` before dump creation.
- First failed validation item: `BACKUP_DATABASE_URL`, mapped by the workflow to the protected secret `VAYRO_BACKUP_DATABASE_URL` in GitHub Environment `vayro-backup`.
- The workflow checks additional protected configuration, but the log stops at the first missing item; the remaining items are **NOT VERIFIED**.
- No PostgreSQL dump, encryption, off-host upload, remote checksum/size verification or restore was completed in that run.
- Restore drill: **NOT RUN / NOT VERIFIED**. No independent restore evidence exists.
- Do not place credentials in chat or source. No new storage destination or paid resource was created.

## Android and product family

- PR #25 remains OPEN/DRAFT. Debug APK artifact `vayro-debug-apk` is still present (artifact ID `14126751574`, expires 2026-11-21). It is a debug WebView wrapper, not a signed release. Official signing and real-device acceptance are NOT RUN.
- The documented eleven independent products are ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM, LEADORA, ARIANA, ARIA and ARMIN MARKET. DANA is a central AI/orchestration capability. None has current independent end-to-end runtime, data-boundary, integration and acceptance evidence sufficient for PASS.
- ARIA must remain without accounting/ERP; ARIANA owns accounting/ERP/tax; LEADORA owns distribution operations. No boundary change was made.

## Release-gate status

| Gate | Status |
|---|---|
| Dedicated VAYRO hosting | BLOCKED |
| Runtime variables and secure DB connection | BLOCKED |
| Migration baseline / live schema reconciliation | BLOCKED |
| Least privilege / RLS / tenant isolation in production | BLOCKED |
| Production MFA and session lifecycle | UNVERIFIED |
| Endpoint authorization in production | UNVERIFIED (selected isolated CI coverage passes) |
| CSP / security headers / trusted proxy | UNVERIFIED |
| Encrypted off-host backup | FAIL |
| Isolated PostgreSQL restore | NOT RUN |
| Independent operation of the eleven products | UNVERIFIED |
| Android debug build | PASS (debug only) |
| Official Android signing / real-device UAT | NOT RUN |
| Production email, licensing and payments | BLOCKED / NOT RUN |
| Legal/privacy review, owner UAT and release approval | NOT RUN / BLOCKED |

## Safest next step

The smallest owner action is to configure the missing protected secret `VAYRO_BACKUP_DATABASE_URL` in the existing GitHub Environment `vayro-backup`, using the correct VAYRO-CORE connection string from the provider console. Do not send it in chat. Re-run the existing backup workflow only after confirming the private destination and all other required fields. A successful encrypted backup must then be followed by a separately authorized restore drill against an empty isolated PostgreSQL 17 target.

Until backup and restore evidence exists, do not change the live schema, roles, grants or RLS policies. Keep all deployment, merge, billing and release gates blocked.
