# VAYRO full-platform engineering audit

**Audit date:** 2026-11-26  
**Repository:** `gavad54/zelmira-one-`  
**Baseline branch:** `upgrade/full-independent-product-family-modules-2026-11-20`  
**Baseline commit:** `479f144962ce16c98ce22d44b84bc5005d964652`  
**Audit work branch:** `engineering/vayro-full-platform-audit-archive-2026-11-26`  
**PR #47:** OPEN / DRAFT / UNMERGED

## Executive finding

The repository is a substantial engineering foundation, not a released product. The latest inspected commit has passing VAYRO CI, CodeQL and lockfile validation, but production readiness is BLOCKED. No inference from source files or CI is treated as evidence of a healthy production system.

## Confirmed repository facts

- Next.js 15 / React 19 / TypeScript / Node.js 22 / Prisma 6 / PostgreSQL.
- Authentication, email verification and recovery routes, MFA flows, session lifecycle and owner APIs exist in source.
- Tenant membership authorization, transaction-local RLS context, and a dedicated tenant DB client exist in source.
- Product catalogue, license lifecycle foundations, owner Command Center, DANA workspace, NEGAH creative flows and Future Lab exist.
- Durable task, goal/epic/feature, agent registry, review records, worker and recurring scheduler source exists.
- CI, CodeQL, npm lockfile validation, Prisma schema/migration checks and disposable-PostgreSQL integration tests exist.
- The source tree contains no first-class conversation/chat, message, attachment, archive, archive-search, export, restore-to-workspace or retention API/page at this baseline. AI generations are persisted as prompt/output records, but are not a threaded conversation archive.
- The VAYRO repository tree contains no native Android Gradle project or signed Android release artifact.

## Exact-head CI evidence

On `479f144962ce16c98ce22d44b84bc5005d964652`:
- VAYRO CI run `45760049320`: SUCCESS.
- CodeQL run `45760049533`: SUCCESS.
- npm lockfile validation run `45760049224`: SUCCESS.

These are repository checks only; they do not establish live hosting, production DB, backup/restore, mail, payments, mobile acceptance or UAT.

## Production blockers recorded in the current PR evidence

- No dedicated, healthy VAYRO production hosting deployment has been demonstrated.
- Previously inspected Railway services were attached to ARIA Web and LEADORA projects, rather than a dedicated VAYRO project; one failed the /api/health check and another failed image build. These observations require a fresh infrastructure read before acting.
- VAYRO-CORE live catalog was last documented as 11 tables, zero applied Prisma migrations, zero rows in inspected tables, RLS enabled but no policies, and missing application-specific database roles. This is a read-only observation dated 2026-11-23, not a new live query.
- Seven Prisma model tables were absent from the inspected live catalog.
- Independent encrypted off-site backup and isolated restore evidence is not complete; Cloudflare R2 was recorded as not enabled.
- Email sender, payment lifecycle, product integration contracts, Android build/signing/device validation, UAT and release approval remain gates.

## Functional coverage assessment

| Domain | Source status | Release assessment |
|---|---|---|
| Identity, sessions, MFA | Implemented foundation and tests | Production verification open |
| Tenant and RLS boundary | Implemented foundation and isolated SQL tests | Live policy/role reconciliation open |
| Command Center / product directory | UI and APIs present | Portfolio workflows incomplete |
| DANA / AI | Provider adapter and generation persistence | No threaded chat archive; provider and billing operations incomplete |
| Conversation history | No first-class domain model/API found | Missing |
| Archive/search/export | No first-class implementation found | Missing |
| File attachments and document indexing | No complete first-class workflow found | Missing |
| Task engine / scheduler | Bounded implementation and CI tests | Runtime deployment/restart drill open |
| Product connectors | Catalogue and contract foundations | Independent live contracts/E2E open |
| Licensing / payments | License foundation | Billing/payment lifecycle not production-ready |
| Backup / restore | Runbooks and workflows | No verified independent restore artifact |
| Web/mobile release | Web source exists | Dedicated hosting and native Android release evidence missing |

## Required software redesign

1. **Conversation and knowledge domain:** tenant-scoped conversations, immutable message history, attachments with object-storage references, archive state, soft deletion, retention/legal-hold metadata, deterministic pagination, search indexing and export jobs. Content must never be exposed across tenant boundaries.
2. **Archive integrity:** append-only message events, content hashes, actor/time metadata, explicit retention policies, audit events, bounded exports and verified restore semantics. Do not treat ordinary AI-generation rows as a conversation archive.
3. **File lifecycle:** upload authorization, MIME/size validation, malware scanning integration point, checksum, object versioning, access-controlled download, retention and deletion workflows.
4. **Search:** PostgreSQL full-text search first, with tenant and permission filters applied before returning snippets; later add semantic retrieval only with documented privacy, embedding deletion and data-residency controls.
5. **Platform boundaries:** keep VAYRO control-plane metadata separate from product-private data. Cross-product calls must use versioned APIs/events and scoped service identities.
6. **Security:** endpoint authorization matrix, least-privilege DB roles, RLS on every tenant table, MFA freshness for privileged actions, origin/rate-limit controls, auditability and secret isolation.
7. **Reliability:** idempotent workers, bounded retries, dead-letter inspection, process restart drills, backup checksums, isolated restore and measured RPO/RTO.
8. **UX/accessibility:** Persian-first RTL, mobile-first responsive navigation, clear archive filters and user-controlled export/delete flows; no visual mockup is accepted as implementation evidence.
9. **Commercial readiness:** do not activate payments, customer onboarding or paid product entitlements until legal, payment-provider, webhook, reconciliation and support controls are tested.
10. **Release:** exact-commit deployment evidence, health/readiness, rollback rehearsal, security review, Android artifact/device validation where required, UAT and explicit owner release approval.


## Implementation delta — conversation/archive vertical slice

The following source changes were added on the audit work branch after the baseline assessment:

- First-class `Conversation`, `ConversationMessage` and `ConversationAttachment` metadata models and a tenant-scoped Prisma migration.
- PostgreSQL RLS and FORCE RLS policies for the three new tables; composite tenant foreign keys bind messages and attachments to their parent records.
- Append-only message and attachment grants; only selected conversation lifecycle columns can be updated by the tenant application role.
- Database checks for message role, positive attachment size and SHA-256 hex digest shape.
- Tenant-scoped create/list conversation APIs, message read/write APIs, archive/restore/soft-delete APIs, and bounded PostgreSQL full-text search.
- Deterministic bounded cursor helpers, message input normalization, content digest generation and archive lifecycle helpers.
- RLS isolation tests for tenant boundaries, creator-only member history, append-only message grants and full-text search visibility.
- The tenant DB runtime-role ownership guard now includes the three conversation tables.

## Exact-head verification update

- Earlier exact-head baseline for the first implementation slice: CI run `45772563996` SUCCESS; CodeQL run `45772564068` SUCCESS.
- A later migration validation failure was observed after adding digest constraints: the SQL text was truncated at a regular-expression anchor. The migration was corrected to use length plus `translate()` checks, avoiding the problematic regex expression.
- Latest verification after the correction is pending at the time of this update; do not treat it as passed until GitHub reports completed/success on the exact PR head.
- The search route currently returns bounded snippets only. No attachment upload/download, object storage, export jobs, retention/legal-hold engine, AI streaming/thread orchestration or user-facing archive UI is included in this vertical slice.

## Governance and execution boundary

Development branches, source changes, tests, documentation and pull requests may proceed autonomously. Merge, production deployment, live database migration/DDL, production secrets/access changes, paid infrastructure, irreversible deletion, billing activation and public release remain approval-gated. This is a safety and ownership boundary, not a technical task to bypass.

## Next engineering sequence

- Add the conversation/archive schema and database-enforced tenant boundary on an isolated development branch.
- Add tenant-authorized APIs, deterministic cursor pagination, archive/restore state transitions, audit events and integration tests.
- Add attachment metadata and object-storage adapter only after a verified storage target and lifecycle policy exist.
- Add search and export workers with bounded resource use and tenant-filtered access.
- Extend the existing release gates and run exact-head CI.
- Separately resolve live hosting, DB migration baseline, RLS/role provisioning, encrypted backup/restore and deployment blockers.

**Status:** AUDIT BASELINE RECORDED — ARCHIVE/CHAT DOMAIN MISSING — PRODUCTION RELEASE BLOCKED.
