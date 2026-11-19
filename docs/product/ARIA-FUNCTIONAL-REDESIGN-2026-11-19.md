# ARIA Functional Redesign — VAYRO Governing Product Specification
**Decision:** 2026-11-19  
**Status:** Functional target approved; implementation remains evidence-gated.  
**Source implementation:** https://github.com/gavad54/aria-android/blob/engineering/aria-functional-redesign-2026-11-19/docs/ARIA_FUNCTIONAL_REDESIGN_2026-11-19_FA.md

## Product role
ARIA is one independent application directly under VAYRO. It consolidates the former ARIA plus audited capabilities of the remaining legacy applications. It is not a parent, shared runtime, or database for DANA, ARIANA, LEADORA or ARMIN MARKET.

## Functional architecture
- Smart workspace: natural-language request intake, task classification, guided paths, task history and outputs.
- AI orchestration: provider routing, domain assistants, retrieval, output validation, cost limits, safe fallback and human approval for consequential actions.
- Knowledge and documents: private uploads, extraction, search, citations, export and retention controls.
- Creator studio: text, campaigns, image, audio/video and brand templates; a tool is active only with a verified provider and end-to-end tests.
- Website builder: draft, edit, preview, private save, approval, controlled publish and rollback.
- Data workspace: import, validation, deduplication preview, analysis and source-backed reporting.
- Workflow automation: triggers, steps, scoped permissions, idempotency, retries, dead-letter handling and audit.
- Services/community: provider profiles, service requests, matching, dispute/reporting and status tracking.
- Personal productivity: learning, planning and household workflows with heightened privacy controls.
- Business growth: content, customer acquisition and digital asset workflows; no accounting/ERP ledger.

## Legacy target map
| Legacy app | ARIA destination |
|---|---|
| ARIA | Core workspace and existing capabilities |
| ARVAND | Trade/business workflows |
| CHARSU | Market discovery and commerce capabilities |
| GANJINEH | Digital storefront tools |
| NEGAH | Creative studio |
| SEPEHR | Cloud/resource management tools with privileged-action safeguards |
| NAMA | Website/page builder |
| PAYAM | Consent-aware marketing and communications |

The list is not yet proven exhaustive. No source or capability is presumed migrated merely because it appears in this map.

## Five-app boundary
VAYRO has five direct independent applications: DANA, ARIA, ARIANA, LEADORA and ARMIN MARKET. DANA coordinates through scoped APIs; it is not their parent. ARIANA alone owns accounting/ERP. LEADORA and ARMIN MARKET remain independent. ARIA must not copy their private data or duplicate their systems of record.

## Delivery gates
1. Establish complete historical source inventory and verify the 11/12-app count.
2. Verify ARIA 32 archive provenance and checksum; import only the owner-approved archive.
3. Reconcile web and Android registries by stable IDs, semantic duplicate checks and version.
4. Build a canonical capability registry with domain, source, owner, state, provider, permissions, cost, API version and tests.
5. Implement one end-to-end workflow at a time with unit, integration, authorization and device tests.
6. Complete identity lifecycle, tenant isolation, audit, backup/restore, provider reliability and usage accounting.
7. Enable commercial transactions only after sandbox, reconciliation, refunds, privacy/legal review and owner approval.

## Evidence rule
The current web source has 60 catalogue records (2 foundation, 5 prototype, 53 planned) at main SHA 350a05a7e80189df4b24359d03ed1c0fc7e7f178. This is not the full Android registry. Catalogue presence, a green syntax test, or an HTTP 200 response does not prove a complete capability. The full source and all historical products remain subject to inventory.
