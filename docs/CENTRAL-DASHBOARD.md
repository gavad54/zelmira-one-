# VAYRO Central Dashboard — Engineering Scope

## Delivered in this slice
- Owner-only dashboard at `/owner`, guarded by a verified, active OWNER session.
- Eight fixed catalog identities: ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM and DANA.
- Explicit, idempotent catalog initialization. Existing product status, description and URL are not overwritten.
- Owner-only catalog read, status/destination update, and audit event in the same transaction.
- Aggregate counts for tenants and licenses.
- HTTPS-only product destinations; ACTIVE catalog status requires a destination.
- No browser database access, no client role, no product database merging, and no automatic activation.
- Focused unit tests for catalog identity and configuration validation.

## Meaning of status
PLANNED, ACTIVE, MAINTENANCE and RETIRED describe the central catalog only. ACTIVE does not assert that a product is deployed, healthy, commercially enabled, security-approved or ready for customers. Production release remains governed by the independent release gates.

## Deliberately not included
Product-specific applications, product health probes, customer billing, license issuance/renewal, payment processing, tenant product entitlements, support impersonation, analytics pipelines, or AI agent execution. Those require separate product/API contracts, authorization tests, operational evidence and release approval.

## Safe rollout
1. Review the code and CI result on the existing draft PR.
2. Reconcile and independently back up the VAYRO database before applying any schema or data migration. This change uses existing Product, License, Tenant and AuditEvent models and adds no schema migration.
3. After database baseline and owner account readiness, the owner may explicitly initialize the catalog.
4. Configure product HTTPS destinations only after each independent product endpoint is verified.
5. Keep customer onboarding and public release disabled until the full release gates pass.
