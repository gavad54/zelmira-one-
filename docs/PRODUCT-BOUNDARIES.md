# VAYRO Product Boundaries — governing baseline

**Decision date:** 2026-11-19  
**Authoritative architecture:** [ADR-0002 — VAYRO parent with five independent applications](architecture/ADR-0002-four-independent-apps-under-dana.md)

## Product hierarchy

VAYRO is the mother application and owner/governance layer. The following five applications are independent and are **direct sub-products of VAYRO**:

| Direct VAYRO sub-product | Role | Independence |
|---|---|---|
| **DANA** | Ecosystem command center and authorized orchestration | Independent application, source/runtime/data/auth/release boundary |
| **ARIA** | Consolidated application formed from former ARIA plus remaining legacy app capabilities | Independent application and direct VAYRO sub-product |
| **ARIANA** | Accounting, finance and ERP | Independent application; sole accounting/ERP system of record |
| **LEADORA** | Distribution, sales, inventory and commercial operations | Independent application; not the accounting/ERP system of record |
| **ARMIN MARKET** | Buyer requests, supplier quotations, sourcing and marketplace workflows | Independent application |

DANA is not the parent of the other applications. ARIA is not the parent of ARIANA, LEADORA or ARMIN MARKET. DANA, ARIANA, LEADORA and ARMIN MARKET are excluded from ARIA consolidation.

## ARIA consolidation portfolio

The former ARIA remains the base product. The known remaining legacy initiatives to audit and consolidate as ARIA modules are:

| Legacy initiative | Intended ARIA domain |
|---|---|
| ARVAND | International trade and commerce workflows |
| CHARSU | Marketplace and commerce network capabilities |
| GANJINEH | Digital stores and e-commerce capabilities |
| NEGAH | Creative studio and content production |
| SEPEHR | Cloud and digital infrastructure capabilities |
| NAMA | Website and landing-page builder |
| PAYAM | Marketing and customer growth capabilities |

This is a discovery baseline, not a verified complete inventory. The historical count of eleven or twelve apps must be reconciled from source repositories, branches, docs, deployments and data stores before claiming completeness.

## DANA command model

- VAYRO owns portfolio governance, identity policy, security baseline, shared standards and release authorization.
- DANA is a standalone application and the ecosystem-wide command center.
- DANA coordinates only authorized operations through versioned APIs/events and least-privilege service identities.
- DANA cannot bypass any application's authorization, approval, audit or release controls.
- A DANA outage must not stop core workflows in ARIA, ARIANA, LEADORA or ARMIN MARKET.

## Non-negotiable product and data boundaries

1. All five applications are direct sub-products of VAYRO with independent source/runtime/data/auth/release boundaries.
2. ARIA may consolidate only the former ARIA and remaining legacy capabilities; it must not absorb DANA, ARIANA, LEADORA or ARMIN MARKET.
3. ARIANA remains the sole accounting/ERP system of record. ARIA must not implement a competing ledger or own ARIANA's private data.
4. LEADORA owns distribution and commercial operations, not accounting/ERP.
5. ARMIN MARKET owns marketplace workflow records; payment custody requires separate approval.
6. No application or DANA may directly query or mutate another application's private tables.
7. Shared identity or navigation does not imply shared permissions or shared database ownership.
8. Cross-app APIs/events require versioned contracts, service authentication, least privilege, schema validation, idempotency, correlation IDs, audit and explicit retry/failure behavior.

## Preservation and migration

- Preserve existing design, brand identity, capabilities, workflows, data and business rules until they are inventoried and assessed.
- No wholesale rewrite, silent product reclassification, destructive migration or feature deletion.
- Every legacy capability must have a source, owner, target module, dependency map, test and disposition.
- Any data movement requires source-to-target mapping, compatibility analysis, independent backup, dry run, integrity checks and rollback/forward-repair plan.
- Product-specific UI identity may be retained within ARIA modules where useful and verified.
- Persian RTL, English support, mobile-first behavior and accessible flows remain constraints where applicable.

## Release requirements

Each of the five applications must independently pass its CI, security and authorization tests, cross-app denial tests, production configuration checks, migration/rollback rehearsal, encrypted offsite backup and isolated restore, UAT and explicit owner release approval.

A green CI run or a healthy hosting process does not prove production database safety, backup recoverability, tenant isolation or commercial readiness. No production DDL, grants, migrations, deployment, payment activation or public release is authorized by this document.
