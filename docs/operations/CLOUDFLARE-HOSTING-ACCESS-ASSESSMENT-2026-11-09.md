# VAYRO hosting provider access assessment — 2026-11-09

## Purpose

Record the actual provider-access checks performed for the dedicated VAYRO hosting path. This is an evidence note, not a deployment or production-readiness certificate.

## Cloudflare account identity

- Cloudflare account listing endpoint returned success.
- Account ID: `27af74303d32dbaa086bcc3e255f2887`.
- Account name: `Mr.arminpanah54@gmail.com's Account`.
- The connected Cloudflare identity was confirmed through the connector's identity endpoint.
- Therefore, the Cloudflare account connection itself is established.

## Permission checks

The following read-only API requests were attempted against the account:

| Capability | API operation | Result |
|---|---|---|
| Workers Builds quota visibility | `GET /accounts/{account_id}/builds/account/limits` | HTTP 403; connector reports missing Workers CI read/write scope |
| Worker script listing | `GET /accounts/{account_id}/workers/scripts` | HTTP 403; connector reports no accepted Workers Scripts/Workers read scope |
| Pages project listing | `GET /accounts/{account_id}/pages/projects` | HTTP 403; connector reports missing `page.read` or `page.write` |
| Git repository connection | `GET /accounts/{account_id}/builds/repos/connections` | Not a supported read operation in the discovered API contract; repository connection is created/updated with PUT and requires Workers CI Write |

The connector's OpenAPI contract identifies the required permission groups:
- Workers Builds: Workers CI Read or Workers CI Write for quota read; Workers CI Write for repository connection.
- Worker scripts: Workers Scripts Read/Write or another explicitly listed Worker read/admin scope.
- Cloudflare Pages: Pages Read or Pages Write for project listing; Pages Write for project creation and source connection.

## Decision

- **Account connection:** VERIFIED.
- **Required API permissions through the current ChatGPT Cloudflare connection:** BLOCKED by HTTP 403.
- **Cloudflare Pages/Workers project creation:** NOT STARTED; no project was created.
- **GitHub repository connection to Cloudflare:** NOT STARTED; no repository connection was changed.
- **Production deployment:** NOT DEPLOYED.

A connected Cloudflare account is not proof that this connector has all account-level API scopes. Do not describe the account as disconnected.

## Safe next steps

1. Use the Cloudflare dashboard or reconnect/reauthorize the Cloudflare app integration with the exact missing scopes shown by the API errors.
2. Re-run the three read-only permission checks.
3. Inspect the repository's Next.js, Prisma, database-driver, file-storage and runtime dependencies before choosing Workers versus Pages. Do not assume a Next.js application using Prisma is compatible with Workers without a reproducible build and runtime test.
4. Prefer a dedicated VAYRO project and a free plan only if the provider's current plan limits and required runtime features are verified.
5. Keep VAYRO-CORE production read-only until an independent backup and isolated restore have been demonstrated. Do not reuse ARIA or LEADORA infrastructure or data.

## Release status

**DEPLOYMENT BLOCKED — NOT RELEASED.**
