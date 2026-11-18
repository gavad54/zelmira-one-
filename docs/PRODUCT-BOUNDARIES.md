# Product boundaries

| Product | Domain | Explicit exclusions |
|---|---|---|
| VAYRO | Central product directory, identity, tenant access, governance, licensing and orchestration | Does not absorb every product database |
| ARVAND | International trade, import and export | Independent specialist product |
| CHARSU | Marketplace and commerce network | Does not own other products' data |
| GANJINEH | Digital stores and e-commerce | Independent specialist product |
| NEGAH | Creative studio and digital production | Independent specialist product |
| SEPEHR | Cloud and digital infrastructure | Infrastructure controls remain isolated |
| NAMA | Website and landing-page builder | Independent specialist product |
| PAYAM | Marketing and customer growth | Referral rewards require verified real sales; no pay-to-recruit |
| DANA (shared command plane) | Shared AI intelligence, management and orchestration across VAYRO | Not counted as a standalone app in the eleven-product portfolio; privileged actions require authorization and audit |
| LEADORA | Distribution, sales, inventory and commercial operations | Remains independently deployed |
| ARIANA | Accounting, finance and ERP | Must remain separate from ARIA |
| ARIA | Social, services, listings and marketplace | No accounting or ERP modules |
| ARMIN MARKET | Buyer requests and supplier quotations | Does not assume custody of buyer/supplier payments |

## Authoritative product count

The eleven independent apps are ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM, LEADORA, ARIANA, ARIA and ARMIN MARKET. DANA is the shared command and intelligence plane, not a member of that eleven-app count. VAYRO is the mother platform and governance layer.

## Integration rules
- Each product remains independently deployable.
- Shared login or navigation does not imply shared database ownership.
- API contracts are versioned and documented.
- Integrations require explicit scopes, service identity, audit logging and revocation.
- No production data migration without a tested backup, mapping, dry run and rollback plan.
