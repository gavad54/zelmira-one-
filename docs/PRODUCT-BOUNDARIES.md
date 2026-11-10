# VAYRO product boundaries
Snapshot 2026-11-10T10:29:44Z; aligned with ARCHITECTURE.md.
| Product/capability | Domain | Boundary |
|---|---|---|
| VAYRO | Product directory, identity, tenant access, governance, licensing/orchestration | Does not absorb every product database |
| ARVAND | International trade/import/export | Independent specialist product |
| CHARSU | Marketplace/commerce network | Does not own other products' data |
| GANJINEH | Digital stores/e-commerce | Independent specialist product |
| NEGAH | Creative studio/digital production | Independent specialist product |
| SEPEHR | Cloud/digital infrastructure | Infrastructure controls isolated |
| NAMA | Website/landing-page builder | Independent specialist product |
| PAYAM | Marketing/customer growth | Referral rewards require verified sales; no pay-to-recruit |
| DANA (platform capability) | AI intelligence/orchestration inside VAYRO | Not an eighth family product or independent catalogue row; privileged actions require authorization/audit |
| LEADORA | Distribution, sales, inventory, commercial operations | Remains independent; audit before integration/change |
| ARIANA | Accounting, finance and ERP | Must remain separate from ARIA |
| ARIA | Social, services, listings and marketplace | No accounting or ERP |
| ARMIN MARKET | Buyer requests and supplier quotations | Does not assume custody of buyer/supplier payments |
## Integration rules
Each product remains independently deployable. Shared login/navigation does not imply shared database ownership. APIs are versioned. Integrations require explicit scopes, service identity, audit logging and revocation. No production migration without tested backup, mapping, dry run and rollback.
