# VAYRO Ecosystem Commercial Upgrade Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a secure, simple, financially sustainable VAYRO ecosystem with four independent flagship applications under DANA command, while preserving existing product work and proving every release claim.

**Architecture:** VAYRO owns ecosystem governance and release policy. DANA is a command/orchestration capability with scoped service identities, not a shared runtime or database. ARIA, ARIANA, LEADORA and ARMIN MARKET each own their code, UX, domain data, authorization, runtime and release lifecycle; other named initiatives remain in the VAYRO portfolio until individually audited.

**Tech Stack:** Existing VAYRO Next.js 15 / React 19 / TypeScript / Prisma / PostgreSQL 17; ARIA Node.js service and Android client; LEADORA FastAPI / SQLite / Docker; ARMIN MARKET Kotlin / Jetpack Compose. ARIANA implementation stack is not verified because its authoritative source repository has not been located.

## Global Constraints

- Preserve existing product source, designs, workflows, data and domain rules. No wholesale rewrite or deletion.
- Four flagship apps are independent: ARIA, ARIANA, LEADORA, ARMIN MARKET. ARIA is not the parent of the others.
- DANA coordinates only through versioned APIs/events and least-privilege service identities; it cannot bypass app authorization.
- ARIA contains no accounting/ERP. ARIANA owns accounting/ERP. LEADORA owns distribution/sales/inventory operations but not accounting ledger. ARMIN MARKET owns buyer requests, supplier quotations and sourcing.
- Keep Persian RTL first, English support, mobile-first, simple UX and each app's identity.
- Benchmark market products and workflows; implement original code/design. Do not copy protected code, assets, copy, branding or proprietary UI.
- Monetization must be transparent and consent-based. Do not activate real payments, custody, lending, seller funds, paid AI or third-party billing without legal/provider review and explicit owner approval.
- No production DB changes until independent encrypted backup, isolated restore, schema reconciliation and migration/rollback rehearsal are proven.
- No merge, deployment, public release, payment activation or irreversible action without explicit approval.
- Report only evidence-backed implementation, tests, live integrations and release status.

---

### Task 1: VAYRO public hierarchy and product catalog

**Files:**
- Modify: `src/lib/product-directory.mjs`
- Modify: `src/app/page.tsx`
- Test: `tests/product-command-structure.test.mjs`
- Existing compatibility test: `tests/product-directory.test.mjs`

**Interfaces:**
- `FLAGSHIP_APPLICATIONS`: four independent apps with name, domain summary and evidence-based status.
- `PORTFOLIO_INITIATIVES`: ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM.
- `VAYRO_CAPABILITIES`: DANA command center descriptor and existing UI route.
- Legacy exports `VAYRO_PRODUCTS` and `INDEPENDENT_PRODUCTS` remain compatibility aliases.

- [x] Add behavioral tests before changing the directory.
- [x] Implement explicit four-app and initiative catalogs.
- [x] Rework homepage sections to show four independent apps first, DANA as command, then the other initiatives.
- [ ] Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` on the exact PR head.
- [ ] Verify mobile layout, Persian RTL, accessible labels and every rendered link.
- [ ] Obtain code review before merging.

Acceptance: exactly four flagship apps appear as independent; DANA is not counted as an app; no unverified app is labeled production-active; all seven initiatives remain visible and separately classified.

### Task 2: Commercial model and entitlement domain

**Files (proposed; verify existing paths before creation):**
- Create: `src/lib/commercial/catalog.mjs`
- Create: `src/lib/commercial/entitlements.mjs`
- Create: `tests/commercial-catalog.test.mjs`
- Create: `tests/commercial-entitlements.test.mjs`
- Modify only after schema/recovery gate: `prisma/schema.prisma` and a new Prisma migration.

**Interfaces:**
- Catalog entries describe product, plan, billing period, included limits, optional add-ons and effective dates.
- Entitlement evaluation takes tenant, product, plan, subscription status and a usage snapshot; returns allowed/denied, limit and reason.
- Monetary values use integer minor units plus ISO currency code; never floating-point arithmetic.
- No provider charge or money movement occurs in this task.

- [ ] Add tests for free/trial/paid plan evaluation, expired subscription, suspended tenant, product mismatch, quota exhaustion, unknown plan and unknown currency.
- [ ] Run focused tests and record the expected failing assertions.
- [ ] Implement pure deterministic catalog and entitlement logic without database or network side effects.
- [ ] Run focused tests, then full unit tests, lint and typecheck.
- [ ] Design the persistent ledger only after VAYRO production schema baseline and restore gates are resolved.
- [ ] Require explicit owner approval before provider integration or any paid action.

Acceptance: plans and quotas can be evaluated deterministically; no user can be charged by catalog/entitlement code; every denial has a stable reason code.

### Task 3: Transparent revenue and cost-allocation ledger

**Files (proposed; after Task 2 and database recovery gate):**
- Create: `src/lib/commercial/ledger.mjs`
- Create: `src/lib/commercial/reconciliation.mjs`
- Create: `tests/commercial-ledger.test.mjs`
- Create: `tests/commercial-reconciliation.integration.mjs`
- Modify: `prisma/schema.prisma` and migration only after production schema reconciliation and restore proof.

**Interfaces:**
- Ledger entries are immutable, balanced and idempotent; each entry includes tenant, product, currency, event, amount, source reference, idempotency key and timestamps.
- Revenue event types distinguish subscription, license, seller plan, optional promotion, marketplace commission, third-party service pass-through, refund and adjustment.
- Reconciliation compares provider settlement records with internal entries; differences remain unresolved until explicitly handled.

- [ ] Test duplicate event delivery, out-of-order events, partial refunds, full refunds, provider fees, currency mismatch, missing settlement and reconciliation discrepancy.
- [ ] Observe expected failures before implementation.
- [ ] Implement append-only ledger logic and reconciliation without connecting a live payment provider.
- [ ] Prove immutable audit history and duplicate-event safety in isolated PostgreSQL.
- [ ] Add sandbox adapter only after legal/provider suitability is verified.
- [ ] Do not hold customer/seller funds or guarantee third-party obligations.

Acceptance: no duplicate revenue recognition; every amount is traceable; refunds and fees reconcile; the platform does not subsidize operational costs by default.

### Task 4: Independent product capability and UX upgrades

**Repositories and observed entry points:**
- ARIA: `gavad54/aria-android`, `server.js`, Android source and tests (exact current paths must be re-inventoried).
- LEADORA: `gavad54/LEADORA`, `app/main.py`, `app/static/`, `tests/`.
- ARMIN MARKET: `gavad54/Armin_market`, `app/src/main/java/com/arminmarket/app/MainActivity.kt`.
- ARIANA: authoritative source not located; do not create replacement code until source, data and existing structure are supplied or discovered.

- [ ] Build a source-grounded capability inventory for each repository: feature, API, data owner, authorization, automated tests, external integrations, deployment and restore evidence.
- [ ] Add one testable user workflow per app before changing its UI or business logic.
- [ ] ARIA: prioritize complete independent onboarding, privacy/abuse controls, useful AI workflows and independently verifiable Android/web release.
- [ ] ARIANA: locate the authoritative repository and preserve its existing structure; audit accounting correctness before building features.
- [ ] LEADORA: prioritize customer-to-order, inventory allocation, dispatch, delivery, returns and CRM automation; keep ledger/ERP accounting out.
- [ ] ARMIN MARKET: prioritize buyer request, supplier quotation, offer comparison, verified seller status and safe transaction handoff; no inventory or payment custody by VAYRO.
- [ ] For each app, run focused tests, full CI, security checks and product-specific UAT.
- [ ] Keep each app's PR, release version, data boundary and deployment independent.

Acceptance: each app has at least one end-to-end verified core workflow and its own release gates; missing source or credentials remain explicit blockers.

### Task 5: DANA orchestration, observability and portfolio command

**Files (proposed after inspecting current DANA routes and authorization helpers):**
- Extend existing DANA routes only after inspecting exact current implementations.
- Create focused tests under `tests/dana-*.test.mjs` and `tests/dana-*.integration.mjs`.
- No new shared database access to app-private tables.

- [ ] Test scoped service identity, revoked identity, cross-app denial, timeouts, retries, duplicate event delivery, dead-letter handling and audit completeness.
- [ ] Implement portfolio health and release-status aggregation using explicit app health/status contracts.
- [ ] Add cost/usage reporting only from measured provider and app events; distinguish estimates from settled amounts.
- [ ] Keep sensitive actions approval-gated and auditable.
- [ ] Verify core app workflows continue when DANA is unavailable.

Acceptance: DANA can coordinate approved operations but cannot bypass app controls; portfolio status is evidence-backed and resilient to individual app outages.

### Task 6: Security, recovery and release certification

**Files (proposed per app):**
- Product-specific security tests, backup/restore runbooks, migration rehearsal and release evidence documents.

- [ ] Test tenant isolation, role boundaries, cross-app denial, service scopes, session revocation, MFA and audit logs.
- [ ] Produce encrypted independent backup and complete an isolated restore for each production data store.
- [ ] Reconcile production schema with migrations; test forward and rollback/forward-repair in isolated staging.
- [ ] Verify dependency audit, SAST/CodeQL, build, container, mobile/device acceptance, monitoring and support runbooks.
- [ ] Obtain owner UAT and explicit release approval for each app independently.

Acceptance: no app is released solely because VAYRO's shell or DANA is green; each app passes its own full release gate.

## Unresolved external decisions

- ARIANA authoritative repository/source and current data location.
- Legal entity, applicable jurisdiction, tax treatment and contracts for marketplace/intermediary fees.
- Payment providers and their permitted services in each launch market.
- Exact plan prices, currencies, free-tier limits, refund windows and support SLAs.
- Whether any initiative (ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM) becomes a separate deployable app or remains a portfolio capability after its audit.
