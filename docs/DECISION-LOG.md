# VAYRO decision log

## DEC-001 — Keep PR #12 unmerged and draft
Date: 2026-11-10
Decision: Keep PR #12 open, draft and unmerged until P0/P1 release gates and production parity are evidenced.
Reason: CI success does not establish production database safety, backup/restore or deployment readiness.
Status: Active.

## DEC-002 — No production DB mutation before recovery proof
Date: 2026-11-10
Decision: Do not run production migrations, create roles/grants/policies, or modify live schema until an independently encrypted backup is restored successfully to an isolated PostgreSQL 17 target and schema reconciliation/recovery rehearsal is complete.
Reason: Live VAYRO-CORE has no migration history and has material schema drift.
Status: Active.

## DEC-003 — Do not apply staged Railway patch blindly
Date: 2026-11-10
Decision: Leave staged patch b9d85124-4dfe-42fe-8fe2-136f239987b0 unapplied.
Reason: It targets an older branch/commit and is not verified as a safe deployment.
Status: Active.

## DEC-004 — Preserve product boundaries
Date: 2026-11-10
Decision: VAYRO is the mother app; approved family modules are ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA and PAYAM. ARIA excludes accounting/ERP; ARIANA owns accounting/ERP; LEADORA remains independent pending audit. Do not remove legacy capability without audit and approval.
Status: Active.

## DEC-005 — Free-first, no unapproved spend
Date: 2026-11-10
Decision: Use existing/free resources where safe; do not activate paid services or create costs without explicit owner authorization.
Status: Active.

## DEC-006 — No secrets in chat
Date: 2026-11-10
Decision: Never request or expose provider credentials, private keys or signing secrets in chat. Owner-controlled protected configuration only.
Status: Active.
