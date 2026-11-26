# VAYRO-CORE live schema drift audit — 2026-11-25

**Status:** Read-only audit evidence. No production changes authorized or performed.
**Target:** Supabase project VAYRO-CORE (PostgreSQL 17.11).
**Repository schema source:** prisma/schema.prisma on the development ref reviewed 2026-11-25.
**Baseline:** main at f0d31804e695cd3d73b452c7507affdca9573740.

## Executive finding

The live public schema is not reconciled with the current development Prisma schema. The repository defines 18 models; the live catalog contains 11 corresponding tables. Seven repository models have no live table, and the live Session table lacks four fields required by the repository schema. The live database has no policies on its 11 RLS-enabled tables, no FORCE RLS, and no recorded Prisma migration history in the prior project inspection. This is a production-blocking drift finding.

## Model/table reconciliation

Repository models (18):
- User
- Tenant
- Membership
- Session
- Product
- License
- AuditEvent
- EmailContact
- EmailContactVerificationToken
- AuthActionToken
- AuthRateLimit
- UserMfa
- MfaRecoveryCode
- AuthChallenge
- AiGeneration
- EngineeringTask
- EngineeringTaskAttempt
- EngineeringTaskDependency

Live public tables (11):
- User
- Tenant
- Membership
- Session
- Product
- License
- AuditEvent
- EmailContact
- EmailContactVerificationToken
- AuthActionToken
- AuthRateLimit

Missing live tables (7):
- UserMfa
- MfaRecoveryCode
- AuthChallenge
- AiGeneration
- EngineeringTask
- EngineeringTaskAttempt
- EngineeringTaskDependency

## Confirmed column-level drift

The repository Session model contains these fields absent from the live Session table:
- revokedAt
- lastSeenAt
- assurance
- mfaAuthenticatedAt

These fields are security-sensitive. Do not enable MFA/session-assurance code paths against the live database until the migration plan and effective runtime behavior have been reviewed and proven.

## Confirmed relational and security findings

- All 11 live public tables report RLS enabled.
- All 11 live public tables report FORCE RLS disabled.
- The live pg_policies inventory returns zero policies.
- The AuditEvent.tenantId column exists, but the live catalog has no corresponding foreign-key constraint to Tenant.
- The inspected live tables are owned by postgres.
- The Supabase migration history previously inspected for this project was empty; re-check immediately before any approved migration operation.
- Security Advisor previously reported 11 rls_enabled_no_policy findings. RLS enabled without applicable policies does not establish tenant isolation.

## Operational decision

Do not run production DDL, Prisma migrations, db push, baseline resolution, role creation, grants, policy changes, or application deployment as a response to this audit alone.

Before proposing a production change:
1. Produce and verify an encrypted off-provider backup.
2. Restore it into an isolated PostgreSQL 17 environment and compare checksums, schema, constraints, indexes, extensions, and row counts.
3. Generate an object-by-object diff from the exact repository migration chain against the restored catalog.
4. Resolve the missing tables and Session fields in a reviewed migration plan; do not assume that applying all migrations to the existing database is safe.
5. Review and prove the AuditEvent.tenantId FK and all role memberships/effective privileges.
6. Design least-privilege runtime and migration identities separately.
7. Add and test explicit policies with cross-tenant read/write/export/delete denial tests. Consider FORCE RLS only after validating owner/platform access paths.
8. Obtain explicit owner authorization for each distinct production operation.

## Verification boundaries

This document records read-only catalog evidence and repository-schema inspection only. It does not claim a successful backup, restore, migration, RLS remediation, production deployment, or release approval.
