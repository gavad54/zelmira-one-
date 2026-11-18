# VAYRO Engineering Execution Decision and Gate Plan
**Date:** 2026-11-18  
**Repository:** `gavad54/zelmira-one-`  
**Branch:** `engineering/vayro-hardening-2026-11-18`  
**Head inspected before this document:** `d50c0c12b5188dc065cf69d79352f7f96d8ecfc1`  
**PR:** [#39](https://github.com/gavad54/zelmira-one-/pull/39) — open, not merged  
**Decision:** continue isolated engineering; keep production migration, deployment and commercial activation blocked.

## 1. Fresh verification checkpoint

The exact PR head inspected was `d50c0c12b5188dc065cf69d79352f7f96d8ecfc1`.

- [VAYRO CI run 44371034634](https://github.com/gavad54/zelmira-one-/actions/runs/44371034634): completed successfully. The job passed locked install, unit tests, Prisma generation and validation, isolated PostgreSQL migration history, isolated auth/platform/tenant role and RLS checks, lint, typecheck, production build, Docker build, PostgreSQL/HTTP integration and both production-only and full dependency audits.
- [CodeQL run 44371034539](https://github.com/gavad54/zelmira-one-/actions/runs/44371034539): completed successfully, including the analysis step.
- PR #39: open, not merged, not draft; GitHub reported mergeable.
- This is repository/isolated-CI evidence. It does not prove the live database, production identity, backup, hosting, Android or customer workflow is ready.

## 2. Fresh live VAYRO-CORE observation

Supabase project `wdqhdnhpgxhmmfeyxwxr` is ACTIVE_HEALTHY on PostgreSQL 17.11. The latest read-only inventory observed:

- 11 public tables, all with RLS enabled; the inventory reported zero rows at that observation time.
- 11 Security Advisor findings: RLS enabled without policies.
- No policies in the policy inventory.
- Empty migration history.
- Live Session has only `id`, `tokenHash`, `userId`, `expiresAt`, `createdAt`; the Prisma schema also expects `revokedAt`, `lastSeenAt`, `assurance`, `mfaAuthenticatedAt`.
- Four Prisma models are absent from the live table inventory: `AiGeneration`, `AuthChallenge`, `MfaRecoveryCode`, `UserMfa`.
- `AuditEvent.tenantId` has no observed FK to Tenant.
- The current inventory and advisor checks are read-only. No DDL, grants, policies, roles, migrations or data were changed.

The prior read-only role inventory found the dedicated runtime logins absent and confirmed that Supabase `service_role` has BYPASSRLS. Re-read roles/grants as part of the next catalog snapshot before making any assumptions about current role state.

## 3. Execution order — mandatory gates

### P0-A — Establish recoverability before schema changes

**Status: BLOCKED — owner-controlled external configuration required.**

1. Create/verify a separately controlled offsite object-storage destination and isolated PostgreSQL 17 restore target.
2. Configure the exact protected GitHub Environment variables/secrets already documented in `PRODUCTION-RECONCILIATION-AND-RECOVERY-PLAN.md`; values must never enter Git, issues, PRs or chat.
3. Run the encrypted backup workflow and verify the remote object and checksum.
4. Run the restore drill against the separate isolated target.
5. Add post-restore assertions: relation inventory, row counts, constraints, indexes, enum types, extension/function/trigger inventory, and application invariants.
6. Record backup timestamp, object version, checksum, restore duration, RPO/RTO and reviewer evidence without exposing credentials.

**Exit criteria:** successful offsite encrypted backup, checksum verification, decrypt and restore on a different PostgreSQL 17 host, plus data/schema invariant comparison. A successful CI-only restore rehearsal does not satisfy this gate.

### P0-B — Reconcile live schema and migration baseline

**Status: BLOCKED — no production DDL authorized.**

1. Produce a complete read-only catalog export: tables, columns, types, defaults, nullability, PK/FK/unique/check constraints, indexes, enums, extensions, views, functions, triggers, ownership, grants, role memberships, RLS flags and policies.
2. Diff every object against `prisma/schema.prisma` and the ordered SQL migration set.
3. Resolve the 4 missing tables, 4 Session columns and AuditEvent tenant FK with explicit data/nullability/delete semantics.
4. Confirm whether production data or external consumers exist at the approved change window; the earlier zero-row observation is time-bound.
5. Design a baseline that records the existing schema without replaying initial CREATE statements over existing objects.
6. Test baseline, forward migration and recovery on a disposable clone of the verified backup.
7. Run all application integration tests against that clone.

**Exit criteria:** reviewed object-by-object diff, clone migration rehearsal, tested recovery path and explicit owner approval for a separately scheduled production change.

### P0-C — Table-level authorization, roles and RLS

**Status: BLOCKED — policies must not be guessed.**

Create the access matrix required by the recovery plan for all current and expected tables. Each row must define data classification, owning service, tenant key derivation, read/insert/update/delete roles, USING and WITH CHECK predicates, owner/platform/auth/bootstrap paths, FORCE RLS decision, audit retention and positive/negative tests.

Required target roles remain separate:
- tenant request runtime: non-owner, non-superuser, non-BYPASSRLS;
- authentication runtime: only required auth/session/token operations;
- platform/owner runtime: explicit owner authorization and narrow privileges;
- one-time bootstrap: constrained and disabled after use;
- migration identity: only for controlled migration jobs.

Do not add generic allow-all policies to silence Advisor. Do not use `service_role` as the normal tenant runtime.

**Exit criteria:** role/grant review, least-privilege matrix, RLS/FORCE RLS design, positive and cross-tenant negative tests on a restored clone, and independent security review.

### P0-D — Endpoint authorization and privileged identity

**Status: IN PROGRESS in code; production certification open.**

1. Inventory every API route and classify public, authenticated, tenant, platform/owner, auth and internal-service operations.
2. Require server-side authorization at the route/service boundary; never rely on hidden UI controls.
3. Verify session expiry, revocation, user disablement, email verification where required, MFA assurance for privileged actions, rate limits and audit events.
4. Test missing/expired/revoked session, disabled user, wrong tenant, wrong role, stale MFA assurance and object-ID substitution for every protected route.
5. Verify no privileged API path accepts a caller-selected tenant context.

**Exit criteria:** endpoint-to-policy coverage report, negative test suite and independent review.

## 4. Product-family execution after P0 controls

Products remain independent boundaries. Do not copy one product's completion percentage to another and do not merge their data stores by convenience.

### Track A — Complete existing implementations first

1. **NEGAH:** durable private media storage, provider-backed generation, ownership-bound downloads, usage/cost metering, retry/timeout and full brief-to-delivery E2E.
2. **LEADORA:** inspect current PR #47 head and CI; close MFA/recovery/session revocation, tenant isolation, independent restore, customer-install/licensing tests, Android device acceptance and payment gates.
3. **ARIANA:** preserve source archive and checksum; establish canonical repository; replace import-time schema creation with versioned migrations; harden session/MFA/RLS and financial idempotency/concurrency; build and sign Android only after backend gates.
4. **ARIA:** preserve strict no-accounting/no-ERP boundary; establish canonical source and archive parity; repair Android source/build/signing; complete module E2E and external adapters; verify database, privacy, payments and restore.
5. **ARMIN MARKET:** build the request/offer backend and persistent data model before expanding UI; implement buyer request, supplier offer, comparison/selection, moderation and audit; then signed release and device UAT.

### Track B — Build the six low-maturity products as vertical slices

Each vertical slice must include UI, domain API, persistence, authorization, audit, automated tests, operational telemetry and a demonstrable user journey.

- **ARVAND:** Buyer/Supplier → RFQ → Quote → comparison/acceptance → trade documents → shipment milestones.
- **CHARSU:** seller onboarding → listing/search → cart/order → commission ledger → settlement/refund → moderation.
- **GANJINEH:** store setup → product/variant → inventory ledger → checkout/order → fulfilment → refund/reconciliation.
- **SEPEHR:** tenant provisioning → runtime/quota → secret isolation → logs/monitoring → backup/restore → usage metering.
- **NAMA:** template → visual editing → preview → publish → domain/SSL → version/rollback → media/forms.
- **PAYAM:** customer/campaign → content calendar → customer approval → official OAuth connection → publishing queue → analytics with source provenance.

Do not claim social publishing, cloud hosting, website publishing or payments until provider credentials, legal terms, sandbox tests and production acceptance have been verified.

## 5. Shared platform completion

- **Owner control:** enforce MFA and re-authentication for privileged actions, immutable audit trail, least privilege, recovery and break-glass procedures.
- **DANA:** keep it as an internal engine, not a twelfth product. Add tool allowlists, human approval for sensitive operations, tenant-scoped context, budget ceilings, provenance, retry/timeout and complete audit. DANA must not bypass platform authorization.
- **Billing:** product entitlements, subscription lifecycle, signed/idempotent webhooks, invoice/ledger, refunds and reconciliation; sandbox first.
- **Email:** verified sender, provider delivery, bounce/complaint handling, retry and audit.
- **Hosting:** establish an independently controlled VAYRO project, database, domain, secrets, monitoring and rollback. Do not repurpose ARIA or LEADORA infrastructure.
- **Android:** define native scope, API/session contract, signing, artifact provenance and real-device UAT. A Debug APK is not a release.
- **Localization:** Persian RTL and English, accessibility, small-screen, keyboard, low-bandwidth and failure-state tests.

## 6. Release gates

Production release remains blocked until all applicable items pass:

- [ ] Independently verified encrypted offsite backup and restore.
- [ ] Full live catalog/schema reconciliation and migration baseline rehearsal.
- [ ] Least-privilege runtime roles, grants, policies and FORCE RLS decisions.
- [ ] Cross-tenant and endpoint authorization negative tests.
- [ ] MFA/session/owner-operation security review.
- [ ] No unresolved blocking dependency or CodeQL finding without a documented approved disposition.
- [ ] Independent VAYRO hosting, secrets, monitoring and rollback.
- [ ] Email/payment/provider sandbox and production verification.
- [ ] Android signing and device UAT where applicable.
- [ ] Product-specific end-to-end UAT and owner release approval.

## 7. Change-control rules

- This plan and repository CI are not production authorization.
- No production DDL, migration, role/grant/policy changes, data writes or destructive action without backup/restore proof, reviewed change set and separate owner approval.
- No merge of PR #39, public deployment, paid service creation or payment activation is performed by this plan.
- Never request or publish secret values in chat, code, logs, issue comments or PR text.
- Keep ARIA without accounting/ERP; accounting/ERP belongs to ARIANA. Preserve independent LEADORA and other product boundaries.
- Every status change must cite a commit, test run, artifact or independently observed environment result.

**Current decision: ISOLATED ENGINEERING MAY CONTINUE — LIVE DATABASE CHANGE BLOCKED — PRODUCTION DEPLOYMENT BLOCKED — COMMERCIAL RELEASE BLOCKED.**
