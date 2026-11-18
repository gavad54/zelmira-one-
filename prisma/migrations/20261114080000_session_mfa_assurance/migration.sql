-- Add explicit authentication assurance to sessions.
-- Existing sessions default to PASSWORD and therefore cannot authorize
-- platform-owner or tenant-owner/admin operations until a verified MFA flow
-- issues a new MFA-assured session.

CREATE TYPE "SessionAssurance" AS ENUM ('PASSWORD', 'MFA');

ALTER TABLE public."Session"
  ADD COLUMN "assurance" "SessionAssurance" NOT NULL DEFAULT 'PASSWORD',
  ADD COLUMN "mfaAuthenticatedAt" TIMESTAMP(3);
