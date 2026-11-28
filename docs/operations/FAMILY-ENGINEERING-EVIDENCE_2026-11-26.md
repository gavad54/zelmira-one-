# Family engineering evidence — 2026-11-26

Snapshot: 2026-11-26 13:40 Asia/Tehran (10:10 UTC). Sources: GitHub live API, Railway read-only inventory, Supabase read-only catalog/advisors. This is an evidence snapshot, not a production-readiness declaration.

## GitHub — five reference PRs

| Product | PR state | Base → head branch | Exact head SHA | Files | Exact-head checks |
|---|---|---|---|---:|---|
| VAYRO #47 | MERGED by gavad54, 2026-11-26 08:15:28 UTC; merge commit 20e65253e45cbd43a5e64967745d453a6262e743 | main → upgrade/full-independent-product-family-modules-2026-11-20 | 479f144962ce16c98ce22d44b84bc5005d964652 | 76 | VAYRO CI 45760049320 PASS; CodeQL 45760049533 PASS; lockfile 45760049224 PASS |
| ARIA #3 | OPEN / DRAFT | engineering/aria-functional-redesign-2026-11-19 → engineering/aria-preserve-all-capabilities-2026-11-19 | 392c55d981af5a9ff2eccf01c68ecce256d28459 | 356 | ARIA CI 45592771472 PASS (npm audit included); catalog CI 45592771532 PASS; CodeQL 45592771491 PASS |
| ARIANA #1 | OPEN / DRAFT | main → engineering/ariana-v0.38-standalone-bootstrap | b0b80c8f7bf595961c4a7aaeb51216c5d1ab6852 | 12 | CI 45592776772 PASS (pip-audit included); CodeQL 45592776764 PASS |
| LEADORA #54 | OPEN / DRAFT | main → fix/disable-participation-contracts-2026-11-20 | a45c750ecda9579ef0a31c4fb50e95bafd31c0e8 | 13 | CI 45621207271 PASS; regression/security 45621207228 PASS; Android test APK 45621207111 PASS; CodeQL 45621207311 PASS |
| ARMIN MARKET #2 | OPEN / DRAFT | main → architecture/market-intelligence-integration-2026-11-19 | 4101cffa36a26b42625928c9f7c99318f76f1d0a | 12 | CodeQL 45592931330 PASS. Android workflow 45592931348 overall FAIL because Dependency Review cannot run while GitHub Dependency Graph is disabled; the separate APK build job and domain tests PASS. |

Current VAYRO main head: 527db3a8051c3eef15c974c43ded4b6e755a75b3. Exact-main VAYRO CI 45785290596 and CodeQL 45785290581 both PASS. Main also contains the 2026-11-26 archive UI/export and DANA conversation persistence commits. PR #47 was merged by the owner account; this audit did not merge it.

## VAYRO-CORE — read-only

Project wdqhdnhpgxhmmfeyxwxr is ACTIVE_HEALTHY on PostgreSQL 17.11.
- Repository Prisma migration directories: 16. Live Supabase migration history: 0.
- Current Prisma schema: 27 models. Live public catalog: 11 tables; 16 application-domain model tables are absent.
- All 11 public tables have RLS enabled, but there are 0 public policies and 0 dedicated vayro_* roles. No explicit table grants were returned for anon, authenticated or service_role.
- All 11 inspected public tables report zero rows.
- Security Advisor: 11 RLS-enabled/no-policy findings. Performance Advisor: 10 unused-index findings. Health Advisor: 0 findings. No development branches listed.

No live DDL, migration, role grant or policy change was performed. Reconciliation remains blocked pending independent encrypted off-host backup, isolated restore, and reviewed schema mapping.

## Railway — read-only

Only two projects are visible: ARIA Web and LEADORA. No independent VAYRO project exists.
- ARIA Web / VAYRO: OFFLINE; last deployment pointer FAILED. Its recorded /api/health healthcheck returned HTTP 503. No VAYRO volume or service variables were listed.
- LEADORA project / VAYRO: OFFLINE; no domain or volume. An older failed build stopped because AUTH_DATABASE_URL was required during Next.js page-data collection.
- LEADORA app: OFFLINE; no current successful deployment. Its separate 500 MB leadora-data volume is mounted at /data.
- ARIA Web has a staged, not-live service creation from branch brand/vayro-name-only, pinned to 6602c54eea9312589129b79304c38e25c9d338c4 (three staged changes). It was not accepted or deployed.
- No Railway webhooks were listed. Monitor inventory is UNVERIFIED because Railway Automations access is not enabled.
- Last-24-hour HTTP telemetry returned zero requests for all three services. CPU/memory samples were zero; this does not establish health. External HTTP probing was UNVERIFIED because the audit environment could not resolve the Railway hostnames.

No staged patch was committed. Do not repurpose either existing VAYRO-named service as independent hosting.

## Durable execution, backup and product boundaries

Task queue, worker/scheduler source, lease/heartbeat, retry/idempotency/dead-letter states and isolated PostgreSQL tests exist in VAYRO source. No dedicated Railway worker/scheduler service, verified runtime credentials, live migration or deployed process-level restart drill was evidenced. This is not a permanent independent runtime.

Encrypted S3-compatible backup and isolated-restore workflows exist in source. No successful encrypted off-host backup artifact with checksum/metadata and no successful isolated restore with invariant PASS were evidenced in this inspection.

VAYRO is the mother platform; DANA is internal, not a separate product. ARIA remains without accounting/ERP; ARIANA owns accounting/ERP/tax; LEADORA owns distribution operations; ARMIN MARKET remains separate. ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA and PAYAM remain planned/prototype entries without independent repository/runtime and end-to-end acceptance evidence.

## Owner-gated items

- ARMIN MARKET: enable GitHub Dependency Graph in repository security settings, then rerun Dependency Review. This audit did not change repository settings.
- VAYRO: dedicated hosting, protected runtime credentials, backup-provider/bucket setup, and any paid infrastructure require owner-controlled setup/approval.
- Production DB: independent backup/restore and reviewed schema reconciliation must precede any live migration or policy/role work.
- Mobile/commercial: official signing, real-device UAT, production email, payment/legal provider setup and owner release approval remain open.

Release classification: source engineering checks pass on the stated exact SHAs; production hosting, live DB baseline/RLS, independent backup/restore, permanent worker/scheduler runtime, product E2E, mobile UAT and commercial release remain BLOCKED.

No merge, deployment, DNS change, live database write/DDL, role grant, RLS policy change, secret read/change, paid resource, or release action was performed in this audit.
