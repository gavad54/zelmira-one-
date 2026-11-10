# VAYRO security status report
Snapshot: 2026-11-10; scope: repository evidence and previously inspected live VAYRO-CORE/Railway state.

## Verified
- Exact PR #12 head 7d0edb71522c281b546011ae110f4501c6903c43: CodeQL success (run 42776421968).
- Exact-head CI success (run 42776421939), including isolated PostgreSQL migration, auth/platform runtime role isolation, tenant RLS isolation tests, dependency audit, lint, typecheck, production build and Docker build.
- Repository includes authentication/session/MFA-related primitives and security-oriented routes/models; presence is not proof of production enforcement.

## Critical production findings
- Live Supabase VAYRO-CORE: 11 public tables, all RLS enabled, zero policies, zero FORCE RLS; Security Advisor reported 11 RLS-enabled/no-policy findings.
- Live migration history empty; live schema differs from Prisma models, including missing UserMfa, MfaRecoveryCode, AuthChallenge and AiGeneration models and missing Session fields revokedAt, lastSeenAt, assurance and mfaAuthenticatedAt.
- Required dedicated runtime roles vayro_app, vayro_auth, vayro_platform and vayro_platform_bootstrap were absent in the last verified inspection.
- No independently verified encrypted backup or restore exists.
- Production readiness failure previously returned HTTP 503; exact internal cause remains unproven. Current /api/health is liveness only.

## Risk disposition
- P0: production RLS policy absence and schema drift; backup/restore absent; production tenant isolation unverified.
- P0: MFA/session production schema and enforcement not proven.
- P1: complete endpoint authorization matrix, CSP/headers/CORS/rate-limit and production email recovery evidence incomplete.
- CI results are isolated test evidence only; they must not be represented as production certification.

## Required containment
- Keep customer onboarding, production data collection and real payments disabled until release gates pass.
- Do not mutate live DB before verified backup/restore and schema/recovery rehearsal.
- Do not expose secrets in source, logs, issues or chat.
- No public release or security-gate bypass.
