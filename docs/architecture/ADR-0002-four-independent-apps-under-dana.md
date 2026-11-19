# ADR-0002: VAYRO parent with five independent applications and ARIA consolidation

- **Decision date:** 2026-11-19
- **Status:** Owner-directed target architecture; implementation and release remain gated
- **Scope:** Product hierarchy, app boundaries, legacy product consolidation, data ownership and command model
- **Supersedes:** Earlier wording that described DANA as the parent of four apps, described DANA as merely an internal VAYRO capability, or made ARIA the parent/shell of other flagship apps

## 1. Binding product hierarchy

**VAYRO is the mother application and ecosystem owner.** Exactly five independent applications are direct VAYRO sub-products:

1. **DANA** — independent command-center application for ecosystem-wide coordination and authorized orchestration.
2. **ARIA** — independent consolidated application formed from the former ARIA and the capabilities/modules of all legacy apps except DANA, ARIANA, LEADORA and ARMIN MARKET.
3. **ARIANA** — independent accounting, finance and ERP application.
4. **LEADORA** — independent distribution, sales and commercial operations application.
5. **ARMIN MARKET** — independent buyer/supplier marketplace application.

All five are **direct children of VAYRO**. DANA is not the parent of the other apps. ARIA is not the parent of any other app. DANA is not merged into ARIA. ARIANA, LEADORA and ARMIN MARKET are not merged into ARIA.

```text
VAYRO
├── DANA          (independent; ecosystem command center)
├── ARIA          (independent; consolidated legacy capabilities)
├── ARIANA        (independent; accounting and ERP)
├── LEADORA       (independent; distribution operations)
└── ARMIN MARKET  (independent; marketplace)
```

## 2. ARIA consolidation scope

ARIA retains its previous product identity and becomes the destination application for the remaining legacy products. The currently known legacy initiatives to inventory as ARIA modules are:

- ARVAND
- CHARSU
- GANJINEH
- NEGAH
- SEPEHR
- NAMA
- PAYAM

The historical portfolio has been described as eleven or twelve applications. That count is not treated as verified until repository, branch, documentation, deployment and data-source discovery is complete. The seven names above are the known candidates, not proof that the inventory is exhaustive.

Consolidation means preserving and integrating the relevant capabilities, workflows, design assets and business rules inside the independent ARIA product. It does not authorize blind code copying, destructive rewrites, data loss, or merging the four excluded apps into ARIA. Each legacy capability must be inventoried and mapped to an ARIA module, retained as a dependency, marked unavailable, or explicitly retired only after owner approval.

## 3. Responsibilities and hard boundaries

### VAYRO
- Owns the ecosystem, product portfolio governance, shared security baseline, identity policy, standards, owner-level oversight and release authorization.
- Receives only approved aggregate status/metrics from sub-products; ownership does not imply unrestricted access to private product data.

### DANA
- Is a separately designed, built, deployed, authenticated, operated and released application.
- Provides command-center workflows, portfolio visibility, planning, AI-assisted coordination and authorized automation.
- Integrates with each product only through documented, versioned APIs/events and narrowly scoped service identities.
- Must not bypass product authorization, human approvals, audit requirements or release controls.
- Its outage must not disable the core workflows of the other four applications.

### ARIA
- Is a separate application directly under VAYRO.
- Consolidates the former ARIA and audited capabilities of the remaining legacy apps listed above.
- Owns only its approved domains and module data.
- Must not own accounting ledgers, accounting ERP, or private ARIANA data.

### ARIANA
- Is the sole product system of record for accounting, finance and ERP.
- Retains its own source, UI, data, authorization, audit trail, runtime and release lifecycle.
- Accounting and ERP capabilities must not be copied into ARIA as a second system of record.

### LEADORA
- Owns distribution, sales operations, inventory and commercial workflow records within its approved scope.
- Retains its own source, UI, data, authorization, runtime and release lifecycle.
- Does not become the accounting/ERP system of record; approved accounting hand-offs go to ARIANA through versioned contracts.

### ARMIN MARKET
- Owns buyer requests, supplier quotations, sourcing and marketplace workflow records.
- Retains its own source, UI, data, authorization, runtime and release lifecycle.
- Payment custody or fund transfers require separate legal, provider and owner approval.

## 4. Preservation and integration rules

1. Preserve the existing design, product identity, capabilities, workflows and business logic of DANA, ARIANA, LEADORA and ARMIN MARKET.
2. Preserve the former ARIA identity and useful existing functionality as the base of consolidated ARIA.
3. Inventory every legacy application and capability before classifying it for ARIA.
4. No source, route, table, record, user history, brand asset or feature may be deleted before its owner, dependencies, target mapping and recovery plan are documented.
5. Keep Persian RTL, English support, mobile-first responsiveness and usability constraints where applicable.
6. Shared design components may be reused without erasing the independent identity of the five applications.
7. Any proposed migration requires source-to-target mapping, compatibility tests, independent backup, dry run, rollback/forward-repair plan and explicit owner approval.

## 5. Data, identity and integration isolation

- Each of the five applications owns its private domain data, authorization rules, runtime configuration, secrets, logs, backup and release evidence.
- No application or DANA may directly query or mutate another application's private tables.
- Cross-app communication uses versioned APIs/events, authenticated least-privilege service identities, schema validation, idempotency for mutations, correlation IDs, audit events, bounded timeouts and explicit retry/failure semantics.
- Shared login or VAYRO identity does not automatically grant permissions inside any sub-product.
- Data export, retention, deletion and recovery remain the source application's responsibility under VAYRO-wide policy.
- ARIA modules may have internal domain boundaries; their data consolidation must not absorb private records belonging to DANA, ARIANA, LEADORA or ARMIN MARKET.

## 6. Delivery sequence and acceptance gates

### Gate 1 — legacy inventory
Discover all historic repositories, branches, commits, files, routes, APIs, data stores, deployments, tests, workflows and dependencies. Reconcile the eleven/twelve count. Mark missing sources as SOURCE_NOT_LOCATED rather than guessing.

### Gate 2 — five-app boundary contracts
Document each app's source, ownership, runtime, data, auth, API/event contracts, service scopes, release pipeline and recovery evidence. Prove that each app's core workflow works without DANA.

### Gate 3 — ARIA module consolidation
Build a capability-to-module matrix for the former ARIA and every remaining legacy app. Integrate one bounded capability at a time with behavioral tests, data lineage and reversible migration plans.

### Gate 4 — DANA command integration
Implement authorized command-center integrations through versioned APIs/events. Test scope denial, revocation, retries, duplicate events, audit coverage and graceful operation during DANA outage.

### Gate 5 — release
Require passing CI/security checks on exact release commits, cross-app authorization tests, independent encrypted offsite backup, successful isolated restore, migration/rollback rehearsal, device/UAT evidence and explicit owner release approval.

## 7. Change control and non-authorization

This ADR defines target architecture and does not prove implementation completeness. It does not authorize production deployment, production database mutation, destructive migration, payment activation, DNS changes, billing, merging this PR or public release. Until separate release authorization and evidence exist, work remains limited to reviewable development-branch changes and non-production verification.
