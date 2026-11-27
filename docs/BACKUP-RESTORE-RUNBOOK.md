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
6. A separately authorized manual restore drill downloads the selected object, verifies its SHA-256 checksum, decrypts it using the separately protected age identity, validates the decrypted PostgreSQL archive listing, checks that the target database host differs from production, requires PostgreSQL 17 and an empty target across all non-system schemas (relations, routines, user-defined types, non-default extensions and large objects), then restores without --clean or --create. After pg_restore exits successfully, the workflow confirms that user relations exist on the target.
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

## Mandatory GitHub Environment approval gates

Before either workflow is enabled, create two GitHub Actions Environments in repository Settings → Environments:

- `vayro-backup`: configure required reviewers so the repository owner explicitly approves every backup job before production database and B2 credentials are released to the runner.
- `vayro-restore`: configure the repository owner as a required reviewer, enable prevention of self-review where GitHub offers that control, and restrict deployment branches to `main`. Every restore must receive a separate human approval.
- Store the workflow's required secrets and variables in the matching Environment rather than broad repository-level scope where possible. The same production connection and B2 credentials are needed in both environments; the private age identity and isolated restore connection are needed only in `vayro-restore`.
- Do not treat the workflow's typed confirmation input as authorization. It is only an additional guard; the Environment approval is the authorization gate.
- If the Environment protections and scoped values are not configured and verified by the owner, do not run either workflow and keep the release gate open.

## Workflow behavior

- .github/workflows/vayro-db-backup.yml: manual run plus daily schedule at 02:17 UTC. Uses PostgreSQL 17 client tools, age encryption and the B2 S3 API. It checks both uploaded objects' remote sizes. It does not delete old objects.
- .github/workflows/vayro-db-restore-drill.yml: manual only and runs only from `main`. Requires the exact confirmation string RESTORE_TO_ISOLATED_VAYRO_TEST, a timestamp-format backup object key, valid credentials, a different target hostname, PostgreSQL 17 and an empty target across all non-system schemas and user objects.
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
- [ ] Restore workflow confirms user relations exist after pg_restore completes.
- [ ] Restore completes in a different-host, empty, disposable PostgreSQL 17 database.
- [ ] Schema and object inventory are compared with the source snapshot; representative counts and application invariants are validated.
- [ ] Backup duration, restore duration, backup timestamp, checksum, dump size, RPO and RTO are recorded.
- [ ] A second independent restore drill succeeds before the release gate is closed.

## Backup scope and exclusions

This workflow is a PostgreSQL logical database backup only. It does not back up application-uploaded files or object-storage blobs, Railway volumes, deployment images, GitHub secrets, environment variables, provider-level project configuration, DNS, or external integrations. It also uses `--no-owner --no-acl`, so database roles and grants must be recreated and validated separately through a reviewed recovery procedure. Do not describe this as a complete VAYRO platform backup until file/object storage and configuration recovery are separately implemented and tested.

## Operational notes

- Supabase Free does not provide the independent offsite backup guarantee required by the VAYRO release gate. B2 free allowances are subject to current provider terms and usage; requests, storage above the allowance and other billable conditions must be checked in the owner account before activation.
- Use a private bucket. Do not enable public access.
- Do not enable automatic deletion/retention until the owner approves a retention policy and at least one independent restore has passed.
- A successful GitHub workflow is evidence of that specific run only. It is not evidence of ongoing monitoring, provider durability guarantees or successful application-level recovery.

## Current blocker correction — 2026-11-24

**Canonical destination: Cloudflare R2 only.** Older references in this runbook to Backblaze B2, `VAYRO_B2_*` secrets, or a B2 endpoint are historical and must not be used for the current workflows.

The current workflow files are:

- `.github/workflows/vayro-db-backup.yml`
- `.github/workflows/vayro-db-restore-drill.yml`

They expect these exact GitHub Environment values:

**Environment `vayro-backup`**
- Secrets: `VAYRO_BACKUP_DATABASE_URL`, `VAYRO_R2_ACCESS_KEY_ID`, `VAYRO_R2_SECRET_ACCESS_KEY`.
- Variables: `VAYRO_BACKUP_AGE_RECIPIENT`, `VAYRO_R2_BUCKET`, `VAYRO_R2_S3_ENDPOINT`, `VAYRO_R2_REGION=auto`.

**Environment `vayro-restore`**
- Secrets: `VAYRO_BACKUP_DATABASE_URL`, `VAYRO_ISOLATED_RESTORE_DATABASE_URL`, `VAYRO_BACKUP_AGE_IDENTITY`, `VAYRO_R2_ACCESS_KEY_ID`, `VAYRO_R2_SECRET_ACCESS_KEY`.
- Variables: `VAYRO_R2_BUCKET`, `VAYRO_R2_S3_ENDPOINT`, `VAYRO_R2_REGION=auto`.

### Observed provider blocker

A read-only Cloudflare R2 bucket-list request returned HTTP 403 / error 10042, indicating R2 has not yet been enabled in the account. No bucket, access key, or paid service was created. Neither workflow has been run successfully; there is no verified encrypted object or restore artifact.

### Owner actions required before execution

1. In the Cloudflare account, enable R2 after reviewing the current account eligibility, payment/usage terms and any billing prompts.
2. Create a **private** bucket in the intended account; do not enable public access.
3. Create a least-privilege R2 API key scoped to that bucket and provide its values only through the protected GitHub Environments.
4. Generate an age keypair locally; store the recipient as a GitHub Environment variable and keep the private identity only in the restore Environment secret / approved offline escrow.
5. Create both GitHub Environments with required owner approval and branch restrictions before adding production or restore credentials.
6. Configure the isolated restore database on a different host from production. Do not reuse the production database URL.
7. Run the backup manually from the protected default branch, verify the encrypted object and checksum, then perform the separate restore drill.

Until those owner actions and the evidence checklist pass, **BACKUP = NOT EXECUTED; RESTORE = NOT EXECUTED; RELEASE GATE = BLOCKED**. Do not infer readiness from workflow files existing in a draft branch.


## Addendum — 2026-11-27: encrypted object read-back verification

The backup workflow now performs an additional verification after uploading the encrypted dump and its SHA-256 sidecar to the private R2 bucket:

1. It checks the remote object sizes using R2 HEAD metadata.
2. It downloads both objects back to the ephemeral runner.
3. It compares the downloaded sidecar byte-for-byte with the locally generated sidecar.
4. It independently computes SHA-256 for the local encrypted dump and the downloaded encrypted dump; both must match the locally generated checksum.
5. The read-back files are removed from the runner after verification. The plaintext dump is not uploaded.

The reusable verifier is `scripts/verify-encrypted-backup-readback.sh`; synthetic tests in `tests/verify-encrypted-backup-readback.sh` prove that altered object bytes and altered sidecars are rejected. VAYRO CI runs these tests without production credentials.

This verifies the bytes returned by the storage endpoint during that specific run. It does not prove retention, immutability, future availability, backup completeness, or restore correctness. A real backup artifact and isolated restore drill remain mandatory before the release gate can pass.

The live audit on 2026-11-27 found that protected backup configuration was not complete, so no dump, upload, read-back or restore artifact was produced. The code change is currently verified only with synthetic CI fixtures.
