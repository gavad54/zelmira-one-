# VAYRO engineering checkpoint — 2026-11-09

## Scope and evidence boundary

This checkpoint records a read-only review of PR #6 and its exact source head. It does not authorize or perform production database, hosting, DNS, secret, deployment, merge, signing, or release operations.

- Repository: `gavad54/zelmira-one-`
- PR: [#6 — Security: MFA, session lifecycle and endpoint authorization gates](https://github.com/gavad54/zelmira-one-/pull/6)
- Branch: `security/mfa-session-endpoint-gates`
- Inspected source head: `9f2c4d351dabf6716f90e21fd1678f3cf0e6995a`
- PR state at inspection: open, Draft, unmerged.
- Base: `brand/vayro-name-only` at `19f4834f601e793df7b33917f5e141155de2ba87`.

## Exact-head CI evidence

For source head `9f2c4d351dabf6716f90e21fd1678f3cf0e6995a`:

- [VAYRO CI run 760](https://github.com/gavad54/zelmira-one-/actions/runs/42513966491): completed, conclusion `success`.
- [CodeQL run 723](https://github.com/gavad54/zelmira-one-/actions/runs/42513966486): completed, conclusion `success`.
- CI job steps independently inspected: locked dependency installation, enforced dependency audit, unit tests, Prisma generation and validation, least-privilege role preparation in isolated PostgreSQL, real migration-history application in isolated PostgreSQL, tenant RLS proof under a non-owner role, lint, typecheck, production build, and PostgreSQL/production-HTTP integration tests all concluded `success`.
- CodeQL analysis job concluded `success`. This does not prove zero open CodeQL alert records.
- This checkpoint does not state test counts or dependency-audit findings because the exact run logs were not inspected for those values.

## Source finding reconciliation

The older review item `AUTH-ENUM-01` in the security review is stale if read without its later status refresh. At the inspected head:

- `src/app/api/auth/login/route.ts` always calls `verifyPassword` once, using `DUMMY_PASSWORD_HASH` when the email has no matching user.
- Session issuance remains gated on a real user record, valid password, enabled account, and verified email.
- `tests/auth-core.test.mjs` verifies that the dummy hash uses the approved scrypt parameters and does not match an ordinary password.
- This is source-level remediation plus an automated unit assertion. It is not a measured timing-side-channel assessment or penetration test.

## Current engineering status

### Repository evidence

- MFA/TOTP enrollment, challenge verification, recovery-code lifecycle, replay prevention, privileged MFA assurance, and session lifecycle code are present in this branch.
- Current tenant APIs use a dedicated `TENANT_DATABASE_URL` Prisma client and transaction-local RLS context.
- CI has isolated PostgreSQL proof for the current tenant RLS boundary.
- These are repository and disposable-CI claims only.

### Open blockers

1. **Authentication database boundary:** auth/session/MFA/rate-limit operations still use the default Prisma client. The actual production role behind `DATABASE_URL` is unknown. A least-privilege auth data-plane role and policies are not verified.
2. **Platform control-plane boundary:** owner product/email administration still lacks a separately verified narrow platform DB role/client and transaction-bound platform actor context.
3. **Trusted ingress:** `TRUSTED_PROXY_HOPS` must not be guessed. There is no verified deployed VAYRO proxy topology; IP-only throttling remains unavailable until the real chain is confirmed.
4. **Production database:** live schema/role/migration baseline reconciliation is not complete. No production migration is authorized.
5. **Backup/restore:** independent encrypted backup and isolated restore with checksum and measured RPO/RTO are not evidenced.
6. **Security operations:** current CodeQL workflow success is not proof that historical alert records are closed. Independent security review, production CSP/header verification, and complete negative authorization coverage remain open.
7. **Commercial delivery:** licensing, billing, payment webhook idempotency, invoice/refund/reconciliation, email delivery and legal/privacy review are not production-ready.
8. **Product delivery:** ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM and DANA remain catalogue entries, not verified operational services.
9. **Mobile and release:** no verified Android release artifact/device acceptance, production hosting, owner UAT, production commit parity or release approval is evidenced.

## Release decision

`DEPLOYMENT BLOCKED — NOT RELEASED`.

No merge, production write, migration, secret change, deployment, DNS change, purchase, Android signing, or public release was performed. The PR remains Draft and must not be merged as a release until all applicable gates have current evidence and the owner explicitly authorizes the specific production actions.


## Verification addendum — 2026-11-09 (latest security branch head)

This addendum supersedes the inspected-head and CI-run references above where they conflict.

- Latest inspected PR #6 head: `691c0626ceb0905643c8ac1423b2b132e22ed4ab`.
- PR #6 remains open, Draft and unmerged; base branch is `brand/vayro-name-only` at `19f4834f601e793df7b33917f5e141155de2ba87`.
- Exact-head VAYRO CI [42638412270](https://github.com/gavad54/zelmira-one-/actions/runs/42638412270) completed with conclusion `success`.
- Exact-head CodeQL [42638412263](https://github.com/gavad54/zelmira-one-/actions/runs/42638412263) completed with conclusion `success`.
- Inspected CI steps all concluded success: locked dependency install/audit; unit tests; Prisma client generation and schema validation; isolated PostgreSQL auth, platform and tenant role setup; auth/platform role-boundary proofs; tenant RLS proof under dedicated runtime login; lint; typecheck; production build; production Docker image build; and PostgreSQL/production HTTP integration tests.
- This exact-head CI result closes the previous HTTP integration failure on the preceding commit. It does not prove production database, hosting, trusted proxy, email, backup/restore, Android or commercial readiness.
- A product-by-product repository evidence audit was added at [PRODUCT-PORTFOLIO-AUDIT-2026-11-09.md](./PRODUCT-PORTFOLIO-AUDIT-2026-11-09.md). It records the eleven approved product boundaries, ARIA and LEADORA repository evidence, ARIANA as `SOURCE_NOT_LOCATED`, and the current product-specific acceptance gaps.

## Current security-branch status

The repository-level CI and CodeQL gates are green on the exact PR #6 head. The PR is still Draft because production gates remain open. No merge, production DDL, production role/policy change, backup/restore, secret update, deployment, signing or publication was performed.
