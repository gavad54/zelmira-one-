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
| DANA | AI intelligence and orchestration | Privileged actions require authorization and audit |
| LEADORA | Distribution, sales, inventory and commercial operations | Remains independently deployed |
| ARIANA | Accounting, finance and ERP | Must remain separate from ARIA |
| ARIA | Social, services, listings and marketplace | No accounting or ERP modules |
| ARMIN MARKET | Buyer requests and supplier quotations | Does not assume custody of buyer/supplier payments |

## Integration rules
- Each product remains independently deployable.
- Shared login or navigation does not imply shared database ownership.
- API contracts are versioned and documented.
- Integrations require explicit scopes, service identity, audit logging and revocation.
- No production data migration without a tested backup, mapping, dry run and rollback plan.
