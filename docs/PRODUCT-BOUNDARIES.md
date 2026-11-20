# Product boundaries — authoritative VAYRO hierarchy (2026-11-20)

VAYRO is the mother application and platform governance surface. Its approved direct product family contains **six independent applications**. VAYRO itself is the parent platform and is not counted as one of the six products.

| Direct product | Domain | Ownership boundary |
|---|---|---|
| ARIA | AI, communication, social/services, creative and digital work | Must not contain accounting, general ledger or ERP |
| ARIANA | Accounting, finance, ledger and ERP | Sole owner of accounting/ERP capabilities |
| LEADORA | Distribution, sales, inventory, commercial operations and growth | Owns operational sales/distribution; PAYAM growth functions are integrated here |
| ARMIN MARKET | Marketplace, buyer requests, supplier quotations and market intelligence | CHARSU marketplace scope is consolidated here; no custody of third-party funds |
| DANA | Independent command-center and authorized orchestration application | Uses versioned, scoped APIs; no direct access to another product's private database |
| ARVAND | International trade, import, export and trade operations | Owns international-trade workflows |

## ARIA internal domains

The following names are internal ARIA domains, not additional direct VAYRO applications:

- GANJINEH — digital storefront and catalogue/sales domain.
- NEGAH — creative studio and content production.
- SEPEHR — cloud/resource-management domain with privileged controls isolated.
- NAMA — website and landing-page builder.

## Consolidation and legacy identifiers

- CHARSU is consolidated into ARMIN MARKET. Do not expose CHARSU as a separate current product.
- PAYAM is consolidated into LEADORA. Do not expose PAYAM as a separate current product.
- Historical names, files, capabilities, data mappings and decisions must remain in the archive/crosswalk. This decision does not authorize deleting historical records or capabilities.
- GANJINEH, NEGAH, SEPEHR and NAMA remain inside ARIA and must not be counted twice as independent apps.

## Data, authorization and deployment boundaries

- Each of the six products retains its own domain logic, data ownership, authorization rules, integration credentials and release evidence.
- Each product can be licensed and deployed independently where its delivery model supports it.
- Shared navigation, identity or command-center views do not imply shared database ownership.
- Cross-product communication uses reviewed, versioned APIs/events, scoped service identities, correlation IDs, idempotency, audit logs and explicit consent/approval for consequential actions.
- Shared platform services must not query or mutate another product's private tables directly.
- No product capability may be removed, merged, renamed or silently reclassified without an archive audit, a source-to-target crosswalk and explicit owner approval where scope or data ownership changes.
- ARIA must not acquire accounting or ERP through a connector, adapter, menu item or shared module. Those capabilities belong to ARIANA only.

## Release status

The six-product hierarchy is an approved architecture, not a claim that six products are production-ready. Product status is determined independently from source, CI, runtime, database, provider, security, commercial and UAT evidence. See the latest master ecosystem audit and release gates.
