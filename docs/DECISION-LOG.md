# VAYRO Decision Log
Snapshot: 2026-11-10T17:10:47Z.

- DEC-001: VAYRO is the control/governance plane; each application remains independently deployable and commercially operable.
- DEC-002: Eleven peer applications are tracked: ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM, LEADORA, ARIANA, ARIA and ARMIN MARKET. DANA is a shared platform AI/orchestration capability, not an eighth module.
- DEC-003: ARIA must not contain accounting/ERP; ARIANA owns accounting/ERP; LEADORA remains independent pending audit.
- DEC-004: Cross-product integration is via versioned, scoped, audited and revocable APIs only; no shared operational DB/schema/credentials.
- DEC-005: Production Supabase remains read-only until independently verified backup/restore and reviewed schema/migration reconciliation exist.
- DEC-006: No production migration, DDL, data/config/secret change, merge, deploy, purchase, paid resource or public release without the relevant separate approval.
- DEC-007: CI success on an isolated disposable database does not certify production RLS or tenant isolation.
- DEC-008: A Railway service named VAYRO under project ARIA Web is not considered independent VAYRO hosting.
