# VAYRO Production Database Role, Baseline and Migration Runbook

**Document status:** Prepared for controlled execution; not an authorization to change production.  
**Target:** Dedicated VAYRO-CORE PostgreSQL project only.  
**Current release decision:** `BLOCKED` until every gate below has current evidence and the owner explicitly authorizes the exact production change window.

## 1. Non-negotiable boundaries

- This runbook does not authorize production DDL, role creation, grants, policy changes, migration execution, secret changes, deployment, or customer onboarding.
- Until explicit production-change authorization is recorded, VAYRO-CORE access remains read-only.
- Never use or modify ARIA, ARIANA, LEADORA, or any other product's database, project, volume, credentials, or backups.
- Never put database URLs, passwords, recovery codes, API keys, or private keys in Git, issues, logs, chat, screenshots, or this document.
- Do not run `prisma migrate deploy`, `prisma migrate reset`, `db push`, ad-hoc DDL, or a role/grant script against production during preparation.
- A successful disposable-CI migration is not evidence that production is backed up, baselined, or safe to migrate.
- If catalog/schema comparison finds an unexplained difference, stop. Do not force a baseline or mark a migration as applied to make the history appear green.

## 2. Current known state — fresh read-only evidence (2026-11-09)

A fresh read-only inspection of Supabase project `wdqhdnhpgxhmmfeyxwxr` (`VAYRO-CORE`) on 2026-11-09 confirmed:

- Project status `ACTIVE_HEALTHY`; PostgreSQL 17.11; region `eu-central-1`.
- Exactly 11 public tables were listed; all 11 reported RLS enabled and zero rows at inspection time.
- A direct PostgreSQL catalog aggregate returned: 11 public tables, 0 public policies, 11 RLS-enabled tables, 0 FORCE-RLS tables, 0 roles named `vayro_%`, and no `public._prisma_migrations` table.
- Supabase migration history returned an empty list.
- Security Advisor returned 11 `rls_enabled_no_policy` findings; Health Advisor returned no findings.
- The live `Session` table contains only the initial session columns (`id`, `tokenHash`, `userId`, `expiresAt`, `createdAt`); it does not show the later MFA/session-assurance fields described by the security branch.
- The live `AuditEvent.tenantId` column is present, but the documented tenant foreign-key constraint is absent.
- No production DDL, policy, grant, role, migration, or data change was performed.

RLS enabled without policies does not enforce tenant isolation. The zero-row observation does not make the schema disposable or safe to replace. The catalog findings are a fresh snapshot, not proof of the application's effective runtime identity; that identity and inherited privileges still require separate verification. Repeat the read-only inventory immediately before any future approved change.

## 3. Required evidence package before production authorization

All items are mandatory. Store evidence in an owner-controlled, access-restricted location outside this repository; publish only non-sensitive checksums and sanitized metadata here.

### 3.1 Independent backup

- [ ] Full logical backup of the VAYRO-CORE database, including schema, data, sequences, functions, triggers, extensions, and migration metadata.
- [ ] Backup encrypted before leaving the source provider; encryption key held separately under owner control.
- [ ] Backup stored outside the Supabase project/provider and outside the same failure domain.
- [ ] Backup object version, creation time, size, checksum (SHA-256), encryption method, retention/immutability settings, and access-control evidence recorded.
- [ ] Backup completed without errors and the checksum verified after transfer.
- [ ] No ARIA or other product data included.

### 3.2 Independent restore drill

- [ ] Restore the backup into a new isolated, non-production PostgreSQL environment.
- [ ] Confirm restore success and verify the restored backup checksum against the source artifact.
- [ ] Compare schema objects and row counts by table; investigate every mismatch.
- [ ] Verify sequences, constraints, indexes, extensions, functions, triggers and representative referential integrity.
- [ ] Run application-independent integrity checks and a read-only smoke test; do not connect production services to the restore.
- [ ] Record measured RPO and RTO, restore logs, operator, timestamp, environment identity, and evidence location.
- [ ] Have a second qualified reviewer attest that the restore is usable.
- [ ] **Gate passes only when both backup and restore are independently evidenced.** A provider snapshot or “backup enabled” toggle alone is insufficient.

### 3.3 Production schema and migration reconciliation

- [ ] Capture a fresh read-only catalog inventory: PostgreSQL version, schemas, tables, columns, types, defaults, indexes, constraints, foreign keys, sequences, extensions, functions, triggers, policies, grants, ownership and role memberships.
- [ ] Capture a fresh read-only migration-history listing.
- [ ] Compare the live catalog with the exact Prisma schema and every repository migration in order.
- [ ] Identify the initial schema migration that corresponds to the already-provisioned tables. If no exact reproducible baseline exists, prepare a reviewed baseline migration; do not fabricate one.
- [ ] Compare every column, enum, default, index, FK, unique constraint and delete/update action. Resolve drift explicitly.
- [ ] Inspect existing `AuditEvent.tenantId` values and orphan references before adding the tenant foreign key.
- [ ] Confirm whether MFA and other later migration objects exist; do not infer from repository schema.
- [ ] Produce a signed-off object-by-object reconciliation report and a deterministic migration plan.

### 3.4 Runtime and migration identity separation

The application runtime and schema migration executor must not share a privileged connection identity.

- [ ] Tenant data-plane runtime uses a dedicated LOGIN role that is a member of `vayro_app`.
- [ ] The login role is `NOSUPERUSER NOBYPASSRLS`, does not own protected tables, and has no direct or inherited membership in superuser, BYPASSRLS, or protected-table-owner roles.
- [ ] `vayro_app` remains a `NOLOGIN NOBYPASSRLS` privilege group; it must not own protected tables.
- [ ] A separately controlled migration-owner identity is used only by the migration operator/workflow and is never configured as the application's runtime URL.
- [ ] The general `DATABASE_URL` use for authentication, rate limiting and platform-wide owner operations is separately inventoried and least-privilege reviewed. Do not assume the tenant role alone certifies the entire server.
- [ ] The cross-tenant platform catalog endpoint `/api/owner/products` has a separately reviewed platform authorization and database privilege boundary.
- [ ] The protected `TENANT_DATABASE_URL` is configured only after role verification; no URL or credential is committed or pasted into logs.
- [ ] Prisma migration connectivity is explicitly separated from runtime connectivity in configuration and CI before production execution. The current schema configuration must be inspected and updated in a reviewed branch if it does not yet provide this separation.

## 4. Read-only role verification queries

Run only with an approved read-only catalog connection before role provisioning, and again after a future authorized provisioning change. Sanitize output; do not disclose connection strings or password hashes.

```sql
SELECT current_user, session_user, current_setting('server_version') AS server_version,
       current_setting('row_security') AS row_security;

SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb,
       rolcanlogin, rolreplication, rolbypassrls
FROM pg_roles
WHERE rolname IN ('postgres', 'service_role', 'authenticated',
                  'anon', 'vayro_app', 'vayro_runtime');

SELECT n.nspname AS schema_name, c.relname AS object_name,
       pg_get_userbyid(c.relowner) AS owner,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS force_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
ORDER BY c.relname;

SELECT member_role.rolname AS member,
       granted_role.rolname AS granted_role,
       m.admin_option
FROM pg_auth_members m
JOIN pg_roles member_role ON member_role.oid = m.member
JOIN pg_roles granted_role ON granted_role.oid = m.roleid
WHERE member_role.rolname IN ('vayro_runtime', 'vayro_app')
ORDER BY member, granted_role;

SELECT table_schema, table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role',
                  'vayro_app', 'vayro_runtime')
ORDER BY table_name, grantee, privilege_type;
```

These queries are diagnostic only. Their output must be interpreted with inherited role memberships and effective privileges, not just direct grants. The application must also prove the effective role from the same connection path it uses at runtime.

## 5. Controlled execution sequence — only after gates and authorization

### Phase A — approve an exact change

The owner/operator records all of the following in the change ticket:

- exact project identifier and environment;
- exact commit SHA and migration names;
- backup artifact identifier and checksum;
- independent restore report and reviewer;
- schema reconciliation report;
- role names and sanitized role-verification results;
- forward plan, rollback/containment plan and expected lock/downtime impact;
- operator, independent reviewer, start/end window and stop conditions;
- explicit owner approval for **role provisioning**, **migration baseline**, and **migration execution** as distinct actions.

Approval for one action does not automatically approve the others.

### Phase B — provision the runtime identity

Only the authorized database operator may provision the dedicated login role. Generate its credential in the provider's protected secret manager or an interactive secure password prompt; never embed a password in SQL files, command history, CI logs or chat.

Required final properties:

- login role is a member of `vayro_app`;
- login role is not superuser and has no BYPASSRLS;
- no protected table ownership;
- no elevated or owner-role memberships;
- no unnecessary schema, sequence, function or table privileges;
- connection uses TLS and the dedicated `TENANT_DATABASE_URL` secret.

Do not use `postgres`, `service_role`, or any table-owner/BYPASSRLS role as the application tenant runtime.

### Phase C — establish the migration baseline

Baseline is a reconciliation operation, not a schema-creation shortcut.

1. Start from a verified restore clone, never production.
2. Confirm that the proposed baseline migration exactly describes the already-existing schema.
3. Apply/validate the baseline procedure on the clone and compare the resulting catalog to the pre-baseline catalog.
4. Apply every subsequent migration in order to a fresh clone and to a second restored clone.
5. Verify both forward paths converge to the same schema and pass all tests.
6. Test the documented recovery path on a disposable clone. Do not assume a down migration exists or is safe; prefer a reviewed forward-fix/restore strategy where rollback is destructive or unsupported.
7. Only after independent review may the operator propose recording the baseline as applied in production. Never use `migrate resolve --applied` until exact schema equivalence has been demonstrated and the specific migration is approved.

### Phase D — rehearse and execute migrations

- Rehearse the exact production command, commit, role and migration set on a fresh isolated restore.
- Capture before/after catalog snapshots and migration-history records.
- Verify tenant RLS SQL proof and the full integration suite using the dedicated non-owner login role.
- Check lock duration, transaction behavior, statement timeouts and expected service impact.
- During the approved window, stop immediately on unexpected catalog drift, role mismatch, non-zero migration exit, unexpected row-count change, failed policy test, or unplanned lock/downtime.
- After execution, re-run catalog, role, grant, RLS and migration-history checks. Run positive and negative two-tenant tests using the real application connection.
- Keep the service closed to customer onboarding until independent post-change review and owner acceptance.

## 6. Required post-change verification

- [ ] All intended tables have the expected RLS policies and `FORCE ROW LEVEL SECURITY` state.
- [ ] Runtime role is non-owner, non-superuser and NOBYPASSRLS; effective role and grants are verified.
- [ ] Missing tenant context fails closed.
- [ ] Tenant A cannot read, insert, update, delete or export Tenant B records.
- [ ] Tenant reassignment and cross-tenant foreign-key references are rejected.
- [ ] Pooled-connection reuse and concurrent tenant transactions show no context leakage.
- [ ] Platform owner operations use their separately approved narrow privilege model.
- [ ] Migration history matches the reconciled migration sequence.
- [ ] Backup remains retained and independently accessible after the change.
- [ ] Independent reviewer signs the evidence; owner records acceptance.

## 7. Stop conditions and decision

Any missing backup/restore evidence, schema drift, unknown connection identity, elevated runtime privilege, unreviewed migration, failed negative test, or missing owner authorization means **STOP — NO PRODUCTION CHANGE**.

Current decision: **PREPARATION ONLY — PRODUCTION ROLE / BASELINE / MIGRATION NOT EXECUTED — DEPLOYMENT BLOCKED.**


## Repository configuration correction — 2026-11-09

The repository configuration requirement in section 3.4 is now implemented in source commit `47792d4a891795d60a4b65c11c4a4ffb8cab2f74`: `prisma/schema.prisma` uses `directUrl = env("MIGRATION_DATABASE_URL")`, and CI supplies a disposable migration URL. This proves configuration separation in source/CI only; it does not prove that production runtime or migration credentials exist, are correctly scoped, or have been configured in the hosting provider.

The current repository migration sequence after the initial schema is:
1. `20261108000000_mfa_session_foundation`
2. `20261108170000_tenant_rls_runtime_boundary`
3. `20261109120000_auth_database_role_boundary`
4. `20261109130000_platform_control_plane_role_boundary`
5. `20261109150000_tenant_ai_generation_history`

The full sequence has been applied successfully only to disposable CI PostgreSQL. VAYRO-CORE production still has no recorded Prisma migration history. The initial-schema baseline and all object-level drift must be reconciled on a verified restored clone before any production baseline or migration decision.


## Fresh live catalog evidence — 2026-11-09 (read-only)

A current read-only inspection of VAYRO-CORE `wdqhdnhpgxhmmfeyxwxr` confirms PostgreSQL 17.11, 11 public tables, 0 recorded migrations, 0 public RLS policies, 0 FORCE RLS tables, 0 required VAYRO group roles and 0 VAYRO LOGIN roles. All 11 existing tables were reported empty at this inspection.

The live catalog is not equivalent to the repository's current schema:
- Missing tables: `UserMfa`, `MfaRecoveryCode`, `AuthChallenge`, `AiGeneration`.
- Missing columns on `Session`: `revokedAt`, `lastSeenAt`, `assurance`, `mfaAuthenticatedAt`.
- The `AuditEvent.tenantId` column and `AuditEvent_tenantId_createdAt_idx` index are present, but the `AuditEvent_tenantId_fkey` foreign-key constraint is absent; no RLS policy is present.
- Security Advisor: 11 `rls_enabled_no_policy` findings; Health Advisor: no findings.

This catalog evidence supersedes the older high-level statement that the live schema merely resembles the initial core schema. It demonstrates additional concrete drift. No production writes were made. The live tables being empty does not make schema mutation safe and does not waive the backup/restore gate.


## Backup capability and plan check — 2026-11-09

- Supabase organization plan is `free`; VAYRO-CORE is PostgreSQL 17.11 and ACTIVE_HEALTHY.
- Supabase's current backup guide states that daily automated backups are provided for Pro, Team and Enterprise projects. For Free projects, it recommends regularly exporting with `supabase db dump` and maintaining off-site backups: [Supabase Database Backups](https://supabase.com/docs/guides/platform/backups).
- The connected Supabase controls available in this session do not expose a database-backup export/download action or a backup-list action. No independent backup artifact or checksum can therefore be produced or verified through these controls.
- A development branch is not a substitute for restoring the current live database: it starts from migrations and does not carry production data. No branch or paid resource was created.
- The `restore_project` action is not a backup-creation mechanism and must not be used as a substitute for an isolated restore drill.

**Backup/restore gate: OPEN — NOT PERFORMED.** No credentials were requested or copied into Git/chat, and no production data or schema was changed.


## Executable Free-plan logical backup and isolated restore procedure — 2026-11-09

This procedure is for the authorized database operator on a trusted workstation with Supabase CLI, Docker, PostgreSQL 17 client tools, and an independently controlled off-site destination. It is not executable through the connected Supabase read-only controls in this ChatGPT session. Do not paste the database URL, password, Supabase access token, or encryption private key into ChatGPT, GitHub, this repository, or a ticket.

### A. Prepare a private operator workspace

- Use an encrypted local disk and a private working directory with access restricted to the operator.
- Install the current Supabase CLI and Docker. `supabase db dump` uses Docker to run compatible PostgreSQL dump tooling.
- Authenticate the CLI through its interactive login flow. Do not place access tokens in shell history.
- Retrieve the VAYRO-CORE database connection string directly from the Supabase dashboard's Connect dialog. Verify the connection path, TLS requirement, and database role before dumping.
- Read the connection string into a hidden shell prompt or secure secret manager; never type it as a literal command argument saved in shell history. The environment variable name used below is `VAYRO_DB_URL`.

### B. Export roles, schema and data separately

Run these commands in the private workspace after securely populating `VAYRO_DB_URL`:

```sh
umask 077
mkdir -p vayro-core-backup
cd vayro-core-backup

supabase db dump --db-url "$VAYRO_DB_URL" -f roles.sql --role-only
supabase db dump --db-url "$VAYRO_DB_URL" -f schema.sql
supabase db dump --db-url "$VAYRO_DB_URL" -f data.sql --use-copy --data-only

test -s roles.sql && test -s schema.sql && test -s data.sql
sha256sum roles.sql schema.sql data.sql > source-files.sha256
```

If any command fails, stop; do not treat a partial set as a backup. Record CLI version, start/end timestamps, exit codes, database version, and sanitized errors. Never capture connection strings or secrets in logs.

### C. Encrypt and transfer off-site

- Package the three dump files and source checksums.
- Encrypt the package before it leaves the controlled workstation using an owner-approved public-key encryption method (for example, `age` recipient encryption). Keep the decryption private key separately under owner control.
- Calculate SHA-256 for the encrypted artifact. Transfer only the encrypted artifact to a separate provider/account or other independent failure domain with restricted access, versioning/immutability where available, and retention controls.
- Read back the transferred artifact and verify its SHA-256 against the locally recorded encrypted-artifact checksum.
- Record artifact identifier, byte size, checksum, encryption method, key-custody reference (never the key), destination, access controls, retention, operator, and timestamps. Do not commit dumps, secrets, or sensitive metadata to this repository.

### D. Restore only into an isolated PostgreSQL 17 test environment

- Provision a disposable, non-production Supabase-compatible PostgreSQL 17 environment controlled by the owner/operator. It must not share production credentials or be reachable by production services.
- Retrieve the encrypted artifact from off-site storage and verify its checksum before decrypting it into the private workspace.
- Restore in dependency order: roles, schema, then data. Use `psql` with `ON_ERROR_STOP`; run the restore in a transaction where dump content and extension requirements permit. If restore fails, preserve sanitized logs, discard the disposable target, and diagnose. Never retry against production.
- Confirm schemas, tables, columns, enum types, indexes, constraints, foreign keys, sequences, extensions, functions, triggers, policies, grants, and role memberships. Compare table row counts and representative referential-integrity checks with the source snapshot.
- Re-run the full read-only catalog inventory and compare it with the pre-dump source inventory. Record restore start/end time and calculate measured RTO; record source snapshot age as measured RPO.
- Have an independent reviewer confirm the restore is usable. A successful dump command alone does not pass the restore gate.

### E. Stop conditions

Stop and keep production unchanged if source export is incomplete, encrypted artifact checksum differs, restore errors occur, catalog/row-count mismatch is unexplained, role attributes differ, or the independent reviewer cannot verify the restored environment. Do not use a Supabase development branch as the restore target: branch creation applies migrations and does not copy live production data. Do not invoke `restore_project` as a substitute for a separately verified backup artifact and isolated restore drill.

**Execution status in this session:** procedure documented only. No CLI workstation or backup-export capability is connected here; no dump, encryption, off-site transfer, checksum verification, restore, or production write was performed.
