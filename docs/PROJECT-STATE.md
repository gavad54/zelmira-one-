# VAYRO project state — authoritative snapshot
Updated: 2026-11-10 11:22:46 +03:30 (2026-11-10T07:52:46Z)
Fixed 48-hour window: 2026-11-10T07:43:24Z to 2026-11-12T07:43:24Z. No reset or extension.

## Repository and exact-head verification
- PR #12: OPEN / DRAFT / UNMERGED; branch infra/backup-restore-b2; 46 commits ahead / 0 behind main.
- Source candidate: b2b78f3a9171eeddd53c4f11d740b8c54abd6a7d.
- Exact-SHA VAYRO CI 42777954484 (#1160): COMPLETED / SUCCESS; all 45 job steps passed. Unit tests, dependency audit, Prisma generation/validation, migrations on isolated PostgreSQL 17, auth/platform/tenant role-isolation, tenant RLS SQL proof, lint, typecheck, production build, Docker build and PostgreSQL/HTTP integration passed.
- Exact-SHA CodeQL 42777954612 (#1123): COMPLETED / SUCCESS.
- Links: https://github.com/gavad54/zelmira-one-/actions/runs/42777954484 and https://github.com/gavad54/zelmira-one-/actions/runs/42777954612.
- The governance-only follow-up commit will require its own exact-head CI/CodeQL check. Do not transfer prior SHA results to a descendant.
- Prior SHA 7d0edb7 had 86 unit and 30 integration tests pass. Do not transfer those counts to latest run; latest counts were not extracted.

## Product identity and boundaries
- Mother app: VAYRO only.
- Seven approved modules: ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM.
- DANA remains a VAYRO platform AI capability, not an eighth family product.
- ARIA excludes accounting/ERP; ARIANA owns accounting/ERP; LEADORA remains independent pending audit.
- Preserve existing capabilities until audited and approved for change. Keep product data stores independent and integrate through reviewed, versioned APIs.
- UI target: Persian RTL + English, mobile-first and responsive.
- Product directory, homepage, declaration and tests changed in 06f3e3528f12e1a76b801430788fa433ebeffef2; exact candidate CI on b2b78f3 passed.

## Repository capability scope
Source includes authentication, password reset/change, MFA/TOTP, recovery codes, session lifecycle, owner/tenant authorization, tenant transaction/RLS boundary and a 42-operation endpoint inventory. These are source capabilities, not proof of production enforcement.
Password-change route exists: verifies current password, requires recent MFA for privileged/MFA-enabled accounts, transactionally updates password, revokes all sessions and records an audit event.

## Live production evidence — last verified inspection
- VAYRO-CORE: 11 public tables; RLS enabled on all 11; zero policies; zero FORCE RLS; migration history empty.
- Missing live tables: UserMfa, MfaRecoveryCode, AuthChallenge, AiGeneration. Live Session lacks revokedAt, lastSeenAt, assurance, mfaAuthenticatedAt.
- Security Advisor reported 11 RLS-enabled/no-policy findings. Dedicated roles vayro_app, vayro_auth, vayro_platform and vayro_platform_bootstrap were absent at last inspection.
- No actual encrypted offsite backup, protected backup secrets, separate restore target or successful restore exists.
- No production DDL, grants, roles, policies or migrations have been applied.

## Hosting and release
- Railway service VAYRO: https://vayro-production.up.railway.app, in legacy project ARIA Web, not dedicated VAYRO project.
- Last verified successful deployment ran base SHA f3abc61523cb7abbd0b0ab4559a34f40a068ddb5, not PR #12. /api/health is liveness only; a previous /api/ready probe returned 503 with cause unproven.
- Dedicated Railway project creation was blocked by observed Free-plan resource limit. No paid upgrade authorized.
- No merge, deployment of PR code, Android signing, UAT completion or public release.

## Weighted progress
The 100-point registry includes all seven end-to-end modules. VERIFIED: GOV-001 (2) + CI-001 (4) + PROD-001 (3) = 9/100 = 9%. This is evidence-weighted task completion, not source-code volume. All module end-to-end tasks remain open.

## Disposition
ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.
