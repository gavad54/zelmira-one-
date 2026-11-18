import { randomBytes } from "node:crypto";
import { z } from "zod";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import {
  createOtpAuthUri,
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  verifyTotp
} from "@/lib/mfa-core.mjs";
import { allowAttempt, currentSession, noStoreJson, sha256 } from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const PENDING_FACTOR_TTL_MS = 10 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

const requestSchema = z.object({
  action: z.enum(["begin", "confirm"]),
  code: z.string().regex(/^\d{6}$/)
}).strict();

function pendingFactorClear() {
  return {
    pendingSecretCiphertext: null,
    pendingSecretIv: null,
    pendingSecretAuthTag: null,
    pendingKeyVersion: null,
    pendingExpiresAt: null
  };
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_request" }, 400);

  const session = await currentSession();
  if (!session) return noStoreJson({ error: "unauthorized" }, 401);

  const limiterKey = sha256("mfa-factor-replace:" + session.sessionId);
  if (!await allowAttempt(limiterKey, 8, RATE_LIMIT_WINDOW_MS)) {
    return noStoreJson({ error: "try_again_later" }, 429);
  }

  const record = await prisma.session.findFirst({
    where: {
      id: session.sessionId,
      userId: session.user.id,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          email: true,
          mfaCredential: true
        }
      }
    }
  });
  const credential = record?.user.mfaCredential;
  if (!record || !credential?.enabledAt) {
    return noStoreJson({ error: "mfa_not_enabled" }, 409);
  }

  const now = new Date();

  if (parsed.data.action === "begin") {
    let activeSecret: string;
    try {
      activeSecret = decryptTotpSecret({
        version: credential.keyVersion,
        iv: credential.secretIv,
        ciphertext: credential.secretCiphertext,
        authTag: credential.secretAuthTag
      });
    } catch {
      return noStoreJson({ error: "mfa_configuration_error" }, 503);
    }

    const acceptedStep = verifyTotp({
      secret: activeSecret,
      token: parsed.data.code,
      now: now.getTime(),
      window: 1,
      lastAcceptedStep: Number(credential.lastAcceptedStep)
    });
    if (acceptedStep === null) return noStoreJson({ error: "invalid_mfa_code" }, 401);

    let pendingSecret: string;
    let encrypted;
    try {
      pendingSecret = generateTotpSecret();
      encrypted = encryptTotpSecret(pendingSecret);
    } catch {
      return noStoreJson({ error: "mfa_encryption_not_configured" }, 503);
    }

    const expiresAt = new Date(now.getTime() + PENDING_FACTOR_TTL_MS);
    try {
      await prisma.$transaction(async tx => {
        const activeSession = await tx.session.updateMany({
          where: {
            id: record.id,
            userId: record.user.id,
            revokedAt: null,
            expiresAt: { gt: new Date() }
          },
          data: { assurance: "MFA", mfaAuthenticatedAt: new Date() }
        });
        if (activeSession.count !== 1) throw new Error("MFA_SESSION_REVOKED");

        const updated = await tx.mfaCredential.updateMany({
          where: {
            id: credential.id,
            enabledAt: credential.enabledAt,
            lastAcceptedStep: { lt: BigInt(acceptedStep) }
          },
          data: {
            lastAcceptedStep: BigInt(acceptedStep),
            pendingSecretCiphertext: encrypted.ciphertext,
            pendingSecretIv: encrypted.iv,
            pendingSecretAuthTag: encrypted.authTag,
            pendingKeyVersion: encrypted.version,
            pendingExpiresAt: expiresAt
          }
        });
        if (updated.count !== 1) throw new Error("MFA_CODE_REPLAYED");
        await tx.auditEvent.create({
          data: {
            actorUserId: record.user.id,
            action: "auth.mfa.factor_replacement_started",
            resource: "MfaCredential",
            resourceId: credential.id,
            metadata: { expiresAt: expiresAt.toISOString() }
          }
        });
      });
    } catch (error) {
      if (error instanceof Error && error.message === "MFA_CODE_REPLAYED") {
        return noStoreJson({ error: "mfa_code_already_used" }, 401);
      }
      if (error instanceof Error && error.message === "MFA_SESSION_REVOKED") {
        return noStoreJson({ error: "unauthorized" }, 401);
      }
      return noStoreJson({ error: "mfa_replacement_failed" }, 409);
    }

    return noStoreJson({
      pending: true,
      secret: pendingSecret,
      otpauthUri: createOtpAuthUri({
        secret: pendingSecret,
        accountName: record.user.email,
        issuer: "VAYRO"
      }),
      expiresInSeconds: PENDING_FACTOR_TTL_MS / 1000
    });
  }

  if (
    !credential.pendingSecretCiphertext ||
    !credential.pendingSecretIv ||
    !credential.pendingSecretAuthTag ||
    !credential.pendingKeyVersion ||
    !credential.pendingExpiresAt
  ) {
    return noStoreJson({ error: "no_pending_factor" }, 409);
  }

  if (credential.pendingExpiresAt <= now) {
    await prisma.mfaCredential.updateMany({
      where: { id: credential.id, pendingExpiresAt: credential.pendingExpiresAt },
      data: pendingFactorClear()
    });
    return noStoreJson({ error: "pending_factor_expired" }, 409);
  }

  let pendingSecret: string;
  try {
    pendingSecret = decryptTotpSecret({
      version: credential.pendingKeyVersion,
      iv: credential.pendingSecretIv,
      ciphertext: credential.pendingSecretCiphertext,
      authTag: credential.pendingSecretAuthTag
    });
  } catch {
    return noStoreJson({ error: "mfa_configuration_error" }, 503);
  }

  const acceptedStep = verifyTotp({
    secret: pendingSecret,
    token: parsed.data.code,
    now: now.getTime(),
    window: 1,
    lastAcceptedStep: -1
  });
  if (acceptedStep === null) return noStoreJson({ error: "invalid_new_factor_code" }, 401);

  const recoveryCodes = Array.from({ length: 10 }, () =>
    randomBytes(8).toString("hex").toUpperCase()
  );
  try {
    await prisma.$transaction(async tx => {
      const promoted = await tx.mfaCredential.updateMany({
        where: {
          id: credential.id,
          enabledAt: credential.enabledAt,
          pendingSecretCiphertext: credential.pendingSecretCiphertext,
          pendingExpiresAt: { gt: new Date() }
        },
        data: {
          secretCiphertext: credential.pendingSecretCiphertext!,
          secretIv: credential.pendingSecretIv!,
          secretAuthTag: credential.pendingSecretAuthTag!,
          keyVersion: credential.pendingKeyVersion!,
          lastAcceptedStep: BigInt(acceptedStep),
          ...pendingFactorClear()
        }
      });
      if (promoted.count !== 1) throw new Error("MFA_PENDING_FACTOR_CHANGED");

      const activeSession = await tx.session.updateMany({
        where: {
          id: record.id,
          userId: record.user.id,
          revokedAt: null,
          expiresAt: { gt: new Date() }
        },
        data: { assurance: "MFA", mfaAuthenticatedAt: new Date() }
      });
      if (activeSession.count !== 1) throw new Error("MFA_SESSION_REVOKED");
      await tx.mfaRecoveryCode.deleteMany({ where: { userId: record.user.id } });
      await tx.mfaRecoveryCode.createMany({
        data: recoveryCodes.map(code => ({
          userId: record.user.id,
          codeHash: sha256(code)
        }))
      });
      await tx.session.updateMany({
        where: { userId: record.user.id, id: { not: record.id }, revokedAt: null },
        data: { revokedAt: new Date() }
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: record.user.id,
          action: "auth.mfa.factor_replaced",
          resource: "MfaCredential",
          resourceId: credential.id,
          metadata: { recoveryCodesIssued: recoveryCodes.length }
        }
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "MFA_SESSION_REVOKED") {
      return noStoreJson({ error: "unauthorized" }, 401);
    }
    return noStoreJson({ error: "mfa_replacement_failed" }, 409);
  }

  return noStoreJson({ replaced: true, recoveryCodes });
}
