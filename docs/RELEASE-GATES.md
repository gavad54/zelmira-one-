# Release gates

The application must not be described as production-ready until all applicable gates have evidence.

- [ ] CI: install, lint, typecheck, schema validation and production build pass.
- [ ] Authentication: password hashing, session rotation, secure cookies, CSRF strategy, rate limiting and account recovery reviewed.
- [ ] Authorization: platform roles and tenant membership enforced server-side.
- [ ] Tenant isolation: automated cross-tenant access tests pass.
- [ ] Security: dependency scan, secret scan, headers, input validation and abuse controls reviewed.
- [ ] Database: migrations reviewed and applied to a non-production environment.
- [ ] Backup: encrypted backup stored outside the hosting provider volume.
- [ ] Restore: independent restore test completed and evidence retained.
- [ ] Operations: logs, alerting, health checks and rollback procedure verified.
- [ ] Mobile: real Android browser/device acceptance test completed.
- [ ] UAT: owner and representative users approve key workflows.
- [ ] Production: active deployment commit matches the approved release commit.

Current state: **FOUNDATION IN PROGRESS — NOT RELEASED**.
