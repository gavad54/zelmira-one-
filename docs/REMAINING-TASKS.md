# Remaining Tasks — VAYRO
Snapshot: 2026-11-10T17:10:47Z.

P0:
1. Obtain an independently verified encrypted offsite backup and restore it into an isolated PostgreSQL 17 target.
2. Reconcile the restored schema against Prisma/source; create a reviewed baseline and rehearse forward/rollback migrations only in isolated environments.
3. Resolve live RLS policy gap; prove tenant separation through actual least-privilege runtime roles and negative cross-tenant tests before any production change.
4. Verify MFA/session fields and runtime authorization against the real schema and deployed application.
5. Complete endpoint authorization and security-event evidence.

P1:
6. Establish dedicated VAYRO hosting and runtime without reusing ARIA Web/LEADORA.
7. Verify email delivery, domain/TLS, CSP/CORS/security headers and monitoring.
8. Implement/test versioned scoped product APIs and independent product lifecycle evidence.
9. Verify payment, licensing, subscription, webhook and cancellation flows.

P2:
10. Android build/sign/install/device acceptance.
11. Owner UAT, regression and accessibility review.

Release remains blocked until all mandatory P0/P1 gates pass and the owner separately authorizes production actions and release.
