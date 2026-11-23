# VAYRO-CORE Independent Backup and Restore Drill

**Status:** Operator procedure prepared; no backup or restore has been executed by this document.  
**Target project:** `wdqhdnhpgxhmmfeyxwxr` (`VAYRO-CORE`)  
**Database observed:** PostgreSQL 17.11, `eu-central-1`  
**Last known live audit:** 2026-11-23 (read-only)  
**Change boundary:** This procedure is for exporting and restoring to an isolated target only. It does not authorize production DDL, role changes, grants, RLS changes, migrations, deployment, or production restore.

## 1. Gate and safety rules

- Keep the source project read-only during the backup operation.
- Never restore over the source project. The restore target must be a separate, isolated PostgreSQL environment with no VAYRO production application connected.
- Do not use a Supabase development branch as proof of a full-data restore: Supabase documents that production data is not carried into a branch.
- Never place database URLs, passwords, access tokens, private keys, or unredacted logs in Git, CI output, chat, issue comments, or screenshots.
- Use a secret manager or interactive credential prompt. Do not put credentials directly in shell history or command arguments saved to logs.
- Encrypt the backup before it leaves the source provider. Store the encryption key separately under owner control.
- Keep the backup outside Supabase and outside the source provider's failure domain.
- Stop if the dump is incomplete, checksum verification fails, the target is not isolated, or restore verification is inconclusive.
- A successful dump alone is not a passed restore drill.

## 2. What the Supabase CLI dump includes and excludes

Use the Supabase CLI `supabase db dump`, which invokes `pg_dump` with Supabase-specific filtering. Supabase documents that the default dump excludes data and custom roles; request roles and data explicitly as separate files.

Create three files from the same source snapshot:

1. `roles.sql` using `--role-only`
2. `schema.sql` using the default schema dump
3. `data.sql` using `--use-copy --data-only`

Important limitations to record:
- Supabase-managed schemas (including `auth` and `storage`) and extension-owned schemas are filtered by the CLI. Confirm whether VAYRO-CORE uses any such schemas or external storage before claiming full-system coverage.
- Storage object bytes are not in the database dump; database backups preserve metadata only. If any VAYRO product uses Supabase Storage, export and verify those objects separately.
- Custom role passwords are not included in Supabase backups/dumps. Re-provision credentials separately through the secret manager after restore; never copy a password hash into this repository.
- Edge Functions, Auth provider configuration, API keys, SMTP settings, custom domains, and other project-level configuration are not restored by a database dump. Inventory them separately if they are in scope.

Official references:
- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- https://supabase.com/docs/reference/cli/supabase-db-dump

## 3. Backup execution

Run from a controlled operator workstation or dedicated secure runner with the Supabase CLI and Docker installed. Use the connection string from the VAYRO-CORE Dashboard's **Connect** panel. Prefer the session pooler unless the operator has confirmed direct IPv6/IPv4 connectivity.

The following are command templates. Replace the placeholder locally; do not paste a real connection string into this file or chat.

```bash
# Store the connection string in a protected environment variable or secret manager.
# Do not echo it or enable shell tracing (set -x).

supabase db dump --db-url "$VAYRO_CORE_DATABASE_URL" -f roles.sql --role-only
supabase db dump --db-url "$VAYRO_CORE_DATABASE_URL" -f schema.sql
supabase db dump --db-url "$VAYRO_CORE_DATABASE_URL" -f data.sql --use-copy --data-only
```

After all three commands exit successfully:

```bash
sha256sum roles.sql schema.sql data.sql > SHA256SUMS
sha256sum -c SHA256SUMS
```

Then:
- Encrypt the three dump files and checksum manifest using an owner-controlled encryption mechanism.
- Upload the encrypted artifact to an independent storage provider/account with restricted access and versioning/immutability where available.
- Download the uploaded artifact to a clean operator environment and verify the checksum again after decryption.
- Record sanitized metadata only: artifact ID, UTC timestamp, total bytes, SHA-256 checksums, encryption method/key custody reference, storage provider/region, object version, retention, and operator.
- Do not mark the backup gate PASS until the independent copy is downloaded and checksum-verified.

## 4. Isolated restore drill

Provision a separate disposable PostgreSQL 17 target or a separate Supabase project dedicated to restore testing. It must not share the production project, database, credentials, application URLs, or production traffic. Confirm the target identity twice before restoring.

Restore in the documented order:

```bash
psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file roles.sql \
  --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "$VAYRO_RESTORE_DATABASE_URL"
```

Notes:
- The target must have compatible PostgreSQL and required extensions.
- Review the dump and target defaults before restore. Supabase documents that target default privileges can affect restored table grants; do not assume the source grants are reproduced exactly.
- Restore only into the isolated target. Never substitute the production connection string.
- If restore fails, preserve logs securely, discard/recreate the disposable target, investigate, and repeat only after review. Do not edit the source database to make the dump pass.

## 5. Verification required for PASS

Capture before/after evidence and verify all of the following:

- [ ] All three dump commands exited successfully.
- [ ] Encrypted off-provider artifact exists and can be downloaded.
- [ ] SHA-256 checksums match before and after transfer.
- [ ] Restore completed with no SQL errors.
- [ ] PostgreSQL version and required extensions are compatible.
- [ ] Schema inventory matches: schemas, tables, columns, types, defaults, enums, indexes, constraints, foreign keys, sequences, functions, triggers, policies, grants, ownership, and role memberships.
- [ ] Row counts match for every application table, not only a sample. Use a consistent snapshot or quiesce writes during the dump/compare so concurrent writes do not create false mismatches.
- [ ] Sequence values are safe relative to restored table data.
- [ ] Representative foreign-key and uniqueness integrity checks pass.
- [ ] RLS policies, role memberships, ownership, and effective privileges are compared. Treat missing role passwords as expected and re-provision only in the isolated target.
- [ ] Application-independent read-only smoke tests pass.
- [ ] Storage objects and project-level configuration have separate evidence or are explicitly marked out of scope.
- [ ] RPO/RTO, restore duration, environment ID, operator, reviewer, sanitized logs, and evidence location are recorded.
- [ ] A second qualified reviewer attests that the restore is usable.

The backup/restore gate is PASS only after every required in-scope item is evidenced and independently reviewed. Any missing item is FAIL or UNVERIFIED, never PASS.

## 6. Production migration gate after restore

A successful isolated restore does not itself authorize production changes. After the restore gate passes, separately complete:

1. Fresh read-only production catalog and migration-history snapshot.
2. Object-by-object reconciliation against the exact Prisma migration chain.
3. Baseline proof on two independent restored clones.
4. Review of tenant data and orphan references before any FK change.
5. Role and effective-privilege design review.
6. Exact production change plan, rollback/containment plan, window, and stop conditions.
7. Separate explicit owner approval for baseline recording, role provisioning, and each production migration execution.

Until those gates pass, keep VAYRO-CORE production unchanged.

## 7. Evidence record template

| Field | Value |
|---|---|
| Source project | `wdqhdnhpgxhmmfeyxwxr` |
| Backup UTC timestamp | UNRECORDED |
| Artifact ID / object version | UNRECORDED |
| SHA-256 manifest | UNRECORDED |
| Encryption / key custody reference | UNRECORDED |
| Independent storage location | UNRECORDED |
| Restore target project/environment | UNRECORDED |
| Restore result | NOT RUN |
| Schema comparison | NOT RUN |
| Row-count comparison | NOT RUN |
| RPO / RTO | UNRECORDED |
| Operator / independent reviewer | UNRECORDED |
| Gate | BLOCKED |

**Current truthful status:** This is an executable operator runbook, not evidence that a backup exists. The ChatGPT Supabase connector currently provides database introspection and SQL/migration operations, but no supported export-to-file, external object-storage upload, or isolated full restore workflow. The operator workstation/secure runner and independent restore target are still required.
