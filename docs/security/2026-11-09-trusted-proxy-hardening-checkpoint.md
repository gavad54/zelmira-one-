# VAYRO trusted-proxy hardening checkpoint — 2026-11-09

**Branch:** `security/mfa-session-endpoint-gates`  
**Latest source commit:** `2b74dc28e277a6df9bc655c40cd3c6b42ff1ec83`  
**Disposition:** SOURCE HARDENING COMMITTED — TESTS ADDED, NOT EXECUTED HERE — PRODUCTION INGRESS NOT VERIFIED

## Changes committed

- Added `parseTrustedProxyHops()`: accepts only canonical positive decimal values from 1 through 32. It rejects missing values, zero, leading zeros, signs, decimals, exponent notation, overflow and values above 32.
- Hardened `getTrustedClientAddress()`: validates every comma-separated `X-Forwarded-For` entry as an IP address; rejects empty or malformed entries, chains shorter than `trustedProxyHops + 1`, hop counts outside 1–32, and chains longer than 64 entries.
- Updated `requestFingerprint()` to use the bounded parser. Invalid configuration or header chain returns no fingerprint.
- Retained the fail-closed IP throttle gate: no fingerprint means the persistent IP limiter is not called and the protected operation is denied.
- Added unit coverage for canonical hop configuration, IPv4/IPv6 selection, multi-hop selection, malformed entries anywhere in the chain, empty values, address-with-port values, invalid hop counts, insufficient chain length and oversized chains.
- Updated the trusted-proxy runbook with the parser acceptance rules and real-ingress evidence requirements.

## Verification status

- GitHub source read-back confirmed the parser, auth-service integration, type declaration, tests and runbook are present on the branch.
- The previous malformed-chain test accidentally classified a valid one-client/one-proxy chain as invalid; that incorrect case was removed in a follow-up commit.
- The repository test suite, lint, typecheck, build and integration tests were **not executed in this session** because no repository runtime/checkout was available.
- Latest exact commit combined status shows only the external Railway context `ARIA Web - VAYRO` as pending. The connected workflow-runs interface returns no workflow runs for this SHA and is limited to PR-triggered runs; exact-head CI and CodeQL therefore remain **unverified**, not passed.
- No real hosting ingress/header evidence was available. `TRUSTED_PROXY_HOPS` remains unconfigured; do not guess its production value.
- No production environment variable, database schema/data/role/grant/RLS policy, backup, restore, hosting, deployment, merge or release was changed.

## Remaining acceptance gates

1. Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and the integration suite in CI on this exact commit; inspect all job logs.
2. Obtain the real hosting proxy topology and a redacted request captured at the application boundary.
3. Configure the exact trusted hop count only after the host confirms its behavior and direct-origin bypass is ruled out.
4. Test rate-limit key separation and repeated attempts through the real ingress.
5. Complete independent encrypted backup and isolated PostgreSQL 17 restore before any production DB migration, role, grant or RLS change.

**Decision: PR remains Draft/open/unmerged. Production remains read-only. VAYRO is not released.**
