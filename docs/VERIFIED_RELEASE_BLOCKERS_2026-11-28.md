# VAYRO Verified Release Blockers — 2026-11-28

## Scope and evidence boundary

This is a read-only operational audit of the VAYRO repository, its three open engineering pull requests, the connected VAYRO-CORE Supabase project, and the currently connected Railway workspace. It records evidence observed on 2026-11-28. It does not authorize or perform production changes, migrations, deployment, release, or credential rotation.

Repository default branch `main` was observed at:

`527db3a8051c3eef15c974c43ded4b6e755a75b3`

## Pull request state

| PR | State | Latest head | CI | CodeQL | Independent review |
|---|---|---|---|---|---|
| #63 encrypted backup read-back | Open, draft, unmerged | `a45da05755e08c7cf0817b3159b68a9a4ace88fa` | Run `46057504909`: success | Run `46057504849`: success | None recorded |
| #64 task result JSON validation | Open, draft, unmerged | `656d0f0fed77f089bf8aa8d361f70bb4d667fabb` | Run `46108675925`: success | Run `46108675937`: success | None recorded |
| #65 VAYRO five-sub-app architecture | Open, ready for review, unmerged | `d330354613b7b9f9761b675a182216df80d88a6a` | Run `46109996553`: success | Run `46109996508`: success | None recorded |

PR #65's exact-head evidence includes 176 passing unit tests and 30 passing PostgreSQL/HTTP integration tests. PR #64 records 179 passing unit tests and 30 passing integration tests. These results establish CI status for the tested commits; they do not establish production readiness.

## Supabase VAYRO-CORE

Project: `wdqhdnhpgxhmmfeyxwxr`, PostgreSQL 17.11, status `ACTIVE_HEALTHY`.

Read-only inspection observed:

- 11 public application tables.
- RLS enabled on all 11 tables.
- FORCE ROW LEVEL SECURITY disabled on all 11 tables.
- Zero policies across the 11 tables.
- Zero direct table grants to `anon`, `authenticated`, `service_role`, or `PUBLIC` in `information_schema.role_table_grants`.
- `service_role` has the PostgreSQL `BYPASSRLS` attribute; it must not be used as an ordinary application runtime role.
- No application roles with the `vayro_` prefix were present.
- No `public._prisma_migrations` or `public.schema_migrations` relation was present.
- Supabase migration listing returned no migration entries.
- Security Advisor reported 11 `rls_enabled_no_policy` findings. Health Advisor returned no findings.

The repository contains Prisma migration files and dedicated-role code, but the live project does not yet show the corresponding migration ledger, application roles, or policies. The database schema must be reconciled object-by-object against the full migration chain before any production migration is attempted. Do not apply migrations or create broad policies as a shortcut.


### Exact schema drift against the repository's current Prisma model

A second read-only catalog comparison confirms that the live database is at the initial-schema stage, not at the current repository schema:

- The current Prisma schema declares 27 models. The live database contains only the 11 tables from `20261106055500_init_vayro_core`.
- The following 16 current Prisma models have no corresponding live table: `UserMfa`, `MfaRecoveryCode`, `AuthChallenge`, `AiGeneration`, `EngineeringTask`, `EngineeringTaskAttempt`, `EngineeringTaskDependency`, `GoalRecord`, `GoalEpic`, `GoalFeature`, `RecurringSchedule`, `EngineeringAgent`, `TaskReview`, `Conversation`, `ConversationMessage`, and `ConversationAttachment`.
- The live `Session` table has only the five initial columns (`id`, `tokenHash`, `userId`, `expiresAt`, `createdAt`). The current Prisma model and the later MFA/session migration also require `revokedAt`, `lastSeenAt`, `assurance`, and `mfaAuthenticatedAt`; these four columns are absent.
- The live enum catalog contains only the six enums from the initial migration. Later schema enums such as `SessionAssurance`, `AuthChallengePurpose`, and `EngineeringTaskStatus` are absent.
- The live 11-table set and the six-enum set align with the initial migration file, while later repository migrations are not represented in the live migration ledger or catalog.

This is not a harmless empty migration-history table: it is a material schema-version gap. Do not mark existing migrations as applied, run `prisma migrate resolve`, use `db push`, or apply the entire chain to production until an isolated restore and a full diff have established the exact baseline. First capture a protected backup, restore it to an isolated target, compare the complete catalog and data constraints, and only then design a reviewed forward-only migration sequence. The missing tables include authentication/MFA secrets and tenant-scoped user data; they must not be reconstructed by an unreviewed blanket migration.

## Railway hosting

The connected workspace currently contains two projects: `ARIA Web` and `LEADORA`. There is no independent Railway project named VAYRO.

Two services named `VAYRO` exist inside those other projects, but neither is a functioning independent VAYRO deployment:

- In `ARIA Web`, the VAYRO service is offline. Its latest recorded deployment failed its HTTP healthcheck with repeated 503 responses. The service has no configured variable names. The production environment also has a staged patch containing three changes and a staged-create service; neither was accepted or deployed during this audit.
- In `LEADORA`, the VAYRO-named service is offline. Its latest recorded deployment failed during build because `AUTH_DATABASE_URL` was required in production but absent from that deployment environment. The service has no configured variable names.

The current repository source includes lazy auth-client initialization, which avoids requiring the protected auth connection string merely while Next.js imports route modules during build. That does not remove the runtime requirement for a correctly provisioned, least-privilege auth database role and `AUTH_DATABASE_URL`.

No staged Railway changes were accepted, no service was redeployed, and no paid resource was created.

## Backup and restore

PR #63 adds encrypted backup upload/read-back verification and synthetic tamper tests. CI and CodeQL pass on its latest head.

No evidence of a real encrypted production backup, remote object read-back, isolated PostgreSQL restore, or restore validation was found. The backup workflow requires protected database, age, and Cloudflare R2 configuration. A green synthetic test is not a real backup or restore. The release gate remains blocked.

## Android and release evidence

The repository contains an Android WebView debug-build workflow. Push-triggered builds use an internal compile-only URL and do not upload an installable APK. An installable debug APK requires manual workflow dispatch with the exact deployed VAYRO HTTPS origin. No live, healthy VAYRO origin was verified during this audit.

The inspected Android Gradle configuration does not define a release signing configuration or a verified signed release artifact. No device installation/run evidence or UAT evidence was available.


## Isolated migration rehearsal cost gate

A Supabase development-branch listing returned no existing branches. Creating an isolated branch for a migration rehearsal requires a recurring compute charge. The connected organization quote returned on 2026-11-28 is **USD 0.01344 per hour**. No branch was created and no charge was accepted because the user has not explicitly approved this recurring cost. The isolated rehearsal remains blocked pending cost approval or an available no-cost PostgreSQL environment.

## Release decision

**DEPLOYMENT BLOCKED. Do not publish or represent VAYRO as released.**

The following evidence is still required:

1. Independent review and disposition of PRs #63, #64, and #65.
2. A verified encrypted backup and successful isolated restore, including separate treatment of database roles/grants and non-database assets.
3. A reconciled migration baseline and tested least-privilege runtime roles/RLS policies in an isolated environment before production rollout.
4. A separately provisioned VAYRO hosting project/service with protected runtime configuration, healthy deployment, and a production commit matching the reviewed release commit.
5. Android install/run proof, release signing proof, and owner acceptance/UAT.
6. A final release-gate review with retained evidence for every item above.

## Actions intentionally not performed

No production SQL, DDL, migration, policy, role, grant, secret, DNS, backup, restore, Railway deployment, staged-change acceptance, PR merge, signing, or public release operation was performed during this audit. These operations remain gated on verified backups, correct credentials and runtime roles, independent review, and the required owner-controlled approvals.
