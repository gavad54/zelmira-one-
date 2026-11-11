# Product boundaries — approved VAYRO baseline v1.0

VAYRO is the mother application and platform governance surface. The family contains exactly eleven independently governed products. DANA is a central AI/orchestration capability, not a twelfth product.

| Product | Domain | Explicit exclusions / ownership boundary |
|---|---|---|
| VAYRO | Mother app, identity, tenant access, governance, licensing, shared platform services and Command Center | Does not absorb product-private databases or business rules |
| ARVAND | International trade, import and export | Owns trade workflows; not other products' data |
| CHARSU | General marketplace and commerce network | Does not own other products' data |
| GANJINEH | Digital stores and e-commerce | Independent storefront and commerce domain |
| NEGAH | Creative studio and digital production | Independent creative production domain |
| SEPEHR | Cloud and digital infrastructure | Privileged infrastructure controls remain isolated |
| NAMA | Website, landing-page and page builder | Independent publishing/site domain |
| PAYAM | Marketing and customer growth | Consent-aware campaigns; referral rewards require verified real sales |
| LEADORA | Distribution, sales, inventory and commercial operations | Not the accounting/ERP system of record |
| ARIANA | Accounting, finance and ERP | Sole product boundary for accounting and ERP; remains separate from ARIA |
| ARIA | Social, communications, services and listings | No accounting, finance-ledger or ERP modules |
| ARMIN MARKET | Buyer requests, supplier quotations and sourcing | Does not assume custody of buyer/supplier payments |

## DANA classification

DANA is VAYRO's internal AI intelligence, analysis and orchestration capability, surfaced through the Command Center. It is not an independently counted product. All DANA access to product data/actions must use scoped identities, normal authorization, explicit approval for consequential actions and audit records.

## Command Center and Future Development Lab

The Command Center governs the portfolio, access, commercial operations, integrations, security/audit, backup/recovery and release evidence. The Future Development Lab handles idea intake, duplication/scope checks, impact analysis, design proposals, isolated prototypes, automated tests, security review, owner decision, staged rollout and rollback. It must not write directly to production or bypass product release gates.

## Integration rules
- Each of the eleven products retains independently governed domain logic, data ownership, authorization and release evidence.
- Each product remains independently deployable where its deployment model supports it.
- Shared login or navigation does not imply shared database ownership.
- Cross-product communication uses reviewed, versioned APIs/events, scoped service identities, idempotency, correlation IDs and audit logging.
- Shared platform services do not directly query or mutate another product's private tables.
- No production data migration without an independently verified backup, mapping, dry run, reviewed plan and rollback/forward-repair strategy.
- No product capability may be removed, merged or silently reclassified without an audit and explicit owner approval where scope, data ownership or irreversible behavior changes.
