# ADR-0002: Four independent applications under DANA command

- **Status:** Accepted by product owner instruction on 2026-11-19
- **Scope:** VAYRO ecosystem governance, application boundaries, command/orchestration, data ownership and release architecture
- **Supersedes:** Any prior statement that ARIA is the parent application or family shell for ARIANA, LEADORA or ARMIN MARKET
- **Does not authorize:** Production deployment, production database mutation, merging this branch, billing activation, destructive migration or public release

## Decision

VAYRO is the sole mother ecosystem and top-level ownership/governance layer.

DANA is VAYRO's central command and orchestration center. DANA coordinates the four independently operated applications and the other VAYRO product initiatives. DANA is not a fifth customer-facing application and does not absorb the applications' private business logic or data.

Exactly four applications are designated as independent flagship applications under DANA command:

1. **ARIA** — general-purpose AI, social, communication, services and listings application. It is independently designed, built, deployed, operated and released.
2. **ARIANA** — accounting, finance and ERP application. It is independently designed, built, deployed, operated and released. It is the sole owner of accounting/ERP domain behavior.
3. **LEADORA** — distribution, sales, inventory and commercial operations application. It is independently designed, built, deployed, operated and released. It is not the accounting/ERP system of record.
4. **ARMIN MARKET** — buyer requests, supplier quotations and sourcing application. It is independently designed, built, deployed, operated and released.

All four are under VAYRO ownership/governance and DANA's authorized command/orchestration. None is a child module, sub-screen, tenant, or deployment of another one of the four. ARIA is not the parent of ARIANA, LEADORA or ARMIN MARKET.

Other approved VAYRO product initiatives remain in the VAYRO portfolio and are coordinated by DANA. Their precise packaging (standalone product, separately deployable service, or capability within a product) must be established by a product-specific audit before implementation; no existing capability is silently moved or deleted. Current named initiatives include ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA and PAYAM.

## Command model

- VAYRO owns portfolio policy, identity governance, access policy, security baseline, release gates, shared platform standards and owner-level oversight.
- DANA coordinates authorized tasks, status, AI-assisted workflows, automation and cross-application operations. DANA must not bypass an application's authorization, approval or release controls.
- Each application owns its own domain model, user experience, database/schema, runtime configuration, secrets, deployment pipeline, logs and release evidence.
- DANA accesses applications only through explicit, versioned APIs/events and narrowly scoped service identities. Every consequential operation requires the application's authorization and any required human approval.
- A DANA outage must not make the four applications' core user workflows unavailable. Each application must continue to operate independently within its own availability boundary.

## Non-negotiable product boundaries

### ARIA
- Owns AI/general-purpose, social, communications, services and listings capabilities within its approved scope.
- Must not own accounting ledgers, bookkeeping, financial statements, ERP accounting or ARIANA's private data.
- May link to ARIANA workflows through an authorized integration, but must not duplicate or directly mutate ARIANA accounting records.

### ARIANA
- Sole product system of record for accounting, finance and ERP workflows.
- Must retain its own database ownership, authorization, audit trail and independent release cycle.
- May receive approved operational data from LEADORA through versioned contracts; source records remain owned by LEADORA.

### LEADORA
- Owns distribution, sales operations, inventory and commercial workflow records within its approved scope.
- Must not become the accounting/ERP system of record.
- Financial summaries or hand-off data to ARIANA must be explicit, traceable and idempotent; LEADORA does not directly write ARIANA tables.

### ARMIN MARKET
- Owns buyer requests, supplier quotations, sourcing and marketplace workflow records.
- Does not assume custody of buyer/supplier payments unless a separately approved payment design, legal review and release gate authorize it.

## Technical isolation and integration contracts

1. Each flagship application has a separate repository or an explicitly isolated source boundary, independent build/test pipeline, runtime/deployment boundary and release version.
2. Each application owns its private database/schema and migrations. Shared identity does not mean shared tables or shared database credentials.
3. Cross-application communication uses versioned APIs or events with:
   - authenticated service identity and least-privilege scopes;
   - schema validation and explicit contract versioning;
   - idempotency keys for retried mutations;
   - correlation IDs and traceable audit events;
   - bounded timeouts, retries with backoff and circuit breaking where appropriate;
   - explicit failure semantics and reconciliation for asynchronous work.
4. No application or DANA may directly query or mutate another application's private tables.
5. User identity federation, if introduced, must use a documented trust protocol and per-application authorization. A valid VAYRO/DANA identity does not automatically grant domain permissions inside an application.
6. Product data export, deletion, retention and backup remain application-owned, subject to VAYRO-wide policy and applicable law.
7. Shared UI/navigation may provide a unified discovery experience, but must not turn the four applications into one coupled runtime.

## Preservation and migration policy

- Preserve existing source, UI, design language, workflows, feature ideas, records and product-specific behavior until a complete inventory identifies duplicates, defects and ownership.
- Do not perform a wholesale rewrite based only on this ADR.
- First map existing repositories, deployments, databases, schemas, user flows, integrations, secrets/configuration names (never secret values), tests and release evidence.
- Any proposed movement of a feature or data requires a source-to-target mapping, compatibility plan, backup, dry run, rollback/forward-repair plan and owner approval.
- Keep existing application visual identities and improve them incrementally. A shared VAYRO design system may provide reusable tokens/components without erasing product identity.
- Maintain Persian RTL and English support where currently required; mobile-first behavior and accessible flows remain design constraints.

## Delivery sequence and acceptance gates

### Gate 1 — inventory and boundary audit
For each of the four apps, record repository/default branch/head, source structure, build/test commands, deployment, database owner, authentication, authorization, external integrations, data sensitivity, backup/restore, known defects and actual CI evidence. Missing source or unavailable credentials are blockers, not assumed implementations.

### Gate 2 — architecture contracts
Approve application ownership maps, DANA service identities/scopes, API/event contracts, identity federation design, audit schema, failure/retry behavior, data retention and per-app SLO/health contracts. Test that an app can run without DANA.

### Gate 3 — implementation in isolated branches
Implement one independently reviewable change at a time. Add behavioral tests before implementation, verify the expected failing test, implement the minimum change, then rerun focused and integration suites. Do not share database tables to accelerate integration.

### Gate 4 — security and recovery
Prove tenant/user authorization, cross-app denial, service-scope denial, audit coverage, secret isolation, encrypted independent backups and successful isolated restores for each application. A CI test database is not evidence of production database safety.

### Gate 5 — release
Require passing CI/security checks on the exact release commit, production configuration verification, migration dry-run and rollback evidence, mobile/device acceptance where applicable, owner UAT, independent review and explicit owner release approval.

## Current repository evidence at decision time

- VAYRO repository: `gavad54/zelmira-one-`; current reviewed engineering PR #39 is open and unmerged.
- Known source repositories: `gavad54/aria-android`, `gavad54/LEADORA`, `gavad54/Armin_market`.
- No verified ARIANA source repository was found in the previous repository discovery. ARIANA implementation status must therefore remain **SOURCE_NOT_LOCATED** until the owner supplies or repository discovery finds the authoritative source.
- The ARIA web/Android repository contains an early prototype and does not establish a production-ready independent app.
- LEADORA repository contains a FastAPI/SQLite application; repository presence and README-listed features do not prove production deployment, backup recovery or complete acceptance.
- ARMIN MARKET repository contains an early Android/Kotlin/Compose prototype; its README explicitly says core marketplace operations are not yet connected.
- These observations are a starting inventory, not a complete code audit or production certification. Refresh source and CI evidence before release decisions.

## Rollback and change control

This ADR is documentation-only until implemented. It does not authorize merging PRs, changing production infrastructure, modifying databases, rotating secrets, enabling payments, publishing applications or deleting existing functionality. Reversal or amendment requires a new dated ADR and an explicit owner decision.