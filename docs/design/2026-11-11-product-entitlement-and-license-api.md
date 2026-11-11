# VAYRO Product Entitlement and License API — v1.0

## Scope delivered in this change

This implementation adds a server-authoritative product access decision and a minimal owner-managed license lifecycle on top of the existing VAYRO Core authentication, platform-owner transaction and tenant-RLS boundaries.

### Tenant data plane

| Method | Route | Authorization | Purpose |
|---|---|---|---|
| GET | `/api/tenants/:tenantId/products` | Verified active tenant membership; OWNER/ADMIN sessions must have fresh MFA | Returns the approved 11-product catalogue with this tenant's license state, access decision and safe launch URL |
| Existing GET | `/api/tenants/:tenantId` | Tenant membership and RLS | Workspace summary and currently licensed products |
| Existing GET | `/api/tenants/:tenantId/ai-generations` | Tenant membership and RLS | Tenant-scoped DANA generation history |
| Existing POST | `/api/dana/generate` | Tenant membership and AI-generation action policy | Generate and persist DANA text output |

### Platform control plane

| Method | Route | Authorization | Purpose |
|---|---|---|---|
| GET | `/api/owner/licenses` | OWNER + MFA, revalidated in platform transaction | Returns bounded license ledger, active tenants and sellable products |
| POST | `/api/owner/licenses` | OWNER + MFA, same-origin, rate limited | Issues one license for an active tenant and active product |
| PATCH | `/api/owner/licenses` | OWNER + MFA, same-origin, rate limited | Revokes/reactivates a license and may set its end date |
| Existing GET/POST/PATCH | `/api/owner/products` | OWNER + MFA | Product catalogue and configuration lifecycle |

## Entitlement rules

Access is allowed only when all conditions are true:
1. The tenant is active and the requesting user has a valid membership.
2. The license belongs to that tenant and product.
3. The license is active.
4. The current time is greater than or equal to `startsAt`.
5. The current time is strictly earlier than `endsAt`, or no end date exists.
6. The product's catalogue status is `ACTIVE`.

The server never trusts a client-supplied role, tenant scope, license status, or product access flag. The tenant endpoint derives context from the session cookie and revalidates it within the same RLS transaction. Product launch URLs are returned only when access is currently allowed.

## Database boundary

Migration `20261111150000_platform_owner_license_lifecycle` grants the dedicated `vayro_platform` role only the license columns needed for issue/revoke/reactivate, plus tenant display fields required by the owner ledger. RLS policies require the existing transaction-local OWNER + MFA proof. The tenant data-plane role retains tenant-scoped license policies; it does not receive platform license administration rights.

The migration is committed to the repository and exercised by isolated CI migrations/role tests. It has **not** been applied to the production database by this change.

## Audit and failure behavior

- License issue, revoke and reactivation append immutable `AuditEvent` rows.
- Duplicate tenant/product licenses return HTTP 409; the unique database constraint remains authoritative.
- Invalid date windows return HTTP 400.
- Inactive tenants or products cannot receive new licenses.
- Cross-origin state-changing requests are rejected.
- Rate limits are database-backed and scoped to the owner identity.
- Storage/auth/database failures fail closed with generic service errors.

## Front-end surfaces

- `/owner/licenses`: owner-only license ledger and issue/revoke/reactivate UI.
- `/workspaces/:tenantId/products`: tenant product catalogue and entitlement status.
- The workspace overview links to the full product catalogue.
- Command Center and global navigation link to license management.

## Explicit commercial limitations

This is a license administration capability, not a payment processor. No card/bank gateway, payment intent, settlement, refund, tax invoice, accounting ledger, subscription renewal scheduler, or webhook reconciliation is implemented here. Manual owner-issued licenses must not be represented as paid transactions. Each product still needs its own backend/domain features, independent deployment, monitoring, backup/restore proof, mobile UAT, legal review and release approval.

## Verification requirements

CI must pass on the exact final PR head, including locked dependency audit, unit tests, Prisma generation/validation, migration replay on isolated PostgreSQL, role/RLS isolation, lint, typecheck, production build, Docker build, production HTTP integration tests and CodeQL. Production deployment and production migration remain separately gated.
