# VAYRO security report — 2026-11-10
Candidate de1c51712b6dec2c5a66bee5babd3743a9835103.
PASS: exact-head CodeQL run 42779828204; exact-head CI isolated PostgreSQL role/RLS checks; locked dependency audit step.
FAIL/BLOCKED: 11 public tables have RLS enabled but zero policies and zero FORCE RLS; all owned by postgres. Supabase Security Advisor reports 11 rls_enabled_no_policy findings. No vayro_* runtime roles found; postgres and service_role have BYPASSRLS=true. Live schema lacks UserMfa, MfaRecoveryCode, AuthChallenge, AiGeneration and Session lifecycle columns per architecture audit. Production MFA, session revocation/rotation, full endpoint matrix, CSP/CORS/headers, proxy trust, email recovery and independent security review are not verified. No independent encrypted backup/restore evidence.
No secrets read or changed; no production schema, role, grant, policy or data mutation.
