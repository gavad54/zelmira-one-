# VAYRO — Ownership, Control and Governance

## Scope
This document defines technical control for the platform owner. It is not a legal opinion or proof of copyright/trademark ownership. Legal ownership requires appropriate company records, contributor agreements, IP assignments, licenses and trademark filings in the relevant jurisdictions.

## Owner control plane
The platform owner role is separate from customer organization roles. Owner access is granted only to explicitly configured owner identities and protected by MFA/passkey where supported.

Owner capabilities:
- Manage product catalogue and product lifecycle.
- Create, suspend and retire product offerings.
- Configure plans, license periods, entitlements and price books.
- Review tenant and subscription metadata without unrestricted access to customer content.
- Manage support access using time-limited, purpose-bound elevation and customer-visible audit records.
- Configure global security policies, rate limits and integration allowlists.
- View system health, backup status, security alerts and audit events.
- Export platform configuration and audit evidence.
- Trigger controlled restore and disaster-recovery procedures.

## Separation of duties
- Platform owner, security administrator, finance operator, support agent and release manager are distinct permissions.
- High-impact operations require step-up authentication and, where feasible, dual approval.
- Support staff do not receive standing access to customer content.
- No person can silently erase audit evidence or disable all security alerts.
- Emergency access is time-bound, logged and reviewed.

## Customer control
- Organization admins manage their own members, roles, product entitlements and organization settings.
- Customers can export their data and inspect access history.
- Customers can revoke sessions, integrations and invitations.
- Customer data is not used for model training or cross-tenant recommendations without a separate, explicit and lawful opt-in.
- Customer content is not visible to the platform owner by default; exceptional support access requires a documented reason, scoped permission and audit event.

## Credentials and recovery
- Secrets are held in protected secret stores, never committed to Git.
- Production credentials are unique per environment and service.
- Owner account recovery requires verified identity and out-of-band recovery controls.
- Rotate credentials after suspected exposure, staff departure or material access change.
- Signing keys and recovery codes are never stored in the application database or repository.

## Governance records
Maintain:
- Corporate/legal entity and IP assignment records.
- Contributor and contractor agreements.
- Trademark and domain registrations.
- Data processing agreements and subprocessors.
- Security policies, incident records and access reviews.
- Product terms, privacy notices, pricing and cancellation terms.
- Backup/restore evidence and release approvals.
