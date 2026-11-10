# VAYRO architecture — current evidence and boundaries
Snapshot 2026-11-10T10:29:44Z. Candidate de1c51712b6dec2c5a66bee5babd3743a9835103; exact-head CI and CodeQL pass.
## Product identity
VAYRO is the mother application. Seven approved family modules: ARVAND (international trade), CHARSU (marketplace), GANJINEH (digital store), NEGAH (creative studio), SEPEHR (cloud infrastructure), NAMA (page builder), PAYAM (marketing).
DANA is a VAYRO platform-level AI capability, not an eighth family product or independent catalogue row. Preserve its existing routes and AI capability registry; classification correction is not capability deletion.
Independent products: ARIA (social/services/marketplace, no accounting/ERP); ARIANA (accounting/ERP); LEADORA (distribution/sales operations; audit independently before change); ARMIN MARKET (buyer requests/supplier quotations).
Keep product data stores independent; integrate only through reviewed, versioned APIs. UI target Persian RTL + English, mobile-first and responsive.
## Technical foundation
Next.js App Router, React, TypeScript, Prisma, PostgreSQL 17. VAYRO-CORE is separate Supabase PostgreSQL project in eu-central-1 (Free plan). Repository includes auth/session, MFA, rate-limit, audit, tenant authorization and readiness code; source/CI does not certify production behavior.
Exact candidate CI 42779828156 passed 45 steps including disposable PostgreSQL role/RLS, build, Docker and HTTP integration. CodeQL 42779828204 passed.
## Live database (2026-11-10)
11 public tables; RLS enabled on all; zero policies; zero FORCE RLS; all owned by postgres. Migration history empty. Live DB missing UserMfa, MfaRecoveryCode, AuthChallenge, AiGeneration and Session fields revokedAt, lastSeenAt, assurance, mfaAuthenticatedAt. No dedicated vayro_* runtime roles found. Security Advisor: 11 RLS-enabled/no-policy findings. Do not mutate schema/roles/grants/policies before encrypted backup, independent restore, schema reconciliation and rollback rehearsal.
## Hosting/release
Railway VAYRO service at https://vayro-production.up.railway.app is inside legacy ARIA Web project, not dedicated VAYRO. Latest successful deployment runs main SHA f3abc61523cb7abbd0b0ab4559a34f40a068ddb5, not PR #12. Five failed deployments in last 24h. HTTP logs show 200 for main routes and 404 for mark/favicon. Runtime “Ready” is not readiness.
No B2 bucket/keys, protected backup secrets, encrypted object, separate restore host or successful restore evidenced. Dedicated Railway project previously blocked by Free-plan resource limit; no paid upgrade authorized.
## Trust boundaries
Server-side authorization; tenant from authenticated session/membership; server-verified platform roles and audit; versioned APIs with narrow scopes/idempotency; secrets only in protected stores; fail closed on unknown authorization; database access server-only.
Disposition: ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.
