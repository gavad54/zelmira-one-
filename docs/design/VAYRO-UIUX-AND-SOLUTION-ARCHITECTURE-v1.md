# VAYRO UI/UX and Solution Architecture Specification
Version: 1.0
Status: Design baseline — implementation not yet certified
Date: 2026-11-11
Parent baseline: docs/specs/2026-11-11-vayro-master-product-architecture-baseline-v1.md

## 1. Purpose and non-negotiable constraints

This specification turns the approved VAYRO Master Product & Architecture Baseline into an actionable interface and technical architecture. It preserves the existing product family, capabilities, and ownership boundaries. It does not authorize production changes, data migrations, product deletions, public release, or commercial activation.

Fixed constraints:
- Mother application and platform name: VAYRO (وایرو).
- Exactly eleven independently governed products: ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM, LEADORA, ARIANA, ARIA, ARMIN MARKET.
- DANA is the central AI/orchestration capability inside VAYRO Command Center, not a twelfth product.
- ARIA excludes accounting, bookkeeping, and ERP. ARIANA owns accounting/ERP. LEADORA owns distribution, sales, inventory, and commercial operations within its approved scope.
- Preserve existing features until a capability audit proves disposition and the owner approves any removal or migration.
- Persian-first, true RTL, English localization, responsive mobile-first interface.
- Visual direction: Neon Glass, restrained luminous accents, premium technical character; avoid decorative effects that reduce readability.
- No Lovable.
- Production and public release remain blocked until their independent release gates are evidenced.

## 2. Experience principles

1. Owner clarity: show what is healthy, blocked, risky, awaiting approval, or unknown; never disguise missing evidence.
2. Progressive disclosure: simple default screens; advanced controls behind deliberate navigation.
3. Product autonomy: each product has its own workspace, permissions, data ownership, release status, and operational evidence.
4. Consistency: shared navigation, tokens, interaction patterns, form behavior, and accessibility rules.
5. Reversibility: configuration and rollout changes show impact, approval, and rollback path.
6. Honest AI: DANA explains sources, confidence, and proposed actions; sensitive actions require explicit owner confirmation.
7. Accessible premium design: contrast, keyboard support, screen-reader labels, reduced motion, and readable Persian typography take priority over visual effects.

## 3. Information architecture

### Global application shell
- Top bar: VAYRO mark, current workspace/product, global search, language switch, notifications, help, profile.
- Primary navigation: Home; Products; Command Center; DANA; Marketplace; Finance & Subscriptions; Communications; Settings.
- Command Center has its own secondary navigation: Overview; Product Portfolio; People & Access; Commercial Operations; Platform & Integrations; Security & Audit; Backup & Recovery; Release Governance; Future Development Lab.
- Product workspace shell: product identity, product-specific navigation, environment indicator, support entry, status and version indicator.
- Mobile: compact top bar and bottom navigation for the five most-used destinations; secondary destinations in an accessible navigation drawer. Do not hide critical security or approval alerts.

### Screen inventory

| Area | Required screens | Primary outcome |
|---|---|---|
| Public entry | Landing, product directory, pricing overview, help, sign-in | Understand VAYRO and enter safely |
| Identity | Sign-in, sign-up, verification, MFA setup/challenge, recovery, session/device list | Secure account lifecycle |
| Home | Owner overview, personal workspace, recent activity | Orient user and surface next action |
| Product portfolio | Product catalogue, product detail, product health, access, plans, release evidence | Govern eleven products independently |
| Command Center | Overview, portfolio, users/roles, finance, integrations, operations, security, backup, release gates | Operate the platform with evidence |
| DANA | Assistant workspace, source/evidence panel, action proposal, approval queue, history | Assist without bypassing authorization |
| Commercial | Plans, subscriptions, invoices, payment status, entitlements, usage | Transparent commercial lifecycle |
| Communications | Inbox, announcements, support tickets, notification preferences | Reliable internal/customer communication |
| Future Development Lab | Idea intake, triage, impact assessment, design proposal, prototype registry, test results, approval, staged rollout, rollback history | Controlled evolution |
| Settings | Profile, language, accessibility, appearance, security, connected services | Personal and workspace configuration |

Every screen must define: loading, empty, success, validation error, permission denied, offline/degraded, and retry states. Destructive or irreversible actions require a confirmation summary and an auditable reason.

## 4. Core user journeys

### Owner sign-in and secure setup
Public entry → sign-in → verification → MFA challenge → workspace selection → owner dashboard. Recovery must not weaken MFA or expose account existence. Session/device management is available from security settings.

### Launch a product workspace
Home → Products → select product → product overview → confirm role and entitlement → enter workspace. If access is missing, show the exact permission/plan requirement and a safe request-access path.

### Review a product release
Command Center → Release Governance → choose product → inspect gate checklist and linked evidence → view blockers → approve only when all mandatory gates are verified. Approval must not automatically deploy unless a separately authorized release action is explicitly requested.

### DANA action proposal
Ask DANA → DANA presents answer, sources, impact, and proposed action → classify as read-only or sensitive → sensitive action enters approval queue → authorized owner approves → execute via scoped service identity → append immutable audit event → show result and rollback path where applicable.

### Future Development Lab
Submit idea → duplicate and scope check → impact analysis across products/data/security/cost → design proposal → isolated prototype → automated tests and security review → owner decision → staged rollout → observe metrics → complete or rollback. No direct production write from the Lab.

### Subscription lifecycle
Select product and plan → show scope, price, renewal, limits, cancellation terms → explicit confirmation → payment provider handoff → verified webhook updates entitlement → receipt and audit event. Client-side payment success alone must never grant entitlement.

### Backup and restore
Command Center → Backup & Recovery → inspect freshness, encryption, retention, external location, and last restore drill → restore request requires elevated authorization and target isolation → dry-run validation → approved restore → verification report. Never overwrite production as an implicit action.

## 5. Design system v1

### Visual tokens
- Canvas: deep ink / near-black for primary command surfaces; neutral light surface option for long-form work.
- Surfaces: layered charcoal and slate; translucent glass only for navigation, overlays, and high-level summary surfaces.
- Accent: controlled electric cyan/ice-blue for interactive focus; restrained violet for AI-related affordances; warm gold only for premium/owner emphasis; red/amber/green reserved for meaningful risk states.
- Text: high-contrast neutral white/near-black; secondary text must remain readable on glass.
- Borders: subtle cool-gray outlines; use elevation sparingly.
- Effects: limited blur, low-intensity glow, short transitions; respect prefers-reduced-motion.
- Typography: Persian-capable UI font with clear numerals and punctuation; consistent English fallback. Use tabular numerals for money, counts, and timestamps.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48 px.
- Radius scale: 8, 12, 16, 24 px.
- Touch target: minimum 44×44 CSS px.

### Component library
Buttons (primary, secondary, quiet, destructive); icon buttons; text fields; password fields; OTP input; selects; combobox/search; checkboxes/radios/switches; date/time controls; tabs; breadcrumbs; side navigation; bottom navigation; cards; data tables; status chips; metric tiles; charts; timeline; activity feed; alert banners; empty states; skeletons; dialogs; drawers; toasts; pagination; file upload; permission matrix; audit event viewer; approval panel; product health card; release gate checklist; AI source/evidence panel.

### Interaction rules
- One dominant primary action per screen.
- Do not rely on color alone for status.
- Tables become labelled cards or horizontally scrollable data views on small screens; preserve row context.
- Forms group related fields, validate inline, retain safe input after recoverable errors, and summarize server-side errors.
- Confirmations state the object, scope, impact, and reversibility.
- Every icon-only action has an accessible name and tooltip.
- RTL layouts mirror directional navigation, but do not mirror logos, universal icons, or mixed-direction identifiers.

## 6. Responsive behavior

- Small mobile: single-column content, bottom navigation, full-screen sheets for complex forms, no dense multi-column tables.
- Large mobile/tablet: collapsible navigation rail/drawer, two-column dashboard cards where space permits.
- Desktop: persistent side navigation, multi-column operational dashboards, full data tables, split-view evidence panels.
- Breakpoints are implementation tokens, not product rules; validate actual content at 360, 390, 768, 1024, and 1440 CSS px.
- All core workflows must remain operable on touch devices without hover.

## 7. Technical solution architecture

### Logical layers
1. Experience layer: responsive VAYRO web application, localized design system, product workspace shells.
2. Application/API layer: versioned API gateway/BFF, identity/session service, authorization policy enforcement, product-specific APIs, DANA orchestration API.
3. Domain layer: VAYRO platform domains and eleven independently owned product domains.
4. Data layer: platform control-plane data separated from product-owned data; explicit tenant scoping; audited migrations; encrypted backup.
5. Integration layer: payment, email, notification, storage, analytics, and external product connectors behind adapters and secret management.
6. Operations layer: observability, security monitoring, audit, backup/restore, release governance.

### Ownership boundaries
- Platform control plane owns global identity references, tenant directory, platform roles, product registry, subscription/entitlement ledger, connector registry, audit index, and release metadata.
- Each product owns its domain schema, business rules, tenant-scoped records, product roles, migrations, and release evidence.
- Shared services expose documented, versioned contracts; they do not query or mutate another product's private tables directly.
- Cross-product workflows use explicit APIs/events with scoped service identities, idempotency keys, schema versioning, correlation IDs, and audit records.
- DANA receives only task-scoped data and tools; it cannot bypass normal API authorization.

### Service domains
- Identity & Session
- Tenant & Membership
- Authorization & Policy
- Product Registry & Entitlements
- Billing & Payment Adapter
- Notification & Email Adapter
- Connector & Integration Registry
- Audit & Compliance
- Backup & Recovery Orchestration
- Observability & Release Governance
- DANA Orchestration
- Product APIs (one bounded context per product)

### API conventions
- HTTPS only; versioned paths (for example /api/v1/...).
- Server-side authorization on every protected request; deny by default.
- Tenant context derived from verified identity/membership, never trusted from a client-supplied tenant ID alone.
- Standard error envelope with stable code, safe message, correlation ID, and field errors.
- Pagination, filtering, sorting, rate limits, idempotency for mutations, and audit metadata are standardized.
- OpenAPI contract per service; compatibility checks in CI; deprecation policy before breaking changes.
- Webhooks require signature verification, replay protection, idempotent processing, and event audit.

## 8. Security and privacy architecture

- MFA for owner and privileged roles; secure session rotation and revocation.
- RBAC supplemented by resource/tenant-aware policy checks; least privilege and separation of duties.
- RLS policies must be tested with positive and negative tenant-isolation cases; RLS enabled without effective policies is not accepted as protection.
- Secrets stored only in protected environment/secret stores; never committed or logged.
- CSP, secure cookies, CSRF protections where applicable, input validation, output encoding, dependency scanning, SAST, and security regression tests.
- Sensitive operations require step-up authentication, explicit confirmation, audit trail, and where appropriate dual control.
- Data classification, retention, export, deletion, and consent rules documented per jurisdiction and product.
- AI prompt/tool boundaries, data minimization, output validation, source traceability, and human approval for consequential actions.
- Security events and administrative actions are tamper-evident and retained under a documented policy.

## 9. Data and event architecture

- Establish canonical tenant, user, membership, product, entitlement, and audit identifiers.
- Every tenant-owned record includes tenant scope enforced at the service and database layers.
- Avoid cross-product foreign keys into private product schemas; use stable public identifiers and API resolution.
- Use an outbox pattern for reliable domain events; consumers must be idempotent.
- Events include event_id, event_type, schema_version, occurred_at, tenant_id where applicable, actor/service identity, correlation_id, and payload classification.
- Migrations are reviewed, forward-compatible where possible, backed by a tested rollback/forward-repair plan, and never run against production before backup and restore readiness.
- Data residency and cross-border processing decisions require legal/security review before production activation.

## 10. Future Development Lab governance

The Lab is a first-class Command Center area with these states:
Draft → Submitted → Triage → Impact Review → Design → Prototype → Test & Security Review → Owner Decision → Staged Rollout → Monitoring → Completed or Rolled Back.

Required proposal fields:
- Problem and target users
- Affected products and capabilities
- Current behavior and proposed behavior
- Data/API/schema impact
- Security, privacy, legal, accessibility, and localization impact
- Cost/operational impact
- Migration and compatibility plan
- Test and acceptance criteria
- Rollback/forward-repair plan
- Owner decision and timestamp

The Lab is isolated from production credentials and production data by default. Approval is explicit and scoped; it does not itself imply deployment permission.

## 11. Quality, accessibility, and acceptance gates

Design acceptance:
- All screen inventory items have wireframe-level structure and interaction states.
- RTL and English layouts are reviewed.
- Keyboard-only and screen-reader flows are specified for critical paths.
- Contrast and touch target requirements are met.
- No critical action is available only through hover or color.
- All eleven products have distinct entry points and documented boundary labels.

Architecture acceptance:
- Service/domain ownership matrix exists.
- API contracts and event schemas are documented.
- Tenant isolation threat model and negative tests exist.
- Role/permission matrix is reviewed.
- Backup encryption, external storage, retention, and isolated restore drill are evidenced.
- Observability, audit, alerting, and rollback are defined.
- Security review and data protection review are completed.

Implementation acceptance:
- Unit, integration, contract, authorization, tenant-isolation, accessibility, and end-to-end tests pass.
- CI and security checks pass on the exact release commit.
- Mobile device UAT and signed Android release evidence exist where applicable.
- Deployment commit matches the approved release commit.
- Product-specific release gates and owner acceptance are recorded.

## 12. Delivery sequence

1. Design foundation: tokens, typography, navigation, responsive shell, component library.
2. Command Center foundation: owner overview, product portfolio, people/access, audit and release status.
3. Platform journeys: identity/MFA, entitlements, communications, integrations, backup/recovery.
4. Product workspace shells: eleven distinct workspaces, preserving existing capabilities and data ownership.
5. DANA and Future Development Lab: scoped AI, evidence, approvals, isolated prototypes, staged governance.
6. Product-by-product implementation and release certification.

Do not parallelize production-sensitive migrations with UI scaffolding. Build and verify the design system and shells first, then integrate APIs behind stable contracts.

## 13. Current status and explicit exclusions

This document is a complete first-pass design and solution-architecture specification, not a rendered UI prototype, implemented application, security certification, or release approval. No code, production database, Railway deployment, payment configuration, or public release is changed by this document alone.

The existing repository architecture and product-boundary documents must be reconciled with this approved baseline in a subsequent documentation change. Historical audit evidence must be preserved rather than overwritten.
