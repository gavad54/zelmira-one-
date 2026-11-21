# VAYRO product-family engineering recovery baseline
Date: 2026-11-21

## Scope and preservation rules
- VAYRO is the mother application and DANA is its internal intelligence/orchestration core.
- Product applications remain independently deployable and bounded by their own repository, data, identity, security, and release lifecycle where applicable.
- Preserve historical modules, identifiers, contracts, registries, migration crosswalks, and archive lineage. No destructive consolidation is authorized by this document.
- This document records evidence and release limitations; it does not assert production readiness.

## Repository evidence
- Pull request: #47
- Branch: `upgrade/full-independent-product-family-modules-2026-11-20`
- Verified head: `bd059491fe96ba86a3dd8e25a4da4c90f13798af`
- PR state at verification: open, draft, unmerged.
- VAYRO CI run 44889564312: completed successfully.
- npm lockfile validation run 44889564309: completed successfully.
- CodeQL run 44889564320: completed successfully.
- All three runs correspond to the verified head above.

## Product-family integration boundaries
The family must not be represented as a single shared database or shared authorization domain. Cross-product calls require explicit, versioned contracts, scoped credentials, tenant-aware authorization, idempotency, audit events, timeouts, and bounded retries. Product-specific data ownership remains with each independent product. DANA may orchestrate through approved contracts but must not bypass product authorization.

## Release blockers not proven by these CI runs
- Production deployment and production commit parity.
- Independent production databases and tenant-isolation tests across deployed services.
- Secret rotation, MFA enforcement, production authorization policy, and external identity configuration.
- Live provider connectivity, payment settlement, subscription lifecycle, and reconciliation.
- Encrypted backup plus a witnessed restore drill.
- Android release signing, device installation, and end-to-end acceptance.
- Operational monitoring, alert routing, incident response, and rollback drill.

## Required next engineering gates
1. Reconcile product ownership and API contracts without deleting historical records.
2. Run isolated integration tests for each product boundary and negative authorization cases.
3. Verify schema migrations against disposable PostgreSQL instances, then stage with backup and rollback evidence.
4. Keep payments and external side effects disabled until provider credentials, sandbox tests, reconciliation, and explicit release authorization are present.
5. Require signed build evidence and device-level smoke tests before public distribution.

## Change safety
This baseline is documentation-only. It does not merge a pull request, deploy services, alter production data, enable payments, or change credentials.
