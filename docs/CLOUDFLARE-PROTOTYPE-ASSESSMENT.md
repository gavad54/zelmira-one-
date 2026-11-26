# Cloudflare Hosting Prototype Assessment

**Date:** 2026-11-26  
**Scope:** isolated hosting feasibility assessment only. This branch does not deploy, change production, migrate data, create a database, create an R2 bucket, or change billing.

## Executive decision

Cloudflare is a plausible candidate for a **separate VAYRO web preview**, but it is not yet an evidenced replacement for the full VAYRO platform. Keep Railway/Supabase and all existing production boundaries unchanged.

The first compatibility route to test is **OpenNext for the current Next.js 15.5.6 application**. Do not migrate this repository to vinext yet: the currently published vinext 1.4.6 project guidance says it targets Next.js 16.x, while this repository pins Next.js 15.5.6. Cloudflare's current automatic-configuration guide also maps Next.js 15 and earlier to OpenNext, and Next.js 16+ to vinext.

## Live account inspection (read-only)

- A connected Cloudflare account was found and authenticated.
- Account ID is intentionally not repeated in this document.
- Workers account settings report `default_usage_model: standard` and `green_compute: false`.
- No DNS zones are visible in this account.
- No Worker scripts are currently listed.
- No Worker custom domains are attached.
- The account has no `workers.dev` subdomain yet. The read-only API returned Cloudflare error 10007 and directs the account owner to open **Workers & Pages** in the dashboard; the first visit creates the subdomain.
- No Cloudflare resource was created or modified during this inspection.

## Repository compatibility findings

- Current application stack: Next.js 15.5.6, React 19.1.1, Prisma 6.19, PostgreSQL, Node.js >=22.
- The current deployment contract is a Node.js standalone Docker image.
- Two separate long-running Node processes exist:
  - `npm run worker:tasks`: continuous task polling, leases, heartbeats, abort signals and task execution.
  - `npm run worker:schedules`: continuous schedule polling and reconciliation.
- Those daemon processes cannot simply be copied into a request-driven Workers deployment. They require a separately designed and tested event-driven replacement (for example, scheduled triggers plus Queues/Workflows) or a separate compatible worker host.
- Prisma/PostgreSQL connectivity must be tested with the actual Prisma version and database role design. Hyperdrive is a candidate connection layer, not yet configured or proven.
- The production database must remain on its current provider until a migration plan, independent encrypted backup, and isolated restore drill are verified.

## Cost and runtime guardrails

Cloudflare's published Workers Free limits currently include 100,000 requests/day, 10 ms CPU time per invocation, 128 MB memory, and 50 external subrequests per invocation. The Workers Paid plan has a $5/month minimum. R2 has a free allowance but becomes usage-billed beyond included limits. These limits and pricing must be rechecked before any resource creation or public use.

No paid plan, paid resource, top-up, R2 bucket, database, or domain may be enabled without separate explicit approval.

## Recommended isolated test sequence

1. The account owner opens the Cloudflare dashboard's **Workers & Pages** section and selects/creates a `workers.dev` subdomain for preview use. No custom domain is required for the first test.
2. Add an isolated Cloudflare build/test path for the existing Next.js 15 application using OpenNext; keep the existing Next.js build and Docker deployment untouched.
3. Run compatibility/build tests without production secrets or production database access.
4. If the build succeeds, deploy only a minimal preview with synthetic data and no production bindings.
5. Validate health route, Persian RTL rendering, static assets, cookies/session behavior, security headers, route handlers, and cold-start/runtime behavior.
6. Separately prototype Prisma/PostgreSQL connectivity against a disposable database only. Do not point it at VAYRO-CORE.
7. Design and test task/scheduler migration independently; do not declare the platform portable until this is proven.

## Stop conditions

Stop the Cloudflare migration if the current Next.js/OpenNext build has unresolved incompatibilities, if the Workers Free CPU/request limits are insufficient, if required runtime APIs are unsupported, or if a paid plan/resource is required. Do not weaken authentication, tenant isolation, RLS, backup, or release gates to make a preview deploy.

## Evidence and references

- Cloudflare Next.js guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- Cloudflare OpenNext guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/
- Cloudflare automatic framework configuration: https://developers.cloudflare.com/workers/framework-guides/automatic-configuration/
- Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- vinext repository compatibility and version guidance: https://github.com/cloudflare/vinext
- Prisma on Workers: https://www.prisma.io/docs/guides/deployment/cloudflare-workers

## Current status

**Assessment prepared; deployment not yet enabled.** The next owner-side prerequisite is creating the account's `workers.dev` subdomain in the dashboard. After that, an isolated build and preview can be attempted without changing VAYRO production.
