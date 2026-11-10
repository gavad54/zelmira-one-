# VAYRO project state — authoritative snapshot
Updated: 2026-11-10 11:15:28 +03:30
Deadline: 2026-11-12 11:13:24 +03:30 (fixed; no restart).

## Repository
- Repository: gavad54/zelmira-one-
- PR #12: open, draft, unmerged; branch infra/backup-restore-b2; 32 commits ahead / 0 behind main at last compare.
- Last fully checked code head before governance-doc commits: 7d0edb71522c281b546011ae110f4501c6903c43.
- Exact-head CI run 42776421939 and CodeQL run 42776421968 both completed successfully. CI's 45 steps all succeeded; 86/86 unit tests and 30/30 PostgreSQL/production-HTTP integration tests passed.
- Governance files were then added in commits ending f22be227; fresh exact-head CI/CodeQL must be checked for the resulting branch head before any latest-head verification claim.

## Product identity and boundaries
- Mother app: VAYRO only.
- Approved family modules: ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM.
- ARIA excludes accounting/ERP; ARIANA owns accounting/ERP; LEADORA stays independent pending audit. Preserve existing capabilities until audited and approved for change.
- Independent product databases; integrations only through reviewed, versioned APIs.
- Persian RTL + English; mobile-first responsive UI.

## Production facts / release blockers
- Live VAYRO-CORE previously inspected: 11 public tables, RLS enabled on all 11, zero policies, zero FORCE RLS; migration history empty; Security Advisor had 11 RLS-without-policy findings.
- Live schema drift includes missing UserMfa, MfaRecoveryCode, AuthChallenge and AiGeneration models, and missing Session fields revokedAt, lastSeenAt, assurance, mfaAuthenticatedAt.
- No verified encrypted offsite backup, backup object, separate restore target or successful restore.
- Railway VAYRO service remains in legacy ARIA Web project and last verified successful deployment used base commit f3abc61523cb7abbd0b0ab4559a34f40a068ddb5, not PR #12. /api/health is liveness only.
- No production DB mutation, PR merge, deployment, public release or Android signing performed.

## Current disposition
ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.
See TASK-REGISTRY.md, SECURITY-REPORT.md, DEPLOYMENT-REPORT.md, RELEASE-GATES.md and TEST-EVIDENCE.md.
