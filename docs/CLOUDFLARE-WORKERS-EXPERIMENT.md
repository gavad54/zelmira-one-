# VAYRO Cloudflare Workers experiment — 2026-11-08

## Scope and safety boundary

This is an isolated compatibility experiment on `experiment/cloudflare-free-hosting-audit`.
It does not modify `main`, Railway production, Supabase, database schema/data, secrets, DNS, or any deployed Worker.
No Cloudflare deployment was performed.

## Verified results

Run: https://github.com/gavad54/zelmira-one-/actions/runs/42456752982  
Commit: `a38056e4b6e14d0477c268cbb75388a14575e05c`  
Artifact: https://github.com/gavad54/zelmira-one-/actions/runs/42456752982/artifacts/13608380739

- Cloudflare/Vinext production build completed successfully.
- The generated Worker was started locally with the Cloudflare Vite preview runtime.
- `GET /api/health` returned HTTP 200 and `{"status":"alive","service":"vayro-web"}`.
- `GET /` returned HTTP 200 and contained the VAYRO homepage.
- The artifact includes the hidden `.cloudflare/output` directory, generated Worker bundle, static assets, config files, preview logs, health response, homepage response, and npm audit JSON.
- This is a local Worker-runtime smoke test, not a remote deployment or a database integration test.

## Security finding and follow-up

The first dependency audit reported 6 findings: 5 moderate and 1 high. The high finding affected Vite 8.3.0–8.3.2 (GHSA-587h-7wmj-h5pm and related Vite advisories). The experiment workflow was updated to request the patched Vite 8.3 line (`vite@^8.3.3`) before building. That update must pass a fresh build, runtime smoke test, and audit before it is treated as verified.

The 5 moderate findings remain under review. No broad `npm audit fix --force` or major-version downgrade was applied.

## Database/runtime blocker

The current application database module instantiates a plain `new PrismaClient()` without a driver adapter. The Cloudflare compatibility report itself notes that Prisma on Workers requires a supported driver adapter. For the existing PostgreSQL/Supabase architecture, the viable path to evaluate is Prisma's PostgreSQL driver adapter with Cloudflare Hyperdrive (or another supported edge-compatible PostgreSQL transport). This requires a deliberate code change and a separately authorized binding/credential setup; it has not been implemented or tested here.

Consequently, successful homepage and liveness requests do not prove login, registration, tenant authorization, email, or database-backed routes work on Workers.

## Remaining gates

1. Verify the patched Vite version and rerun npm audit.
2. Add and test a Cloudflare-specific Prisma PostgreSQL adapter without breaking the Railway Node.js runtime.
3. Run integration tests against a disposable, isolated database before any production database access.
4. Verify auth/session/password hashing and all database-backed route handlers under workerd.
5. Confirm backup and restore, secrets, MFA, email delivery, security review, and release gates.
6. Only after explicit separate authorization: configure Hyperdrive/Worker bindings and consider a staged deployment.

## References

- Vinext Cloudflare bindings and runtime: https://vinext.dev/docs/deploying/cloudflare
- Cloudflare Hyperdrive + Prisma ORM: https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/prisma-orm/
- Vite security patch information: https://github.com/advisories/GHSA-587h-7wmj-h5pm
