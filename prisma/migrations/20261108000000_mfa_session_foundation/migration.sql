-- MFA and session lifecycle foundation.
-- Repository-only until reviewed and applied to an isolated CI database.
CREATE TYPE public."SessionAssurance" AS ENUM ('PASSWORD', 'MFA');
CREATE TYPE public."AuthChallengePurpose" AS ENUM ('LOGIN_MFA', 'MFA_ENROLLMENT');

ALTER TABLE public."Session"
  ADD COLUMN "revokedAt" TIMESTAMP(3),
  ADD COLUMN "lastSeenAt" TIMESTAMP(3),
  ADD COLUMN "assurance" public."SessionAssurance" NOT NULL DEFAULT 'PASSWORD',
  ADD COLUMN "mfaAuthenticatedAt" TIMESTAMP(3);

CREATE TABLE public."UserMfa" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "secretCiphertext" TEXT,
  "pendingSecretCiphertext" TEXT,
  "pendingExpiresAt" TIMESTAMP(3),
  "enabledAt" TIMESTAMP(3),
  "lastTotpStep" BIGINT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserMfa_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserMfa_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE public."MfaRecoveryCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MfaRecoveryCode_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MfaRecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE public."AuthChallenge" (
  "id" TEXT NOT NULL,
  "challengeHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "purpose" public."AuthChallengePurpose" NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthChallenge_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuthChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "UserMfa_userId_key" ON public."UserMfa"("userId");
CREATE UNIQUE INDEX "MfaRecoveryCode_codeHash_key" ON public."MfaRecoveryCode"("codeHash");
CREATE INDEX "MfaRecoveryCode_userId_usedAt_idx" ON public."MfaRecoveryCode"("userId", "usedAt");
CREATE UNIQUE INDEX "AuthChallenge_challengeHash_key" ON public."AuthChallenge"("challengeHash");
CREATE INDEX "AuthChallenge_userId_purpose_expiresAt_idx" ON public."AuthChallenge"("userId", "purpose", "expiresAt");
CREATE INDEX "AuthChallenge_expiresAt_consumedAt_idx" ON public."AuthChallenge"("expiresAt", "consumedAt");
CREATE INDEX "Session_userId_revokedAt_idx" ON public."Session"("userId", "revokedAt");

ALTER TABLE public."UserMfa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MfaRecoveryCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuthChallenge" ENABLE ROW LEVEL SECURITY;

