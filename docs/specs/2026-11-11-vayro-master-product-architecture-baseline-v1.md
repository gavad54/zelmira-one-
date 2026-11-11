# VAYRO Master Product & Architecture Baseline
**Document ID:** VAYRO-MPAB-001  
**Version:** 1.0  
**Status:** Proposed baseline — owner-approved for repository registration; pending owner document review  
**Date:** 2026-11-11  
**Repository:** `gavad54/zelmira-one-`

## 1. Purpose and authority

This document establishes the product-family and architecture baseline for VAYRO. It consolidates the current product boundaries and the owner's latest direction into one reference for subsequent product specification, engineering planning, implementation, verification and release.

The baseline is intended to reduce repeated ideation, scope drift, duplicated work and incompatible product boundaries. It preserves the existing project structure and capabilities: this is an upgrade and clarification, not authorization to delete, merge, replace or rewrite existing products or features.

This document records a design decision. It is **not** evidence that every product is implemented, secure, operational, commercially available or release-ready.

## 2. Fixed product-family definition

VAYRO is the mother application and platform governance surface. The family contains exactly eleven independent products:

| Product | Primary mission | Explicit boundary |
|---|---|---|
| **ARVAND** | International trade: import, export and trade operations | Trade workflows; not the owner of other products' data |
| **CHARSU** | General marketplace and commerce network | Buyer/seller discovery and marketplace workflows |
| **GANJINEH** | Digital stores and direct e-commerce | Storefront, catalog, orders and store operations |
| **NEGAH** | Creative studio and digital production | Creative briefs, production, review and delivery |
| **SEPEHR** | Cloud and digital infrastructure services | Infrastructure control remains isolated and privileged |
| **NAMA** | Website, landing-page and page builder | Page creation, publishing and site management |
| **PAYAM** | Marketing and customer growth | Consent-aware campaigns, customer communication and analytics |
| **LEADORA** | Distribution, sales, inventory and commercial operations | Distribution operations; not the accounting/ERP system of record |
| **ARIANA** | Accounting, finance and ERP | Sole product boundary for accounting and ERP capabilities |
| **ARIA** | Social, communications, services and listings | Must not contain accounting, finance-ledger or ERP modules |
| **ARMIN MARKET** | Buyer requests, supplier quotations and sourcing | Request/quotation workflows; does not take custody of buyer/supplier funds |

### 2.1 DANA classification

DANA is the AI intelligence, analysis and orchestration capability of the VAYRO command center. It is **not a twelfth product**, is not an independently marketed product in this baseline, and must not be counted among the eleven products. Its access to product data and actions is explicitly scoped, authorized, logged and revocable.

### 2.2 Preservation rule

Existing repositories, modules, workflows, data, assets and capabilities must be inventoried before changes. No capability may be removed, silently reclassified, merged into another product or migrated without an impact assessment and explicit owner approval where product scope, data ownership or irreversible behavior changes.

## 3. Architecture decision

Adopt a **hybrid product-oriented architecture**:

1. A VAYRO platform layer provides shared identity, authorization, governance, licensing, billing, audit, integration contracts and command-center capabilities.
2. Each of the eleven products retains a distinct product identity, domain model, data ownership boundary, authorization policy, deployment/release evidence and operational lifecycle.
3. Product-to-product communication occurs only through reviewed, versioned APIs or events with scoped service identities, least privilege, timeouts, idempotency where appropriate, audit trails and revocation.
4. Shared navigation, single sign-on or consolidated reporting does not imply shared database ownership.
5. A customer must be able to acquire and use an eligible product independently; a product must not require another product unless an explicitly documented optional integration is selected.

A single shared database for all product domains is not the default. Any shared platform data is limited to what is necessary for platform identity, tenant routing, entitlements, billing references and governance. Product business records remain owned by their respective products.

## 4. VAYRO platform capabilities

The following are logical capabilities; they may be implemented as bounded modules or services according to the existing codebase and operational constraints. This list does not mandate premature microservice proliferation.

| Capability | Responsibility |
|---|---|
| **VAYRO ID** | Identity, authentication, sessions, verification and account lifecycle |
| **VAYRO ACCESS** | Server-side roles, permissions, tenant membership and product entitlements |
| **VAYRO CORE** | Minimal shared platform records and core contracts; not a universal product database |
| **VAYRO LICENSE** | Product licenses, plans, limits, renewals and entitlement state |
| **VAYRO BILLING** | Payment references, invoices, refunds, reconciliation and billing events |
| **VAYRO CONNECT** | Versioned, scoped and revocable product integrations |
| **VAYRO ADMIN** | Owner controls, platform configuration and governance |
| **VAYRO AUDIT** | Security and business audit events with traceable actor and action |
| **VAYRO BACKUP** | Backup policy, retention, integrity verification and restore exercises |
| **DANA** | Authorized AI analysis, recommendations and workflow orchestration |

## 5. Command center

The VAYRO command center is the owner and platform-operations control surface. It should provide:

- **Owner dashboard:** overall health, product status, release posture, key operational indicators and outstanding blockers.
- **Product portfolio:** product registry, owners, versions, dependencies, lifecycle, feature flags and independent release status.
- **Identity and access:** user and organization administration, roles, permissions, product access and auditable revocation.
- **Commercial operations:** plans, licenses, subscriptions, invoices, payment status, refunds and product-level revenue reporting.
- **Operations and reliability:** service health, logs, alerts, incidents, capacity and recovery status.
- **Security and audit:** access reviews, privileged actions, policy status, security findings and audit trail.
- **Backup and recovery:** backup freshness, integrity/checksum evidence, restore-test records and RPO/RTO measurements.
- **Release governance:** build evidence, test results, approvals, staged rollout, rollback readiness and release history.
- **DANA workspace:** authorized summaries, recommendations and human-approved orchestration.

### 5.1 Future Development Lab

A dedicated command-center area named **Future Development Lab** (آزمایشگاه توسعه و آینده) must be designed as an extensible capability for later product design and change. It should support:

1. Idea intake and structured problem statements.
2. Impact analysis across products, data, APIs, security, cost and operations.
3. Design proposals and versioned decision records.
4. Isolated prototypes and feature branches/environments.
5. Automated tests, compatibility checks and security review.
6. Owner review and approval workflows.
7. Controlled rollout, monitoring and rollback.

The Lab is a proposal-and-validation environment, not a bypass around governance. It must never directly modify production or publish a feature simply because an AI agent or user entered an idea. Every change follows the same review, test, authorization and release controls as other engineering work.

## 6. Product definition standard

Before a product is declared implementation-ready, its product specification must define:

- Target users, primary jobs-to-be-done and validated problem statement.
- Value proposition and differentiators.
- Core workflows and user journeys, including error and recovery paths.
- Functional scope, non-functional requirements and explicit exclusions.
- Data classification, data ownership, tenant isolation and retention rules.
- Roles, permissions, administrative controls and audit requirements.
- External integrations and versioned API/event contracts.
- Monetization, packaging, licensing and support model.
- Accessibility, localization and responsive/mobile requirements.
- MVP boundary, measurable acceptance criteria and release gates.

### 6.1 Initial capability direction

These capability groups are planning scope, not claims of existing implementation:

- **ARVAND:** trade parties, product/trade records, quotations, order tracking, trade documents, logistics milestones and trade analytics.
- **CHARSU:** seller/buyer profiles, listings, taxonomy, search, discovery, messaging, order lifecycle and marketplace moderation.
- **GANJINEH:** storefront creation, catalog/variants, pricing, inventory, orders, promotions, shipping/payment integrations and store analytics.
- **NEGAH:** creative briefs, project intake, content/design production, asset/version management, client review, approvals and delivery.
- **SEPEHR:** infrastructure/service provisioning, hosting, resource usage, monitoring, access control, alerting and operational reporting.
- **NAMA:** responsive page editor, templates, domain/publishing workflow, forms, SEO controls, version history and controlled integrations.
- **PAYAM:** consent and contact preferences, audience segmentation, campaign management, permitted messaging, conversion analytics and suppression controls.
- **LEADORA:** distribution catalog, stock, sales orders, purchasing, warehouse operations, routes/delivery, customer/supplier operations and distribution analytics.
- **ARIANA:** accounting ledger, chart of accounts, vouchers, receivables/payables, treasury, financial statements, tax-related workflows and ERP capabilities.
- **ARIA:** profiles, social content, discovery, communication, listings and service interactions; explicitly no accounting/ERP.
- **ARMIN MARKET:** buyer request creation, specification, supplier invitation, quotation intake, comparison, negotiation and request tracking; no custody of buyer/supplier funds.

## 7. Security, privacy and AI governance

- Authorization is enforced server-side for every protected operation. Browser-supplied tenant or role identifiers are never trusted as proof of authority.
- Tenant membership and product entitlement are derived from authenticated, server-verified state.
- Apply least privilege, deny-by-default behavior, secure session handling, privileged-user MFA and auditable owner actions.
- Keep secrets in protected runtime/CI secret stores; never commit or expose secret values in logs, documentation or chat.
- Product data remains isolated by default. Cross-product access requires an explicit contract, narrow scope, service identity, purpose and revocation path.
- DANA uses allowlisted tools and scoped identities. Consequential actions (payments, deletion, access changes, production configuration, migrations and releases) require explicit authorization and, where specified, human approval.
- AI-generated output is treated as untrusted until validated. AI must not bypass permissions, approval gates, audit logging or release controls.
- Apply data minimization, retention/deletion workflows, encryption in transit and at rest, abuse controls and applicable privacy/legal review.

## 8. Commercial model

The platform may support:

- Independent monthly and annual subscriptions per product.
- Tiered plans (for example: Starter, Professional and Organization) with transparent entitlements.
- Optional bundles without forcing customers to buy unrelated products.
- Usage-based pricing for metered services such as cloud resources or storage, with visible usage and limits.
- Setup, support and professional services.
- A governed product/extension marketplace with transparent commissions and settlement rules.

Billing must be idempotent and auditable. Payment activation, refunds, invoices, reconciliation, tax/legal obligations and customer terms require tested workflows and appropriate jurisdictional review. No revenue forecast or guaranteed income is implied by this design.

## 9. Quality and independent release gates

Each product must pass its own applicable gates. A green monorepo CI run does not certify every product.

Minimum evidence includes:

1. Approved product specification and scope boundaries.
2. Automated unit, integration, end-to-end and regression tests appropriate to the product.
3. Endpoint-by-endpoint authentication and authorization review.
4. Cross-tenant isolation tests for read, write, export and delete operations where implemented.
5. Security scanning, dependency review, secure headers/CSP, input validation and abuse controls.
6. Database schema/migration review with tested forward and rollback paths in isolated environments.
7. Encrypted offsite backup and a successful isolated restore with checksum and measured RPO/RTO.
8. Monitoring, alerting, incident handling and rollback procedure.
9. Operational email/payment/integration verification where applicable.
10. Web/mobile acceptance testing on supported devices and signed release artifacts where applicable.
11. User documentation, support process, privacy/legal review and owner UAT.
12. Approved production commit matching the deployed artifact and explicit owner release approval.

Until evidence is inspected, a gate remains open. No product may be described as commercially released solely because its catalogue entry, UI shell, deployment or CI pipeline exists.

## 10. Delivery sequence

The recommended dependency-aware sequence is:

1. **Platform safety foundation:** identity, authorization, tenant isolation, audit, secret management, database baseline and backup/restore.
2. **Command center foundation:** owner dashboard, product registry, access governance, observability, release controls and Future Development Lab skeleton.
3. **Existing product preservation and audit:** inventory and assess current DANA, NEGAH, LEADORA, ARIANA, ARIA and ARMIN MARKET capabilities; preserve existing working behavior and close documented gaps.
4. **Planned product specifications and delivery:** ARVAND, CHARSU, GANJINEH, SEPEHR, NAMA and PAYAM, with independent scopes and acceptance criteria.
5. **Commercial enablement:** licensing, billing, payment lifecycle, support, legal documentation and revenue reporting.
6. **Independent product releases:** internal verification, controlled pilot, owner UAT and staged commercial release only after each product passes its gates.

This sequence is a dependency order, not a promise of simultaneous completion or a fixed calendar estimate. Reorder only when evidence demonstrates a dependency or risk reason; document the decision.

## 11. Baseline freeze and change control

After owner acceptance of this baseline:

- Product names, the count of eleven, primary missions and explicit boundaries are frozen through the release cycle.
- Engineering may make implementation-level changes required for correctness, security, performance, accessibility and compatibility, provided the approved product boundaries and data ownership remain intact.
- No unrelated redesign, renaming, product merge, scope expansion or architecture rewrite is permitted during the release cycle without a recorded change proposal and owner approval.
- A change proposal must state the problem, evidence, affected products, API/data compatibility impact, security/privacy impact, cost, migration/rollback plan, tests and release consequences.
- Changes affecting product identity, ownership of data, product boundaries, irreversible migration, commercial terms or production release require explicit owner approval.
- Emergency security fixes may be applied through a documented expedited process, with post-change evidence and notification.
- All accepted changes must update the relevant specifications, architecture/contract documentation and tests.

## 12. Known implementation and release caveats

This baseline does not supersede evidence-based release gates in `docs/RELEASE-GATES.md` or live audit findings. The repository's current architecture and audit records describe an engineering foundation, not eleven complete operational products. Previously recorded issues include incomplete production database migration baselining and RLS policies, lack of verified encrypted backup/isolated restore evidence, and lack of independently verified VAYRO hosting/runtime configuration. These must be freshly checked before execution; historical audit statements are not live status.

Do not reuse ARIA infrastructure, database, credentials, storage or volumes as a shortcut for VAYRO. Preserve the explicit separation between VAYRO and ARIA.

## 13. Decision record

**Decision requested:** adopt this document as the VAYRO product-family and architecture baseline v1.0.  
**Owner approval status:** the owner authorized preparation and repository registration of this baseline. Final document review/acceptance remains a separate checkpoint.  
**Implementation status:** not implied by this design.  
**Release status:** not released; existing release gates remain authoritative.

---
*End of baseline.*
