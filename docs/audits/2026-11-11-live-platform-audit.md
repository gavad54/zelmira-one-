# VAYRO live platform audit — 2026-11-11

## Scope and evidence boundary

This is a read-only production/platform snapshot captured on 2026-11-11. It records what was observable through the connected GitHub, Supabase and Railway integrations. It does not authorize production DDL, deployment, secret changes, data onboarding, billing activation or release.

## Repository verification

- Repository: `gavad54/zelmira-one-`.
- Main commit at audit start: `cbad8640f033eecb456c91f282ca4e819bab1409`.
- PR #18 corrected the TypeScript declaration for `authorizeTenantRequest` to match the runtime query fields and `session.updateMany` calls.
- PR #18 exact head: `20997d31d6e2850ff5686c99de5b56a11f862ace`.
- VAYRO CI run [42991293981](https://github.com/gavad54/zelmira-one-/actions/runs/42991293981) completed successfully. Its job included dependency audit, unit tests, Prisma generation/schema validation, isolated PostgreSQL migration and least-privilege/RLS tests, lint, typecheck, production build, Docker image build and PostgreSQL/production HTTP integration tests.
- CodeQL run [42991294177](https://github.com/gavad54/zelmira-one-/actions/runs/42991294177) completed successfully.
- PR #18 was merged by squash as `65335176a86313acd59e899f181bdeaa20d5ac26`.
- These checks validate the repository commit and isolated CI database only. They do not validate the live VAYRO-CORE database or Railway runtime.

## VAYRO-CORE live database snapshot

Project `wdqhdnhpgxhmmfeyxwxr`, named `VAYRO-CORE`:

- Status: `ACTIVE_HEALTHY`.
- Region: `eu-central-1`.
- PostgreSQL: `17.11.0.018`.
- Public schema: 11 tables and 74 columns; all 11 tables have RLS enabled.
- Supabase migration history returned no applied migrations. The repository contains eight Prisma SQL migration files, but their presence in Git is not evidence that they ran against this project.
- `pg_policies` returned zero policies in `public`.
- Security Advisor returned 11 `rls_enabled_no_policy` findings.
- Read-only role inspection found no roles named `vayro_*`; the custom runtime roles defined in repository migrations are not provisioned in this live database.
- Read-only table grants showed application table privileges only for `postgres`; no table grants were returned for `anon`, `authenticated` or `service_role`.
- The inspected tables returned zero rows.
- Health Advisor returned no findings at the time of inspection.

### Database conclusion

The live database matches only the initial 11-table foundation, not the later MFA, tenant runtime, auth runtime and platform runtime migration state in the repository. Migration history is unbaselined and custom least-privilege roles are absent. Do not run `prisma migrate deploy`, apply policies, grant runtime privileges, seed data or create owner/customer records in production until an independently encrypted backup and isolated restore have been proven, the baseline has been reviewed, and the exact runtime role model has been validated.

RLS enabled with no policies currently denies row access to ordinary roles; it does not establish tenant isolation. Do not resolve the Advisor findings by adding broad or generic policies.

## Railway live deployment snapshot

Accessible Railway projects at audit time:

- `ARIA Web` — project `c936dddd-5aa7-46d9-bd04-aa77f2164586`.
- `LEADORA` — project `806faa38-6cdd-4a6a-bad4-0e94cf6070fa`.
- No separately named VAYRO Railway project was visible.

The VAYRO service is located inside the `ARIA Web` project, production environment:

- Service: `VAYRO`, ID `ea06b2d7-b28e-462e-9251-2613af769d8e`.
- Source: `gavad54/zelmira-one-`, branch `main`.
- Latest deployment: `63069f8a-bec0-4572-969a-5ef079ce7a19`, status `SUCCESS`, one replica in `iad`.
- Railway domain: `https://vayro-production.up.railway.app`.
- No attached volume or Railway bucket was reported.
- Service variable inspection returned only Railway-generated system variable names. No application configuration names such as `DATABASE_URL`, `AUTH_DATABASE_URL` or `PLATFORM_DATABASE_URL` were present in the service variable-name list. Secret values were not requested or exposed.
- Healthcheck path is `/api/health`; a successful liveness deployment does not prove application database readiness or UAT.
- A staged patch remains in the ARIA Web production environment. It would create a second service from the stale branch `brand/vayro-name-only` at commit `6602c54eea9312589129b79304c38e25c9d338c4`. It was not accepted or deployed. Do not accept this stale patch as a VAYRO fix.
- No new Railway project, service, volume, bucket, secret or deployment was created during this audit.

## Backup and restore

- GitHub workflows for encrypted PostgreSQL backup and isolated restore exist in the repository.
- The runbook requires protected GitHub Environments, B2 credentials, an age key pair, a dedicated backup connection and a separate disposable restore database.
- No successful backup run, encrypted offsite object, checksum verification, isolated restore drill or measured RPO/RTO was evidenced during this audit.
- Database-only backup does not cover uploaded files, Railway volumes, deployment configuration, secrets or external integrations.
- Keep backup and restore gates open until real artifacts and a completed independent restore are inspected.

## Product and release status

- VAYRO has an engineering foundation and product directory; directory entries are not proof of operational products.
- DANA and NEGAH have implementation areas in the repository, but this audit does not certify their end-to-end commercial operation.
- ARVAND, CHARSU, GANJINEH, SEPEHR, NAMA and PAYAM remain planned/catalogue-level in the main application unless separate runtime, data, tests and release evidence are produced.
- ARIA, ARIANA and LEADORA require their own independently verifiable product, data, runtime, security, backup, mobile and UAT evidence.
- ARIA must not contain accounting or ERP; ARIANA remains the accounting/ERP boundary.

## Required next actions

1. Provision and verify protected GitHub backup/restore environments and provider resources without sharing secret values in chat.
2. Run a real encrypted backup only after the owner verifies the protected environment and target source database.
3. Restore that artifact to a separate disposable PostgreSQL 17 host; compare schema, object and representative row counts, and record RPO/RTO.
4. Reconcile the live VAYRO-CORE catalog against all eight repository migrations and Prisma schema. Establish a reviewed baseline plan; do not apply it to production yet.
5. Provision dedicated non-login group roles and separate login identities for auth, tenant and platform runtime, then validate grants and RLS in an isolated clone.
6. Configure the Railway service only after the owner confirms a dedicated VAYRO hosting project and the required protected runtime configuration. Do not reuse ARIA infrastructure as a substitute for product independence.
7. Complete endpoint-by-endpoint authorization, MFA production enrollment, email delivery, CSP/security review, mobile build/signing/device UAT and owner acceptance.
8. Complete each of the 11 product release gates independently before enabling customer onboarding or payments.

## Final status

**ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.**

No production database mutation, secret change, Railway deployment, staged-patch acceptance, customer onboarding or payment activation was performed during this audit.
