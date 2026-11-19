# Product boundaries — VAYRO governing baseline v2.0

**Decision date:** 2026-11-19  
**Authoritative decision:** [ADR-0002 — Four independent applications under DANA command](architecture/ADR-0002-four-independent-apps-under-dana.md)

VAYRO is the sole mother ecosystem and ownership/governance layer. DANA is VAYRO's central command and orchestration center. The four flagship applications are **ARIA, ARIANA, LEADORA and ARMIN MARKET**. All four are independent applications under DANA's authorized command and VAYRO governance.

ARIA is **not** the parent application or shared shell for the other three. No flagship application is a child module, sub-screen, tenant or deployment of another flagship application.

## Four independent flagship applications

| Application | Domain ownership | Independence and exclusions |
|---|---|---|
| **ARIA** | General-purpose AI, social, communications, services and listings | Own source/release/runtime/data boundary. No accounting ledger, bookkeeping, financial statements or ERP. |
| **ARIANA** | Accounting, finance and ERP | Sole accounting/ERP system of record; own source/release/runtime/database and audit trail. |
| **LEADORA** | Distribution, sales, inventory and commercial operations | Own operational records and release boundary; not the accounting/ERP system of record. |
| **ARMIN MARKET** | Buyer requests, supplier quotations, sourcing and marketplace workflows | Own marketplace records and release boundary; no payment custody without separately approved design and legal/release gates. |

## VAYRO portfolio initiatives

The following named initiatives remain within the VAYRO portfolio and are coordinated by DANA. Their packaging and deployment model must be decided only after an individual source and product audit; they must not be silently folded into any flagship app or discarded.

| Initiative | Intended domain |
|---|---|
| **ARVAND** | International trade, import and export |
| **CHARSU** | Marketplace and commerce network |
| **GANJINEH** | Digital stores and e-commerce |
| **NEGAH** | Creative studio and content production |
| **SEPEHR** | Cloud and digital infrastructure |
| **NAMA** | Website and landing-page builder |
| **PAYAM** | Marketing and customer growth |

## DANA classification and command model

DANA is not a fifth customer-facing application. It is VAYRO's internal AI intelligence, analysis, orchestration and command capability.

- VAYRO defines portfolio ownership, security policy, identity governance, shared platform standards and release approval.
- DANA coordinates authorized work, portfolio status, AI-assisted operations and cross-app workflows.
- DANA cannot bypass a product's own authorization, approval, audit or release controls.
- A DANA outage must not prevent the four apps from performing their core independent workflows.
- DANA accesses application capabilities only through documented, versioned APIs/events and scoped service identities.

## Non-negotiable integration and isolation rules

1. Each flagship application owns its domain logic, private data, schema/migrations, authorization, secrets, runtime configuration, build pipeline, release version and recovery evidence.
2. Shared login or navigation does not imply shared database ownership or shared domain permissions.
3. No application or DANA may directly query or mutate another application's private tables.
4. Cross-app APIs/events require versioned contracts, least-privilege service identities, schema validation, idempotency keys for mutations, correlation IDs, audit logging, bounded timeouts and explicit retry/failure semantics.
5. An authenticated identity in VAYRO or DANA does not automatically confer application-level permissions.
6. Data export, deletion, retention and backup remain owned by the source application under VAYRO-wide policy.
7. Shared UI components and design tokens may be reused without erasing each application's visual identity or making their runtimes dependent on one another.

## Preservation and change control

- Preserve existing code, designs, capabilities, workflows, domain rules, data and product ideas until they are inventoried and assessed.
- No wholesale rewrite, feature deletion, data migration, product merger or silent reclassification.
- Audit before redesign. Improve existing designs incrementally and retain product-specific identity.
- Any feature/data transfer requires source-to-target mapping, compatibility analysis, independent backup, dry run, rollback/forward-repair plan and explicit owner approval.
- Persian RTL, English support, mobile-first behavior, accessibility and usability for nontechnical users remain product constraints where applicable.

## Release requirements

Each application must independently pass its own CI, security review, authorization and cross-app denial tests, production configuration checks, migration/rollback rehearsal, encrypted offsite backup and isolated restore, UAT and explicit release approval. VAYRO/DANA portfolio status cannot substitute for an application's release evidence.

A green CI run against a disposable database does not prove production database safety. No production DDL, grants, migrations, deployments, payment activation or public release is authorized by this document.

## Source availability snapshot

- VAYRO: `gavad54/zelmira-one-`
- ARIA: `gavad54/aria-android` (current known repository; source and release completeness require further audit)
- LEADORA: `gavad54/LEADORA`
- ARMIN MARKET: `gavad54/Armin_market`
- ARIANA: **SOURCE_NOT_LOCATED** in the previous repository discovery; do not invent implementation status or rebuild from assumptions.

The source snapshot is not a complete implementation audit. Refresh repository heads, workflows, tests, deployment and data-recovery evidence before release decisions.
