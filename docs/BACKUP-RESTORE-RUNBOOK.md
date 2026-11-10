# VAYRO encrypted backup and isolated restore runbook

## Status and safety boundary

This change adds workflow scaffolding only. It does not create a Backblaze account, bucket, key, GitHub secret, backup object or restore database. It does not prove that a backup has run or that a restore succeeded. Keep the release gate OPEN until an actual encrypted backup is downloaded, decrypted, restored and validated in a separately controlled environment.

Never point a restore job at production. Never run schema migrations or DDL against live VAYRO-CORE as part of backup setup. Do not reuse ARIA or LEADORA infrastructure, credentials, buckets or data.

## Intended flow

1. GitHub Actions connects to VAYRO-CORE PostgreSQL using the protected VAYRO_BACKUP_DATABASE_URL.
2. PostgreSQL 17 pg_dump creates a custom-format logical dump.
3. The runner encrypts the dump locally with age using a public recipient key. The plaintext dump is removed before upload.
4. Only the encrypted dump and its SHA-256 checksum are uploaded to a private Backblaze B2 bucket through its S3-compatible endpoint.
5. The backup job reads both uploaded objects' B2 HEAD metadata and compares remote ContentLength values with the local file sizes. This detects missing/truncated uploads; it is not a cryptographic verification of the stored object.
6. A separately authorized manual restore drill downloads the selected object, verifies its SHA-256 checksum, decrypts it using the separately protected age identity, validates the decrypted PostgreSQL archive listing, checks that the target database host differs from production, requires PostgreSQL 17 and an empty target public schema, then restores without --clean or --create.
7. An operator validates schema/object counts, row counts, application invariants and representative records on the isolated clone. Record elapsed backup/restore times, dump size, checksum and observed recovery point.

The checksum detects transfer corruption; it is not a substitute for authenticated encryption. The age identity must be held outside GitHub source and outside the backup bucket.

## GitHub Actions configuration

Create these repository Secrets only after the authorized account owner has established provider resources and reviewed eligibility, free-tier limits, payment method requirements and overage terms. Never put values in source code, issues, pull requests or chat.

| Secret | Purpose |
|---|---|
| VAYRO_BACKUP_DATABASE_URL | PostgreSQL connection used by pg_dump; use a dedicated least-privilege identity where supported |
| VAYRO_B2_KEY_ID | B2 application key ID scoped to the one private bucket |
| VAYRO_B2_APPLICATION_KEY | B2 application key secret |
| VAYRO_BACKUP_AGE_IDENTITY | Private age identity used only by the manual restore workflow |
| VAYRO_ISOLATED_RESTORE_DATABASE_URL | Connection to a separate, empty, disposable PostgreSQL database on a different host |

Create these repository Variables:

| Variable | Purpose |
|---|---|
| VAYRO_BACKUP_AGE_RECIPIENT | Public age recipient corresponding to the protected private identity |
| VAYRO_B2_BUCKET | Name of the private B2 bucket |
| VAYRO_B2_S3_ENDPOINT | Region-specific B2 S3 endpoint displayed by Backblaze |
| VAYRO_B2_REGION | Region identifier matching that endpoint |

The restore workflow compares the production and restore database hostnames and refuses a same-host target. It also requires a backup object key matching the workflow's generated timestamped key format, PostgreSQL 17 on the target, a valid PostgreSQL archive and an empty public schema (relations, routines and user-defined types). These are guardrails, not a complete substitute for human review: provision a separate disposable restore database on a separate host and verify the target URL before adding the secret. Hostname comparison cannot detect every possible DNS alias or network-level route to the same underlying server; the operator must independently verify the target host.

## Workflow behavior

- .github/workflows/vayro-db-backup.yml: manual run plus daily schedule at 02:17 UTC. Uses PostgreSQL 17 client tools, age encryption and the B2 S3 API. It checks both uploaded objects' remote sizes. It does not delete old objects.
- .github/workflows/vayro-db-restore-drill.yml: manual only. Requires the exact confirmation string RESTORE_TO_ISOLATED_VAYRO_TEST, a timestamp-format backup object key, valid credentials, a different target hostname, PostgreSQL 17 and an empty target public schema.
- Neither workflow changes database schema, creates database roles, alters grants/RLS, or deploys the application.
- Retention and lifecycle deletion are intentionally not automated. Configure and review retention only after confirming backup cadence, restore requirements and provider billing behavior.

## Acceptance checklist — do not mark complete until evidenced

- [ ] B2 private bucket exists in the intended region; account owner has reviewed eligibility, payment method and overage terms.
- [ ] B2 application key is restricted to the one bucket and minimum required list/read/write capabilities.
- [ ] Age recipient/private identity pair is generated and securely escrowed; private identity is not stored in source or B2.
- [ ] GitHub secrets and variables are configured by the authorized owner.
- [ ] A manual backup workflow run succeeds on the protected default branch.
- [ ] Encrypted object and checksum are visible in the private bucket; no plaintext dump was uploaded.
- [ ] Both remote object sizes match the runner's local files as recorded in the workflow summary.
- [ ] The object is downloaded, checksum verified and decrypted in the isolated restore workflow.
- [ ] The decrypted archive passes pg_restore --list validation.
- [ ] Restore completes in a different-host, empty, disposable PostgreSQL 17 database.
- [ ] Schema and object inventory are compared with the source snapshot; representative counts and application invariants are validated.
- [ ] Backup duration, restore duration, backup timestamp, checksum, dump size, RPO and RTO are recorded.
- [ ] A second independent restore drill succeeds before the release gate is closed.

## Operational notes

- Supabase Free does not provide the independent offsite backup guarantee required by the VAYRO release gate. B2 free allowances are subject to current provider terms and usage; requests, storage above the allowance and other billable conditions must be checked in the owner account before activation.
- Use a private bucket. Do not enable public access.
- Do not enable automatic deletion/retention until the owner approves a retention policy and at least one independent restore has passed.
- A successful GitHub workflow is evidence of that specific run only. It is not evidence of ongoing monitoring, provider durability guarantees or successful application-level recovery.
