# VAYRO project state — authoritative snapshot
Updated: 2026-11-10 11:20 +03:30
Deadline: 2026-11-12 11:13:24 +03:30 (fixed; no restart).

## Repository
- Repository: gavad54/zelmira-one-
- PR #12: open, draft, unmerged; branch infra/backup-restore-b2; last compare 45 commits ahead / 0 behind main.
- Current documentation/governance head before this evidence-only commit: 87e940774dedd3adf64610d7f9fc431657195a12.
- Last exact-head CI/CodeQL pass: source head 7d0edb71522c281b546011ae110f4501c6903c43, CI 42776421939 and CodeQL 42776421968. 86 unit + 30 integration passed; all 45 CI steps passed.
- Current product-directory source commit 06f3e3528f12e1a76b801430788fa433ebeffef2 has three focused Node tests passed locally against copied exact source/test files (Node v22.16.0). This is not a repository CI run, Next.js build or TypeScript check. Current PR head has no GitHub Actions runs or status checks in the latest API query.

## Product identity and boundaries
- Mother app: VAYRO only.
- Exactly seven approved family modules: ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM.
- DANA is preserved as a platform-level AI capability, not an eighth family product.
- ARIA excludes accounting/ERP; ARIANA owns accounting/ERP; LEADORA stays independent pending audit. Preserve existing capabilities until audited and approved for change.
- Independent product databases; integrations only through reviewed, versioned APIs.
- Persian RTL + English; mobile-first responsive UI.

## Production facts / release blockers
- Live VAYRO-CORE last inspected: 11 public tables, RLS enabled on all 11, zero policies, zero FORCE RLS; migration history empty; Security Advisor had 11 RLS-without-policy findings.
- Live schema drift includes missing UserMfa, MfaRecoveryCode, AuthChallenge and AiGeneration models, and missing Session fields revokedAt, lastSeenAt, assurance, mfaAuthenticatedAt.
- No verified encrypted offsite backup, backup object, separate restore target or successful restore.
- Railway VAYRO service remains in legacy ARIA Web project and last verified successful deployment used base commit f3abc61523cb7abbd0b0ab4559a34f40a068ddb5, not PR #12. /api/health is liveness only.
- No production DB mutation, PR merge, deployment, public release or Android signing performed.

## Current disposition
ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.
