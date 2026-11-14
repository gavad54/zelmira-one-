-- Persist server-side session revocation so every authorization path can reject it.
-- This migration is validated only in disposable CI; production application requires separate approval.
ALTER TABLE public."Session"
  ADD COLUMN "revokedAt" TIMESTAMP(3);
