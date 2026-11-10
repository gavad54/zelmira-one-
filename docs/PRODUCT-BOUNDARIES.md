# Product boundaries

VAYRO is the central command and governance plane. It does not own or execute the operational business workflows of its independent applications.

| Application | Domain | Independence boundary |
|---|---|---|
| ARVAND | International trade, import and export | Own runtime, operational database, auth, APIs, backup and commercial lifecycle |
| CHARSU | Marketplace and commerce network | Own runtime, operational database, auth, APIs, backup and commercial lifecycle |
| GANJINEH | Digital stores and e-commerce | Own runtime, operational database, auth, APIs, backup and commercial lifecycle |
| NEGAH | Creative studio and digital production | Own runtime, operational database, auth, APIs, backup and commercial lifecycle |
| SEPEHR | Cloud and digital infrastructure | Own runtime, operational database, auth, APIs, backup and commercial lifecycle |
| NAMA | Website and landing-page builder | Own runtime, operational database, auth, APIs, backup and commercial lifecycle |
| PAYAM | Marketing and customer growth | Own runtime, operational database, auth, APIs, backup and commercial lifecycle |
| LEADORA | Distribution, sales, inventory and commercial operations | Independent legacy product; preserve scope and data |
| ARIANA | Accounting, finance and ERP | Separate accounting/ERP product; never merge into ARIA |
| ARIA | Social, services, listings and marketplace | No accounting or ERP modules |
| ARMIN MARKET | Buyer requests and supplier quotations | Independent buyer/supplier marketplace; no assumed custody of payments |

DANA is a shared AI/orchestration capability of VAYRO, not an independent application.

## VAYRO owns

- Product directory and portfolio-level status visibility.
- Owner command center and governance workflows.
- Optional identity federation and central entitlement references.
- Subscription and revenue visibility at portfolio level.
- Integration registration, API governance and revocation.
- AI/automation orchestration policy and audit.
- Infrastructure health signals and release governance.

VAYRO does not own another application's operational database, customer transactions, inventory, accounting records, private files or business-specific authorization decisions.

## Mandatory rules

1. Each application can be installed, used, purchased, supported, backed up, restored, deployed and released independently.
2. No product may require another product's runtime for its own core workflows.
3. No shared operational database, schema, database credentials or implicit cross-product reads.
4. Cross-product communication is through documented, versioned APIs only.
5. Each API integration has a dedicated service identity, least-privilege scopes, explicit fields, audit logging, timeout, idempotency and revocation.
6. Optional SSO does not remove local authentication, local authorization or account recovery.
7. A VAYRO OWNER role does not automatically grant access to product business records.
8. Product failure, deployment, migration or rollback must not cascade to another product.
9. No product is labelled production-active merely because its URL is configured or it appears in the catalogue.
10. ARIA must remain free of accounting and ERP; ARIANA retains that domain.

## Current evidence boundary

The VAYRO repository's catalogue and owner dashboard describe product metadata. They are not evidence that each product already has a separate repository, runtime, database, backup, restore drill or commercial launch. Each application requires its own implementation and release evidence.