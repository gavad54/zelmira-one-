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
