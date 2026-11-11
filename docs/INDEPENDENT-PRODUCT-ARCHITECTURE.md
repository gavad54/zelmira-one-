# Independent Application Architecture Contract

**Status:** Approved target architecture; implementation and release evidence are tracked separately.
**Owner platform:** VAYRO
**Application count:** 11 independent applications
**Shared AI capability:** DANA (not an application)

## 1. System topology

VAYRO is the command, governance and portfolio control plane. It is responsible for central visibility and policy, not for running the business workflows or storing the operational records of every product.

The eleven applications are peers:

1. ARVAND
2. CHARSU
3. GANJINEH
4. NEGAH
5. SEPEHR
6. NAMA
7. PAYAM
8. LEADORA
9. ARIANA
10. ARIA
11. ARMIN MARKET

DANA is a shared AI/orchestration capability available to VAYRO and, through explicitly authorized interfaces, to applications. DANA must not become an implicit data-sharing path or a required runtime dependency.

## 2. Required independence for every application

| Boundary | Required implementation | Acceptance evidence |
|---|---|---|
| Source and ownership | Separately controlled codebase or isolated repository with its own maintainers and release history | Repository and ownership inventory |
| Runtime | Independently deployable runtime, environment, domain and rollback | Deploy, health-check and rollback drill without deploying another app |
| Data | Product-owned operational database, migrations, credentials and retention policy | Catalog and credentials prove no shared operational DB; negative cross-product access test |
| Identity | Local authentication, recovery and authorization; optional standards-based VAYRO federation | Local login works with VAYRO unavailable; revoked federation token denied |
| API | Versioned contract, service identity, narrow scopes, explicit fields, timeouts and idempotency | Contract tests, authorization-negative tests and revocation test |
| Backup | Independently controlled encrypted backup | Backup object, checksum and access-control evidence |
| Restore | Isolated restore with measured recovery point and recovery time | Restore logs, integrity check, RPO/RTO report |
| Commercial | Independent price, plan, license, payment and cancellation lifecycle | Product-specific subscription and entitlement tests |
| Support | Independent support and incident ownership | Support path and incident runbook |
| Resilience | No cascade from other products' downtime or release | Fault-injection/contract test with dependency unavailable |

VAYRO may store only portfolio metadata, product endpoints, health summaries, entitlement references, integration registrations and audit events required for central governance. It must not store or become authoritative for another product's accounting, inventory, customer transactions, files or business records.

## 3. Control-plane capabilities

VAYRO must provide:

- Owner command center with portfolio-wide status, exceptions and audit history.
- Product registry with lifecycle state backed by evidence, not manual claims alone.
- Identity federation as an optional service; product-local accounts remain available.
- Central entitlement and license references; product servers enforce entitlements locally or through a fail-safe, cached contract.
- Subscription and revenue consolidation without taking ownership of product ledgers.
- Integration registry with scopes, owners, versions, health, expiry and revocation.
- Infrastructure and deployment inventory, release approvals and rollback references.
- DANA policy controls: approved tools, scoped identities, budget limits, human approval and audit.

## 4. Integration rules

1. No shared operational database, shared schema, direct cross-product database credentials or cross-product table reads.
2. Product-to-product communication is API-only and explicitly enabled by the owning products.
3. Each integration must identify provider, consumer, API version, data fields, purpose, scopes, owner, expiry and revocation procedure.
4. No core local workflow may block merely because an optional integration or VAYRO is unavailable.
5. Every request is authenticated and authorized server-side. Unknown scope or identity is denied.
6. Sensitive actions require idempotency, audit events and where appropriate human confirmation.
7. No production data migration without an independently verified backup, mapping, dry run and rollback.

## 5. Product-specific non-negotiable boundaries

- ARIA contains no accounting, ERP, tax ledger or accounting-company workflow. Those belong to ARIANA.
- ARIANA remains independently usable and is not an ARIA module.
- LEADORA retains its own distribution and sales operations scope and data.
- ARMIN MARKET remains a separate buyer-request and supplier-quotation application.
- No product's existing capability is removed or merged without inventory, impact assessment and owner approval.
- DANA is not counted as an independent application.

## 6. Product lifecycle state machine

Allowed portfolio states:

- `PLANNED`: product concept and scope approved; no operational readiness claim.
- `BUILDING`: active implementation with repository and owner assigned.
- `INTERNAL_TEST`: deployed to a non-production environment; tests and security checks running.
- `PILOT`: controlled users and data under explicit pilot controls.
- `PRODUCTION`: every product-specific release gate passed and owner approval recorded.
- `MAINTENANCE`: service remains supported with restricted change scope.
- `SUSPENDED`: access or operation deliberately suspended; preserve evidence and recovery path.
- `RETIRED`: formally decommissioned with data export/retention and customer notice completed.

A configured URL, a green repository CI run, a product card or a code file is not sufficient to set `PRODUCTION`.

## 7. Delivery order

1. Establish the authoritative product registry and independence contract in VAYRO.
2. Complete VAYRO's own backup/restore, identity/MFA, endpoint authorization, tenant isolation and hosting gates.
3. For each application, inventory its current source, infrastructure, database, secrets ownership, backup, restore, security and release state.
4. Preserve existing capabilities and create a product-specific implementation plan from that inventory.
5. Implement each app independently, using shared API standards but no shared runtime or operational data.
6. Integrate optional SSO, entitlements, analytics and DANA only after local workflows and controls work independently.
7. Release each app separately after its own security, backup/restore, UAT and rollback gates pass.

## 8. Current evidence boundary

This contract and the VAYRO registry describe the target architecture. They do not prove that eleven independent application deployments, databases, backups, restore drills, payment systems or customer support operations already exist. Each must be verified independently before its status can be promoted.
