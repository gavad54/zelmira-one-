# VAYRO test evidence

## Exact-head repository verification
Commit: dbbaf89d1d56b8faacead90bbfb87cf01f6341e3
Pull request: #12
- VAYRO CI run 42767999257 — completed, conclusion success.
- CodeQL run 42767999555 — completed, conclusion success.

Inspected CI job steps all completed successfully:
- locked dependency install
- enforced dependency security audit
- unit tests
- Prisma client generation and schema validation
- least-privilege role setup in isolated PostgreSQL
- real Prisma migration execution in isolated PostgreSQL
- isolated authentication/platform role isolation
- isolated tenant runtime login and RLS isolation test
- lint and typecheck
- production build
- production Docker image build
- PostgreSQL and production HTTP integration tests

## Scope limitations
These are repository CI tests using isolated infrastructure. They do not prove:
- production Supabase schema, role, grant, policy or data state
- a real offsite backup object exists
- a successful independent restore
- Railway production hosting or deployed commit parity
- production email, payment, Android device acceptance or UAT
- zero open CodeQL alert records

## Operational tests still required
- [ ] Actual encrypted backup run and remote object verification
- [ ] Independent restore and application-level data validation
- [ ] Production DB schema/role/policy reconciliation and negative tenant tests
- [ ] Production endpoint authorization and MFA/session lifecycle tests
- [ ] Deployed web smoke, monitoring, rollback and commit parity
- [ ] Android signed artifact installation and real-device acceptance
