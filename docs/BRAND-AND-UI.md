# VAYRO Brand & UI — authoritative edition (2026-11-20)

## Identity
- Product/parent brand: **VAYRO / وایرو**.
- The mother application name shown to users is VAYRO only.
- Retain the latest owner-approved VAYRO logo artwork; use a clean transparent/vector asset, not a photo-background mockup.
- Visual direction: professional, technical, premium **neon glass** with controlled glow; restrained ice-blue and champagne-gold accents, high legibility and accessible contrast.

## UX
- Persian-first, RTL, mobile-first and responsive.
- English localization must remain possible without breaking RTL.
- Simple task-first navigation; users should not need to understand the module registry.
- Respect keyboard focus, reduced-motion, text scaling and accessibility.
- Product catalogue cards are not represented as live services unless runtime and release evidence exists.
- Never fabricate user counts, revenue, ratings, provider status or production readiness.

## VAYRO hierarchy

VAYRO is the mother platform. It has exactly six direct independent applications:

1. ARIA — AI, communications, social/services and digital work; no accounting, ledger or ERP.
2. ARIANA — accounting, finance, ledger and ERP.
3. LEADORA — distribution, sales, inventory, commercial operations and growth.
4. ARMIN MARKET — marketplace, buyer requests, supplier quotations and market intelligence.
5. DANA — independent command-center and authorized orchestration application.
6. ARVAND — international trade, import, export and trade operations.

## ARIA internal domains

These are not additional independent applications:
- GANJINEH — digital storefront and catalogue/sales domain.
- NEGAH — creative studio and content production.
- SEPEHR — cloud/resource-management domain.
- NAMA — website and page builder.

## Consolidation
- CHARSU scope is consolidated into ARMIN MARKET.
- PAYAM scope is consolidated into LEADORA.
- Preserve all historical files, module IDs, product records and crosswalk references. Consolidation is not permission to delete history.

## Product boundaries
- ARIA must not contain accounting, general ledger or ERP, including through adapters, menu routes or shared modules.
- ARIANA is the sole owner of accounting and ERP workflows.
- Shared navigation does not imply shared database ownership.
- Every direct product owns its domain logic, data, permissions, integrations and release evidence.
- Cross-product actions use versioned APIs/events, scoped service identities, audit logs, idempotency and explicit approval for consequential operations.
- DANA must not directly query or mutate another product's private database.

## Release representation
Use distinct statuses: DESIGN, LOCAL_EXECUTABLE, PROVIDER_VERIFIED, E2E_VERIFIED, PRODUCTION_ACTIVE, MONETIZED and BLOCKED. A catalogue entry or passing unit test alone is not a live product.
