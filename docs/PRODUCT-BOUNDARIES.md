# Product boundaries

| Product | Domain | Explicit exclusions |
|---|---|---|
| ZELMIRA ONE | Identity, tenant access, governance, product directory, licensing and orchestration | Does not absorb every product database |
| LEADORA | Distribution, sales, inventory and commercial operations | Remains an independently deployed product |
| ARIANA | Accounting, finance and ERP | Must remain separate from ARIA |
| ARIA | Social, services, listings and marketplace | No accounting or ERP modules |
| ARMIN MARKET | Buyer requests and supplier quotations | Does not assume custody of buyer/supplier payments |

## Integration rules

- Each product remains independently deployable.
- Shared login or navigation does not imply shared database ownership.
- API contracts are versioned and documented.
- Integrations require explicit scopes, service identity, audit logging and revocation.
- No production data migration without a tested backup, mapping, dry run and rollback plan.
