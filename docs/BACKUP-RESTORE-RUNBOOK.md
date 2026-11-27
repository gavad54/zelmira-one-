# VAYRO encrypted backup and isolated restore runbook

## Status — 2026-11-27

**Backup: NOT EXECUTED. Restore: NOT EXECUTED. Release gate: BLOCKED.**

The workflows and synthetic tests are present, but the protected Cloudflare R2 configuration has not been completed. No production dump, remote backup object, read-back artifact, or independent restore has been produced. Do not treat successful CI as evidence of a real backup.

Cloudflare R2 is the only intended object-storage destination. Do not use historical Backblaze B2 settings or legacy R2 credential names.

Never point a restore job at production. Never run migrations, DDL, role changes, grants, or RLS changes on live VAYRO-CORE as part of this runbook. Do not reuse ARIA or LEADORA infrastructure, credentials, buckets, or data. Never put secret values in chat, source code, issues, pull requests, or logs.

## Exact GitHub Environment configuration

Create two GitHub Actions Environments: `vayro-backup` and `vayro-restore`. Require owner approval for both, restrict restore to `main`, and store each value only in its matching Environment. The typed restore confirmation is an additional guard, not a substitute for Environment approval.

### Environment: `vayro-backup`

**Secrets**
- `VAYRO_BACKUP_DATABASE_URL` — dedicated least-privilege PostgreSQL connection for pg_dump.
- `VAYRO_R2_BACKUP_ACCESS_KEY_ID` — dedicated R2 key for backup upload/read-back.
- `VAYRO_R2_BACKUP_SECRET_ACCESS_KEY` — secret for that backup key.

**Variables**
- `VAYRO_BACKUP_AGE_RECIPIENT` — public age recipient; never put the private identity here.
- `VAYRO_R2_BUCKET` — private bucket name.
- `VAYRO_R2_S3_ENDPOINT` — HTTPS endpoint for the account's R2 bucket.
- `VAYRO_R2_REGION` — R2 region value, normally `auto`.

The backup key should be scoped to this private bucket and the minimum permissions required to write and read back objects under `vayro/postgres/*`. It must not have delete or bucket-administration permissions.

### Environment: `vayro-restore`

**Secrets**
- `VAYRO_ISOLATED_RESTORE_DATABASE_URL` — disposable, empty PostgreSQL 17 target on a separate host from production.
- `VAYRO_BACKUP_AGE_IDENTITY` — private age identity used to decrypt backups; store it in approved offline escrow as well.
- `VAYRO_R2_RESTORE_READONLY_ACCESS_KEY_ID` — independent R2 key with read-only access to the required backup objects.
- `VAYRO_R2_RESTORE_READONLY_SECRET_ACCESS_KEY` — secret for that read-only key.

**Variables**
- `VAYRO_PRODUCTION_DATABASE_HOST` — production database hostname, without credentials.
- `VAYRO_PRODUCTION_DATABASE_NAME` — production database name.
- `VAYRO_R2_BUCKET`
- `VAYRO_R2_S3_ENDPOINT`
- `VAYRO_R2_REGION`

The restore key must not have write, delete, or bucket-management permissions. The workflow checks that the restore host and database name differ from production, requires PostgreSQL 17, checks that the target has no user objects, and requires the exact confirmation string `RESTORE_TO_ISOLATED_VAYRO_TEST`. Hostname comparison cannot detect every DNS alias or network route to the same underlying server; the owner must independently verify that the target is a genuinely separate disposable database.

## Backup and restore behavior

### Backup workflow

File: `.github/workflows/vayro-db-backup.yml`

- Runs manually or daily at 02:17 UTC, only from `main`.
- Uses PostgreSQL 17 `pg_dump` custom format.
- Encrypts the dump locally with age; plaintext is removed before upload.
- Uploads only the encrypted dump and SHA-256 sidecar to private R2.
- Checks remote object sizes, downloads both objects back, compares the sidecar byte-for-byte, and independently checks SHA-256 of the encrypted local and downloaded objects.
- Removes read-back temporary files after successful verification.
- Does not implement retention or deletion.

The read-back verifier is `scripts/verify-encrypted-backup-readback.sh`. Synthetic CI fixtures test valid files, tampered object bytes, and tampered checksum sidecars. These tests do not contact R2.

### Isolated restore workflow

File: `.github/workflows/vayro-db-restore-drill.yml`

- Manual only; runs only from `main` after Environment approval and exact confirmation.
- Uses the separate read-only R2 key to download the selected timestamped backup object and its checksum sidecar.
- Verifies checksum, decrypts with the protected age identity, and validates the PostgreSQL archive.
- Requires a separate empty PostgreSQL 17 target and restores with `pg_restore --exit-on-error --no-owner --no-acl`.
- Reports restored relations, row count, extensions, RLS, FORCE RLS, and missing-policy metrics.
- Reports RLS policy gaps as a separate security release gate; a successful data restore does not make the security gate pass.

Because the dump uses `--no-owner --no-acl`, the restore drill does not prove role ownership or grants. Roles, grants, runtime identities, and application-level permissions require a separately reviewed recovery plan and tests.

## Recovery scope and limitations

This is a PostgreSQL logical database backup only. It does not back up uploaded files or object-storage blobs, Railway volumes, deployment images, GitHub secrets, Environment variables, provider configuration, DNS, or external integrations. It is not a complete VAYRO platform backup until those assets and configuration are separately covered and restored in a drill.

A successful upload/read-back proves only that the encrypted bytes were returned correctly during that run. It does not prove retention, immutability, future availability, backup completeness, or application-level recovery. A successful restore of database rows also does not prove that the application can start or that authentication, tenant isolation, roles, grants, or external services work.

## Owner checklist — required before closing the release gate

- [ ] Review current R2 account eligibility, payment requirements, usage limits, and possible overage costs.
- [ ] Create a private R2 bucket; do not enable public access.
- [ ] Create separate least-privilege backup and read-only restore keys.
- [ ] Generate an age keypair; escrow the private identity securely outside source control and outside the bucket.
- [ ] Configure both GitHub Environments with required owner approvals and exact names above.
- [ ] Configure the isolated PostgreSQL 17 restore database on a genuinely separate host.
- [ ] Run a real backup from protected `main`; verify its encrypted object and checksum in R2.
- [ ] Run the isolated restore drill and verify schema/object inventory, row counts, representative records, and application invariants.
- [ ] Recreate and test required database roles and grants separately.
- [ ] Test recovery of file/object storage and deployment configuration separately.
- [ ] Record backup time, restore time, dump size, checksum, recovery point, RPO, and RTO.
- [ ] Complete a second independent restore drill before considering the backup gate closed.

## Current provider blocker

The latest observed read-only Cloudflare R2 bucket-list request returned HTTP 403 / error 10042, indicating R2 was not enabled for the connected account at that time. No bucket, key, or paid service was created. Re-check the account directly before any setup; do not assume this earlier observation describes the current account state.

Until owner configuration and real backup/restore evidence exist, keep **BACKUP = NOT EXECUTED; RESTORE = NOT EXECUTED; RELEASE GATE = BLOCKED**.
