# VAYRO Production Migration Rehearsal and Release Runbook

**Status: PLAN ONLY — NOT AUTHORIZED FOR PRODUCTION EXECUTION**  
**Baseline:** main `527db3a8051c3eef15c974c43ded4b6e755a75b3`  
**Evidence date:** 2026-11-28

## 1. Purpose

The connected VAYRO-CORE database is at the initial migration schema, while the repository contains a longer additive migration chain and a 27-model Prisma schema. This runbook defines a controlled route to reconcile and rehearse that chain without touching production.

Do not run `prisma migrate resolve`, `prisma db push`, hand-edit the production migration ledger, or apply the full chain to VAYRO-CORE as a shortcut.

## 2. Observed starting point

- Live catalog: 11 public tables and six initial enums.
- RLS is enabled on all 11 tables; no policies and no FORCE RLS were observed.
- Current Prisma schema: 27 models; 16 later model tables are absent from live catalog.
- Live `Session` has only its five initial columns; four later session/MFA columns are absent.
- No migration ledger relation or migration entries were observed.
- The live table/enum set matches the initial migration, but that observation alone is not proof of data equivalence or a safe migration baseline.

## 3. Migration chain and security boundaries

The repository chain includes, at minimum:

1. `20261106055500_init_vayro_core` — initial core tables and enums.
2. `20261108000000_mfa_session_foundation` — session assurance, MFA, recovery codes and auth challenges.
3. `20261108170000_tenant_rls_runtime_boundary` — `vayro_app` tenant data-plane role, scoped grants/policies and FORCE RLS.
4. `20261109120000_auth_database_role_boundary` — separate `vayro_auth` identity data-plane role and policies.
5. `20261109130000_platform_control_plane_role_boundary` and subsequent least-privilege/catalog migrations — platform role boundary and catalog privileges.
6. Later additive migrations — AI generation history, licenses, durable task engine/dependencies, goals/schedules/agents/reviews and conversation archive/attachments.

The exact ordered migration directory list in the checked-out repository is authoritative. Never manually reorder or omit migrations.

### Role constraints

- `anon` and `authenticated` must not receive application-table grants unless a separately reviewed design requires them.
- `service_role` has BYPASSRLS and must not be used as a normal application runtime identity.
- `vayro_app`, `vayro_auth`, platform control-plane and scheduler identities must remain distinct, non-superuser and NOBYPASSRLS where specified by their migrations.
- A LOGIN credential must be provisioned separately from the NOLOGIN group role and must inherit only the intended group role.
- Tenant context settings (`app.tenant_id`, `app.user_id`, `app.user_role`, `app.session_token_hash`) are trusted-server context only. Never accept them directly from client input.
- Do not grant table ownership, migration privileges, or BYPASSRLS to application runtime roles.

## 3A. Exact migration inventory on the inspected main baseline

The recursive Git tree for main `527db3a8051c3eef15c974c43ded4b6e755a75b3` was complete (not truncated) and contained these 16 timestamp-ordered migration directories:

1. `20261106055500_init_vayro_core`
2. `20261108000000_mfa_session_foundation`
3. `20261108170000_tenant_rls_runtime_boundary`
4. `20261109120000_auth_database_role_boundary`
5. `20261109130000_platform_control_plane_role_boundary`
6. `20261109150000_tenant_ai_generation_history`
7. `20261109160000_platform_bootstrap_least_privilege`
8. `20261109170000_platform_product_catalog_insert_privileges`
9. `20261111150000_platform_owner_license_lifecycle`
10. `20261121130000_durable_task_engine`
11. `20261121140000_task_owner_api_boundary`
12. `20261122100000_task_dependency_graph`
13. `20261122110000_block_failed_task_dependents`
14. `20261125120000_durable_goals_schedules_agents_reviews`
15. `20261125130000_recurring_schedule_materializer`
16. `20261126100000_conversation_archive_foundation`

The same inspected baseline contains 27 Prisma models and nine Prisma enums. The live catalog snapshot contains 11 public tables and six initial enums. The arithmetic difference of 16 model tables is a reconciliation indicator only; it is not proof that every model maps one-to-one to a missing table. The rehearsal must compare actual tables, columns, indexes, constraints, enum labels, functions, triggers, ownership, grants and policies object by object.

## 4. No-cost rehearsal route

Use only a disposable PostgreSQL 17 instance in CI or another already-available no-cost isolated environment. Do not create a paid Supabase branch without explicit cost approval.

### Rehearsal A — empty-database full-chain replay

1. Create a fresh disposable PostgreSQL 17 database.
2. Apply the repository migration chain in timestamp order using the repository's supported migration command.
3. Capture the complete migration output and exit status.
4. Run Prisma schema validation and generated-client checks.
5. Run catalog assertions: expected models/tables, columns, enum labels, indexes, foreign keys, constraints, grants, RLS and FORCE RLS.
6. Run role privilege tests for `anon`, `authenticated`, `service_role`, `vayro_app`, `vayro_auth`, platform role and scheduler role.
7. Run tenant-isolation tests with at least two tenants and negative cross-tenant reads/writes.
8. Run authentication/MFA tests, including session revocation and recovery-code single-use.
9. Run task, schedule, goal and conversation integration tests.
10. Preserve logs and the exact commit SHA.

### Rehearsal B — initial-schema upgrade simulation

1. Create a second fresh PostgreSQL 17 database.
2. Apply only `20261106055500_init_vayro_core`.
3. Insert synthetic, non-sensitive fixtures for users, tenants, memberships, sessions, products and licenses.
4. Take a logical dump and restore it into a third disposable database; verify row counts, constraints and checksums.
5. Apply only the remaining migrations in timestamp order.
6. Confirm existing fixture rows survive and new schema objects match the Prisma model.
7. Test both authorized and denied operations under each runtime role.
8. Confirm no migration silently marks an unapplied migration as complete and no data is dropped or rewritten unexpectedly.

Do not use production data in these rehearsals.

## 5. Production backup and restore gate

A production backup is not complete until all of the following are evidenced:

- Database dump is encrypted before leaving the trusted environment.
- Backup object is read back from remote storage.
- Downloaded bytes match the uploaded object and a SHA-256 digest.
- Sidecar metadata and encryption metadata are verified.
- Database is restored into an isolated PostgreSQL target.
- Restore logs, row counts, schema catalog and representative checksums are retained.
- Roles, grants, extensions and ownership are separately inventoried and restored/reconciled; `--no-owner --no-acl` alone is not proof of role/grant recovery.
- Object storage, uploaded attachments, volumes, deployment artifacts, secrets/configuration and DNS are separately inventoried. Database dump alone does not cover them.
- No secret values are copied into CI logs, PR comments or this repository.

If protected backup credentials or encryption keys are unavailable, stop. Do not request or paste secrets into chat.

## 6. RLS rollout design gate

Before any production SQL:

1. Complete the isolated restore gate.
2. Compare the full live catalog against the initial migration and every subsequent migration, object by object.
3. Review all migration SQL, including role creation, grants, policies, SECURITY DEFINER functions and triggers.
4. Confirm the production connection principal has the minimum required privileges.
5. Test the exact migration chain and rollback/recovery plan in isolated PostgreSQL.
6. Have an independent reviewer approve the SQL and a named owner authorize the production maintenance window.
7. Apply one reviewed forward-only migration batch at a time, with pre/post catalog snapshots and immediate stop conditions.
8. Verify the 11 existing tables, existing data, grants, RLS policies and cross-tenant isolation after each batch.

Do not add blanket policies to clear Security Advisor findings. A table with RLS enabled and no policy is default-deny for roles subject to RLS; the actual role grants and server paths must be verified before changing this state.

## 7. Independent hosting and Android

- Provision a separate VAYRO hosting project/service only after a no-cost option is confirmed or the owner approves the exact cost.
- Do not reuse ARIA Web or LEADORA projects as a substitute for independent VAYRO hosting.
- Configure secrets only through the hosting provider's protected variable manager; never place values in source control.
- Deploy the exact reviewed commit to a staging environment first.
- Verify health endpoint, authentication, tenant isolation, storage and background tasks.
- Only after a healthy HTTPS VAYRO origin exists, dispatch the Android debug workflow with that exact origin.
- Verify installation and real use on a physical Android device.
- Configure release signing through protected secrets and produce a verifiable signed artifact.
- Complete UAT and retain evidence tied to the exact commit and artifact digest.

## 8. Stop conditions

Stop immediately if any of the following occurs:

- Backup read-back, decryption or restore fails.
- Catalog differs from the reviewed rehearsal unexpectedly.
- Migration attempts destructive or unreviewed data changes.
- Runtime role has SUPERUSER, BYPASSRLS, table ownership or excess grants.
- Cross-tenant access test succeeds unexpectedly.
- Authentication/MFA or session revocation tests fail.
- Healthcheck, HTTPS, Android install, signing or UAT evidence is missing.
- A new paid resource or recurring charge is required but not approved.

## 9. Release decision

Current decision remains **DEPLOYMENT BLOCKED**.

This document is an engineering plan and does not claim that a production backup, restore, migration, hosting deployment, Android installation, signing or UAT has been completed. Production execution requires independent review, verified recovery, explicit owner authorization and retained evidence for every gate.
