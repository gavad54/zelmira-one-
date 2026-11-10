# DANA — VAYRO Command Intelligence

**Role:** Shared VAYRO platform capability; not a twelfth application and not a replacement for product-specific business logic.  
**Current delivery state:** Foundation present; command-center orchestration is not production-ready.

## 1. Responsibility

DANA assists the VAYRO owner and authorized operators with portfolio-wide analysis, planning, coordination and controlled automation. VAYRO remains the owner/control plane. Each of the eleven products remains independently responsible for its runtime, operational database, customer authorization, backups, release and commercial lifecycle.

DANA must not become a hidden shared database, a bypass around product APIs, or a mandatory runtime dependency for any product.

## 2. Capability domains

1. Portfolio intelligence: summarize product status, risks, dependencies and evidence-backed progress.
2. Work planning: turn approved goals into tasks, priorities, milestones and duplicate-work checks.
3. Engineering assistance: inspect authorized repositories, propose changes, run tests and prepare release evidence.
4. Security operations: summarize alerts, access reviews, vulnerabilities, backup evidence and incident status.
5. Controlled automation: execute only registered actions through scoped product APIs and approved tools.
6. AI workspace: text generation with provider, tenant authorization, persistence and usage metadata.
7. Marketing intelligence: draft campaigns and analyze authorized campaign metrics.
8. Support coordination: classify incoming requests and track follow-up without unrestricted customer-content access.
9. Organizational knowledge: retrieve approved decisions, documentation and audit history with source references.
10. Finance intelligence: summarize portfolio-level revenue and costs from approved aggregates; accounting source of truth remains ARIANA.
11. Infrastructure intelligence: report service health, deployments, resource use, backup and restore evidence.
12. Quality and risk: track acceptance tests, unresolved defects, release gates and operational risks.
13. Voice and localization: Persian-first interaction, English support and accessible mobile workflows.

The list defines the intended product scope. It does not imply that every domain is implemented.

## 3. Action policy

The source registry in `src/lib/dana-governance.mjs` classifies proposed action identifiers:

| Class | Examples | Required behavior |
|---|---|---|
| AUTOMATIC | Portfolio read/report, analytics read, task planning, code review/draft, sandbox tests, alerts | Read-only or isolated preparation only |
| APPROVAL_REQUIRED | Production code changes, deployment, sensitive security settings, spending, customer-data changes/deletion | Require a separately authenticated, action-specific approval before execution |
| PROHIBITED | Security bypass, external data leakage, ownership transfer | Never execute |
| UNKNOWN | Any unregistered action | Fail closed; do not execute |

The classifier is a policy primitive only. It does not authenticate an approver, create an approval record, authorize a product API, or execute an action. Those controls must be implemented at the server-side execution boundary before any consequential automation is enabled.

For approval-required actions, the future approval service must bind approval to the exact action, target product/resource, parameter digest, requester, approver, expiry and one-time execution identifier. The approver must be independently authenticated; high-impact actions should use step-up authentication and separation of duties.

## 4. Existing implementation evidence

- `/dana/ai-workspace` provides a tenant-scoped text-generation interface. The API requires a verified session and tenant authorization, calls the configured server-side AI provider and persists generation history. It returns a provider-not-configured response when required runtime configuration is absent.
- `/dana/prompt-studio` produces a structured prompt from a template. It explicitly does not call an AI provider and does not persist generated prompts.
- The AI capability registry describes planned capability ownership and revenue models. A PLANNED entry is not an available service.
- `classifyDanaAction` provides deterministic action classification. It is not yet wired to a general agent executor or approval workflow.

## 5. Not yet evidenced as operational

The following are not to be advertised as live until separately implemented and verified:

- Live portfolio connectors and evidence-backed cross-product status aggregation.
- Task execution, scheduling, dependency tracking and duplicate-work prevention across repositories.
- Agent tool execution with scoped service identities, allowlists, budgets, timeouts, idempotency and audit trails.
- Action-specific approval records, step-up authentication, dual control and replay protection.
- Monitoring and incident integrations, verified backup/restore status, and automated recovery orchestration.
- Marketing, support, financial and infrastructure data connectors.
- Voice input/output and durable organizational knowledge retrieval.
- Provider usage ledger, cost allocation and commercial metering for AI operations.

## 6. Mandatory isolation and safety rules

- DANA accesses product data only through documented, versioned, scoped APIs.
- Each product independently authenticates and authorizes every request; VAYRO owner status does not grant access to customer business data.
- Product-local workflows must continue if DANA is unavailable.
- DANA may prepare production changes but must not deploy, spend, alter sensitive settings or change customer data without the relevant approval gate.
- DANA must never bypass security, export customer data to unauthorized destinations or change ownership.
- Every consequential action must have an actor, purpose, target, input digest, approval reference, result and audit event.
- Provider failure, missing credentials, missing authorization or unknown policy must fail closed without claiming success.

## 7. Acceptance gates

DANA is production-ready only when all applicable tests pass:

1. Unit tests for every action class and unknown-action denial.
2. Negative tests proving prohibited and unregistered actions cannot reach an executor.
3. Approval tests for wrong action, wrong target, modified parameters, expired approval, replay, requester-as-approver and revoked approval.
4. Product API scope tests and cross-tenant denial tests.
5. Provider outage, timeout, rate-limit, budget and idempotency tests.
6. Audit completeness and redaction tests.
7. Owner UAT in Persian RTL and English on mobile and web.
8. Independent release, backup and restore evidence.

No production approval or execution capability is implied by this document or by the action classifier alone.
