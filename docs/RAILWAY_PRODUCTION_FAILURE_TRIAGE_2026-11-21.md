# Railway Production Failure Triage — 2026-11-21

## Verified findings

All checks below were read-only. No service, deployment, environment variable, domain, database, or staged change was modified.

### VAYRO service under Railway project "ARIA Web"

- Project: `ARIA Web` (`c936dddd-5aa7-46d9-bd04-aa77f2164586`)
- Environment: `production` (`468fda02-2199-4520-8c7e-6b589d3ceb0a`)
- Service: `VAYRO` (`ea06b2d7-b28e-462e-9251-2613af769d8e`)
- Current runtime status: `Offline`
- Latest deployment: `6354aa02-a334-4457-a46d-5f41188845a5`, `FAILED`, created 2026-11-09
- Deployment failure stage: `HEALTHCHECK`; failure error: `Healthcheck failure`
- Deployment context: repository `gavad54/zelmira-one-`, branch `security/mfa-session-endpoint-gates`, commit `93108e0d95ff940e9855f8fdc3ef4f37063b1043`
- Build log shows the Next.js production build aborting during page-data collection because `AUTH_DATABASE_URL` is required in production and was not available to the build process.
- The service's variable-name list was empty at inspection time. This confirms no service-level variable names were exposed by the Railway service configuration read; it does not reveal or prove the state of environment-scoped secrets.
- Service domain: `vayro-production.up.railway.app`; no custom domain was listed.
- Healthcheck path: `/api/health`.

### Duplicate VAYRO service under Railway project "LEADORA"

- Project: `LEADORA` (`806faa38-6cdd-4a6a-bad4-0e94cf6070fa`)
- Environment: `production` (`c3587e3a-9ff5-4749-bd91-2afdda4d5f77`)
- Service: `VAYRO` (`cfe90ccf-580f-48fc-a984-17aa071a4f2a`)
- Current runtime status: `Offline`
- Latest deployment: `f2f67daf-5d15-4dc1-91e2-3596fe521d6d`, `FAILED`, created 2026-11-09
- Source: `gavad54/zelmira-one-`, branch `security/mfa-session-endpoint-gates`, commit `47792d4a891795d60a4b65c11c4a4ffb8cab2f74`
- The service's variable-name list was empty at inspection time and no service domain was listed.

## Safe remediation sequence

1. An authorized owner must add the required `AUTH_DATABASE_URL` to the correct Railway production environment using the protected Variables UI. Do not put the value in Git, logs, chat, workflow summaries, or source code.
2. Before a new deployment, verify only the variable's presence (never its value), and verify the application-specific authentication database endpoint and least-privilege role are the intended ones.
3. Check whether other required runtime variables are absent by comparing the repository's documented variable-name contract with Railway's variable-name inventory. Do not print values.
4. Resolve which Railway project is the authoritative VAYRO production home. Do not delete or move the duplicate VAYRO service under LEADORA until the owner approves a preservation/migration plan.
5. Rebuild and deploy only after the owner authorizes the production change. Verify build, startup, `/api/health`, dependency readiness, replica state, and HTTP behavior after deployment.
6. Keep LEADORA's `leadora-web` service and its `leadora-data` volume isolated from VAYRO throughout remediation.

## Current disposition

- Root cause for the inspected VAYRO build failure: **identified** — missing `AUTH_DATABASE_URL` in the production build environment.
- Configuration correction: **BLOCKED** — requires an authorized owner to set the protected environment variable.
- New deployment and HTTP verification: **NOT RUN** — no production deployment was authorized.
- Railway monitor/alert inventory: **UNVERIFIED** — monitor inspection was unavailable through the connected account.
- This record does not claim production recovery or uptime.


## Follow-up source-code comparison

The failed Railway deployment above was built from commit `93108e0d95ff940e9855f8fdc3ef4f37063b1043` on 2026-11-09. A read-only inspection of the current VAYRO PR #47 head (`cefb30a618e85997b6f4dc49f9fefb6c42b6ec8d`) found that `src/lib/auth-prisma.ts` now creates the Prisma client lazily through a Proxy. The module import/build phase therefore does not instantiate the auth database client; `AUTH_DATABASE_URL` is still required when a protected auth request actually runs, and `assertAuthRuntimeRole()` checks the effective runtime role.

This is an important distinction:
- The historical deployment log proves the old deployment failed during Next.js page-data collection because the old code required `AUTH_DATABASE_URL` at build time.
- The current PR branch contains a build-safe lazy initialization boundary and must not be changed to weaken the production fail-closed check.
- The current Railway service still exposes no service-level variable names. The presence of an environment-scoped `AUTH_DATABASE_URL` was not confirmed.
- The Railway service source configuration and the failed deployment metadata report different branches (`main` vs `security/mfa-session-endpoint-gates`). Resolve this source/deployment provenance discrepancy before relying on any deployment SHA.

Accordingly, the next safe action is to compare the current approved release candidate with the deployed commit, verify the required variable's presence through the protected Railway variable-name inventory, and run a CI/staging deployment check. Do not change the variable value, bypass runtime role validation, or deploy production automatically.
