# VAYRO — Backup, Restore and Disaster Recovery

## Non-negotiable design
A backup is not proven until it has been restored into an isolated environment and checked. A Railway volume snapshot alone is not an independent backup.

## Recommended target policy
These are engineering recommendations to ratify before production:
- Database recovery point objective (RPO): 15 minutes for critical control-plane data.
- Recovery time objective (RTO): 4 hours for the core control plane.
- Encrypted daily full backup plus continuous/WAL or frequent incremental capture where supported.
- Retain 30 daily, 12 monthly and 1 annual recovery point, subject to cost and legal retention.
- Store encrypted copies in a separate provider/account and separate region where legally permitted.
- Keep encryption keys separate from backup storage; restrict and audit key access.

## Backup scope
- PostgreSQL database and schema/migration version.
- Object storage metadata and objects, including checksums and version IDs.
- Product registry, entitlements and platform configuration.
- Required audit evidence, subject to retention policy.
- Infrastructure configuration and deployment manifests, excluding secrets.
- Key inventory and recovery procedures; never export raw signing keys into backup archives.

## Execution controls
1. Use a dedicated least-privilege backup identity.
2. Create a consistent database snapshot or logical dump.
3. Encrypt before transfer; verify TLS in transit.
4. Upload to independent object storage with versioning and retention lock where available.
5. Record timestamp, source environment, schema version, checksum, size and result.
6. Alert on missed, partial or unusually small backups.
7. Never overwrite the only known-good backup.

## Restore drill
1. Provision a clean isolated environment with no production network route.
2. Retrieve a selected backup using a separately controlled restore identity.
3. Verify archive checksum and signature.
4. Restore database and object data.
5. Apply only migrations compatible with the restored snapshot.
6. Run schema, row-count, referential-integrity and application smoke checks.
7. Confirm tenant separation with cross-tenant negative tests.
8. Record measured RPO/RTO, exceptions and reviewer approval.
9. Destroy temporary restore environment securely after evidence is retained.

## Evidence required for release
- Backup job logs and object-storage version identifiers.
- Checksums and encryption metadata.
- Independent restore log and test report.
- Evidence that restore was not performed against production.
- Named reviewer and timestamp.
- Documented retention and deletion policy.

## Current status
This file specifies the required design. It does not prove that backups, external storage, encryption keys, automated jobs or restore tests currently exist. Production backup automation must not be enabled until credentials, provider, region, retention, cost and legal constraints are confirmed.
