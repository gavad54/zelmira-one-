# VAYRO Backup and Recovery Runbook (No Backblaze B2)

**Status:** PREPARATION ONLY — no verified off-site backup or restore drill exists.
**Last reviewed:** 2026-11-15
**Production changes:** None.

## 1. Current facts

- The repository contains a daily encrypted PostgreSQL backup workflow and an isolated restore-drill workflow.
- Those workflows require the protected GitHub Environment secrets and variables documented in the workflow files.
- The required Backblaze B2 account and credentials have not been provisioned.
- Therefore, no successful encrypted off-site backup, checksum verification against a stored object, or restore drill may be claimed.
- The live VAYRO-CORE database has schema drift and missing migrations. Do not run migrations as part of a backup exercise.

## 2. Safe interim position

Until a separate backup destination is configured:

1. Keep the production database unchanged.
2. Do not store database dumps, encryption identities, database URLs, API keys, or recovery codes in Git, GitHub issues, pull requests, workflow logs, or ordinary CI artifacts.
3. Do not treat a Git repository clone or an APK artifact as a database backup.
4. Preserve the existing backup and restore workflows; do not weaken encryption, checksum validation, or isolated-target checks to make a workflow appear green.
5. Record the database provider's native backup/PITR availability and retention from the actual project plan/dashboard before relying on it. Do not assume a retention period or point-in-time recovery is enabled.

## 3. Destination decision

Choose one private destination before enabling automated exports:

- **Preferred existing design:** private Backblaze B2 bucket with application key restricted to that bucket and the exact S3 endpoint/region.
- **Alternative:** another private object-storage provider with equivalent private access, server-side transport security, lifecycle/retention controls, and a tested download/restore path. This requires adapting and reviewing the workflow; do not paste provider credentials into chat.
- **Provider-native backup/PITR:** acceptable as an additional recovery layer only after confirming the current plan, retention window, and restore procedure in the provider dashboard.

A destination is not ready until ownership, access scope, retention, encryption, and restore access have been verified.

## 4. GitHub Environment configuration

Configure values only in the repository's protected GitHub Environments, never in repository source files.

### Environment: `vayro-backup`

Secrets:
- `VAYRO_BACKUP_DATABASE_URL`
- `VAYRO_B2_KEY_ID`
- `VAYRO_B2_APPLICATION_KEY`

Variables:
- `VAYRO_BACKUP_AGE_RECIPIENT`
- `VAYRO_B2_BUCKET`
- `VAYRO_B2_S3_ENDPOINT`
- `VAYRO_B2_REGION`

### Environment: `vayro-restore`

Secrets:
- `VAYRO_BACKUP_DATABASE_URL`
- `VAYRO_ISOLATED_RESTORE_DATABASE_URL`
- `VAYRO_BACKUP_AGE_IDENTITY`
- `VAYRO_B2_KEY_ID`
- `VAYRO_B2_APPLICATION_KEY`

Variables:
- `VAYRO_B2_BUCKET`
- `VAYRO_B2_S3_ENDPOINT`
- `VAYRO_B2_REGION`

Use separate least-privilege credentials where supported. The restore target must be a separately provisioned, empty, isolated PostgreSQL 17 database. Never point the restore workflow at production.

## 5. Acceptance gates

A backup is accepted only when all are evidenced:

- Workflow completed successfully.
- Encrypted object exists in the private destination.
- Remote object size and SHA-256 sidecar are checked.
- Backup timestamp, object key, database identity, and workflow run are recorded without exposing credentials.
- Retention/lifecycle behavior is confirmed.

A restore is accepted only when all are evidenced:

- Exact backup object is downloaded.
- SHA-256 verification succeeds before decryption.
- Decryption and PostgreSQL archive validation succeed.
- Restore occurs only into the isolated empty target.
- Restored relations and application-level invariants are checked.
- A responsible owner reviews the evidence.

An upload or HEAD/size check alone is not a successful restore test.

## 6. Stop conditions

Stop and report BLOCKED if:
- Any required secret or variable is missing.
- The destination is public or access scope is broader than required.
- The encryption recipient/identity pair is not validated.
- The isolated restore database is not confirmed empty and separate from production.
- The backup timestamp, checksum, or archive validation fails.
- Any proposed step requires a production schema change, data mutation, paid plan, or new paid service without separate approval.

## 7. Current release gate

**BACKUP/RESTORE: BLOCKED — destination and credentials not provisioned; no successful restore evidence.**

This runbook is documentation and readiness control only. It does not create a backup, provision storage, configure secrets, or certify disaster recovery.
