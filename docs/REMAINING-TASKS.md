# VAYRO remaining tasks

Priority order. Reconcile against live evidence before execution; do not repeat tasks already proven complete.

## P0 — backup and safe database reconciliation
- [ ] Authorized owner establishes an eligible private offsite backup destination and reviews provider terms/costs.
- [ ] Configure protected GitHub secrets/variables without exposing values in source, issues or chat.
- [ ] Run an actual encrypted backup and verify the stored objects.
- [ ] Provision a separate disposable PostgreSQL 17 restore host/database.
- [ ] Run an independent restore, validate schema/data/invariants, and record measured RPO/RTO.
- [ ] Compare restored live schema object-by-object with Prisma schema and migration SQL; design baseline/forward/recovery plan.
- [ ] Only after approved backup and rehearsal, implement production roles, grants, policies and FORCE RLS as appropriate; prove cross-tenant read/write/export/delete denial with real runtime roles.

## P1 — identity, security and application
- [ ] Reconcile production MFA/session schema and deploy only through reviewed migrations.
- [ ] Verify every protected endpoint against a role/permission matrix, including negative tests.
- [ ] Complete CSP, headers, CORS, rate-limit/proxy, input validation, audit and independent security review.
- [ ] Verify production email delivery and account recovery.
- [ ] Complete operational owner/admin workflows and tenant-aware product functionality.
- [ ] Complete durable object storage for generated assets and product connector contracts.

## P2 — production and release
- [ ] Establish dedicated VAYRO hosting and domain/TLS, protected variables, monitoring and rollback within free-tier constraints.
- [ ] Resolve Railway free-plan resource limit or use a verified free alternative; no paid upgrade without owner approval.
- [ ] Verify production deployment commit parity and health.
- [ ] Build Android release if in approved scope; test on a real device and complete signing through authorized owner process.
- [ ] Complete billing/licensing only after provider, legal and webhook review; keep real payments disabled until approved.
- [ ] Complete privacy/legal review, UAT and explicit release authorization.
- [ ] Prepare store listing and submit only after owner-controlled store requirements are met.

## Blockers requiring owner/provider action
- Provider resources and protected credentials for backup/restore do not exist.
- A separate Railway project could not be provisioned under the observed free-plan resource limit.
- Production VAYRO-CORE has RLS enabled but no policies and material schema drift; production changes are unsafe before verified backup/restore and reconciliation.
- Account eligibility, billing, signing and store submission must be handled by the authorized account owner under provider terms. Never paste secrets into chat.
