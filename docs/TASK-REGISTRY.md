# VAYRO Task Registry
Snapshot: 2026-11-10T17:13:32Z. Status vocabulary: NOT_STARTED, IN_PROGRESS, IMPLEMENTED, TESTED, VERIFIED, BLOCKED. VERIFIED is evidence-scoped.

| ID | Task / acceptance criterion | Priority | Weight | Status | Evidence / dependency |
|---|---|---:|---:|---|---|
| GOV-001 | Eleven peer apps represented; DANA excluded from app registry; ARIA/ARIANA boundaries correct | P1 | 5 | VERIFIED (PR branch only) | PR #14 branch |
| ARCH-001 | Control-plane/independent-plane contract and API-only integrations documented | P1 | 5 | VERIFIED (documentation scope) | docs/ARCHITECTURE.md, docs/PRODUCT-BOUNDARIES.md |
| CI-001 | CI, dependency-audit step, CodeQL all pass on exact latest PR head | P1 | 5 | IN_PROGRESS | Prior head passed; latest docs commit requires fresh runs |
| DB-001 | Reconcile live schema with versioned migrations on verified restored clone | P0 | 10 | BLOCKED | No migrations; schema differs from Prisma source |
| RLS-001 | Runtime roles, policies, FORCE RLS and positive/negative cross-tenant tests pass on real non-owner path | P0 | 15 | BLOCKED | Live 0 policies / 0 FORCE RLS |
| AUTH-001 | MFA, session expiry/revocation and owner controls verified against deployed schema | P0 | 7 | IN_PROGRESS | Source exists; live schema mismatch |
| API-AUTH-001 | Every endpoint mapped to server-side authorization; negative tests pass | P0 | 6 | IN_PROGRESS | CI tests pass on prior isolated run; production coverage unverified |
| BACKUP-001 | Encrypted offsite backup object, remote checksum, retention and access evidence | P0 | 7 | BLOCKED | PR #12 workflow exists; no real run/object evidence |
| RESTORE-001 | Isolated PostgreSQL 17 restore and application invariants; measured RPO/RTO | P0 | 7 | BLOCKED | No successful drill evidence |
| HOST-001 | Dedicated VAYRO project/runtime/domain and independent failure boundary | P1 | 6 | BLOCKED | Current VAYRO service is under ARIA Web |
| EMAIL-001 | Verified sender and successful production delivery/verification flow | P1 | 3 | NOT_STARTED | No delivery proof |
| BILLING-001 | Tested subscription/license/payment/webhook/cancel lifecycle | P1 | 3 | NOT_STARTED | No live payment proof |
| API-INT-001 | Versioned, scoped, audited, revocable product APIs | P1 | 4 | IN_PROGRESS | Architecture contract documented; runtime integrations unverified |
| PORTFOLIO-001 | Independent source/runtime/DB/release evidence for all 11 applications | P1 | 6 | IN_PROGRESS | Inventory shows major repository/runtime gaps |
| ANDROID-001 | Build, sign, install and run approved Android artifact on device | P2 | 3 | NOT_STARTED | No current device proof |
| UAT-001 | Owner acceptance, regression and release evidence complete | P1 | 2 | NOT_STARTED | No signed acceptance |
| RELEASE-001 | All mandatory release gates pass and release is explicitly authorized | P0 | 6 | BLOCKED | Dependent on all P0 gates |

Planned weight total: 100. Verified weight: 10 (GOV-001 and ARCH-001; scoped to PR branch/documentation, not production readiness). Weighted verified progress: 10%. CI-001 is pending exact-head reruns. This is not a claim that the full product or portfolio is 10% commercially complete.
