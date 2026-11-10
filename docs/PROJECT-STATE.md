# VAYRO project state

Last verified: 2026-11-10 UTC
Repository: gavad54/zelmira-one-
Working branch: infra/backup-restore-b2
Current PR: #12 — open, draft, unmerged
Latest inspected PR head before this state update: d0300f87eef12011623378e377b6bfd625f4eed9
PR base: main at f3abc61523cb7abbd0b0ab4559a34f40a068ddb5

## Product and architecture baseline
- VAYRO is the mother application and product-family governance layer.
- Product family: ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM and DANA.
- Separate products remain distinct: LEADORA, ARIANA (accounting/ERP), ARIA (no accounting/ERP), and ARMIN MARKET.
- VAYRO-CORE is the separate Supabase PostgreSQL project; never reuse ARIA or LEADORA databases, credentials or storage.
- Repository stack: Next.js App Router, React, TypeScript, Prisma and PostgreSQL.

## Exact-head repository evidence
- PR #12 head d0300f87eef12011623378e377b6bfd625f4eed9: VAYRO CI run 42768803326 completed successfully. Inspected steps passed locked dependency installation/audit, unit tests, Prisma generation/schema validation, isolated PostgreSQL migration, auth/platform/tenant role-isolation tests, lint, typecheck, production build, Docker build and PostgreSQL/HTTP integration tests.
- CodeQL run 42768803337 completed successfully on the same exact head. This confirms scan execution, not that all alert records are closed.
- CI is isolated repository evidence; it does not prove production DB security, backup/restore or release readiness.

## Live VAYRO-CORE read-only evidence (2026-11-10)
- Project wdqhdnhpgxhmmfeyxwxr is ACTIVE_HEALTHY, PostgreSQL 17.11.
- 11 public tables; all 11 have RLS enabled; 0 policies; 0 FORCE RLS; migration history empty; all tables reported 0 rows.
- Current catalog includes 11 tables. The previously identified missing repository models (UserMfa, MfaRecoveryCode, AuthChallenge, AiGeneration), missing Session columns (revokedAt, lastSeenAt, assurance, mfaAuthenticatedAt), and missing AuditEvent tenant FK remain material drift.
- Security Advisor currently reports 11 RLS-enabled/no-policy findings; Health Advisor returned no findings.
- No production DDL, grants, roles, policies, migrations or data writes were performed. Do not mutate production before independent encrypted backup, successful isolated restore, object-by-object reconciliation and a reviewed rehearsal.

## Live Railway evidence (2026-11-10)
- Workspace project remains named ARIA Web; it contains live service VAYRO (ea06b2d7-b28e-462e-9251-2613af769d8e), online with 1/1 replica.
- Latest successful deployment 73f8a197-ebe0-4b17-b40f-19f1a49fbfa6 runs commit f3abc61523cb7abbd0b0ab4559a34f40a068ddb5, not PR #12 head. Five recent failed deployments were reported in the last 24 hours.
- A staged patch b9d85124-4dfe-42fe-8fe2-136f239987b0 would create another service from branch brand/vayro-name-only at commit 6602c54eea9312589129b79304c38e25c9d338c4. It is not live and must not be accepted blindly. No Railway patch-discard action is exposed in the connected tool catalog.
- A dedicated VAYRO Railway project was previously blocked by the free-plan resource limit. No paid upgrade was authorized.

## Backup and restore
- PR #12 adds GitHub Actions scaffolding for encrypted PostgreSQL 17 dumps to private B2 and a manually confirmed isolated restore drill.
- On source commit dbbaf89d1d56b8faacead90bbfb87cf01f6341e3, CI 42767999257 and CodeQL 42767999555 passed.
- The later exact head d0300f87eef12011623378e377b6bfd625f4eed9 also passed CI 42768803326 and CodeQL 42768803337.
- No B2 bucket/keys, protected GitHub secrets, backup object, isolated restore database or actual backup/restore execution exists yet. Remote object-size verification is not a substitute for restore validation.

## Release decision
ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.

Open gates include actual independent backup/restore, production schema/security reconciliation, production auth/MFA and endpoint authorization verification, dedicated hosting/domain/TLS, operational email, durable asset storage, product workflows/integrations, billing/legal review, Android release/device acceptance if required, UAT, monitoring/rollback, deployed commit parity and explicit owner release approval.

Do not claim completion, merge, deploy, migrate production data, enable customer onboarding/payments or publish until the applicable gates have current evidence and required owner authorization.
