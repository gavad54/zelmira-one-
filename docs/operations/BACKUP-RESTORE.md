# VAYRO Backup and Restore Controls

**Status:** CI restore verification implemented; production backup service not configured or proven.

## What is verified in the repository

The VAYRO CI workflow now runs a PostgreSQL logical backup/restore check against its disposable PostgreSQL 17 service:

1. Applies the complete checked-in Prisma migration history.
2. Inserts a synthetic marker into `AuthRateLimit`.
3. Creates a custom-format `pg_dump`.
4. Restores the dump into a separate database in the same isolated CI PostgreSQL service.
5. Confirms the marker row and completed Prisma migration count match.
6. Drops the restored database and removes the temporary dump.

This is an automated schema/data restore smoke test. It is not an encrypted off-site backup, a provider-level point-in-time recovery test, or evidence of production RPO/RTO.

## Production requirements — still release-blocking

- Use a backup destination independent of the application host and primary database provider.
- Encrypt before upload (for example, age or a managed KMS envelope); keep decryption material outside GitHub source, application logs and the backup bucket.
- Use a dedicated least-privilege backup identity and short-lived credentials where supported.
- Enable object versioning/immutability and retention appropriate to the business/legal requirements.
- Record a SHA-256 checksum, backup timestamp, source database identity, schema/migration version and encryption key version for each backup.
- Alert on missed backups, failed uploads, failed checksums and restore failures.
- Restore periodically into a separate isolated database; verify schema, representative row counts and application-level invariants.
- Measure and record actual RPO/RTO. A successful `pg_restore` command alone is not sufficient.
- Back up the MFA encryption key under a separate, controlled recovery procedure. Database backups without the matching key version may not restore authentication capability.

## Safe operational boundary

Do not point scripts at production until the database migration baseline, runtime database role, external storage, encryption key custody and rollback plan are independently verified and the owner approves the operation. No production backup, restore, migration, secret change or data mutation was performed as part of the repository CI work.
