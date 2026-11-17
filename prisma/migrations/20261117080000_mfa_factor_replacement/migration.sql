-- Support safe authenticator replacement without removing the active factor
-- until a new factor has been verified by the user.
ALTER TABLE public."MfaCredential"
  ADD COLUMN "pendingSecretCiphertext" TEXT,
  ADD COLUMN "pendingSecretIv" VARCHAR(24),
  ADD COLUMN "pendingSecretAuthTag" VARCHAR(32),
  ADD COLUMN "pendingKeyVersion" INTEGER,
  ADD COLUMN "pendingExpiresAt" TIMESTAMP(3);

ALTER TABLE public."MfaCredential"
  ADD CONSTRAINT "MfaCredential_pending_factor_complete_check"
  CHECK (
    (
      "pendingSecretCiphertext" IS NULL
      AND "pendingSecretIv" IS NULL
      AND "pendingSecretAuthTag" IS NULL
      AND "pendingKeyVersion" IS NULL
      AND "pendingExpiresAt" IS NULL
    )
    OR
    (
      "pendingSecretCiphertext" IS NOT NULL
      AND "pendingSecretIv" IS NOT NULL
      AND "pendingSecretAuthTag" IS NOT NULL
      AND "pendingKeyVersion" IS NOT NULL
      AND "pendingExpiresAt" IS NOT NULL
    )
  );
