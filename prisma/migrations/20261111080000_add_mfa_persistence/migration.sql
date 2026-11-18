-- MFA persistence foundation. No client-facing DB grants or policies are added.
-- Login challenge tokens and recovery codes are stored as one-way hashes only.
-- TOTP material is stored as an authenticated-encryption envelope.

CREATE TABLE public."MfaCredential" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "secretCiphertext" TEXT NOT NULL,
  "secretIv" VARCHAR(24) NOT NULL,
  "secretAuthTag" VARCHAR(32) NOT NULL,
  "keyVersion" INTEGER NOT NULL DEFAULT 1,
  "enabledAt" TIMESTAMP(3),
  "lastAcceptedStep" BIGINT NOT NULL DEFAULT -1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MfaCredential_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MfaCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE public."MfaLoginChallenge" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MfaLoginChallenge_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MfaLoginChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE public."MfaRecoveryCode" (
  "id" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MfaRecoveryCode_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MfaRecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "MfaCredential_userId_key" ON public."MfaCredential"("userId");
CREATE UNIQUE INDEX "MfaLoginChallenge_tokenHash_key" ON public."MfaLoginChallenge"("tokenHash");
CREATE INDEX "MfaLoginChallenge_userId_expiresAt_idx" ON public."MfaLoginChallenge"("userId", "expiresAt");
CREATE UNIQUE INDEX "MfaRecoveryCode_codeHash_key" ON public."MfaRecoveryCode"("codeHash");
CREATE INDEX "MfaRecoveryCode_userId_usedAt_idx" ON public."MfaRecoveryCode"("userId", "usedAt");

ALTER TABLE public."MfaCredential" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MfaLoginChallenge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MfaRecoveryCode" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."MfaCredential", public."MfaLoginChallenge", public."MfaRecoveryCode" FROM anon, authenticated, service_role;
