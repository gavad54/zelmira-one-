# PR #5 platform database-boundary compatibility review — 2026-11-15

## Decision

**Do not merge PR #5 in its current form. Do not copy the main-branch owner route by itself.**

The review finding is reproducible on the live refs. The feature branch still uses the legacy shared Prisma client for privileged platform-owner reads and writes. The current default branch has a separate authentication data plane and a separate platform control-plane role, enforced by runtime checks, transaction-local actor context, PostgreSQL grants and RLS policies.

A partial file copy would either fail at runtime/build time or leave the owner API using an incomplete privilege boundary. This review therefore records the exact compatibility requirements before implementation; it does not claim the code finding is fixed.

## Exact refs inspected

- PR: [#5](https://github.com/gavad54/zelmira-one-/pull/5), open, draft, unmerged.
- PR base: `experiment/cloudflare-free-hosting-audit` at `b247b0af38d371f23359a92aa59bb35a1abfab96`.
- PR head: `feature/vayro-real-dashboard` at `4cee5223c4a5322a253604209e53d6e41391056d`.
- Current `main`: `f0d31804e695cd3d73b452c7507affdca9573740`.
- Live comparison `main...feature/vayro-real-dashboard`: 368 commits ahead and 17 behind; status `diverged`.

## Reproduced code difference

### PR #5 head

`src/app/api/owner/products/route.ts` (blob `1548cc9130251291a12bb0617cbe2895b799ef4b`):

- imports the shared `prisma` client from `@/lib/prisma`;
- authorizes through `authorizeOwnerSession({ ..., db: prisma })`;
- reads Product, Tenant and License using that same client;
- executes catalog initialization and product updates through `prisma.$transaction`;
- initializes catalog entries with `upsert`.

The branch's owner-products integration test (blob `7203179ddcd9c280894f632db849c2a7aa43cee8`) covers origin validation and rate limiting, but does not prove the effective platform database role, platform RLS context or least-privilege SQL grants.

### Current main

`src/app/api/owner/products/route.ts` (blob `26149f9167fadc4cce90d7b3c6c814ec0326ee03`) instead uses:

- `authPrisma` plus `assertAuthRuntimeRole()` for identity/session validation;
- `withPlatformOwnerTransaction()` for platform data operations;
- `platformPrisma` plus `assertPlatformRuntimeRole()` inside the transaction;
- transaction-local actor/session context, followed by revalidation of the exact OWNER and current MFA-assured session under RLS;
- `createMany({ skipDuplicates: true })` for catalog initialization, preserving the column-scoped INSERT-only privilege model.

The supporting modules are present on main but absent from the PR branch:

| Main-branch module | Main blob |
|---|---|
| `src/lib/auth-prisma.ts` | `f035399c3c1ea8af645d380ec2d9e91387f536b4` |
| `src/lib/platform-prisma.ts` | `2e170934cda83b3df3c7fbbf0d683ce0efce094f` |
| `src/lib/platform-request-transaction.ts` | `4a8b6918a428dee861fdf64ff1e1967215a60eaf` |

## Migration and schema dependencies

The main implementation is not a route-only change. Its database boundary depends on the ordered role/RLS migrations:

1. `20261108170000_tenant_rls_runtime_boundary` — creates and constrains `vayro_app`.
2. `20261109120000_auth_database_role_boundary` — creates `vayro_auth` and its identity-only grants/policies.
3. `20261109130000_platform_control_plane_role_boundary` — creates `vayro_platform` and `vayro_platform_bootstrap`, column-scoped grants, owner/session RLS policies and the one-time bootstrap capability.
4. `20261109160000_platform_bootstrap_least_privilege` and `20261109170000_platform_product_catalog_insert_privileges` — tighten the bootstrap role and the exact Product insert columns.

These migrations are present on main but not on the PR branch. The platform migration explicitly checks that the tenant and auth roles exist and are separate; it must not be applied as an isolated migration.

There is also Prisma schema drift:

- PR #5 has `MfaCredential` and `MfaLoginChallenge`; main has `UserMfa` and `AuthChallenge`.
- Main's `Session` includes `lastSeenAt`; the PR schema does not.
- The tenant RLS migration grants/uses `Session.lastSeenAt`, while the auth migration grants access to main's `UserMfa` and `AuthChallenge` tables.

Therefore the main migration history cannot safely be applied to the PR schema as-is. The schema, ordered migrations, auth/platform clients, role provisioning contract and integration fixtures must be reconciled together.

## Dashboard behavior that must be preserved during the port

- Keep the PR's `currentActiveLicenseWhere(now)` semantics: a license is active only when `startsAt <= now`, `active = true`, and `endsAt` is absent or in the future. The current main route's aggregate SQL does not include the `startsAt` predicate, so a blind route copy would regress the 2026-11-13 correction.
- Preserve the approved product catalog and its PLANNED initial status.
- Preserve the main route's explicit portfolio filter and the existing DANA legacy-record handling; do not delete or rewrite legacy product rows.
- Keep catalog initialization compatible with column-scoped INSERT grants; do not reintroduce `upsert` if it requires broader UPDATE privileges.

## Exact-head CI evidence (PR head `4cee5223c4a5322a253604209e53d6e41391056d`)

All three associated workflow runs completed successfully:

- [VAYRO CI #43575184721](https://github.com/gavad54/zelmira-one-/actions/runs/43575184721) — success.
- [Dashboard Validation #43575184188](https://github.com/gavad54/zelmira-one-/actions/runs/43575184188) — success.
- [CodeQL #43575184135](https://github.com/gavad54/zelmira-one-/actions/runs/43575184135) — success.

Each run's latest job completed with conclusion `success`. These checks validate the code and tests currently present on the PR head; they do not establish the missing platform role/RLS boundary or production runtime configuration.

## Required implementation sequence

1. Reconcile the PR Prisma schema with the chosen auth/session model, including `lastSeenAt`, without deleting the existing MFA data model or silently discarding product data.
2. Port the complete ordered tenant/auth/platform role and RLS migration chain to disposable CI PostgreSQL, with migration-order and role-separation assertions.
3. Add the lazy `AUTH_DATABASE_URL` and `PLATFORM_DATABASE_URL` clients and fail-closed runtime-role checks; do not fall back to the default database role in production.
4. Port the transaction boundary and owner route together. Preserve the `startsAt` license predicate, catalog semantics, audit writes and column-scoped privileges.
5. Extend PostgreSQL + production-HTTP tests to prove wrong-role rejection, no cross-domain grants, no owner operation without a fresh MFA session, and no direct shared-client access from the owner route.
6. Run VAYRO CI, Dashboard Validation and CodeQL on the exact resulting PR head. Keep PR #5 Draft until review and all independent release gates pass.

## Safety boundary

This commit records a source-level compatibility review only. No production database, role, grant, RLS policy, secret, deployment, customer data, merge or public release was changed. Production role/URL provisioning and any production migration remain separately authorized owner actions.

**Status: platform database-boundary finding remains OPEN; PR #5 remains NOT READY TO MERGE.**
