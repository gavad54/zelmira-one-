# VAYRO task registry
Only VERIFIED tasks count as complete. Snapshot 2026-11-10T10:29:44Z; candidate before this governance commit de1c51712b6dec2c5a66bee5babd3743a9835103.

| ID | Acceptance criterion | Priority | Status | Evidence / dependency |
|---|---|---:|---|---|
| GOV-001 | Preserve a single fixed 48h window | P0 | VERIFIED | Recovered start 07:43:24Z; deadline 2026-11-12T07:43:24Z; provenance prior record |
| CI-001 | Exact candidate CI passes all required steps | P0 | VERIFIED | Run 42779828156, 45/45 |
| SEC-001 | Exact candidate CodeQL succeeds | P0 | VERIFIED | Run 42779828204 |
| DOC-001 | Architecture, boundaries and release gates agree | P1 | VERIFIED | This commit |
| DUP-001 | Diff-audit overlapping dashboard/security PRs | P1 | IN_PROGRESS | PR #5 overlaps dashboard; compare before any integration |
| DB-001 | Encrypted offsite backup object and checksum verified | P0 | BLOCKED | No B2 object/protected config |
| DB-002 | Isolated PostgreSQL 17 restore and invariants pass | P0 | BLOCKED | Requires DB-001 and independent target |
| DB-003 | Live schema and migration history reconciled | P0 | BLOCKED | Empty migration history/schema drift |
| DB-004 | Least-privilege runtime roles/effective grants verified | P0 | BLOCKED | No vayro_* roles found; production mutation prohibited |
| RLS-001 | Policies/FORCE RLS and two-tenant tests pass on real runtime role | P0 | BLOCKED | 11 tables, zero policies/FORCE RLS |
| AUTH-001 | Production auth/session schema and behavior verified | P0 | BLOCKED | Live MFA tables/session columns absent |
| MFA-001 | Production MFA enrollment, recovery and enforcement verified | P0 | BLOCKED | CI/source is not production evidence |
| SESSION-001 | Rotation, revocation, expiry and all-session logout verified | P0 | BLOCKED | Production lifecycle evidence incomplete |
| API-AUTH-001 | Positive/negative authorization evidence for all protected endpoints | P0 | IN_PROGRESS | 42 operations inventoried; evidence incomplete |
| SEC-002 | Production CSP/CORS/headers/proxy/rate-limit/audit verified | P0 | BLOCKED | Runtime topology/config not verified |
| HOST-001 | Dedicated VAYRO hosting/domain/monitoring verified | P1 | BLOCKED | Railway service remains in ARIA Web |
| MAIL-001 | Real email verification/recovery delivery tested | P1 | BLOCKED | No delivery evidence |
| PAY-001 | Payment/webhook/licensing flows tested | P1 | BLOCKED | No provider evidence or activation authorization |
| API-001 | Versioned product API contracts/scopes verified | P1 | BLOCKED | Full product contract coverage absent |
| ANDROID-001 | Signed Android build runs on real device | P2 | BLOCKED | No current device evidence |
| UAT-001 | Owner/user acceptance scenarios pass | P1 | BLOCKED | No signed UAT |
| RELEASE-001 | All release/legal gates and explicit approval pass | P0 | BLOCKED | Not authorized; not released |

Do not repeat CI-001/SEC-001 unless candidate code changes. No production DB task may proceed before DB-001/DB-002.
