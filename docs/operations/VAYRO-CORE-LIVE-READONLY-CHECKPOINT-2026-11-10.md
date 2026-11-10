# VAYRO-CORE Live Read-only Checkpoint — 2026-11-10

**Observed:** 2026-11-10 18:45 UTC (Supabase Security Advisor observation timestamp)  
**Project:** `VAYRO-CORE` (`wdqhdnhpgxhmmfeyxwxr`)  
**Region / engine:** `eu-central-1`, PostgreSQL 17.11  
**Evidence mode:** Supabase project metadata, verbose public-table listing, migration-history API and Security Advisor.  
**Disposition:** READ-ONLY. No production SQL, DDL, DML, grants, role changes, migrations, backup, restore or deployment performed.

## 1. Freshly rechecked project state

| Check | Result |
|---|---|
| Project status | `ACTIVE_HEALTHY` |
| Public tables listed | 11 |
| Public tables reporting RLS enabled | 11 |
| Row counts returned by table listing | 0 for all 11 |
| Supabase migration history | Empty |
| Security Advisor | 11 `rls_enabled_no_policy` findings |
| Latest Advisor observation | 2026-11-10 18:45:26 UTC |

The 11 tables are `User`, `Tenant`, `Membership`, `Session`, `Product`, `License`, `AuditEvent`, `EmailContact`, `EmailContactVerificationToken`, `AuthActionToken`, and `AuthRateLimit`.

The current Advisor findings name each of these tables as RLS-enabled without a policy. RLS enabled without policies is not proof of tenant isolation. The zero-row result is a point-in-time tool observation, not permission to treat the database as disposable.

## 2. Schema drift revalidated against the PR14 Prisma schema

The live table listing still does not include these Prisma models:

- `UserMfa`
- `MfaRecoveryCode`
- `AuthChallenge`
- `AiGeneration`

The live `Session` table still exposes only `id`, `tokenHash`, `userId`, `expiresAt`, and `createdAt`. The Prisma schema additionally requires `revokedAt`, `lastSeenAt`, `assurance`, and `mfaAuthenticatedAt`.

The Prisma schema also declares the `SessionAssurance` and `AuthChallengePurpose` enums associated with the missing MFA/session objects. The earlier 2026-11-09 catalog audit records that these enums and the `AuditEvent.tenantId` foreign key are absent from the live catalog; those specific catalog facts were not re-queried in this checkpoint.

## 3. What this evidence does not establish

- It does not prove the exact current `FORCE ROW LEVEL SECURITY` state or every effective privilege / role membership. The 2026-11-09 direct catalog audit recorded zero FORCE-RLS tables and zero `vayro_%` roles; repeat those direct catalog checks before any future change.
- It does not prove a successful backup, encrypted off-site object, checksum verification, retention controls or restore.
- It does not prove that any repository migration is safe to apply to the current production schema.
- It does not prove tenant isolation through the actual application runtime identity.

## 4. Required safe sequence

1. Obtain an independently stored encrypted backup of VAYRO-CORE.
2. Verify its checksum and access/retention controls.
3. Restore it into an isolated PostgreSQL 17 environment and record RPO/RTO.
4. Capture complete live and restored catalog inventories.
5. Reconcile all objects against the exact Prisma schema and ordered migrations.
6. Rehearse a reviewed baseline and forward migrations on the restored clone.
7. Test auth, platform and tenant roles using dedicated non-owner LOGIN identities, including negative cross-tenant tests.
8. Only after independent review and explicit production-change authorization may a separate production change plan be considered.

## 5. Release disposition

**DATABASE RECONCILIATION IN PROGRESS — PRODUCTION READ-ONLY — MIGRATION BLOCKED — DEPLOYMENT BLOCKED — NOT RELEASED.**

Evidence sources: connected Supabase project metadata, verbose public table listing, migration-history response and Security Advisor response observed 2026-11-10; repository `prisma/schema.prisma` on `architecture/vayro-independent-product-governance`; prior direct catalog audit `docs/security/2026-11-09-live-production-catalog-audit.md`.
