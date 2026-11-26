# VAYRO — Supabase Reference Screenshots: Architecture Evaluation and Adoption Plan

**Date:** 2026-11-18  
**Reference material:** Four user-provided Supabase screenshots: customer-story page; LangChain + Next.js starter; Flutter user-management starter; React Native Expo starter; Next.js App Router auth starter; AI chatbot starter using Vercel AI SDK / OpenAI; Stripe subscription starter.  
**Repository baseline inspected:** `f0d31804e695cd3d73b452c7507affdca9573740`  
**Status:** Architecture decision proposal. No production changes, credentials, billing, deployment or customer data modified.

## 1. Executive decision

Use the screenshots as patterns to evaluate, not as a mandate to import every starter or framework.

Recommended VAYRO direction:

- Keep the existing Next.js/TypeScript application as the primary web application and owner/customer cockpit.
- Use Supabase Postgres as the data platform only after migration history, least-privilege runtime roles, tenant RLS policies and cross-tenant tests are corrected and proven.
- For Next.js server-rendered authentication, use Supabase's current `@supabase/ssr` cookie-based pattern with PKCE and a server/browser client split. Follow the proxy/middleware filename compatible with the actual installed Next.js major version.
- Keep one identity and tenant model in VAYRO CORE. Do not create separate user databases or duplicate auth systems for NAMA, NEGAH, PAYAM or each starter.
- Use Vercel AI SDK as a candidate UI/streaming adapter for chat and structured AI responses. Keep model/provider access behind VAYRO's server-side provider abstraction.
- Use LangChain only if a concrete workflow requires its orchestration, retrieval or agent graph features. Do not add it merely because a starter includes it.
- Defer a second mobile framework choice. Evaluate Flutter versus React Native Expo against the existing Android application, current code, team capability, offline needs, release process and maintenance cost before adopting either.
- Treat the Stripe starter as a subscription lifecycle example, not a payment-provider decision. Payment adapters must be jurisdiction-compatible and pass legal/compliance review; never hard-code a provider or currency.
- Use private object storage with tenant-aware Storage RLS and short-lived signed access for customer websites/media. Do not treat provider-returned URLs as durable asset storage.

## 2. Screenshot-by-screenshot technical assessment

### A. Supabase customer stories / energy-sector example

**What the screenshot supports:** Supabase presents a customer story about a large-scale energy/programming use case and its database platform.

**VAYRO application:** useful as a product-quality reference for database-backed systems that need to scale and support many workflows.

**What it does not prove:** it does not establish that VAYRO's current schema, RLS, database roles, backup/restore, capacity or production reliability are ready. A vendor customer story is not a VAYRO performance benchmark.

**Decision:** inspiration only; validate VAYRO with its own load, tenant-isolation, recovery and cost tests.

### B. LangChain + Next.js starter

**Pattern:** Next.js frontend with an orchestration layer for LLM calls/tools.

**Good VAYRO fit:** DANA workflows that need multiple bounded steps, retrieval, tool routing, stateful workflows or explicit human approval.

**Architecture constraints:**
- Every tool call must resolve the authenticated user and tenant on the server.
- Tool permissions must be narrower than the user's broad product role; enforce per-action authorization.
- Each action must have an audit event, idempotency key, tenant scope and explicit approval requirement where it changes customer-visible state.
- Do not let an LLM construct raw SQL, bypass RLS, access arbitrary tenant IDs, or invoke privileged service credentials.
- Persist workflow state and tool results in VAYRO-owned tables with retention controls; do not assume model conversation memory is authoritative business state.

**Decision:** optional orchestration library behind DANA, not a replacement for application services or authorization. Start with deterministic application workflows; add LangChain only where complexity justifies it.

### C. Flutter user-management starter

**Pattern:** a mobile-first user-management app using Supabase Auth, database and file storage.

**Good VAYRO fit:** reference for account settings, user profile, team/member management, file upload and mobile interactions.

**Risks:** adopting Flutter would introduce another client codebase, build pipeline, release/signing process and duplicated UX logic if the existing Android application already has a native implementation.

**Decision:** reuse its UX/data-flow patterns. Do not adopt Flutter until a short architecture spike compares it with the existing Android client and React Native option.

### D. React Native Expo starter

**Pattern:** shared React Native code for mobile and web, using Supabase auth and a monorepo starter.

**Good VAYRO fit:** potential shared UI/business logic for a future mobile client if the existing codebase and delivery team can support it.

**Risks:** the screenshot describes a starter derived from create-t3-turbo; that does not prove it is compatible with VAYRO's current Next.js repository, native Android project, authentication implementation or release pipeline.

**Decision:** evaluate, do not import. Keep web and mobile API contracts independent of UI framework. Avoid simultaneous Flutter and React Native adoption.

### E. Next.js App Router + Supabase cookie auth starter

**Pattern:** App Router with cookie-based session handling.

**Good VAYRO fit:** strongest direct fit to the current web application architecture.

**Required implementation details:**
- Browser client only for browser-side interactions; server client for Server Components, Server Actions and Route Handlers.
- Cookie refresh must follow the Supabase SSR guidance for the installed Next.js version (Next.js 16 uses `proxy.ts`; earlier versions use `middleware.ts`).
- Verify identity using trusted server-side claims/session validation; never trust client-supplied user or tenant IDs.
- Apply no-store/private cache controls to personalized auth responses; avoid shared CDN caching of session-bearing responses.
- Use PKCE-compatible auth flows and test refresh, logout, expiry, multi-tab behavior and recovery.
- Centralize tenant membership and product entitlements in VAYRO CORE. RLS is the final data boundary, not a substitute for endpoint authorization.

**Decision:** adopt this pattern after dependency/security remediation and after the existing auth implementation is audited. Do not copy a starter over existing auth without a migration plan.

### F. AI chatbot starter (Vercel AI SDK + OpenAI + Next.js)

**Pattern:** streaming chat UI and model integration.

**Good VAYRO fit:**
- DANA conversational owner cockpit.
- Customer intake and guided service configuration.
- NEGAH creative brief/script/caption assistance.
- NAMA page copy and content generation.
- PAYAM campaign planning and performance explanations.

**Required production controls:**
- Provider/model adapter with timeouts, retry policy, token/cost budgets and fallback behavior.
- Structured output validation; schema validation before business actions.
- Streaming responses must not imply a durable job completed before the job state confirms success.
- Separate read-only analysis tools from write tools.
- Write tools require idempotency, authorization, audit trail and user/customer confirmation.
- Prompt injection defenses: retrieved content is untrusted data, not policy; tools must enforce their own access rules.
- Rate limits and per-tenant usage metering; redaction of secrets and personal data from logs.
- Human review for customer-facing copy, pricing, website publication and social posts.

**Decision:** Vercel AI SDK is a candidate presentation/streaming layer, not the security or orchestration boundary. The existing `src/lib/ai-provider.mjs` adapter should be assessed for reuse rather than creating a competing provider layer.

### G. Stripe subscription starter

**Pattern:** SaaS subscription lifecycle and checkout integration.

**Good VAYRO fit:** plans, trials, renewals, cancellations, invoices and entitlement changes.

**Required production controls:**
- Payment-provider abstraction; no Stripe-specific assumptions in product entitlements or core ledger.
- Webhook signature verification, idempotent event processing, replay protection and reconciliation.
- Append-only billing ledger with gross receipts, taxes, refunds, chargebacks, provider fees, delivery costs and net contribution separated.
- Entitlements derived from verified ledger/provider events, not a browser redirect or client-side success flag.
- Proration, grace periods, dunning, cancellation and refund states explicitly modeled.
- Country/provider eligibility and legal review before enabling a provider.
- Never store card data directly; use compliant provider-hosted collection.
- No real payments until test-mode reconciliation and security/UAT gates pass.

**Decision:** adopt lifecycle concepts only. Select a payment provider after target-market and compliance validation.

## 3. Target VAYRO architecture

```text
Web / Owner Cockpit (Next.js)
             |
       VAYRO API layer
             |
  Identity + Tenant + Entitlements
             |
      VAYRO CORE (Postgres)
      |       |        |
      RLS   Audit    Usage/Billing Ledger
             |
  -----------------------------------------
  |          |          |         |       |
 NAMA      NEGAH      PAYAM      DANA   LEADORA/ARIANA/ARIA
 Websites  Creative   Social     Orchestration   Product modules
             |
     Private Media Storage
             |
   Approved external providers
 (AI / social / email / payments)
```

Product boundaries remain:
- NAMA owns page/site projects, domains, publishing, versions and rollback.
- NEGAH owns creative briefs, prompts, media assets, rendering jobs, captions and exports.
- PAYAM owns channel connections, content calendars, approvals, publishing attempts and platform analytics.
- DANA orchestrates tenant-scoped product actions; it does not own or bypass their data boundaries.
- VAYRO CORE owns identity, tenant membership, entitlements, product registry, audit, metering and billing ledger.

## 4. Storage and media design

The screenshot's file-storage examples are relevant to customer sites and creative assets, but the current audit found NEGAH persistence marked `PROVIDER_URL_ONLY`.

Target design:
- Private buckets by data class, not public buckets by default.
- Object key format includes immutable tenant and asset identifiers; never trust a client-supplied path as authorization.
- Storage RLS verifies tenant membership and resource ownership for upload, list, read, update and delete.
- Upload authorization via short-lived signed upload URLs or server-mediated uploads; validate MIME type, file signature, size and quotas.
- Persist metadata, checksum, provider, lifecycle state, retention, owner and tenant in Postgres.
- Use signed download URLs with short expiry; public website assets must be explicitly published through a separate publication process.
- Define retention, deletion, backup and restore behavior for media independently from database backups.
- Add malware/content scanning where operationally available before serving customer uploads.

## 5. Phased delivery and acceptance gates

### Phase 0 — unblock the engineering baseline
- Remediate the reported high-severity dependency paths without forced major upgrades.
- Run locked install, dependency audit, unit tests, Prisma validation, lint, typecheck, production build and Docker build.
- Record exact commit and workflow evidence.

**Gate:** all required CI checks pass on the exact proposed head commit.

### Phase 1 — secure the data foundation
- Establish and validate migration baseline.
- Create least-privilege runtime roles.
- Add RLS policies and FORCE RLS where applicable.
- Add positive and negative tenant-isolation integration tests.
- Add Storage RLS and private-bucket policies.
- Complete independent backup and isolated restore drill.

**Gate:** cross-tenant read/write denied under the real runtime role; restore verified.

### Phase 2 — customer delivery foundation
- Customer and business profiles, briefs, service catalog, quote, order, approval, deliverable and audit lifecycle.
- NAMA website project/template/version/publish/rollback lifecycle.
- NEGAH durable asset storage and asynchronous media job lifecycle.
- PAYAM channel connection and publishing state model, initially in sandbox/test mode.

**Gate:** an end-to-end test tenant can complete a sample order without using real customer data or money.

### Phase 3 — AI and mobile
- Add AI SDK streaming to DANA/NEGAH/NAMA where justified.
- Add orchestration library only for workflows needing durable multi-step execution.
- Compare React Native Expo, Flutter and existing Android implementation with a scored decision record.
- Verify mobile auth, deep links, token refresh, offline behavior, accessibility and release signing.

**Gate:** documented framework decision and mobile UAT on supported devices.

### Phase 4 — commercial activation
- Payment adapter, signed webhooks, append-only ledger, reconciliation, entitlements and refund flows.
- Official social OAuth and publish APIs with user approval.
- Analytics imported from verified platform APIs; unavailable metrics explicitly marked unavailable.

**Gate:** provider sandbox tests, compliance review, security review, backup/restore and owner UAT all pass.

## 6. Current blockers and non-claims

This proposal does not claim:
- that VAYRO already has complete tenant RLS;
- that MFA is fully operational end-to-end;
- that NAMA can publish customer websites;
- that NEGAH can render and durably store final videos;
- that PAYAM can publish to Instagram/YouTube;
- that Stripe or another payment provider is available for the user's target market;
- that any of the screenshot starters have been imported or deployed.

The current VAYRO-CORE live audit blockers remain authoritative until rechecked and closed with evidence.

## 7. Source references

User-provided screenshots are the inspiration for this decision record. Technical implementation guidance is checked against current official documentation:
- Supabase Next.js SSR client setup: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&queryGroups=framework&router=app
- Supabase server package selection: https://supabase.com/docs/guides/auth/choosing-a-server-package
- Supabase RLS guide: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Vercel AI SDK overview: https://vercel.com/ai-sdk

