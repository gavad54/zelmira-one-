# VAYRO Live Release-Gate Audit — 2026-11-15

**Audit type:** Follow-up to the 2026-11-14 snapshot, using connected GitHub, Railway and Supabase observations recorded on 2026-11-15.  
**Repository:** `gavad54/zelmira-one-`  
**Decision:** **ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED**

This is an evidence record, not authorization for production mutation, migration, merge, deployment, paid provisioning or public release.

## 1. GitHub and Android

### PR #25 — Android WebView wrapper
- State: OPEN, DRAFT, not merged.
- Head: `52a1df7ce55e1884c256a7266b55248a429e875c`.
- URL: https://github.com/gavad54/zelmira-one-/pull/25
- Android workflow run [43626841004](https://github.com/gavad54/zelmira-one-/actions/runs/43626841004): successful; artifact `vayro-debug-apk`, artifact ID `14126751574`.
- The retrieved APK was inspected as an Android APK. SHA-256: `c798e1c3477c490e18be3b536e69adda33251c85840cd956a4b2d220f6453265`.
- This is a **debug WebView wrapper**, not a full native application, not release-signed, and not store-ready. No real-device install or end-to-end acceptance evidence is established.
- The default application origin is `https://vayro-production.up.railway.app`, currently hosted as a service inside the ARIA Web Railway project, not independently hosted VAYRO infrastructure.

### CI and CodeQL
- CI run [43626843194](https://github.com/gavad54/zelmira-one-/actions/runs/43626843194): successful. It includes unit tests, locked dependency audit, Prisma validation/migrations in isolated CI PostgreSQL, role/tenant isolation tests, lint, typecheck, production build, Docker build and HTTP integration tests.
- CodeQL run [43626843211](https://github.com/gavad54/zelmira-one-/actions/runs/43626843211): successful.
- These checks support source/CI confidence only; they do not certify production runtime, backup recovery, device acceptance or release readiness.

### PR #26 — live audit documentation
- URL: https://github.com/gavad54/zelmira-one-/pull/26
- State at the time of this follow-up: OPEN, DRAFT, not merged.
- Head: `a5b3a4df94c5927a17df243b5b78a07f0468480b`.
- Contains the detailed source-level MFA review, runtime variable inventory, live schema drift findings, hosting topology and backup/restore gates.

### PR #27 — backup/recovery runbook
- URL: https://github.com/gavad54/zelmira-one-/pull/27
- Adds `docs/BACKUP-RECOVERY-OWNER-RUNBOOK.md` and dated audit records.
- The branch is two commits ahead of main and has no review submissions at the time of inspection.
- This documentation does not provision storage, create a backup, run a restore, or certify disaster recovery.

## 2. Railway hosting

- Workspace: `gavad54's Projects`.
- Existing projects observed: `ARIA Web` and `LEADORA`; no independent VAYRO project exists.
- The VAYRO service in ARIA Web is online with one replica, but it is nested in ARIA Web rather than independently governed.
- Six recent failed deployments were observed in the seven-day window; a sampled failure stopped at the healthcheck stage.
- Latest successful deployment observed: 2026-11-11 15:28:15.856 UTC, commit `f0d31804e695cd3d73b452c7507affdca9573740`.
- The VAYRO service metadata returned no configured variable names, no volume and no custom domain.
- Attempting to create an independent VAYRO Railway project failed with: `Free plan resource provision limit exceeded. Please upgrade to provision more resources!`
- No upgrade was purchased and no production deployment or configuration change was made.

## 3. Supabase VAYRO-CORE

- Project ID: `wdqhdnhpgxhmmfeyxwxr`.
- Status observed: `ACTIVE_HEALTHY`, PostgreSQL 17.11, region `eu-central-1`.
- Migration history is empty.
- The public schema contains 11 tables, with zero rows observed during the read-only inspection.
- Security Advisor reports 11 `rls_enabled_no_policy` findings for the listed public tables. This requires deliberate review against the intended server-only access model; it does not alone prove public/client access.
- Read-only grant inspection showed table grants only for `postgres`; no grants to `anon`, `authenticated` or `service_role` were returned. A single-query role inventory should be used before relying on custom-role absence as a definitive conclusion.
- Schema drift remains:
  - Live tables/models missing from the repository Prisma schema: `UserMfa`, `MfaRecoveryCode`, `AuthChallenge`, `AiGeneration`.
  - Live `Session` lacks Prisma-declared `revokedAt`, `lastSeenAt`, `assurance` and `mfaAuthenticatedAt`.
  - Live `AuditEvent` lacks the Prisma-declared `tenantId` column/FK.
- Performance Advisor reports 10 unused-index notices; none were removed.
- No DDL, migration, grant, policy, data or configuration change was made.

## 4. MFA

Source review and CI evidence cover TOTP (RFC 6238), AES-256-GCM encrypted secrets, hashed one-time recovery codes, expiring single-use challenges, attempt limits, replay protection, fresh-MFA checks and audit events.

This remains **source-level implementation evidence**, not production MFA certification. Runtime configuration and live database roles/schema must be reconciled and tested before enabling customer accounts.

Required runtime configuration identified from source includes:
- `AUTH_DATABASE_URL` and `PLATFORM_DATABASE_URL` using separate least-privilege logins.
- `VAYRO_MFA_ENCRYPTION_KEY` (32 bytes represented as 64 hex characters).
- `NEXT_PUBLIC_APP_URL` and `TRUSTED_PROXY_HOPS`.
- One configured email provider and its protected credentials.
- Build/migration variables `DATABASE_URL` and `MIGRATION_DATABASE_URL` must not be reused as privileged runtime credentials.

The production service's empty variable-name inventory means provisioned runtime configuration is not evidenced.

## 5. Backup and restore

- Daily encrypted backup workflow: `.github/workflows/vayro-db-backup.yml`, scheduled at 02:17 UTC.
- Restore drill workflow: `.github/workflows/vayro-db-restore-drill.yml`, requires an exact object key, explicit confirmation string and isolated PostgreSQL 17 target.
- Required protected configuration is documented in the owner runbook.
- The owner has confirmed no Backblaze B2 account/credentials are available.
- No successful encrypted off-site backup or isolated restore drill exists.
- Object-size/HEAD verification in the backup workflow is not equivalent to a restore test.
- No paid storage or alternate service was provisioned.

**BACKUP/RESTORE: BLOCKED.** Do not claim RPO/RTO, backup success, recoverability or disaster-recovery readiness.

## 6. Release blockers

1. Independently governed VAYRO hosting is not provisioned; the Railway free-plan resource limit blocks creation.
2. Protected production runtime variables and least-privilege database roles are not evidenced.
3. Live Prisma schema and database catalog/migration history are inconsistent; no safe baseline/forward/rollback plan has been proven in an isolated environment.
4. Encrypted off-site backup and a successful isolated restore remain unavailable.
5. MFA is not certified against the live production runtime.
6. A debug APK exists, but real-device acceptance and official release signing are absent.
7. UAT, rollback evidence and explicit owner release approval remain outstanding.

## 7. Actions deliberately not performed

- No production database writes, DDL, migrations, policies, grants or data changes.
- No Railway production deployment, service mutation, staged-patch acceptance or plan upgrade.
- No secret, signing-key or credential rotation.
- No PR merge or public release.
- No purchase or paid resource provisioning.

**Final decision: NOT READY FOR PRODUCTION OR COMMERCIAL RELEASE.** Continue only reversible source/documentation work and isolated tests until the owner prerequisites and release gates are satisfied.
