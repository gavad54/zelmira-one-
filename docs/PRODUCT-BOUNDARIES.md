# Product boundaries

| Product | Domain | Explicit exclusions |
|---|---|---|
| VAYRO ONE | Identity, tenant access, governance, product directory, licensing and orchestration | Does not absorb every product database |\n| ARVAND | International trade, export and import | Does not replace customs, banking or legal authorities |\n| CHARSU | Marketplace and buyer/seller discovery | Does not assume custody of customer payments |\n| GANJINEH | E-commerce and digital storefronts | Does not automatically become merchant of record |\n| NEGAH | Creative studio and digital production | Does not own customer trademarks or submitted assets by default |\n| SEPEHR | Cloud and digital infrastructure | Contracted service levels must be explicit |\n| NAMA | Website and landing-page builder | Does not publish unapproved claims automatically |\n| PAYAM | Marketing, attribution and compliant referrals | No rewards for recruitment or account creation alone |\n| DANA | AI assistance and workflow orchestration | No bypass of permissions or unreviewed consequential actions |
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
