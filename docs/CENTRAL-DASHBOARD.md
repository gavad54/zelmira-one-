# VAYRO Central Dashboard — Engineering Scope

## Portfolio model

VAYRO is the mother platform and owner/governance layer. The central catalogue contains exactly eleven independent apps:

1. ARVAND — international trade.
2. CHARSU — marketplace.
3. GANJINEH — online store builder.
4. NEGAH — creative studio.
5. SEPEHR — cloud infrastructure.
6. NAMA — website and landing-page builder.
7. PAYAM — marketing and sales.
8. LEADORA — business management, distribution and operations.
9. ARIANA — accounting, finance, tax and ERP.
10. ARIA — intelligent social, services and marketplace super-app; no accounting or ERP.
11. ARMIN MARKET — buyer requests and supplier quotations.

DANA is the shared AI intelligence, management and orchestration command plane across these eleven apps. It is not a twelfth independent app and is not included in the eleven-app catalogue.

## Delivered in this engineering slice

- Owner-only dashboard at `/owner`, guarded by a verified, active OWNER session.
- Eleven fixed independent app identities in the server-side catalogue.
- Explicit, idempotent catalogue initialization. Existing product status, description and URL are not overwritten.
- Owner-only catalogue read, status/destination update, and audit event in the same transaction.
- Aggregate counts for tenants and licenses.
- HTTPS-only product destinations; ACTIVE catalogue status requires a destination.
- No browser database access, no client role, no product database merging, and no automatic activation.
- Focused unit and integration tests for catalogue identity and configuration validation.
- The owner dashboard labels and count denominator reflect eleven apps.

## Meaning of status

PLANNED, ACTIVE, MAINTENANCE and RETIRED describe the central catalogue only. ACTIVE does not assert that a product is deployed, healthy, commercially enabled, security-approved or ready for customers. Product catalogue presence is not evidence that an independent product is implemented.

## Deliberately not included

Product-specific applications, product health probes, customer billing, license issuance/renewal, payment processing, tenant product entitlements, support impersonation, analytics pipelines, or AI agent execution. Those require separate product/API contracts, authorization tests, operational evidence and release approval.

## Safe rollout

1. Review the code and exact-commit CI result on the existing draft PR.
2. Reconcile and independently back up the VAYRO database before applying any schema or data migration. This dashboard change uses existing Product, License, Tenant and AuditEvent models and adds no schema migration.
3. After database baseline and owner account readiness, the owner may explicitly initialize the catalogue.
4. Configure product HTTPS destinations only after each independent product endpoint is verified.
5. Keep customer onboarding and public release disabled until the full release gates pass.
