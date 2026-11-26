# VAYRO isolated Cloudflare edge prototype

## Purpose

This is a deliberately small, independent Worker used to verify the Cloudflare edge runtime before considering any hosting migration for VAYRO.

It exposes only:
- `GET /`: a plain-text prototype marker.
- `GET /health`: a liveness response that explicitly reports that production and database connections are disabled.

All other paths return 404. Non-GET methods return 405.

## Isolation and safety

- No VAYRO production hostname, database, Supabase project, Railway service, or customer data is referenced.
- No secrets, environment variables, R2 buckets, queues, KV namespaces, or paid add-ons are configured.
- The Worker makes no outbound network requests and stores no data.
- Responses include conservative security headers and are not cacheable.
- This prototype is not a production application and must not receive customer traffic.

## Local verification

The repository test suite discovers the test at `tests/cloudflare-edge-prototype.test.mjs`.

Run:

```sh
node --test tests/cloudflare-edge-prototype.test.mjs
npm test
```

## Deployment gate

Deployment is intentionally not performed by this change. The connected Cloudflare account currently has no `workers.dev` subdomain configured; Cloudflare's API reports that the account owner must first open the Workers & Pages landing page in the dashboard to initialize one.

Before any remote test deployment:
1. The account owner or authorized adult administrator must confirm that the account remains on the free plan and that no paid service or billing change is required.
2. The account owner must enable the account's `workers.dev` subdomain in the Cloudflare dashboard.
3. Confirm the exact public test hostname to use.
4. Deploy only this isolated Worker, then test `/` and `/health`.
5. Delete the test Worker after verification unless the owner explicitly asks to retain it.

Do not add production secrets or connect this Worker to VAYRO-CORE.

## VAYRO application compatibility

The current VAYRO application uses Next.js 15, React 19, Prisma 6, and standalone Node output. Cloudflare currently recommends evaluating Next.js through `vinext`; its compatibility check and feature-by-feature review are required before adopting it. This isolated Worker does not prove that the full VAYRO application, Prisma data access, background workers, or authentication stack can run on Cloudflare.

References:
- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
