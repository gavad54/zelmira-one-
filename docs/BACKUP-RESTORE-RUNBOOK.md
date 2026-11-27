# VAYRO encrypted backup and isolated restore runbook

## Status and safety boundary

This runbook describes workflow behavior only. It does not create an R2 bucket, key, GitHub secret, backup object or restore database, and it does not prove that a backup has run or that a restore succeeded. Keep the release gate OPEN until an actual encrypted backup is read back, checksum-verified, decrypted, restored and validated in a separately controlled environment.

Never point a restore job at production. Never run schema migrations or DDL against live VAYRO-CORE as part of backup setup. Do not reuse ARIA or LEADORA infrastructure, credentials, buckets or data.

## Intended flow

1. GitHub Actions connects to VAYRO-CORE PostgreSQL using the protected `VAYRO_BACKUP_DATABASE_URL`.
2. PostgreSQL 17 `pg_dump` creates a custom-format logical dump.
3. The runner encrypts the dump locally with age using a public recipient key. The plaintext dump is removed before upload.
4. Only the encrypted dump and its SHA-256 checksum sidecar are uploaded to a private Cloudflare R2 bucket through its S3-compatible API.
5. The backup job checks both remote object sizes using R2 HEAD metadata, downloads the encrypted object and checksum sidecar back to the ephemeral runner, compares the downloaded sidecar byte-for-byte with the local sidecar, and verifies that the downloaded encrypted object's SHA-256 matches the locally generated hash. This proves the bytes read back at that time; it does not prove provider durability, immutability or future availability.
6. A separately authorized manual restore drill downloads the selected object, verifies its SHA-256 checksum, decrypts it using the separately protected age identity, validates the decrypted PostgreSQL archive listing, checks that the target database host differs from production, requires PostgreSQL 17 and an empty target across all non-system schemas (relations, routines, user-defined types, non-default extensions and large objects), then restores without `--clean` or `--create`. After `pg_restore` exits successfully, the workflow confirms that user relations exist on the target.
7. An operator validates schema/object counts, row counts, application invariants and representative records on the isolated clone. Record elapsed backup/restore times, dump size, checksum and observed recovery point.

The checksum detects byte changes between upload and read-back; it is not a substitute for authenticated encryption, access controls, retention or an independent restore drill. The age identity must be held outside GitHub source and outside the backup bucket.

## Protected configuration

The current workflows use GitHub Environments `vayro-backup` and `vayro-restore`. Their exact protected variable/secret names are maintained in the workflow files. Never put credential values in source code, issues, pull requests, logs or chat. Environment approvals must be configured by the authorized owner before the workflows can access production or restore credentials.

## Workflow behavior

- `.github/workflows/vayro-db-backup.yml`: manual run plus daily schedule at 02:17 UTC; restricted to `main`. Uses PostgreSQL 17 client tools, age encryption and the R2 S3-compatible API. It checks remote object sizes and performs a full object/sidecar read-back SHA-256 verification. It does not delete old objects.
- `.github/workflows/vayro-db-restore-drill.yml`: manual only and runs only from `main`. Requires the exact confirmation string `RESTORE_TO_ISOLATED_VAYRO_TEST`, a timestamp-format backup object key, valid protected configuration, a different target hostname, PostgreSQL 17 and an empty target across all non-system schemas and user objects.
- Neither workflow changes database schema, creates database roles, alters grants/RLS, or deploys the application.
- Retention and lifecycle deletion are intentionally not automated. Configure and review retention only after confirming backup cadence, restore requirements and provider billing behavior.

## Acceptance checklist — do not mark complete until evidenced

- [ ] Private R2 bucket exists in the intended account and region; the owner has reviewed current eligibility, usage terms and any billing prompts.
- [ ] R2 API credentials are restricted to the intended bucket and minimum required capabilities.
- [ ] Age recipient/private identity pair is generated and securely escrowed; private identity is not stored in source or the backup bucket.
- [ ] GitHub Environment secrets and variables are configured by the authorized owner, with required reviewer protections.
- [ ] A manual backup workflow run succeeds on the protected default branch.
- [ ] Encrypted object and checksum sidecar are present in the private bucket; no plaintext dump was uploaded.
- [ ] Both remote object sizes match the runner's local files.
- [ ] The downloaded encrypted object matches the local SHA-256, and the downloaded checksum sidecar matches the local sidecar byte-for-byte.
- [ ] The object is downloaded, checksum-verified and decrypted in the isolated restore workflow.
- [ ] The decrypted archive passes `pg_restore --list` validation.
- [ ] Restore workflow confirms user relations exist after `pg_restore` completes.
- [ ] Restore completes in a different-host, empty, disposable PostgreSQL 17 database.
- [ ] Schema and object inventory are compared with the source snapshot; row counts and application invariants are validated.
- [ ] Backup duration, restore duration, backup timestamp, checksum, dump size, RPO and RTO are recorded.
- [ ] A second independent restore drill succeeds before the release gate is closed.

## Backup scope and exclusions

This workflow is a PostgreSQL logical database backup only. It does not back up application-uploaded files or object-storage blobs, Railway volumes, deployment images, GitHub secrets, environment variables, provider-level project configuration, DNS, or external integrations. It also uses `--no-owner --no-acl`, so database roles and grants must be recreated and validated separately through a reviewed recovery procedure. Do not describe this as a complete VAYRO platform backup until file/object storage and configuration recovery are separately implemented and tested.

## Current evidence

The 2026-11-27 live audit found that the backup workflow stopped at protected-configuration validation. No dump, encrypted object, remote read-back, or restore artifact was produced. The read-back verification code in the development PR is therefore covered by synthetic CI fixtures only until the authorized owner configures the protected environment and a real backup run is approved.

**Current truthful status: BACKUP = NOT EXECUTED; RESTORE = NOT EXECUTED; RELEASE GATE = BLOCKED.** A passing synthetic test or workflow file is not evidence that a real backup exists.
