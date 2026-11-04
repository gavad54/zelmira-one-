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
