# VAYRO Product Family — Delivery and Acceptance Roadmap

**Status:** Execution baseline; not a completion certificate  
**Parent:** VAYRO  
**Scope:** The eleven approved products listed below  
**Release posture:** DEPLOYMENT BLOCKED — NOT RELEASED

This roadmap converts the approved product family into independently testable commercial products. A product name, catalogue card, page mock-up, API stub, mocked provider, passing unit test or green CI run does not establish a working product.

## 1. Product portfolio and minimum commercial scope

| Product | Product boundary | Minimum usable commercial release | Evidence required before VERIFIED |
|---|---|---|---|
| ARVAND | International trade, import/export | Buyer/supplier profiles, RFQ, quotation comparison, trade document workspace, shipment/order milestones, permissions and audit | End-to-end RFQ to accepted quotation; document access control; currency/tax/shipping assumptions disclosed; tenant isolation |
| CHARSU | Multi-vendor marketplace | Seller onboarding, listings, search, cart/order lifecycle, commissions, settlement ledger, refunds/disputes, moderation | Sandbox transaction lifecycle; seller/buyer authorization; idempotent webhook and reconciliation tests |
| GANJINEH | Merchant storefront and e-commerce | Store setup, catalog, variants, inventory, pricing, checkout integration, orders, fulfillment, customer notices | Real test purchase; stock concurrency; order lifecycle; refund/stock reconciliation |
| NEGAH | Creative production studio | Brief intake, asset upload/rights declaration, real image generation/editing, job progress, private outputs, export/history | Real provider execution; provider usage/cost recorded; asset ownership and download authorization; failure/retry tests |
| SEPEHR | Cloud/runtime infrastructure | Tenant-isolated projects, resource quotas, deployment/runtime lifecycle, secrets, logs, backups, metering and recovery | Isolated workload test; quota enforcement; secret isolation; restore/rollback drill; measured usage |
| NAMA | Website/landing-page builder | Templates, visual editor, preview, responsive output, domain/publish lifecycle, version history and rollback | Create/edit/preview/publish/rollback end-to-end; tenant ownership; accessibility and device checks |
| PAYAM | Marketing and customer growth | Campaign planning, content calendar, copy/creative drafts, approval, publishing connectors, analytics and consent controls | Real sandbox/pilot connector; approval and revocation; campaign audit; metrics provenance |
| DANA | AI intelligence and agent orchestration | Provider-backed text/document workflows, prompt studio, knowledge retrieval, agent tools with allowlists, approval gates and usage tracking | Real provider execution; source-grounded retrieval tests; tool authorization; metering; no fabricated success on provider outage |
| ARIA | Social, services and listings marketplace | Profiles, social feed, listings/services, discovery, messaging, reporting/moderation and privacy controls | Full user journey and abuse/moderation tests; tenant/user privacy; explicitly no accounting/ERP |
| ARIANA | Accounting, finance and ERP | Chart of accounts, journals, ledgers, invoices, inventory/accounting integration, tax reports, periods and audit | Double-entry invariants; reconciliation; period-close tests; jurisdictional accounting/tax review; independent data boundary |
| LEADORA | Distribution and sales operations | Customers, suppliers, products, stock, orders, sales workflow, commercial reporting and accounting integration contract | End-to-end distribution workflow; stock and financial reconciliation; role tests; independent data boundary |

ARMIN MARKET remains a separate legacy/adjacent product boundary and is not counted among these eleven. Do not merge its data or capabilities into the eleven without a separately approved scope change.

## 2. Shared VAYRO platform services

These services are prerequisites for commercial operation, but do not replace each product's own workflows:

1. Identity and access: verified accounts, MFA for privileged roles, session lifecycle, recovery, endpoint authorization and audit.
2. Tenant control: server-derived tenant context, database RLS, cross-tenant negative tests, tenant lifecycle and export/deletion controls.
3. Product registry: versioned product identifiers, product entitlements, feature flags and independently deployable product boundaries.
4. Commercial core: plans, subscriptions, license lifecycle, append-only usage/financial ledger, idempotent payment webhooks, invoices, refunds and reconciliation.
5. Integration gateway: versioned API contracts, service identities, least privilege, timeouts, idempotency, retries and revocation.
6. File/asset service: private-by-default storage, tenant ownership, signed short-lived access, malware/content checks, retention and deletion.
7. AI execution: real provider adapters, model/capability registry, cost limits, queues, retries, provenance and human approval for external actions.
8. Operations: monitoring, alerting, support tooling, incident response, encrypted off-provider backups and tested restores.
9. Localization/accessibility: Persian RTL as a first-class interface, English, currency/timezone/locale handling, responsive mobile UX and accessibility checks.
10. Governance: privacy terms, data processing disclosures, product-specific legal review, consent, retention and customer support processes.

## 3. Delivery sequence

### Gate 0 — Repository and product truth
- Inventory every route, model, migration, integration, UI screen and test.
- Map each implemented item to exactly one product owner and API contract.
- Label every capability NOT_STARTED, IN_PROGRESS, IMPLEMENTED, TESTED, VERIFIED or ACCEPTED.
- Remove or disable UI actions that are not connected to a working backend.
- Preserve independent ARIA, ARIANA and LEADORA repositories/data boundaries.

### Gate 1 — Secure shared platform
- Complete MFA, session lifecycle, endpoint authorization and platform-control-plane separation.
- Complete tenant RLS for every tenant-owned table and every read/write/export/delete path.
- Verify auth, tenant and platform runtime database roles are least-privilege and distinct from migration roles.
- Establish migration baseline only after schema/catalog reconciliation and isolated forward/recovery rehearsal.
- Complete dependency, secret, container, static-analysis and runtime security reviews.

### Gate 2 — Commercial foundation
- Implement entitlement checks at API level, not only UI.
- Implement append-only usage and financial ledgers with idempotency keys.
- Implement payment-provider sandbox flows before any live-payment activation.
- Test subscription changes, failed payments, cancellations, refunds, chargebacks and reconciliation.
- Keep customer onboarding and live charges disabled until legal/compliance and owner approval.

### Gate 3 — Product MVPs
- Deliver one product at a time against its minimum commercial scope in section 1.
- Each MVP requires working UI + API + persistent data + permissions + negative tests + operational telemetry.
- External AI/media, payment, email and publishing features must use real configured services in a controlled test environment. Mock providers are test-only.
- Do not advertise a feature as available if the provider, account, credential, quota or jurisdiction is not configured.

### Gate 4 — Production readiness
- Dedicated hosting and protected runtime secrets.
- Independent encrypted backup and a successful isolated restore with checksum and measured RPO/RTO.
- Monitoring, alerting, rollback, incident response and support procedures.
- Android/mobile device acceptance where mobile application delivery is in scope.
- Owner UAT and representative-user UAT.
- Production commit parity, release artifact integrity and explicit release approval.

## 4. Required acceptance evidence per product

A product cannot be marked VERIFIED until all applicable evidence is attached to its release record:

- Source commit and build artifact identity.
- Feature-to-route/model/API traceability matrix.
- Automated unit, integration, end-to-end and negative authorization tests.
- Tenant A/B isolation proof for all owned records and assets.
- Real provider/service test evidence (not mocks) for advertised integrations.
- Usage/cost/entitlement evidence for monetized capabilities.
- Accessibility, Persian RTL, English and mobile acceptance results.
- Logging/monitoring, backup/restore and recovery evidence.
- Security/privacy review and unresolved-risk register.
- Product-owner UAT acceptance.

## 5. Non-negotiable safeguards

- No product database consolidation by default.
- ARIA must not contain accounting or ERP.
- ARIANA remains the accounting/ERP product.
- No production migration without verified independent backup, restore proof, reviewed migration plan and explicit authorization for that exact migration.
- No production secret, signing key, recovery code or customer data in Git.
- No deployment, merge, payment activation, customer onboarding or public release based only on a general request to "finish everything".
- No claims of completion without evidence for the exact current commit and deployed environment.

## 6. Initial verified status

At roadmap creation, the repository's own product-boundary and release-gate documentation describes the eight specialist VAYRO catalogue entries as a catalogue rather than eight completed systems. The current PR change surface includes a DANA/NEGAH foundation and shared platform/security work, but this is not evidence that all eleven products have complete workflows or production deployments.

**Initial status for all eleven product releases: NOT VERIFIED.** This is an evidence classification, not a claim that no code exists in any independent repository. Each independent product requires its own fresh repository audit before work is assigned or completion is declared.

**Portfolio status: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**
