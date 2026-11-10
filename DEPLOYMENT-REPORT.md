# VAYRO deployment report — 2026-11-10
Railway project ARIA Web (c936dddd-5aa7-46d9-bd04-aa77f2164586); service VAYRO (ea06b2d7-b28e-462e-9251-2613af769d8e); production environment; online, 1/1 replica.
Latest successful deployment 73f8a197-ebe0-4b17-b40f-19f1a49fbfa6 runs main SHA f3abc61523cb7abbd0b0ab4559a34f40a068ddb5, not PR #12 candidate. Five failed deployments in the last 24h.
Observed HTTP logs: homepage/login/register and selected product routes HTTP 200; /vayro-mark.svg and /favicon.ico HTTP 404. “Ready in 75ms” is process startup only, not HTTP/DB readiness.
https://vayro-production.up.railway.app appears in actual HTTP logs. Dedicated VAYRO Railway project is absent from accessible project list; no paid upgrade authorized. Domain ownership, fresh external probe, DB-backed readiness and deployment parity are NOT VERIFIED.
No deployment/restart/domain/environment/hosting mutation.
