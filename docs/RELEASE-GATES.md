# Release gates

The application must not be described as production-ready until every applicable gate has evidence.

## Verified on audited commit

- [x] VAYRO CI passed on `a0169251d369ee5c49ed25ba2e414b54c227a8a5`: [run 41963128369](https://github.com/gavad54/zelmira-one-/actions/runs/41963128369). Unit tests, Prisma generation/validation, disposable PostgreSQL authorization integration tests, lint, typecheck and production build all passed.
- [x] CodeQL passed on the same commit: [run 41963128402](https://github.com/gavad54/zelmira-one-/actions/runs/41963128402).

## Outstanding release gates

- [ ] Reproducible dependencies: commit a genuine npm lockfile and use `npm ci` in CI and Docker.
- [ ] Authentication: endpoint-level tests and review of password policy, session lifecycle/revocation, secure cookies, CSRF/origin checks, rate limiting, email verification/recovery, privileged-user MFA and owner bootstrap cleanup.
- [ ] Authorization: every protected operation uses server-verified sessions and database-derived tenant membership.
- [ ] Tenant isolation: cross-tenant read/write/export/delete denial is tested for every tenant-owned API.
- [ ] Security/privacy: dependency, container and secret scans; CSP, headers, CORS, input validation, abuse controls, privacy workflows and independent security review.
- [ ] Database: migrations reviewed and forward/rollback tested in isolated non-production environments.
- [ ] Backup: encrypted backup stored outside the hosting provider and independently controlled.
- [ ] Restore: independent restore completed in an isolated environment, with checksum and measured RPO/RTO evidence.
- [ ] Email: production sender configured by the authorized mailbox owner and end-to-end delivery/verification tested; no credentials in Git or chat.
- [ ] Licensing/billing: idempotent payment webhooks, invoice/refund/reconciliation and entitlement transitions tested; legal review completed before activation.
- [ ] Product integrations: versioned contracts, scoped service identities, health checks, failure handling and product-boundary tests verified.
- [ ] Hosting: separate VAYRO Railway project, database, protected variables, monitoring and rollback configured by an authorized owner.
- [ ] Mobile: real Android device acceptance test completed for the approved commit.
- [ ] UAT: owner and representative users approve the critical workflows.
- [ ] Production: active deployment commit matches the approved release commit.
- [ ] Governance: privacy/legal review and explicit owner release approval recorded.

Current state: **FOUNDATION IN PROGRESS — NOT RELEASED**.
