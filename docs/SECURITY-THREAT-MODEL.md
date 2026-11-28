# VAYRO — Security Architecture and Threat Model

## Security objectives
Confidentiality, integrity, availability, tenant isolation, accountable administration, recoverability and privacy by design.

## Threat classes
- Account takeover, credential stuffing, phishing and session theft.
- Broken object-level authorization and cross-tenant data exposure.
- Privilege escalation and abuse of owner/support roles.
- Injection, XSS, CSRF, SSRF, unsafe file upload and deserialization.
- API scraping, automated abuse, spam, fraud and denial of service.
- Prompt injection, tool abuse, data exfiltration and unsafe autonomous actions.
- Supply-chain compromise, dependency confusion and secret leakage.
- Backup theft, ransomware, destructive admin actions and provider outage.
- Insider misuse and silent access to customer information.

## Required controls
### Identity and access
- Secure password hashing using Argon2id or a vetted identity provider.
- MFA/passkeys for owner and privileged roles.
- Short-lived sessions, secure cookies, rotation and revocation.
- Server-side authorization on every resource and action.
- RBAC plus tenant-scoped attributes; deny by default.
- Step-up authentication for billing, ownership, export, deletion and key operations.

### Application and API
- Strict input schemas and output encoding.
- Parameterized database access.
- CSRF protection for cookie-authenticated state changes.
- CSP, HSTS, frame restrictions, MIME sniffing protection and safe referrer policy.
- CORS allowlist; no wildcard credentialed origins.
- Rate limits by account, tenant, IP and operation.
- Idempotency keys for financial or irreversible operations.
- SSRF defenses and egress allowlists for server-side fetches.
- File type/size scanning and isolated object storage.
- Secrets redaction from logs and error responses.

### Data and privacy
- TLS in transit and encryption at rest.
- Separate production and non-production data.
- Tenant isolation tests at repository and API layers.
- Data minimization, retention schedules, export and deletion controls.
- Audit records for access grants, role changes, exports and privileged actions.
- No cross-tenant model context or retrieval.

### AI and automation
- Treat user content, uploaded files and retrieved web pages as untrusted input.
- Tool allowlists and per-tool scopes.
- No autonomous money movement, account deletion, legal acceptance or external publication.
- Human confirmation for consequential actions.
- Output validation, budget limits, action rate limits and complete trace/audit.
- Protect secrets and system instructions from retrieval and tool outputs.
- Kill switch per agent, tool and tenant.

### Operations and supply chain
- Dependency lockfiles, automated vulnerability scanning and SBOM.
- Protected branches, required CI and reviewed releases.
- Signed build artifacts and protected signing keys.
- Centralized monitoring, alerting and incident runbooks.
- Tested restore procedures and rollback plan.
- Periodic access reviews and penetration testing.

## Security acceptance tests
- User A cannot read, update, export or delete User B's tenant data.
- Customer admin cannot grant platform-owner privileges.
- Support access expires automatically and produces an audit event.
- Revoked sessions and API tokens stop working.
- Rate limits and abuse controls return safe errors.
- Malicious HTML, URLs, uploads and prompt-injection samples cannot gain privileged actions.
- Backup archives are encrypted and restore checksums match.
- Security headers and cookie flags are verified in production-like tests.

## Release gate
No statement of “fully secure” is permitted. Release requires a scoped security assessment, resolved critical/high findings, documented accepted residual risks and a tested incident response process.


### Trusted proxy configuration
- Never treat client-supplied `X-Forwarded-For` as authoritative without a verified trusted-proxy hop count.
- Configure `TRUSTED_PROXY_HOPS` only after the selected host ingress behavior is verified.
- Until then, account/email/token rate limits remain active and IP-only rate limits are skipped.

### Database runtime trust boundary
- The `app.user_id`, `app.tenant_id`, `app.session_token_hash`, `app.user_role` and `app.platform_*` PostgreSQL settings are trusted server-side request context, not credentials or proof of identity by themselves.
- A PostgreSQL custom setting can be changed by a session that has a database connection. Therefore, no tenant, browser, mobile or third-party client may receive a VAYRO runtime database connection string or the credentials of `vayro_app`, `vayro_auth`, `vayro_platform`, worker or scheduler roles.
- The backend must authenticate the application session, verify current tenant membership and role, then set transaction-local context on a dedicated least-privilege connection. Use transaction pooling safely: set context and perform the protected query in the same transaction.
- Runtime LOGIN users are separate from NOLOGIN capability roles, inherit only the one capability they need, and must not own tables, create roles, inherit other capability roles, become superusers or have BYPASSRLS.
- Supabase `anon`, `authenticated` and `service_role` must not be granted direct privileges on VAYRO application tables or sequences. Access is server-only and uses the dedicated VAYRO runtime roles.
- The disposable PostgreSQL CI suite checks the above catalog grants and role memberships in addition to positive and negative tenant RLS behavior. These tests do not prove that production credentials are correctly stored or withheld; that requires a separate deployment configuration audit.
