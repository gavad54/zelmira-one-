# VAYRO Tenant Isolation — Security Assessment and Completion Gates

**Status:** BLOCKED — no claim of complete tenant isolation  
**Scope:** Repository-only assessment. No live database queries, DDL, grants, policies, migrations, writes, secrets, or deployments were performed.

## Executive finding

Tenant isolation cannot currently be certified as complete. The current Prisma schema contains tenant identity and membership primitives (Tenant, Membership), tenant-owned licensing (License), and optionally tenant-associated audit events (AuditEvent). It does not yet define the operational tenant-owned business records for the planned product family. Therefore there is no complete product-data inventory against which to prove isolation.

The existing server-side authorization helper resolves an opaque session token, loads membership by the authenticated user ID and requested tenant ID, checks active tenant status, applies role/action authorization, and fails closed on lookup errors. This is an application authorization control. It is not a database row-level security boundary.

## Critical blockers

1. **Runtime database identity is unknown.** The actual PostgreSQL role used by Prisma, its role memberships, ownership, superuser/BYPASSRLS flags, and effective privileges have not been verified. If the runtime role owns protected tables, is superuser, or has BYPASSRLS, ordinary RLS policies may not constrain it.
2. **No transaction-scoped tenant context contract exists.** Policies based on transaction-local settings are unsafe unless every tenant-scoped query runs in a transaction that sets context with SET LOCAL, derives it from a verified session/membership, and cannot be overridden by untrusted input. Current arbitrary Prisma calls do not establish that contract globally.
3. **No complete tenant-owned table inventory exists.** Future product records, join tables, attachments, exports, background jobs, cache keys, search indexes, object-storage paths and audit access all need tenant ownership and authorization rules.
4. **RLS enabled is not equivalent to tenant isolation.** Policies must be present, correct for SELECT/INSERT/UPDATE/DELETE, and tested under the actual non-owner runtime role. UPDATE requires both USING and WITH CHECK.
5. **Privileged operations need a separate, explicit model.** Platform-level owner access must not become an implicit bypass for tenant data. Any cross-tenant support operation requires explicit scoped authorization, reason, audit event and preferably time-bounded elevation.

## Required architecture before policy SQL is safe

- Create a dedicated non-owner, non-superuser runtime database role with no BYPASSRLS; do not use postgres, table-owner, or service-role credentials for ordinary app requests.
- Keep schema migration ownership separate from runtime application access.
- Revoke unnecessary table privileges from browser-facing roles; do not expose server credentials.
- Introduce a single server-side tenant transaction boundary. It must:
  - validate the opaque session and its revocation/expiry state;
  - derive user and tenant membership from database records, never from client-supplied role claims;
  - set transaction-local user/tenant context only after authorization;
  - execute all tenant-scoped reads and writes on that same transaction client;
  - prevent context leakage across pooled connections;
  - fail closed if context is missing or malformed.
- Use FORCE ROW LEVEL SECURITY on tenant-owned tables where compatible with the migration/maintenance model, and verify behavior as the real runtime role.
- Add composite constraints/foreign keys so a child row cannot reference a parent from another tenant (for example tenant_id plus parent_id).
- Define tenant scoping for object storage, cache, queues, exports, webhooks, analytics and background workers—not only PostgreSQL rows.

## Policy design rules

For every tenant-owned table:
- SELECT: row tenant must equal the verified transaction tenant, and the actor must have the required membership/action.
- INSERT: WITH CHECK must require the verified tenant and valid actor/ownership relationship.
- UPDATE: both USING and WITH CHECK must constrain old and new row tenant; tenant reassignment is denied.
- DELETE: row tenant and required role/action must match.
- No permissive USING true policy for application roles.
- No client-controlled tenant context or user metadata as authorization authority.
- Avoid SECURITY DEFINER functions as an RLS workaround. If any are truly necessary, isolate them in a non-exposed schema, restrict EXECUTE, and independently review them.

## Required automated evidence

Build a two-tenant fixture (Tenant A and Tenant B), with separate owners, admins, members and viewers. Execute all cases using the actual runtime role, not a superuser or table owner.

| Test | Expected result |
|---|---|
| A member reads A row | Allow |
| A member reads B row by guessed ID | Deny / no row |
| A member inserts row tagged B | Deny |
| A member updates A row to tenant B | Deny |
| A member deletes B row | Deny / no row |
| B member reads A membership, license, audit event | Deny |
| Suspended/closed tenant access | Deny |
| Missing tenant context | Deny |
| Malformed tenant context | Deny |
| Reused pooled connection after A transaction | B cannot see A rows |
| Concurrent A and B transactions | No context bleed |
| Cross-tenant foreign-key reference | Constraint failure |
| Unauthorized export/background job | Deny |
| Platform support without explicit elevation | Deny |
| Explicit support elevation | Only scoped, time-limited and audited access |

Run tests for every CRUD endpoint and every tenant-owned table. Add property-based/fuzz tests for tenant ID substitution and IDOR. Verify the effective database role and row_security behavior from inside the same connection path used by the application.

## Safe execution order

1. Obtain read-only evidence of the actual VAYRO-CORE Prisma connection role and effective privileges.
2. Inventory every current table, view, function, trigger and storage bucket, plus every tenant-aware route/job.
3. Add the runtime role and transaction context design in repository code; validate in isolated PostgreSQL.
4. Add policies and constraints in a reviewed migration; run forward and rollback tests only in isolated databases.
5. Execute the complete two-tenant test matrix under the actual least-privilege role.
6. Obtain independent security review.
7. Only after approved backup/restore evidence and explicit owner approval may a separate production migration plan be considered.

## Current release decision

**TENANT ISOLATION: BLOCKED.** The existing membership-based server authorization is a useful first layer, but database-enforced isolation and full data-plane coverage are not proven. Do not enable customer onboarding or production data collection. Do not run a production migration or grant privileges to clear security-advisor notices.


## Repository inspection — verified facts (2026-11-08)

The following facts were checked directly against the current branch source and migration files:

- Prisma datasource defines only `DATABASE_URL`; there is no separate migration-owner URL such as `DIRECT_URL`.
- `src/lib/prisma.ts` creates one global PrismaClient. It does not expose a dedicated least-privilege tenant-scoped client or transaction wrapper.
- The initial migration enables RLS on the 11 initial tables but defines **no RLS policies**. It revokes all table and sequence privileges from Supabase `anon`, `authenticated`, and `service_role`. The MFA migration adds three more RLS-enabled tables, also with no policies.
- Because there are no policies, a non-owner role without BYPASSRLS receives no rows and cannot write rows in these tables. A table owner or BYPASSRLS role can bypass ordinary RLS. Thus the current application behavior depends on the effective Prisma connection role and cannot be certified from repository source.
- Tenant-owned current data is limited to `License.tenantId`, `Membership.tenantId`, and nullable `AuditEvent.tenantId`; `Tenant` is the tenant root. Product is a global catalog. No product-family business tables are currently modeled.
- `Tenant` has a unique slug. `Membership` has unique (userId, tenantId), but there is no composite tenant-scoped foreign-key pattern yet for future tenant-owned child records.
- The current tenant authorization helper validates session, active membership and tenant status in application code. It does not set PostgreSQL transaction-local tenant context and does not run the authorized business query inside the same transaction.
- Tenant workspace reads tenant, member count and licenses after the separate authorization call. That creates a time-of-check/time-of-use boundary and does not make RLS enforce the tenant scope.
- Tenant creation and tenant rename/close operations use transactions for their writes/audit events, but do not establish a database tenant context.
- The current CI PostgreSQL service creates `anon`, `authenticated`, and `service_role`, applies migrations, and runs integration tests. It does not create or test a distinct non-owner VAYRO runtime login role, does not test effective `BYPASSRLS`/ownership behavior, and does not run a two-tenant RLS CRUD matrix.
- The architecture document says VAYRO-CORE was provisioned directly, migration history is not baselined, and production migration deployment is prohibited pending reconciliation and isolated forward/rollback testing.

## Concrete blocker disposition

| Blocker | Evidence | Safe disposition |
|---|---|---|
| Runtime role unknown | Only DATABASE_URL in schema; no runtime role test or access to secret metadata | Must be verified in VAYRO-CORE by owner/operator read-only SQL; do not guess |
| Migration/runtime role conflated | No DIRECT_URL or separate Prisma migration URL | Design and CI can be changed; production secret provisioning requires owner/operator |
| RLS has no policies | Initial and MFA migrations enable RLS without policies | Must add policies only with a complete transaction-context design and role tests |
| Runtime owner/BYPASSRLS risk | No role catalog evidence | Verify actual role flags, table ownership and effective grants |
| No tenant transaction context | Prisma singleton only; authorization helper performs independent queries | Implement and test a single scoped transaction boundary before enabling FORCE RLS |
| Auth paths also need data access | User, Session and auth support tables have RLS enabled | Design narrowly scoped server auth policies or separate restricted auth access; never open broad access |
| TOCTOU | Authorization and tenant workspace query are separate operations | Move authorization and scoped reads/writes into one transaction |
| Cross-tenant referential integrity | No tenant-composite foreign-key pattern | Add composite unique/FK constraints for every tenant-owned parent-child relation |
| No two-tenant RLS test role | CI only creates Supabase API roles | Add a non-owner, NOLOGIN test role and execute positive/negative CRUD tests under SET ROLE |
| Product data inventory incomplete | No product business tables in Prisma | Cannot certify isolation for future product records until those schemas and APIs exist |
| External data planes unscoped | No storage/queue/cache/export implementation inventory | Must define tenant namespaces and negative tests when each integration is introduced |

No production changes are authorized or performed. The findings above make the current release gate **FAIL/BLOCKED**, not a pass.


## Live VAYRO-CORE read-only verification (2026-11-08)

The connected Supabase project was inspected using read-only catalog queries and the Supabase table/advisor APIs. No DDL, grants, role changes, policies, data writes, or migrations were executed.

Verified live facts:
- All 11 currently provisioned public tables have RLS enabled, but each has **zero policies**.
- All 11 tables are owned by `postgres`; `FORCE ROW LEVEL SECURITY` is false for every table.
- The SQL inspection connection reports `current_user = postgres`, `session_user = postgres`, and `row_security = on`.
- Catalog flags show `postgres` has `rolbypassrls = true`; Supabase `service_role` also has `rolbypassrls = true`. Neither `anon` nor `authenticated` has BYPASSRLS.
- No table grants were returned for `anon`, `authenticated`, or `service_role`.
- The 11 live tables contain zero rows at inspection time.
- Supabase reports 11 `rls_enabled_no_policy` security lint findings.
- The live migration history API returned an empty list, consistent with the architecture document's warning that schema provisioning was performed directly and migration history is not baselined.
- Live schema currently contains the 11 initial tables. The three MFA tables defined in the repository's later migration were not present in the live table listing; do not assume that migration was applied.

These facts prove that the existing RLS configuration is not an enforced tenant boundary: policies are absent and the owner/BYPASSRLS principals can bypass RLS. They do **not** prove which role the deployed VAYRO application uses, because the protected runtime DATABASE_URL cannot be read through the available integration and must never be exposed in chat.

## Earlier CI evidence (historical; superseded by the final verification below)

The GitHub CI run `42500520633` (run 637) completed with failure. Dependency audit, unit tests, Prisma generation/validation, isolated migration deployment, lint, typecheck and production build passed. The production HTTP integration step failed 20/21 tests: the new password-change integration test expected HTTP 401 but received 403 at `tests/password-change.integration.mjs:74`. This is a same-origin test/configuration defect, not evidence that tenant isolation passes. CodeQL run `42500520615` completed successfully. The CI failure must be repaired and rerun; it must not be represented as a tenant-isolation test result.

## What can and cannot be safely changed now

Repository documentation and isolated CI can be changed without touching customer data. A complete database-enforced solution, however, requires a coordinated change to (a) the protected runtime connection role, (b) a separate migration-owner connection, (c) the server-side transaction/context boundary and all tenant-scoped query paths, (d) per-table RLS policies and composite constraints, and (e) an isolated PostgreSQL two-tenant test suite. The production database currently has no migration history baseline, and the approved operating boundary for this work is read-only on VAYRO-CORE. Therefore no production role, grant, policy, FORCE RLS setting or migration was changed.

**Historical status before the follow-up implementation: FAIL / BLOCKED.** This assessment was superseded by the repository implementation and isolated CI verification documented below.


## Follow-up implementation — current branch (2026-11-08)

The repository-only implementation has advanced beyond the original assessment. The following changes are present on this branch and remain unmerged:

- Added migration `20261108170000_tenant_rls_runtime_boundary`.
- The migration creates the non-login group role `vayro_app` with `NOBYPASSRLS`, rejects an unsafe existing role, and grants only the current tenant data-plane privileges.
- RLS policies now cover the current core tenant and identity rows: `Tenant`, `Membership`, `License`, `AuditEvent`, plus the limited self-read needed for `User` and `Session`. `Product` remains a global read-only catalog.
- `FORCE ROW LEVEL SECURITY` is enabled for those tables. The runtime role is not made a table owner and is not granted access to MFA, auth-action-token, email-contact, rate-limit or other platform tables.
- Tenant context uses transaction-local `app.user_id`, `app.tenant_id`, and `app.session_token_hash` settings. The application helper derives these only from the validated session and requested tenant, then revalidates session, user and membership through the RLS role inside the same transaction as the tenant query.
- Added a separate Prisma client that requires `TENANT_DATABASE_URL`; it fails closed if that dedicated connection is not configured.
- Tenant list, create, workspace read, rename and close handlers have been routed through the dedicated transaction boundary. Self-service tenant creation is restricted by RLS to the current authenticated user creating their own OWNER membership.
- Added an AuditEvent-to-Tenant foreign key.
- Replaced the earlier synthetic-only RLS fixture with a SQL proof against VAYRO's actual current tables. It covers two tenants, a user belonging to both, per-tenant reads, user-scoped tenant listing, tenant provisioning, positive and negative writes, audit actor binding, session/user self-read, missing context and transaction context reset.
- Added an integration test that exercises the actual Prisma transaction helper against the dedicated runtime role.

### Important scope and deployment constraints

This implementation is repository code and isolated-CI work only. It has **not** been applied to VAYRO-CORE. The new migration is not production-ready to apply until the existing production schema is reconciled and a migration baseline is established.

The production tenant connection must be provisioned separately as a LOGIN role that is a member of `vayro_app`, with `NOBYPASSRLS`, no table ownership, and no elevated memberships. Configure the protected `TENANT_DATABASE_URL` only after the owner/operator has verified the role catalog and the independent backup/restore gate. Do not point this URL at `postgres`, `service_role`, a table owner, or any `BYPASSRLS` role.

The existing general-purpose `DATABASE_URL` Prisma client is still used for authentication, rate limiting and other platform operations. Its actual production role and privilege set remain unknown. This assessment therefore does not certify the entire server process or future product data-plane routes until every tenant-data query is inventoried and shown to use the dedicated role. No product-family business tables exist in the current schema, so those future tables remain outside this proof.

The transaction-local GUC design assumes database access is server-only and that untrusted clients cannot connect directly or execute arbitrary SQL. It is not a defense against arbitrary SQL execution under the application role; SQL injection prevention and server-only credential handling remain mandatory.

### Final isolated verification — 2026-11-08

The corrected implementation and test suite were verified on branch head `e9d9bc753728ea8face3ac7f3446bcb3b6a06f2d`:

- VAYRO CI run 745: **success** — [run 42503849736](https://github.com/gavad54/zelmira-one-/actions/runs/42503849736).
- CodeQL run 708: **success** — [run 42503849701](https://github.com/gavad54/zelmira-one-/actions/runs/42503849701). This is a successful scan execution, not a claim that the repository has zero alerts.
- Unit tests: **60 passed, 0 failed**.
- Integration tests: **25 passed, 0 failed**.
- Real-table RLS SQL proof: **passed** under the non-owner `vayro_app` role.
- Locked dependency audit, Prisma generation/validation, migration application on disposable PostgreSQL, Lint, Typecheck and production build: **passed**.
- The integration suite used a dedicated login connection for `vayro_app` with `NOBYPASSRLS`, no table ownership, and a transaction-scoped user/tenant/session context.
- Current tenant API paths routed through this boundary: `/api/tenants`, `/api/tenants/[tenantId]`, `/api/tenants/[tenantId]/access`, and `/api/tenants/[tenantId]/members`.

The earlier failed CI runs were implementation/test corrections during development; they are superseded by the successful run 745 above.

### Remaining production gates

This result verifies the repository implementation against a disposable PostgreSQL instance. It does **not** prove production VAYRO-CORE is protected:

1. The live VAYRO-CORE inspection previously found RLS enabled without policies, empty migration history, and an unknown application connection role. No production migration has been applied.
2. Provision a production LOGIN role that is a member of `vayro_app`, with NOBYPASSRLS, no protected-table ownership, and no membership in superuser/BYPASSRLS/table-owner roles. Configure the protected `TENANT_DATABASE_URL` only after this is independently verified.
3. The general-purpose `DATABASE_URL` client remains in use for authentication, rate limits and platform-wide owner operations. Its production privileges remain unknown. The platform-wide `/api/owner/products` operation intentionally has cross-tenant scope and still requires a separately verified, least-privilege platform authorization boundary.
4. Establish the production migration baseline, inspect existing AuditEvent tenant references, verify an independent backup and restore, rehearse forward/rollback migration, complete independent security review and obtain explicit owner approval before production changes.
5. No VAYRO product-family business tables exist yet. Every future tenant-owned table and storage/export/queue/cache/background-job path must be added to the tenant inventory and receive RLS policies and cross-tenant negative tests.

**Verified conclusion:** current tenant API isolation implementation and its isolated CI proof are `PASS`. Production tenant isolation remains `BLOCKED` pending role provisioning, production migration/baseline, backup/restore and owner approval. The PR remains Draft and must not be merged or deployed as a production release.
