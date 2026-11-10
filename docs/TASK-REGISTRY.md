# VAYRO weighted task registry
Snapshot: 2026-11-10 11:33:43 +03:30
Fixed window: 2026-11-10T07:43:24Z → 2026-11-12T07:43:24Z (48 hours, no reset).
Only VERIFIED tasks earn weight.

| ID | Measurable acceptance criteria | Weight | Priority | Dependencies | Status | Evidence / blocker |
|---|---|---:|---:|---|---|---|
| GOV-001 | Reconcile PR/head/branch/main/workflows and exact UTC deadline | 2 | P1 | none | VERIFIED | PR #12 open/draft/unmerged; 48 ahead/0 behind |
| CI-001 | CI and CodeQL pass on exact source candidate SHA | 4 | P0 | GOV-001 | VERIFIED | b8abdfc; CI 42779145368 all 45 steps success; CodeQL 42779145558 success |
| ARCH-001 | Product boundaries, data stores, APIs and live infrastructure documented accurately | 2 | P1 | GOV-001 | IN_PROGRESS | Current product boundaries documented; complete product/API/data inventory incomplete |
| PROD-001 | Seven family modules listed; DANA platform capability; independent product boundaries preserved | 3 | P1 | ARCH-001 | VERIFIED | Directory/homepage/types/tests updated; exact-head CI passed |
| OWNER-UI-001 | OWNER login routes after MFA to /dashboard; page loads; metrics/product controls use platform role; anonymous/foreign access denied | 2 | P1 | AUTH-001, API-AUTH-001 | IMPLEMENTED | Dashboard page, login redirect and platform-role API refactor committed in current candidate; exact-head CI pending |
| MODULE-ARVAND | Trade workflows, API, UI, persistence, access and positive/negative tests operational | 6 | P1 | ARCH-001, DB-001 | NOT_STARTED | End-to-end evidence absent |
| MODULE-CHARSU | Marketplace listing/search/order workflows and tenant-safe API/UI/tests operational | 6 | P1 | ARCH-001, DB-001 | NOT_STARTED | End-to-end evidence absent |
| MODULE-GANJINEH | Storefront/catalog/inventory/order and tenant-safe API/UI/tests operational | 6 | P1 | ARCH-001, DB-001 | NOT_STARTED | End-to-end evidence absent |
| MODULE-NEGAH | Creative workflow, provider integration, durable asset storage, tenant authorization and tests operational | 6 | P1 | ARCH-001, DB-001 | IN_PROGRESS | Prototype/routes exist; provider-backed generation and durable object storage not verified |
| MODULE-SEPEHR | Cloud service lifecycle, tenant isolation, quotas, provisioning and monitoring proven | 6 | P1 | ARCH-001, DB-001 | NOT_STARTED | End-to-end service implementation not evidenced |
| MODULE-NAMA | Page builder, publishing, domain/TLS and tenant-safe content lifecycle operational | 6 | P1 | ARCH-001, DB-001 | NOT_STARTED | End-to-end evidence absent |
| MODULE-PAYAM | Campaign/customer-growth workflows, consent, analytics and delivery integration operational | 6 | P1 | ARCH-001, DB-001 | NOT_STARTED | End-to-end evidence absent |
| DB-001 | Production schema and migration history reconciled with safe baseline/rollback | 4 | P0 | BACKUP-001, RESTORE-001 | BLOCKED | Live migration history empty; schema drift |
| BACKUP-001 | Encrypted offsite backup object exists; checksum/size/retention verified | 5 | P0 | authorized provider resources | BLOCKED | No bucket, keys, protected secrets or backup object |
| RESTORE-001 | Independent PostgreSQL 17 restore passes schema/data/invariant checks; RPO/RTO recorded | 5 | P0 | BACKUP-001 | BLOCKED | No separate restore target or successful restore |
| AUTH-001 | Login, verification, reset/change, owner bootstrap and production auth config verified | 4 | P0 | DB-001 | IN_PROGRESS | Repository flows/tests exist; production schema and role config not verified |
| MFA-001 | Privileged MFA enrollment/login/recovery/disable enforced against production schema/key | 4 | P0 | DB-001, AUTH-001 | BLOCKED | Source/isolated CI exist; live DB lacks MFA tables/session columns; runtime key unverified |
| SESSION-001 | Expiry, single/all-session revoke, password reset/change, privilege-change invalidation and rotation verified | 4 | P0 | AUTH-001, MFA-001 | IN_PROGRESS | Expiry/revocation/password flows exist; rotation and privilege-change invalidation remain open |
| API-AUTH-001 | Every route/method has role/scope matrix and row-level positive/negative test evidence | 3 | P0 | AUTH-001 | IN_PROGRESS | 42 operations inventoried; per-operation evidence incomplete |
| TENANT-001 | Production LOGIN role and two-tenant CRUD isolation proven | 4 | P0 | BACKUP-001, RESTORE-001, DB-001 | BLOCKED | Disposable CI RLS proof passed; live DB has zero policies |
| RLS-001 | Production policies, FORCE RLS, grants and runtime-role cross-tenant denial verified | 4 | P0 | BACKUP-001, RESTORE-001, DB-001 | BLOCKED | Live DB: 11 RLS-enabled, zero policies, zero FORCE RLS |
| SECURITY-001 | CSP, headers, CORS, rate limits, audit, email recovery and independent review pass | 2 | P1 | AUTH-001, MFA-001 | IN_PROGRESS | Platform-role boundary refactor pending exact-head CI; production config and independent review incomplete |
| DEPLOY-001 | Production runs reviewed SHA with DB-backed readiness, monitoring and rollback proven | 3 | P1 | DB-001, SECURITY-001 | BLOCKED | Railway still runs base SHA f3abc61 |
| ANDROID-001 | If in approved scope, signed build installs/runs on real device | 1 | P2 | release scope, authorized signing | NOT_STARTED | No real-device evidence |
| UAT-001 | Owner-approved acceptance scenarios pass and evidence is recorded | 1 | P1 | DEPLOY-001 | BLOCKED | UAT evidence absent |
| RELEASE-001 | Legal/privacy/store gates and explicit authorized release approval complete | 1 | P0 | all P0/P1 gates | BLOCKED | No release authorization |

## Weighted progress
Total planned weight = 100. VERIFIED = GOV-001 (2) + CI-001 (4) + PROD-001 (3) = 9/100 = 9%.
IMPLEMENTED, IN_PROGRESS, TESTED and BLOCKED earn no completion weight. The registry includes all seven end-to-end modules and OWNER-UI-001.

## Zero-duplication
Compare objective, inputs, outputs, paths, dependencies and acceptance criteria against this registry and DUPLICATE-REGISTER.md before adding work. Reuse canonical IDs. Exact-SHA tests become stale after relevant source changes.
