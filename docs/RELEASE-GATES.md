# Release gates

The application must not be described as production-ready until all applicable gates have evidence.

- [x] CI: dependency installation, automated unit tests, Prisma generation/validation, lint, typecheck and production build pass on commit `d9e2a9e80c02bdecaca0a49b13e5df44861153d4` (GitHub Actions run [41889484300](https://github.com/gavad54/zelmira-one-/actions/runs/41889484300)).
- [ ] Reproducible dependencies: commit a genuine npm lockfile and use `npm ci` in CI and Docker.
- [ ] Authentication: password hashing, session rotation, secure cookies, CSRF strategy, rate limiting, account recovery and privileged-user MFA reviewed.
- [ ] Authorization: connect policy checks to server-verified sessions and database-derived tenant memberships.
- [ ] Tenant isolation: automated integration tests prove cross-tenant access is denied for every read/write/export/delete path.
- [ ] Security: dependency/container/secret scans, CSP, headers, input validation and abuse controls reviewed.
- [ ] Database: migrations reviewed and applied to an isolated non-production environment; rollback tested.
- [ ] Backup: encrypted backup stored outside the hosting provider and independently controlled.
- [ ] Restore: independent restore test completed in an isolated environment, with checksum and RPO/RTO evidence.
- [ ] Operations: production monitoring, alerting, incident runbooks and rollback procedure verified.
- [ ] Hosting: authorized Railway owner resolves resource provisioning limit and production environment is configured.
- [ ] Mobile: real Android device/browser acceptance test completed.
- [ ] UAT: responsible owner and representative users approve key workflows.
- [ ] Production: active deployment commit matches the approved release commit.
- [ ] Governance: product/legal/privacy review and explicit owner release approval recorded.

Current state: **FOUNDATION IN PROGRESS — NOT RELEASED**.
