# Automated testing

Run the repository checks from the project root:

```sh
npm install
npm test
npm run lint
npm run typecheck
npm run db:validate
npm run build
```

The Node.js built-in test runner executes the tenant authorization policy tests without requiring a live database. These tests cover user/tenant mismatches, inactive tenants, role restrictions and deny-by-default behavior.

The authorization helper is a policy primitive, not a complete authentication or authorization integration. Production API handlers must obtain the authenticated user from a verified server-side session, load membership from the database, and call the policy before every tenant-scoped operation. Never accept membership roles from request bodies or client state.

Database integration tests, cross-tenant API tests, dependency lockfile verification, security scanning, backup/restore drills and production smoke tests remain separate release requirements.


## CI verification scope

The GitHub Actions validation workflow uses a locked install (`npm ci`), a blocking dependency audit (`npm audit --audit-level=moderate`), unit tests, Prisma client generation/schema validation, migration deployment against an isolated PostgreSQL service, lint, TypeScript checking, production build and PostgreSQL-backed production HTTP integration tests.

The verified run on 2026-11-07 at code head `0e5609e00b17c9f641d3f397bf08310526d27a03` reported 35 unit tests and 12 integration tests passing, with no failures. The dependency audit reported zero vulnerabilities.

The tenant HTTP integration scenario covers authenticated tenant creation/list/workspace access, cross-tenant denial, same-origin protection, strict rename input, ADMIN rename, ADMIN denial for close, OWNER-only soft close, audit persistence and retention of closed tenant data.

These CI checks do not replace production environment smoke tests, independent backup/restore drills, external security review, device testing or UAT.
