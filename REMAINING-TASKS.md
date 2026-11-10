# Remaining tasks
## P0
- DB-001/DB-002: no encrypted offsite backup object or isolated PostgreSQL 17 restore.
- DB-003: empty migration history and schema drift; no reviewed baseline/rollback rehearsal.
- DB-004/RLS-001: no vayro_* roles; 11 public tables have zero policies and zero FORCE RLS.
- AUTH-001/MFA-001/SESSION-001: production MFA/session schema and lifecycle unverified.
- API-AUTH-001: 42 operations inventoried; positive/negative evidence incomplete.
- SEC-002: production ingress/proxy/CSP/CORS/headers and independent review unverified.
- RELEASE-001: legal/privacy and explicit release approval absent.
## P1
Dedicated VAYRO hosting, email delivery, payments/webhooks/licensing, versioned product APIs and UAT remain unverified.
## P2
Android signed real-device proof absent.
Do not solve these by mutating production, upgrading a paid plan, deploying, merging or activating payments without applicable authorization and prerequisites.
