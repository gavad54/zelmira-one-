# VAYRO — DANA + Growth Studio Autonomous Engineering Execution Prompt
**Version:** 1.0  
**Date:** 2026-11-18  
**Target repository:** `gavad54/zelmira-one-`  
**Reference PRs:** #37 (Supabase/DANA architecture proposal), #36 (Growth Studio live gap audit)  
**Baseline inspected by this prompt:** `f0d31804e695cd3d73b452c7507affdca9573740`  
**Execution branch:** `engineering/dana-growth-autonomous-remediation-2026-11-18`  
**Status:** Execution specification; not a release approval.

---

## 1. Mission and required outcome

Act as the VAYRO engineering organization under the previously approved governance model. Inspect the actual repository, current default branch, PRs, workflows, application code, database schema/migrations, deployment configuration and tests. Then implement the maximum safe, reversible, verifiable work required to make DANA and the Growth Studio a coherent, customer-operable service.

The commercial objective is a guided service for customers who have no programming, design or marketing expertise. A customer should be able to describe a goal in ordinary language, receive a clear service recommendation and quote, approve the work, follow progress, review deliverables, request revisions and see verified performance and costs. The system must never imply that a website, video, social post, payment or campaign succeeded unless the corresponding provider or application state proves it.

Do not stop at writing plans or adding static dashboard cards. Prefer working code, persistent domain models, authenticated APIs, real integration contracts, automated tests and inspectable evidence. When an external provider, credential, owner decision or production resource is unavailable, implement a safe adapter/interface, sandbox test, documented blocker and owner-ready setup instructions; do not fabricate a successful integration.

## 2. Governance, product boundaries and authority

VAYRO is the mother application and governance plane. DANA is an internal AI intelligence/orchestration capability inside the VAYRO Command Center, not a twelfth product.

Preserve the eleven independent product boundaries:
- ARVAND — international trade.
- CHARSU — marketplace and commerce network.
- GANJINEH — digital stores and e-commerce.
- NEGAH — creative studio and digital production.
- SEPEHR — cloud and digital infrastructure.
- NAMA — website and landing-page builder.
- PAYAM — marketing and customer growth.
- LEADORA — distribution, sales, inventory and commercial operations.
- ARIANA — accounting, finance and ERP.
- ARIA — social, communications, services and listings; explicitly no accounting or ERP.
- ARMIN MARKET — buyer requests and supplier quotations.

Do not modify the independent ARIA, ARIANA, LEADORA or ARMIN MARKET repositories. Do not move their data or business rules into VAYRO. Cross-product operations must use reviewed, versioned APIs/events, scoped service identities, correlation IDs, idempotency and audit events. VAYRO CORE may own identity, tenant membership, product registry, entitlements, audit, usage metering and shared billing records, but it must not become a direct-query gateway into product-private databases.

### Authority limits
Allowed without additional owner input:
- Read-only repository and configuration audits.
- New isolated branches and draft PRs.
- Reversible code, tests, documentation, schemas/migrations in source control, mocks and sandbox adapters.
- CI execution and local/disposable database tests.
- Security fixes that do not weaken controls.
- Build/export of a source snapshot from verified repository content.

Not allowed without explicit owner approval and the required release evidence:
- Merge any PR or push to protected production branches.
- Deploy publicly or change DNS/domains.
- Run production DDL, migrations, grants, RLS changes or data writes.
- Create, reveal, rotate or copy owner secrets, provider credentials, signing keys or payment keys.
- Enable live customer onboarding, social publishing, payments, subscriptions or public campaigns.
- Spend money, upgrade paid infrastructure or change ownership/access.
- Delete customer data, product capabilities or historical records.

Never request passwords, session cookies, API keys or recovery codes in chat. Use protected GitHub/Railway/Supabase secret stores configured by the owner. Do not put secrets in source, logs, artifacts, screenshots or reports.

## 3. Required first-pass verification

Before changing code, refresh all evidence; historical docs are not live state.

1. Record current default branch name and SHA.
2. Fetch PR #36 and #37 metadata, base/head refs, latest head SHAs, changed files, review comments, mergeability and exact CI/CodeQL/dependency-audit results. Do not infer PR status from this document.
3. Determine whether the PR branches are based on the current default branch. Identify drift and overlapping changes.
4. Inspect all relevant source paths, Prisma schema, every migration, auth/session/MFA implementation, tenant authorization helpers, DANA provider adapters, AI generation routes, NAMA/NEGAH/PAYAM pages and APIs, storage implementation, package manifests/lockfile, CI workflows and release gates.
5. Check whether the reported dependency advisories still exist on the current exact head. Identify direct and transitive paths. Never use `npm audit fix --force`, suppress advisories, or introduce broad unreviewed overrides.
6. Read current architecture, product-boundary, security, database-access, backup/restore and release-gate documents. Reconcile contradictory or stale claims with exact commit and run evidence.
7. Classify each finding as: confirmed defect, missing implementation, external dependency, historical/stale finding, or unverified. Include file path, line/function, evidence, impact, severity, owner dependency and acceptance test.

Do not claim live Supabase, Railway, Meta, YouTube, email or payment-provider state unless the corresponding authorized read-only source has actually been queried during this run.

## 4. DANA — required operational design

DANA must be a reliable coordinator, not an unrestricted autonomous administrator.

### 4.1 Customer-facing experience
Create a guided, Persian-first and RTL-capable workflow, with English support:
1. Ask the customer what outcome they need in ordinary language.
2. Classify intent into NAMA website, NEGAH creative production, PAYAM marketing, or a combined service request.
3. Ask only for missing information that materially changes scope, cost or delivery.
4. Convert the request into a structured brief with audience, deliverables, channels, schedule, constraints and acceptance criteria.
5. Produce a transparent estimate/quote with line items, assumptions, exclusions, estimated delivery and revision policy.
6. Require explicit customer approval before paid work, external publication or irreversible changes.
7. Create a persistent order and show status, owner, due date, blockers and next action.
8. Present deliverables for review, collect revision requests and record acceptance.
9. Show verified performance and cost reports with source, time range, freshness and missing-data labels.

Provide accessible defaults and explanations. Do not make expertise or technical vocabulary a prerequisite. Never promise guaranteed reach, sales, ranking, views or revenue.

### 4.2 Agent and tool security
- Use an explicit tool registry/allowlist with schemas, per-tool scopes, tenant binding and risk classification.
- Resolve user identity and tenant on the server from a verified session. Never trust a client-supplied tenant ID as authorization.
- Separate read-only tools from write tools.
- Require approval for customer-visible publishing, spending, billing, pricing changes, domain changes, account connection/revocation, deletion and other consequential actions.
- Enforce authorization inside every tool/API, not merely in the prompt or UI.
- Treat user uploads, retrieved documents, web pages and provider responses as untrusted data; prompt-injection content cannot override policy or grant tools.
- Never permit model-generated raw SQL, arbitrary URLs, shell execution or access to service-role credentials.
- Apply timeouts, bounded retries, idempotency keys, per-tenant concurrency limits, token/cost budgets and circuit breakers.
- Redact credentials and unnecessary personal data from logs.
- Persist task state, approvals, tool invocations, outcomes, errors and correlation IDs. Model conversation memory is not authoritative business state.
- Support cancel, retry, resume and human handoff.
- A streamed response must not report completion until the durable task/provider state confirms completion.

### 4.3 Performance and coordination
DANA dashboard must distinguish:
- Planned, queued, running, waiting-for-customer, waiting-for-provider, needs-human-review, succeeded, partially-succeeded, failed and cancelled.
- Internal task progress from external provider status.
- Estimated cost from settled/reconciled cost.
- Forecast/estimate from observed results.
- Missing or stale analytics from zero performance.

Every report must show time range, tenant, source, last sync time, metric definitions, attribution caveats and any incomplete integrations.

## 5. Growth Studio — end-to-end service requirements

Implement in dependency order, using feature flags and sandbox mode where external approval is required.

### 5.1 Shared customer/order domain
Create and test persistent, tenant-scoped entities as justified by the existing schema:
- Customer/business profile and consent/preferences.
- Service catalogue and versioned package definitions.
- Intake brief and attachments.
- Quote and quote line items, validity and approval.
- Order and order items, status history and idempotency.
- Customer approvals and revision requests.
- Deliverables and acceptance records.
- Notifications and audit events.
- Usage reservations and actual cost ledger entries.

Define state machines and legal transitions. Prevent duplicate order creation and duplicate charges. Every mutation must be authenticated, authorized, tenant-scoped, validated, rate-limited where appropriate and audited.

### 5.2 NAMA — website delivery
Implement:
- Template catalogue with clear scope and accessible preview.
- Structured page/section editor with safe content blocks.
- Responsive mobile/desktop preview.
- Customer brief-to-draft generation with human/customer review.
- SEO, accessibility, metadata and link checks.
- Version history and immutable publish snapshots.
- Domain ownership verification and TLS readiness checks.
- Publish/unpublish, rollback and audit history.
- Per-site tenant authorization and quota controls.

Do not claim a site is live based on a saved draft or a successful build. Confirm publication through the hosting provider and a verified HTTP check. Keep custom-domain activation disabled until DNS/owner approval.

### 5.3 NEGAH — creative production
Implement:
- Brief, prompt and asset lifecycle.
- Provider abstraction with configuration validation and safe failure modes.
- Asynchronous generation/render jobs with queued/running/retry/succeeded/failed states.
- Durable private object storage; provider URLs alone are not durable assets.
- Tenant-aware object authorization for upload/list/read/update/delete.
- MIME and file-signature validation, size limits, quotas and retention/deletion policy.
- Checksums, immutable asset IDs and metadata.
- Video render/export pipeline, captions/subtitles, aspect ratios and preview where provider capability exists.
- Job idempotency, cancellation, retries, usage reservation and reconciled provider cost.
- Customer review, revision and final acceptance.

If video provider credentials or service capability are absent, implement a truthful provider adapter boundary and mark video rendering as unavailable—not complete.

### 5.4 PAYAM — social publishing and analytics
Implement only official, policy-compliant provider flows:
- OAuth connection, state/PKCE validation, minimum scopes, encrypted token storage and revocation.
- Token expiry/refresh handling and account eligibility checks.
- Draft calendar and scheduling.
- Approval-gated publish jobs with idempotency and provider receipt IDs.
- Publish status derived from provider responses.
- Analytics ingestion from official APIs, with freshness and attribution metadata.
- Exportable content and clear manual publishing guidance when APIs/scopes/accounts do not permit automation.

Never request or store social passwords or session cookies. Never simulate published status, views, reach, engagement or conversions. Do not bypass platform review, access restrictions or rate limits.

### 5.5 Customer reporting and business economics
Provide transparent reporting:
- Orders, quotes, approvals, delivery time, revisions and service-level status.
- Planned versus actual usage and provider cost.
- Gross receipts, tax, refunds, fees and net contribution as separate concepts.
- Campaign and content metrics from verified sources only.
- Clear source, period, refresh timestamp and missing-data labels.
- CSV/export where authorized.

Payment processing remains disabled until provider eligibility, legal review, webhook signature verification, idempotency, reconciliation, refunds and entitlement transitions pass sandbox tests and owner approval.

## 6. Supabase, database and storage safety

The live database has previously been reported with schema drift, missing migration history, RLS enabled without policies, missing runtime roles and missing MFA/session fields. Recheck; do not blindly apply old findings or migrations.

Required sequence:
1. Inspect the live catalog read-only and compare every table, column, index, constraint, enum, function, trigger, policy, grant, role attribute and migration ledger with Prisma and repository SQL.
2. Produce an object-level drift report and a reviewed baseline proposal.
3. Prove encrypted backup outside the hosting provider and restore it into an isolated environment. Record checksum, restore timestamp, RPO and RTO.
4. Rehearse migration and recovery on the restored clone, never on production.
5. Define separate least-privilege auth, tenant and platform runtime identities. Verify LOGIN, role memberships, ownership, grants, NOBYPASSRLS and no unintended superuser/BYPASSRLS.
6. Add tenant-scoped policies and FORCE RLS where appropriate. Test read, insert, update, delete and export denial across tenants using the actual runtime roles.
7. Verify Storage bucket privacy and object-level policies separately from database RLS.
8. Verify MFA enrollment, challenge, recovery, session assurance and privileged-route enforcement end to end.
9. Keep all production DDL, role changes, grants and migrations blocked until the owner-approved release gate is satisfied.

Do not expose service-role keys to browser/mobile clients. Do not reuse ARIA or LEADORA database, volumes, secrets or hosting resources.

## 7. Quality engineering and CI

For each implementation slice:
- Add unit tests for validation, state machines, authorization and idempotency.
- Add integration tests against disposable PostgreSQL for migrations, roles, RLS and tenant isolation.
- Add API tests for authentication, same-origin/CSRF, rate limits, malformed input, duplicate requests and provider failures.
- Add contract tests for provider adapters and webhook signatures/replay handling.
- Add UI tests for RTL, keyboard accessibility, mobile layouts, empty/error/loading states and approval flows.
- Add end-to-end sandbox workflow: customer intake → quote → approval → order → NAMA/NEGAH/PAYAM task → customer review → delivery/acceptance → report.
- Run locked install, dependency audit at the enforced severity, unit/integration tests, Prisma generation/validation, lint, typecheck, production build, Docker build, CodeQL and applicable secret/container scans.
- Capture exact commit SHA and workflow URLs. A result on a different SHA is not evidence for the current head.
- Do not downgrade or bypass a failing security/test gate.

## 8. Execution strategy and PR management

1. Keep PR #36 and #37 intact as historical evidence until their current status and content are rechecked.
2. Avoid duplicating their documentation. Extract useful requirements and link to the source records.
3. Implement in small, independently reviewable commits on an isolated branch.
4. Resolve merge conflicts only after inspecting both sides and preserving product boundaries.
5. Prefer one focused PR for security/database foundations and separate PRs for shared customer workflow, NAMA, NEGAH and PAYAM if their dependencies permit.
6. Do not mark a PR ready or merge it merely because CI is green.
7. Keep the Future Development Lab isolated from production data/credentials and require owner decisions for scope changes.
8. Maintain a decision log for framework/provider selection. Do not adopt LangChain, Vercel AI SDK, Flutter, React Native, Stripe or any starter merely because it appears in reference material; compare against existing code, market eligibility, cost and maintenance burden.

## 9. Definition of done

A feature is complete only when all applicable conditions are true:
- Source code exists and is reachable through the intended UI/API.
- Persistent data model and migration are present and reviewed.
- Authorization and tenant isolation are enforced server-side.
- Error, retry, cancellation and idempotency paths work.
- Unit, integration and relevant end-to-end tests pass.
- CI, dependency audit and security scans pass on the exact head SHA.
- External-provider behavior is verified in sandbox or clearly marked unconfigured.
- Audit events and customer-visible state are consistent.
- Documentation and operator/customer instructions are updated.
- No unresolved critical/high security issue remains in the feature's scope.
- Production readiness is not claimed without backup/restore, independent hosting, live security, UAT and owner approval.

## 10. Final reporting format

At the end of every execution pass, report:

1. Exact repository, branch and base/head SHA.
2. PR #36/#37 current status, head SHA, changed-file summary and checks.
3. Work actually implemented (paths, commits and behavior).
4. Tests actually run with exact pass/fail/skip counts and evidence URLs.
5. Security findings opened, fixed, accepted or still blocked.
6. Database/storage status with explicit distinction between source/isolated tests and live production.
7. NAMA, NEGAH, PAYAM and DANA capability matrix: implemented, tested, sandbox-verified, production-verified, blocked.
8. Revenue readiness: quote, order, billing, payment, ledger, reconciliation and refund states.
9. Backup/restore evidence and artifact checksum, or an explicit statement that no restorable application backup was produced.
10. Remaining blockers, owner-only actions and exact reason each cannot be completed autonomously.
11. Progress percentage calculated from weighted, evidence-backed acceptance criteria—not optimistic estimates. Separate code completion, integration verification and production release readiness.
12. A concise next-action plan.

Never report 100%, production-ready, commercially operational, published, paid or restorable without the corresponding evidence.

## 11. Immediate priority order

P0 — Refresh live repository/PR/CI and database evidence; confirm exact source state.  
P1 — Resolve dependency/security gate; preserve fail-closed behavior.  
P2 — Complete backup/restore proof and isolated database reconciliation plan.  
P3 — Establish least-privilege runtime roles, RLS and cross-tenant tests in disposable/restored environments.  
P4 — Implement shared customer brief/quote/order/approval/deliverable state machine.  
P5 — Implement NAMA website lifecycle.  
P6 — Implement NEGAH durable assets and video-job lifecycle.  
P7 — Implement PAYAM official OAuth/publishing/analytics adapters.  
P8 — Implement DANA bounded orchestration, approvals, durable tasks, audit, cost budgets and reporting.  
P9 — Run the complete sandbox customer journey and owner UAT preparation.  
P10 — Request explicit owner authorization for any production-only action after all gates pass.

**Final instruction:** Execute the maximum safe work autonomously, but do not confuse permission to engineer with permission to change production, spend money, expose secrets, merge or release. Preserve every existing product boundary and report only evidence-backed outcomes.
