# PR #5 privileged-session MFA gate — 2026-11-14

## Scope and exact baseline

- Repository: `gavad54/zelmira-one-`
- Pull request: [#5](https://github.com/gavad54/zelmira-one-/pull/5)
- Development branch: `feature/vayro-real-dashboard`
- Base branch: `experiment/cloudflare-free-hosting-audit`
- Source baseline reviewed before this change: `f37f08231de1e561962278a5e82efdd7353c419d`
- This is a development-branch change only. No production database, secret, deployment, merge or public release is authorized or performed.

## Finding

Before this change, the PR #5 login route issued a normal session immediately after password and email checks. The owner-session and tenant authorization helpers did not require MFA assurance. The branch contains TOTP cryptographic and persistence groundwork, but no connected enrollment, confirmation or login-verification routes.

The integrated MFA implementation on `main` is not a safe file-only copy: its `UserMfa/AuthChallenge` models and dedicated authentication database-role boundary differ from PR #5's `MfaCredential/MfaLoginChallenge` schema and default Prisma path.

## Change made

- Added the same session-assurance contract used by the current mainline design: `SessionAssurance` (`PASSWORD` / `MFA`) and `mfaAuthenticatedAt`.
- New sessions default to `PASSWORD`. The server-side `issueSession` helper can mark a session `MFA` only when an internal caller explicitly requests that assurance; no client-supplied assurance is accepted.
- Password login now fails closed for platform `OWNER` / `PLATFORM_ADMIN` and active-tenant `OWNER` / `ADMIN` accounts. It records an audit event and does not create a session or cookie while the MFA flow is absent.
- Existing password-only sessions for privileged accounts are rejected by the session lookup. Platform owner authorization and tenant owner/admin authorization require an MFA-assured session verified within the preceding 12 hours. Missing, stale or future timestamps are rejected.
- The login page explains that privileged login is unavailable until the complete second-factor flow is connected.
- Added HTTP and unit regression coverage. Ordinary non-privileged password login remains available.

## Verification boundary

This change is a **fail-closed access gate**, not a completed MFA implementation. It does not add TOTP enrollment/confirmation/login verification, recovery-code delivery, challenge expiry/attempt handling, factor disablement, production key provisioning or production activation. Test fixtures that use MFA assurance are explicit isolated-test fixtures; they do not prove a real MFA ceremony.

The new migration is intended for the disposable PostgreSQL database created by CI. It must not be run against VAYRO-CORE or any production database without a separate approved migration plan.

## Acceptance still required

1. Reconcile the PR branch's legacy MFA persistence with the current auth database-role boundary.
2. Port the complete enrollment, login challenge, TOTP/recovery verification and session revocation flow as one coherent implementation.
3. Prove challenge expiry, attempt limits, concurrent replay rejection, recovery-code single use, disable/recovery behavior and privileged-role coverage over PostgreSQL + HTTP.
4. Keep PR #5 Draft and deployment blocked until independent review and all release gates pass.
