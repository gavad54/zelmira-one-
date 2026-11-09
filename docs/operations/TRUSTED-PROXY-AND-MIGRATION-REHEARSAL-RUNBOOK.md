# VAYRO Trusted Proxy and Production Migration Rehearsal Runbook

**Status:** PREPARATION ONLY — NOT CONFIGURED — NOT EXECUTED  
**Branch:** `security/mfa-session-endpoint-gates`  
**Production posture:** READ-ONLY; deployment remains blocked.

This runbook closes the source-audit handoff for two outstanding engineering gates: trusted client-IP handling for authentication throttles, and a safe migration rehearsal against an independently restored database clone. It does not authorize production changes.

## 1. Trusted proxy and authentication rate limits

### Current source behavior

- Identity-keyed persistent throttles are applied to login attempts.
- IP-keyed throttles use `TRUSTED_PROXY_HOPS` and `X-Forwarded-For`.
- `TRUSTED_PROXY_HOPS` must be a canonical positive decimal integer from 1 through 32; unset, malformed, zero, leading-zero, overflow or out-of-range values are rejected.
- The parser validates every comma-separated `X-Forwarded-For` element as an IP address, rejects empty/malformed elements, requires at least `trustedProxyHops + 1` entries and caps the chain at 64 entries.
- `allowIpAttempt()` now fails closed when the fingerprint is `null`: the IP throttle returns `false`, and the calling endpoint denies the operation with its rate-limit response. Identity-keyed limits remain a separate additional control; they do not replace the IP gate.
- The source must not guess a hop count. A wrong value can select an attacker-controlled address or a proxy address shared by many users.

### Required host evidence before configuration

The hosting operator must record:

1. Hosting provider and the exact public ingress path.
2. Every reverse proxy/load balancer between the client and the application.
3. Which trusted proxy appends or overwrites `X-Forwarded-For`, and whether it strips client-supplied values.
4. A captured, redacted request showing the actual header chain at the application boundary.
5. The exact number of trusted rightmost proxy hops that append to the chain.
6. Confirmation that the application cannot be reached through an alternate path that bypasses the trusted ingress.

Do not copy a hop count from a hosting tutorial or infer it from a diagram. Do not trust `X-Real-IP`, `Forwarded`, or `X-Forwarded-For` until the host's behavior is verified.

### Configuration and acceptance

- Set `TRUSTED_PROXY_HOPS` only in the protected runtime environment after the evidence above is approved.
- Keep it unset while the proxy chain is unknown. In that state, endpoints that require IP throttling intentionally deny the protected operation; do not treat the resulting 429 response as a healthy production configuration. Authentication must not be exposed until the actual ingress chain is verified and the setting is configured in the protected runtime environment.
- Exercise the application through the real ingress with a known test client address and at least one known proxy address.
- Verify the parsed client address is the first untrusted hop from the right, not the rightmost proxy and not an arbitrary leftmost header value.
- Verify malformed entries anywhere in the chain, empty entries, ports, too-short chains, chains longer than 64 entries, and invalid hop-count settings do not produce a fingerprint.
- Verify valid IPv4 and IPv6 chains, and hop counts 1 and 32, are parsed deterministically.
- Verify repeated login attempts from one client address increment the IP limiter, while a second client address receives an independent key.
- Verify the email/account limiter remains active independently of IP parsing.
- Verify the public app is not reachable through an untrusted direct origin path.
- Record redacted request evidence, effective environment variable presence (never its secret values), test results and the exact deployed commit.

**Release gate:** IP throttling is NOT VERIFIED until the production-like ingress test passes. Do not set an arbitrary hop count to make the gate appear green.

## 2. Independent backup and restore prerequisite

No migration rehearsal against the live VAYRO-CORE project is permitted.

Before any schema experiment:

1. Obtain a database-native logical export or provider-supported backup through an authorized owner-controlled path.
2. Store it encrypted outside the source provider/account boundary.
3. Calculate and record a SHA-256 checksum; record export time, source project identifier, PostgreSQL version and export method.
4. Restore the export into a separate isolated project/environment with no production application traffic.
5. Verify the restored database is queryable and compare table, column, index, constraint, extension, role, grant, RLS and policy inventories.
6. Record restore duration and the achieved recovery point; do not claim RPO/RTO targets without measured values.
7. Preserve the backup and restore logs under restricted access. Never place credentials, tokens, raw customer data or private backup URLs in Git.

The connected Supabase actions used during the 2026-11-09 audit did not expose an export/download operation. Consequently, no backup artifact or restore proof is currently available.

## 3. Schema and migration reconciliation on the restored clone

The live project previously showed 11 public tables, zero RLS policies, zero FORCE RLS tables, no recorded Supabase migration history, and no `vayro_*` roles. These observations are a warning, not proof that the database is disposable or that the Prisma migration chain can be applied directly.

On the isolated restored clone only:

1. Capture the complete live catalog before changes.
2. Compare every table/column/type/default/nullability, primary/foreign key, unique/check constraint, index, enum, extension, trigger, function, grant, role attribute, RLS flag and policy with the repository's full Prisma migration chain.
3. Resolve each difference explicitly. Do not use `prisma migrate resolve` or mark migrations applied until the baseline is reviewed against the actual catalog.
4. Rehearse the proposed baseline procedure on a disposable copy of the restored clone.
5. Apply the complete forward migration sequence to a fresh clone using only the dedicated migration identity.
6. Provision disposable LOGIN roles for auth, platform and tenant data planes with least privilege; verify each effective role is non-superuser, NOBYPASSRLS, does not own protected tables, and has no elevated/extra memberships.
7. Run positive and negative authorization tests under each actual runtime role, including cross-tenant reads/writes, missing context, forged actor/tenant context, MFA table isolation, platform allowlist boundaries and public email-verification capability boundaries.
8. Confirm the ordinary runtime roles cannot perform DDL and cannot bypass RLS.
9. Test application startup and representative HTTP workflows against the clone with the distinct runtime URLs.
10. Test recovery by restoring the original pre-migration backup again; record whether the recovery procedure is repeatable.

Required evidence: catalog diff, reviewed migration plan, migration logs, role/grant report, test logs, application smoke-test report, restore checksum and measured timings, reviewer sign-off, and exact source commit.

## 4. Production change authorization

Production remains read-only until all of the following exist:

- independently stored encrypted backup;
- successful isolated restore with checksum;
- approved live-catalog-to-migration reconciliation;
- successful forward migration and recovery rehearsal on the restored clone;
- verified production role design and exact runtime connection identities;
- reviewed migration SQL and rollback/recovery plan;
- explicit approval for the exact production migration and change window.

A general request to complete VAYRO is not a substitute for approval of a specific irreversible production database change.

## 5. Current gate disposition

| Gate | Disposition |
|---|---|
| Identity-keyed login throttling in source | Implemented; exact-head CI/security verification required |
| Missing/untrusted IP fingerprint behavior | FAIL-CLOSED in source; dedicated unit tests added; exact-head CI pending |
| Trusted proxy chain | NOT CONFIGURED / NOT VERIFIED |
| IP-based throttling through production ingress | NOT VERIFIED; production-like ingress test still required |
| Independent encrypted backup | NOT AVAILABLE |
| Isolated restore | NOT PERFORMED |
| Live schema reconciliation | NOT PERFORMED on a restored clone |
| Forward/recovery migration rehearsal | NOT PERFORMED |
| Production DDL, roles, grants and RLS policies | NOT AUTHORIZED / NOT EXECUTED |

**Decision: ENGINEERING IN PROGRESS — PRODUCTION READ-ONLY — DEPLOYMENT BLOCKED — NOT RELEASED.**
