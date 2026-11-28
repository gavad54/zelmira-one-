# Product boundaries — approved VAYRO family baseline v2.0

VAYRO is the mother application and platform governance surface. Its direct family contains exactly five independently governed sub-applications: DANA, ARIANA, LEADORA, ARMIN MARKET and ARIA.

The seven legacy identities ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA and PAYAM are preserved as functional modules owned by ARIA. They are not counted or licensed as separate direct VAYRO sub-applications in the new canonical registry. Their legacy keys and API filters remain available for backward compatibility.

| Direct VAYRO sub-app | Domain | Explicit exclusions / ownership boundary |
|---|---|---|
| VAYRO | Mother app, identity, tenant access, governance, licensing, shared platform services | Does not absorb product-private databases or business rules |
| DANA | Independent command center, AI analysis, orchestration and portfolio oversight | Not an ARIA capability; consequential actions require scoped authorization, approval and audit |
| ARIANA | Accounting, finance, tax, budgeting and ERP | Sole owner of accounting/finance ledger and ERP workflows; separate from ARIA |
| LEADORA | Distribution, sales and commercial operations | Independent product boundary; not the accounting/ERP system of record |
| ARMIN MARKET | Buyer requests, supplier quotations and sourcing marketplace | Does not assume custody of buyer/supplier payments |
| ARIA | Social, communications, services and business modules | No accounting, finance-ledger or ERP modules |

## ARIA legacy module inventory

| Legacy module key | Preserved domain | Canonical owner |
|---|---|---|
| ARVAND | International trade, import and export | ARIA |
| CHARSU | Marketplace and commerce network | ARIA |
| GANJINEH | Digital stores and e-commerce | ARIA |
| NEGAH | Creative studio and digital production | ARIA |
| SEPEHR | Cloud and digital infrastructure capabilities | ARIA |
| NAMA | Website, landing-page and page builder | ARIA |
| PAYAM | Marketing and customer growth | ARIA |

## DANA classification

DANA is a first-class, independently governed VAYRO sub-application and the command center. Its own access, licensing, API surface and audit boundary must not be implemented as an ARIA module. Shared platform orchestration does not imply access to private product data.

## Compatibility and migration rules

- Existing legacy product keys remain valid as `legacyProduct` and `moduleKey` identifiers.
- Existing API requests filtered by a legacy product key continue to return the same capabilities; the canonical owner is ARIA.
- New callers may filter by canonical `ARIA` or by an explicit ARIA module key.
- DANA is represented only as a direct VAYRO sub-application, not as an internal platform capability.
- Product identity changes do not rename or delete legacy routes, database records, event producers, license history or stored capability keys.
- Any eventual data migration must be additive and reversible, with a mapping report and collision checks before changing persisted identifiers.

## Integration rules
- Each direct sub-application retains independently governed domain logic, data ownership, authorization and release evidence.
- Shared login or navigation does not imply shared database ownership.
- Cross-product communication uses reviewed, versioned APIs/events, scoped service identities, idempotency, correlation IDs and audit logging.
- Shared platform services do not directly query or mutate another product's private tables.
- No production data migration without an independently verified backup, mapping, dry run, reviewed plan and rollback/forward-repair strategy.
- No product capability may be removed or silently reclassified. The seven legacy domains remain represented under ARIA and are tested as a complete inventory.
