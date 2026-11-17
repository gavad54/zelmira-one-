# VAYRO — Independent Infrastructure and Operational Key Custody

**Status:** Engineering specification and verified gap register. This document does not claim that production infrastructure or secrets have been provisioned.

## 1. Verified baseline (2026-11-17)

- Supabase project `VAYRO-CORE` exists, is `ACTIVE_HEALTHY`, PostgreSQL 17, region `eu-central-1`.
- The project is separate from ARIA. The inspected public schema contains 11 tables, all with RLS enabled; estimated row counts are zero.
- No table policies exist. No table grants to `anon`, `authenticated` or `service_role` were found. This is consistent with the current server-only data-access design; do not add browser grants without a separately reviewed authorization model.
- Migration history in the live database is empty. Repository migrations contain six ordered migration files. The live schema does not yet match the complete repository schema (including MFA and later Session columns).
- Live roles include `postgres` with login and `BYPASSRLS`; `service_role` has `BYPASSRLS` but cannot log in. The actual application connection identity has not been proven.
- No independent VAYRO application host, production backup destination, external restore drill, production email sender or production secret custody has been verified.
- The repository has a Dockerfile, Railway deployment descriptor and environment-variable names, but configuration files are not a deployed service.
- PR #5 is open, Draft and unmerged. No production change was made during this inspection.

## 2. Target topology

Keep the control plane isolated from every product data plane:

1. **Source and build:** GitHub protected branch, reviewed PR, locked dependencies, CI and CodeQL. Production deployment must use an immutable commit SHA and a separate approval gate.
2. **Application runtime:** one dedicated VAYRO web service in a separately approved host/project. Use separate staging and production environments; do not reuse ARIA or LEADORA credentials, volumes, databases or object storage.
3. **Database:** existing VAYRO-CORE PostgreSQL project, with a dedicated login role for the application. The runtime role must not be superuser and must not have `BYPASSRLS`. Keep migration/administrative credentials separate from runtime credentials.
4. **Secrets:** protected host secret store or an approved external secret manager. No production secret in Git, build arguments, image layers, browser bundles, logs, issue comments or chat.
5. **Backup:** independent object-storage account/provider, preferably separate from both app hosting and primary database provider; encryption before upload; versioning/immutability; separately controlled restore identity.
6. **Operations:** HTTPS, health and readiness probes, structured redacted logs, alerting, rollback to a known immutable image, incident and key-recovery runbooks.

The host/provider and plan are not selected here because account access, cost and regional/legal constraints must be verified first. Do not create paid resources without explicit cost approval.

## 3. Runtime identity and database access

### Required properties

- Dedicated role name: `vayro_app` (proposed; verify availability before provisioning).
- `LOGIN = true`, `SUPERUSER = false`, `BYPASSRLS = false`.
- No membership in `postgres`, `service_role`, `supabase_admin` or other privileged roles.
- Grant only `CONNECT` to the VAYRO database, `USAGE` on the required schema, and table-level `SELECT, INSERT, UPDATE, DELETE` required by the application.
- No `CREATE`, `ALTER`, `DROP`, `TRUNCATE`, ownership, role administration or schema migration rights.
- Use a separate short-lived migration principal for reviewed migrations. Never put its credential in the runtime environment.
- Verify the runtime identity from inside the running application connection using `current_user`, `rolsuper`, `rolbypassrls` and `rolcanlogin`. Fail readiness if the identity is privileged or cannot log in.
- Keep browser roles without table grants. RLS-without-policy findings are expected under this server-only model; do not add permissive policies merely to silence an advisor.

### Baseline/migration gate

Do not run `prisma migrate deploy` against the live project yet. First:
1. Export a verified independent backup.
2. Compare every live type, table, column, default, index, constraint, extension, grant and RLS flag against `prisma/schema.prisma` and all six repository migrations.
3. Resolve drift, especially MFA tables/columns and Session assurance/revocation/activity columns.
4. Produce a reviewed baseline procedure that marks the already-provisioned initial schema as applied only after exact equivalence is proven; do not replay the initial CREATE TABLE migration against existing tables.
5. Test baseline plus all forward migrations against a disposable PostgreSQL 17 database and test restore/rollback there.
6. Obtain owner approval before any production baseline metadata or DDL operation.

## 4. Operational secret inventory

Only names and custody requirements belong in this repository. Values must be set directly in the approved provider's protected secret manager.

| Secret/configuration | Purpose | Required handling |
|---|---|---|
| `DATABASE_URL` | Runtime DB connection | Dedicated least-privilege role; never use the administrative URL |
| `VAYRO_MFA_ENCRYPTION_KEY` | AES-256-GCM TOTP seed encryption | 32 random bytes / 64 hex characters; unique per environment; versioned rotation and recovery procedure |
| `VAYRO_OWNER_BOOTSTRAP_TOKEN` | One-time first-owner bootstrap | High-entropy, one use; remove immediately after owner bootstrap |
| `EMAIL_API_KEY` or Gmail OAuth credentials | Transactional email | Provider-specific restricted credential; rotate and test delivery |
| `EMAIL_PROVIDER`, `EMAIL_FROM` | Email adapter/sender | Verified sender; test sender is not production delivery |
| `TRUSTED_PROXY_HOPS` | Client-IP trust boundary | Set only after verifying exact proxy chain; never guess |
| Payment provider credentials (future) | Payment/webhook operations | Not provisioned; separate restricted credentials per environment, signed webhooks and rotation |
| Backup encryption/KMS material (future) | Backup confidentiality/recovery | Separate custody from backup bucket and runtime app; dual-control recovery where available |
| Android signing key (future) | Official release signing | Owner-controlled secure custody; never commit or place in ordinary app runtime secrets |

Do not create dummy values to make readiness green. A syntactically valid key is not evidence that key custody, recovery, rotation or service operation has been tested.

## 5. Key lifecycle controls

For every production key record only metadata: key identifier/version, purpose, environment, owner/custodian, creation date, rotation due date, last successful validation, recovery location and revocation status. Never record the key value.

- Generate high-entropy keys using a cryptographically secure generator in a trusted local or provider environment.
- Transfer directly into the protected secret manager; do not paste into source code, CI logs, chat or issue trackers.
- Separate development, staging and production keys.
- Restrict read access to the minimum service identity and designated owner/custodian.
- Rotate by versioned deployment: introduce new key, validate new writes/reads, re-encrypt or retain old-key decrypt support as designed, then revoke old key only after recovery and rollback are proven.
- Test disaster recovery with the matching key version without exposing it.
- Revoke immediately on suspected disclosure and record incident evidence.

## 6. Backup and recovery target

Proposed objectives pending owner ratification:
- Core control-plane RPO: 15 minutes.
- Core control-plane RTO: 4 hours.
- Encrypted daily full backup plus supported incremental/WAL capture.
- Retention target: 30 daily, 12 monthly and 1 annual recovery point, subject to cost and legal review.
- Independent provider/account and separate access identity; object versioning/immutability; SHA-256 checksum and schema/migration metadata.
- Restore into an isolated environment at least quarterly and after material schema/key changes.
- Record measured RPO/RTO, checksum, migration version, restore results, tenant-isolation checks and reviewer.

The existing CI logical backup/restore smoke test is not a production backup or an independent restore drill.

## 7. Host deployment gate

Before selecting or creating a host:
- Confirm owner account access, project ownership, region, pricing, resource limits and data residency.
- Create separate VAYRO staging and production services only after cost/owner approval.
- Configure immutable image/commit deployment, HTTPS, health check `/api/health`, readiness check `/api/ready`, restart policy, resource limits, logs, alerts and rollback.
- Set protected environment variables directly in the host dashboard.
- Verify no cross-product credentials, shared storage or shared database.
- Confirm the running commit SHA matches the approved release SHA.

A `railway.toml` or Dockerfile in Git does not prove that Railway service exists or is running.

## 8. Current execution status

| Workstream | Status |
|---|---|
| Dedicated VAYRO-CORE project | Exists; active |
| Initial schema | Exists; 11 tables, empty |
| Migration baseline | Blocked pending catalog/schema reconciliation |
| Least-privilege runtime DB role | Not provisioned/verified |
| Runtime identity readiness guard | Added in repository; CI verification pending |
| Dedicated app hosting | Not provisioned |
| Production MFA key custody | Not configured/verified |
| Email provider and verified sender | Not configured/verified |
| Independent encrypted backup | Not configured |
| Independent restore drill | Not performed |
| Production deployment | Not authorized |

## 9. Prohibited until separate owner approval

No production migration/baseline, role/grant/policy change, secret creation or rotation, paid resource creation, deployment, DNS cutover, customer data ingestion, payment activation, PR merge or public release is performed by this engineering specification.
