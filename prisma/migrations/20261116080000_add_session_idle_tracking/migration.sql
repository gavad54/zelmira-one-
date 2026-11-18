-- Add server-side activity tracking for the 30-minute idle-session policy.
-- NULL is intentional for existing sessions; runtime falls back to createdAt.
ALTER TABLE public."Session"
  ADD COLUMN "lastSeenAt" TIMESTAMP(3);

CREATE INDEX "Session_userId_revokedAt_idx"
  ON public."Session"("userId", "revokedAt");
