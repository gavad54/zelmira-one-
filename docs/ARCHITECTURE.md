# VAYRO architecture — current evidence and approved boundaries
Snapshot: 2026-11-10 11:18 +03:30.
Current product-directory implementation commit: 06f3e3528f12e1a76b801430788fa433ebeffef2 (not yet CI-verified).

## Product identity
VAYRO is the mother application. Exactly seven approved family modules:
- ARVAND — international trade
- CHARSU — marketplace
- GANJINEH — digital store
- NEGAH — creative studio
- SEPEHR — cloud infrastructure
- NAMA — page builder
- PAYAM — marketing

DANA is preserved as a VAYRO platform-level AI capability, not counted as an eighth family product. Its existing routes and AI capability registry are retained. This is a classification correction, not capability deletion.

Independent products:
- ARIA: social, services and marketplace; no accounting or ERP.
- ARIANA: accounting and ERP.
- LEADORA: distribution and sales operations; audit independently before integration, merge, removal or change.
- ARMIN MARKET: buyer requests and supplier quotations.

Do not remove existing capabilities without audit and explicit approval. Keep product data stores independent and integrate only through reviewed, versioned APIs. UI target: Persian RTL + English, mobile-first and responsive.

## Technical foundation
- Web: Next.js App Router, React, TypeScript; Prisma ORM; PostgreSQL 17.
- VAYRO-CORE: separate Supabase PostgreSQL project in eu-central-1 (Free plan).
- Repository includes password hashing, server-side sessions, login/registration/logout, email verification/recovery primitives, MFA routes/services, rate limiting, audit events, tenant membership authorization helpers, health/readiness routes and related Prisma models.
- Code presence and disposable CI tests do not certify production deployment, production MFA, email delivery, billing, live tenant isolation or operational readiness.
- The home product directory now separates seven family modules, DANA platform capabilities and independent products. The associated test was updated but awaits fresh exact-head CI.

## Live database evidence (last inspected 2026-11-10)
- 11 public tables; RLS enabled on all 11; zero RLS policies; zero FORCE RLS tables.
- Migration history empty.
- Schema drift: live DB missing UserMfa, MfaRecoveryCode, AuthChallenge and AiGeneration models; Session missing revokedAt, lastSeenAt, assurance and mfaAuthenticatedAt.
- Dedicated vayro_app, vayro_auth, vayro_platform and vayro_platform_bootstrap roles were absent in last verified inspection.
- Security Advisor reported 11 RLS-enabled/no-policy findings.
- Do not mutate production schema, roles, grants or policies until encrypted backup, independent restore, object-by-object reconciliation and recovery rehearsal are complete.

## Hosting and release evidence
- Railway service VAYRO: https://vayro-production.up.railway.app, in legacy project ARIA Web, not dedicated VAYRO project.
- Last verified successful deployment ran base commit f3abc61523cb7abbd0b0ab4559a34f40a068ddb5, not PR #12. /api/health is liveness only. A previous /api/ready probe returned 503; exact internal cause not established.
- Dedicated Railway project creation was blocked by observed free-plan resource limit; no paid upgrade authorized.
- PR #12 contains backup/restore workflow scaffolding. No B2 bucket/keys, protected secrets, actual encrypted backup object, separate restore host or successful restore exists.

## Security trust boundaries
1. Server-side authorization on every protected operation.
2. Tenant identity derived from authenticated session and verified membership, not browser-supplied tenant ID alone.
3. Owner/platform roles verified server-side and owner actions audited.
4. Versioned APIs, narrow scopes, timeouts, idempotency and auditable service identities.
5. Secrets only in protected runtime/CI stores; never in source or chat.
6. Unknown authorization/entitlement fails closed.
7. Database access is server-only; no browser table privileges.

## Current disposition
ENGINEERING IN PROGRESS — DEPLOYMENT BLOCKED — NOT RELEASED.
