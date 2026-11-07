# VAYRO — Platform Engineering Blueprint

## Product mandate
VAYRO is a Persian-first, multilingual platform that helps people discover and use specialist digital services. The application name shown to users is **وایرو**. The approved logo direction is the transparent-background VAYRO mark with metallic gold, deep navy and cyan accents. Keep the symbol, orbital ring, wordmark proportions and palette consistent; do not add a raster/photo background.

This blueprint is a design and implementation contract. It does not claim that all modules described here are already implemented or that VAYRO is commercially active.

## Experience principles
- Progressive disclosure: simple mode first, expert controls only when needed.
- Accessibility: readable typography, high contrast, keyboard and screen-reader semantics, scalable text, reduced motion and large touch targets.
- Multilingual architecture: Persian RTL by default; English LTR; locale-aware dates, numbers, currency and address formatting. Do not hard-code Persian assumptions into data models.
- Inclusive interaction: plain-language labels, guided onboarding, voice input/output as optional assistance, captions/transcripts, adjustable speech speed and confirmation before consequential actions.
- Visual language: dark luxury glass surfaces, restrained neon cyan and warm metallic gold, clear hierarchy, subtle depth, never sacrifice readability for effects.
- Responsive first: Android small-screen layouts are a primary acceptance target; desktop is also supported.
- Trust: explain what data is collected, why it is needed, who can access it and how it can be exported or deleted where law permits.

## Product taxonomy
Platform/control plane:
- VAYRO identity, organization and membership management
- Product catalogue and independent product entitlements
- Licensing, subscriptions and owner administration
- Notifications, support, audit, policy and consent
- DANA AI orchestration with explicit tool permissions and human approval

Specialist family:
- ARVAND: international trade and logistics workflows
- CHARSU: marketplace and discovery
- GANJINEH: e-commerce storefronts
- NEGAH: creative production
- SEPEHR: cloud services and infrastructure controls
- NAMA: website and landing-page builder
- PAYAM: marketing, CRM campaigns and verified referral attribution
- DANA: AI assistant and orchestration

Independent products remain independent:
- LEADORA: distribution, sales, inventory and commercial operations
- ARIANA: accounting, finance and ERP
- ARIA: social, services, listings and marketplace; explicitly no accounting or ERP
- ARMIN MARKET: buyer requests and supplier quotations

## Broader needs coverage
Treat the following as product opportunity domains, not a promise to launch every service in one release:
1. Learning and skills: courses, tutoring, career guidance, accessible learning plans.
2. Work and professions: portfolios, job/project discovery, scheduling, professional profiles.
3. Local services: verified service-provider discovery, booking requests, reviews and dispute intake.
4. Commerce: catalogues, seller tools, product discovery, transparent seller policies.
5. Community and culture: local events, cultural content, language and regional discovery.
6. Accessibility: voice-assisted navigation, captions, screen-reader support, low-bandwidth mode.
7. Small business: simple CRM, invoicing integrations where legally appropriate, inventory and customer communication.
8. Public-interest information: curated directories and verified resources, with provenance and freshness labels.
9. Creator tools: design, publishing, media management and licensing controls.
10. International use: localization, time zones, currencies and region-specific compliance.

Do not launch high-impact areas (health, legal, financial advice, employment eligibility, public benefits) as automated decision systems. They require domain experts, human review, source transparency and jurisdiction-specific compliance.

## Core platform services and interfaces
- Identity service: OIDC-compatible sessions, MFA/passkeys where supported, recovery and session revocation.
- Organization service: organization, membership, invitation, role and policy records.
- Entitlement service: product, plan, license, feature and expiry decisions; fail closed on unknown state.
- Integration gateway: versioned APIs, scoped service identities, rate limits, idempotency keys, timeout budgets and schema validation.
- Event backbone: versioned domain events, transactional outbox, retry policy, dead-letter handling and replay controls.
- Audit service: append-only security and administrative events with actor, tenant, action, target, timestamp, outcome and correlation ID.
- Notification service: in-app and opt-in email/push/SMS adapters with user preferences and delivery status.
- DANA orchestration: policy-filtered tools, least privilege, prompt-injection defenses, data minimization, human approval and complete action audit.

## Data ownership and tenant boundaries
- Every customer organization has a tenant boundary.
- All tenant-owned records carry tenant identity and are queried through server-side authorization.
- A browser-supplied tenant ID is never proof of membership.
- Product databases remain separately owned by their product services; central VAYRO stores only the minimum control-plane metadata needed for access and entitlements.
- Provide customer export and deletion workflows subject to legal retention duties.
- Do not claim that customers own the platform source code unless a separate written IP assignment says so.

## Revenue design
Potential sustainable revenue streams:
- Per-product subscription and annual license.
- Tiered organization plans based on seats, usage and support level.
- Optional premium support, onboarding and managed services.
- Usage-based infrastructure/AI consumption with budgets and explicit caps.
- Marketplace seller tools or transparent transaction fees only where VAYRO is legally and operationally a party to that service.
- Optional creator/business promotion with clear sponsored labels.
- Verified referral/affiliate rewards only after a real qualifying sale, with fraud controls and legal review. Never reward recruitment or paid entry into a downline.

Revenue systems must disclose pricing, renewal, cancellation, taxes, refunds, usage caps and seller responsibilities. No hidden charges, dark patterns or misleading earning claims.

## Iran and Mashhad design considerations
- Persian language and RTL are first-class, not translated afterthoughts.
- Use Mashhad-inspired visual details sparingly and respectfully: turquoise/azure tile geometry, restrained architectural arches and local craft patterns as optional accents, not clichés.
- Support Jalali and Gregorian calendar display while storing timestamps in UTC.
- Keep phone, address, postal code, currency and tax fields configurable by jurisdiction.
- Before enabling payment, messaging, maps, cloud hosting or AI providers in Iran or any other region, verify current sanctions, export controls, privacy, consumer, tax and payment regulations. Do not promise availability where providers or law prohibit it.
- Use low-bandwidth and intermittent-connectivity design, with safe offline drafts and explicit sync conflict handling.

## Release strategy
Deliver in independently testable stages:
1. Foundation: branding, accessible responsive shell, CI, threat model and data model.
2. Control plane: identity, tenant membership, roles, entitlements and audit.
3. Operational core: product registry, integration gateway, notifications and support.
4. Backup and recovery: automated encrypted offsite backups and isolated restore drills.
5. Specialist products: one bounded product at a time with acceptance tests and owner-approved launch.
6. Production readiness: security assessment, load tests, UAT, incident runbooks and rollback rehearsal.

A product remains unavailable to customers until its own acceptance criteria and legal checks pass. No fake data, fake buttons or demo-only flows may be represented as operational features.
