# VAYRO Growth Studio — General-Market Product & Delivery Specification

**Status:** Draft engineering specification; not an implementation or release approval.
**Parent:** VAYRO
**Primary experience:** One simple guided customer/owner workspace.
**Owning products:** NAMA (websites and landing pages), NEGAH (creative production), PAYAM (marketing and growth), coordinated by DANA.
**Audience:** Broad public market: individuals, self-employed workers, tradespeople, local service providers, creators, shops, professionals, small organizations and larger businesses.

## 1. Product promise and limits

Help a customer establish a credible digital presence, produce useful media, publish approved content, understand performance and request ongoing services without needing technical or marketing expertise.

Never promise guaranteed followers, views, leads, sales or income. Never sell fake followers, engagement, comments, reviews, artificial watch time, spam outreach or platform manipulation. Recommendations must distinguish measured results from estimates.

## 2. Personas and guided onboarding

Support these selectable starting profiles without restricting access:
- Individual / personal brand
- Local service or tradesperson
- Retail / online seller
- Creator / educator
- Professional / consultant
- Small or medium organization
- Larger organization / agency

Guided onboarding asks one question per step in plain Persian, supports RTL and English, offers examples and sensible defaults, and allows skipping nonessential fields. Collect only data required for the requested service. Provide accessible controls, text scaling, captions, keyboard/screen-reader support and low-bandwidth upload handling.

## 3. End-to-end customer journey

1. Lead intake: service category, business description, audience, location/market if voluntarily provided, languages, contact preference, objective and consent.
2. Brief generation: DANA converts answers into a reviewable brief; customer can edit or approve.
3. Package recommendation: explain deliverables, timeline, revisions, exclusions, recurring fees and usage limits before purchase.
4. Website workflow (NAMA): choose template, generate draft structure/copy, preview mobile/desktop, edit, accessibility/SEO checks, customer approval, publish to authorized domain, version and rollback.
5. Creative workflow (NEGAH): brief -> concepts/scripts/storyboard -> assets -> edit/captions -> quality checklist -> customer approval -> export. Do not imply direct video rendering exists until a real rendering provider and job pipeline are integrated.
6. Marketing workflow (PAYAM): content calendar -> draft post/reel/video metadata -> approval -> publish/schedule only through official authorized platform APIs -> retrieve analytics where available.
7. Optimization: summarize real metrics, identify uncertainty, propose experiments and request approval before changing live campaigns.
8. Retention: monthly report, renewal reminders, export/delete requests and service handoff.

## 4. Initial sellable service catalog

All prices are configurable by jurisdiction, currency, provider costs and owner approval. Do not hardcode a currency or publish a price until the owner configures it.

- Website Starter: one responsive landing page, contact form, basic SEO metadata, one language, limited revisions.
- Website Business: multi-page site, editable content sections, analytics consent controls, domain connection guidance and maintenance option.
- Content Starter: monthly idea calendar, scripts/captions and customer-ready creative briefs; no claim of automated video generation until proven.
- Reels/Short Video Pack: defined count of edited exports, aspect ratios, captions and revision limits; production may be AI-assisted or human-reviewed.
- Social Growth Care: monthly audit, content plan, approved publishing workflow and performance report.
- Combined Presence Pack: website + content + social setup.
- Custom / Agency: quote-based with explicit scope and service-level commitments.

For each package record: SKU, owner product, deliverables, limits, service cost, price, tax treatment, refund/cancellation policy, estimated turnaround, revisions, entitlement, metering policy and status. Support one-off setup fees plus recurring maintenance/management subscriptions where lawful and operationally supportable. Revenue dashboards must show gross receipts, refunds, taxes, provider costs, labor/service costs, fees, net contribution and recurring revenue separately. Never label gross sales as profit.

## 5. Owner cockpit — minimal literacy mode

Primary actions:
- «مشتری جدید»
- «ساخت سایت»
- «ساخت ریلز و محتوا»
- «برنامه انتشار»
- «گزارش مشتری»
- «درآمد و سفارش‌ها»

Each order has one plain-language status: اطلاعات لازم است، در حال آماده‌سازی، منتظر تأیید مشتری، آماده تحویل، منتشرشده، نیازمند رسیدگی. Provide a single next recommended action, clear errors, undo/version history where possible and human escalation. Expert settings remain hidden behind permissions.

## 6. Engine and product boundaries

- NAMA owns site/page artifacts, domains, publishing, page versions and website analytics integration.
- NEGAH owns creative briefs, media assets, scripts, captions, editing/render job metadata and exports.
- PAYAM owns channel connections, consent-aware campaign plans, scheduling/publishing records, attribution and growth reports.
- DANA orchestrates tasks using tenant-scoped tools; it is not a product data owner and cannot bypass approval.
- VAYRO CORE owns identity, tenant membership, entitlements, usage metering, billing ledger, audit and product registry only.
- Cross-product operations use versioned APIs/events, scoped service identities, idempotency keys, correlation IDs and audit records. No direct cross-product private-table access.

## 7. Social platform integration constraints

- Start with draft/export workflow. Direct publishing and analytics are enabled only after official API access, app review, scopes, platform policy and account eligibility are verified.
- Instagram publishing/insights availability depends on eligible professional accounts and Meta permissions; do not promise personal-account publishing.
- YouTube upload/analytics require authorized OAuth consent and appropriate YouTube API scopes/quota. Respect upload limits, disclosure requirements and copyright.
- Never request customer passwords or session cookies. Use official OAuth; store tokens encrypted server-side with revocation and least privilege.
- If an API capability is unavailable, provide downloadable approved files and a clear manual publishing guide rather than simulated success.
- No automated follow/unfollow, mass messaging, engagement pods, fake views, fake comments or scraping that violates platform terms.

## 8. Core data entities (logical model; migration not yet authorized)

CustomerProfile, BusinessProfile, ServiceBrief, ServicePackage, Quote, Order, OrderItem, Deliverable, Approval, WebsiteProject, WebsiteVersion, MediaAsset, CreativeJob, ContentPlan, ContentItem, ChannelConnection, PublishAttempt, AnalyticsSnapshot, ConsentRecord, Invoice, PaymentAttempt, Refund, UsageReservation, UsageLedgerEntry, SupportTicket, AuditEvent.

Every tenant-owned row requires tenant ownership and API authorization. Every uploaded asset needs ownership, MIME/size validation, malware scanning strategy, retention policy and signed short-lived access. Financial events are append-only and reconciled; never mutate a paid balance directly.

## 9. Metering and profitability controls

Before a paid AI/media job: estimate provider cost, reserve tenant credits/usage, enforce plan limits and disclose possible usage. Use idempotent job creation. On success settle from verified provider usage; on failure/cancellation release unused reservation. Avoid double charging on retries. Track per-job model/provider, input/output units, actual cost, customer charge, margin and refund state. Apply per-tenant quotas, abuse detection and budget ceilings.

## 10. Security, privacy and legal gates

- Complete tenant isolation, endpoint authorization and MFA before real customer data.
- Explicit consent and lawful basis for contact, analytics and marketing.
- Customer controls to export, correct and delete data subject to lawful retention.
- Clear controller/processor roles, privacy notice, terms, service contract, refund policy and content/IP license.
- No public customer onboarding or real payments before backup/restore, security, billing reconciliation, production hosting and owner UAT gates pass.
- Human approval required for public claims, prices, guarantees, regulated content, publishing and paid campaigns.
- Disclose synthetic media when appropriate; use only user-owned, licensed or authorized assets and likenesses.

## 11. Phased implementation and acceptance criteria

### Phase A — workflow foundation
- Reconcile existing AI Business Suite, Growth, NEGAH and NAMA code before adding new code.
- Publish service catalog and guided intake as explicitly non-transactional until billing is ready.
- Persist tenant-scoped briefs, quotes, orders and approvals with tests.
- Acceptance: cross-tenant denial tests; input validation; audit events; Persian/English responsive UX; no fake payment or publish state.

### Phase B — website delivery
- Reusable templates, preview, editable sections, versioning, approval and rollback.
- Acceptance: mobile/desktop visual tests, accessibility checks, domain ownership verification, publish/rollback integration tests.

### Phase C — media production
- Add provider adapters for image/audio/video; durable asset storage; asynchronous jobs; captions and export formats.
- Acceptance: real provider integration in test mode, retry/idempotency, cost ledger, asset retention and deletion tests. A UI alone is not completion.

### Phase D — social publishing and analytics
- Official OAuth connectors, least scopes, token encryption/rotation/revocation, platform review and quota handling.
- Acceptance: real sandbox/test account evidence; no password collection; accurate error handling; platform-policy review.

### Phase E — billing and commercial operation
- Owner-approved pricing, payment provider suitable for target jurisdiction, invoice/refund/chargeback reconciliation and tax review.
- Acceptance: end-to-end test transactions, idempotent webhooks, ledger reconciliation, refund tests and owner UAT. No production charge until approved.

### Phase F — growth optimization
- Attribution, experiment framework, statistically cautious reporting and customer retention.
- Acceptance: metric provenance, consent handling, clear attribution window and no fabricated uplift.

## 12. Current repository evidence and known gaps

The current main branch already contains:
- `/ai-business-suite` capability registry page and `/api/ai-business-suite/capabilities`.
- `/growth` informational growth page.
- `/negah/creative-studio` and `/api/negah/generate` image generation path.
- Existing general design for 50 AI-business capabilities and shared engines.

Known gaps visible in the inspected source:
- Capability registry entries are not proof that engines are implemented.
- NEGAH generation reports billing as NOT_CONNECTED and provider URL-only asset persistence.
- No verified complete video-rendering pipeline, customer order/quote lifecycle, social OAuth publishing, channel analytics integration or end-to-end billing was established by this review.
- Existing production security, database, backup/restore and hosting release blockers remain controlling gates.

## 13. Definition of done

A feature is complete only when code, migrations, automated tests, security/tenant tests, operational configuration, observability, documentation and a reproducible acceptance record exist. Draft, demo, planned, provider-not-configured and untested states must be labeled accurately. No PR merge, production migration, payment activation, customer onboarding or public launch is authorized by this specification.
