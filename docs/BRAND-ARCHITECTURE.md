# VAYRO ecosystem — brand and product architecture

## Master brand

- **VAYRO (وایرو)** — approved parent brand.
- **VAYRO ONE (وایرو وان)** — central platform for product discovery, identity, governance and access.
- Brand line: **INTELLIGENCE. WITHOUT LIMITS.**
- Persian line: **هوشمندی، بدون مرز**
- Visual direction: VAYRO SIGNATURE — dark luxury, architectural geometry, restrained champagne-gold and ice-blue accents, Persian-first RTL and mobile-first layouts.

## Newly named specialist products

| Product | Persian display name | Domain | Intended responsibility |
|---|---|---|---|
| ARVAND | اروند | International trade | Export/import workflows, trade documentation and partner discovery |
| CHARSU | چهارسو | Marketplace | Buyer/seller discovery, listings and marketplace workflows |
| GANJINEH | گنجینه | E-commerce | Digital storefronts, catalogues and online retail |
| NEGAH | نگاه | Creative studio | Creative production, brand assets and digital content |
| SEPEHR | سپهر | Cloud | Cloud workspace, storage and infrastructure services |
| NAMA | نما | Website builder | Website, landing-page and digital-presence creation |
| PAYAM | پیام | Marketing and growth | Campaigns, customer acquisition, attribution and compliant referrals |
| DANA | دانا | AI orchestration | Governed AI assistance and workflow orchestration |

These are approved working product names for the VAYRO ecosystem, not assertions of trademark registration, domain availability or completed product delivery. Before commercial launch, each name requires trademark, company-name, domain, app-store, social-handle and target-language screening.

## Existing independent products — names retained

| Product | Domain | Boundary |
|---|---|---|
| LEADORA | Distribution and sales operations | Inventory, sales and commercial workflows |
| ARIANA | Accounting and ERP | Accounting, finance and enterprise resource planning |
| ARIA | Social, services and marketplace | Must not contain accounting or ERP features |
| ARMIN MARKET | Supplier request marketplace | Buyer requests and supplier quotations |

Do not rename these established products as part of the VAYRO master-brand change without a separate explicit decision. Their repositories, deployments, customer-facing identifiers and integrations remain independent.

## Platform architecture

VAYRO ONE is the central access and governance layer. It does not silently merge specialist product databases or business rules.

- Identity and access: central identity with scoped product entitlements.
- Licensing: independent product subscriptions, trials, renewals and support.
- Integration: versioned APIs, least-privilege service credentials and auditable events.
- Data: tenant isolation by product; explicit data-sharing consent and export controls.
- AI: DANA orchestrates approved tools and workflows with permission checks, human approval for consequential actions and audit trails.
- Operations: each product has independent health, backup, restore, release and incident procedures.

## Commercial and legal boundaries

Customers control their tenant data, authorized users, settings and exports according to contract. This does not transfer software copyright or source-code ownership unless a separate written IP assignment says so.

For customer-to-customer commerce, the platform's legal role depends on actual product behavior, contracts and applicable law. Do not claim blanket zero liability. Avoid holding customer funds; use regulated payment providers and jurisdiction-specific legal review if payments are introduced.

PAYAM referral rewards must be tied to verified completed sales to end customers, not recruitment, joining fees or payment for introducing new members. Provide clear disclosures, anti-fraud controls, refund/chargeback handling and legal review in each operating jurisdiction.
