# VAYRO CI security and isolated recovery verification — 2026-11-17

## Scope and exact revision

- Repository: `gavad54/zelmira-one-`
- Branch: `feature/vayro-real-dashboard`
- Tested HEAD: `ab78b75874e9fb1b3146d3d6ffa4451495a1c8a9`
- PR: [#5](https://github.com/gavad54/zelmira-one-/pull/5) — open, Draft, unmerged.
- No production database, grants, RLS policies, secrets, deployment or customer data were changed.

## Workflow evidence

All three workflows were triggered on the exact HEAD above:

- [VAYRO CI run 44169204674](https://github.com/gavad54/zelmira-one-/actions/runs/44169204674) — validation steps completed; final dependency audit failed.
- [VAYRO Dashboard Validation run 44169204905](https://github.com/gavad54/zelmira-one-/actions/runs/44169204905) — success.
- [CodeQL run 44169204717](https://github.com/gavad54/zelmira-one-/actions/runs/44169204717) — success.

A second duplicate CI run [44169191434](https://github.com/gavad54/zelmira-one-/actions/runs/44169191434) on the same SHA reached the same dependency-audit failure. Do not treat duplicate workflow invocations as independent coverage.

## Verified successful CI checks

On run 44169204674, the following steps completed successfully before the final audit gate:

1. Locked dependency installation.
2. Unit tests.
3. Prisma client generation and schema validation.
4. Creation of isolated client-role fixtures for privilege assertions.
5. Application of the repository's complete six-migration history to disposable PostgreSQL 17.
6. SQL contract assertions: expected 14 tables, RLS enabled, no unexpected table privileges for the tested client/service roles, required session MFA/revocation/idle columns, MFA pending-factor constraint, and six completed migrations.
7. Repeat migration deployment (idempotency).
8. Baseline rehearsal against a pre-existing disposable schema, followed by remaining migrations and contract assertions.
9. PostgreSQL logical backup/restore smoke test.
10. Lint, TypeScript typecheck, production build and PostgreSQL/production-HTTP integration tests.

### What the backup/restore test actually proved

The workflow inserted a marker row into the isolated `AuthRateLimit` table, created a custom-format logical dump with `pg_dump`, created a separate disposable restore database, restored using `pg_restore --exit-on-error`, and compared both the marker-row count and completed migration-history count between source and restored databases. Both comparisons passed. The restore database was then dropped and the temporary dump removed.

This is genuine CI evidence of a successful logical backup/restore round trip in an ephemeral test environment. It is **not** evidence of:
- encrypted backups;
- off-site or cross-provider storage;
- independent production credentials or access controls;
- backup retention or immutable copies;
- point-in-time recovery/WAL continuity;
- a restore of the live VAYRO-CORE database;
- measured production RPO/RTO.

## Security gate failure — dependency audit

The strict command `npm audit --audit-level=moderate` failed with **13 high-severity vulnerabilities**. The log identifies vulnerable transitive dependency paths involving `picomatch`, `fdir`, `tinyglobby`, `micromatch`, `fast-glob`, `@next/eslint-plugin-next`, `eslint-config-next`, and TypeScript ESLint packages.

The key advisory is [GHSA-fc5q-39xc-vjpf / CVE-2026-112366](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), a high-severity ReDoS issue affecting picomatch versions through 4.0.7. The advisory currently lists affected/fixed versions as unknown and does not provide a verified patched npm release. The lockfile contains picomatch 2.3.2 and 4.0.7 entries, both marked development dependencies.

Upstream remediation proposals were inspected:
- [picomatch PR #238](https://github.com/micromatch/picomatch/pull/238) proposes a 4.x fix but remains open/unmerged.
- [picomatch PR #246](https://github.com/micromatch/picomatch/pull/246) proposes a separate 2.x fix but remains open/unmerged.
- [picomatch issue #247](https://github.com/micromatch/picomatch/issues/247) requests upstream release guidance and remains open.

These open pull requests are not released, verified package versions. No unmerged branch, arbitrary Git dependency, guessed override, or forced major-version upgrade was introduced. The audit threshold was not weakened or suppressed. The security gate therefore remains **BLOCKED** until a verified upstream release or an independently reviewed and tested mitigation is available.

## Decision

- Isolated migration, baseline rehearsal, idempotency and logical backup/restore: **PASS on the exact tested commit**.
- Dashboard Validation and CodeQL: **PASS on the exact tested commit**.
- Strict dependency security audit: **FAIL — 13 high vulnerabilities**.
- Production backup/restore: **NOT TESTED**.
- Production schema baseline/migration: **NOT APPLIED**.
- Release: **BLOCKED — NOT RELEASED**.

Next actions: wait for a published, verified picomatch remediation (or complete an independently reviewed mitigation), update the lockfile through a controlled dependency change, rerun the complete CI suite, and separately design a protected encrypted off-site backup plus an owner-authorized production restore rehearsal. No production action is implied by this report.
