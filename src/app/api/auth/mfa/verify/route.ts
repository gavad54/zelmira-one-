import { randomBytes } from "node:crypto";
import { z } from "zod";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { decryptTotpSecret, verifyTotp } from "@/lib/mfa-core.mjs";
import { allowAttempt, issueSession, noStoreJson, sha256 } from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  const parsed = z.object({
    challengeToken: z.string().regex(/^[a-f0-9]{64}$/),
    code: z.string().trim().min(6).max(32)
  }).strict().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_request" }, 400);

  const { challengeToken } = parsed.data;
  const code = parsed.data.code.replace(/[\s-]/g, "").toUpperCase();
  if (!await allowAttempt(sha256("mfa-verify:" + challengeToken), 5, CHALLENGE_TTL_MS)) {
    return noStoreJson({ error: "try_again_later" }, 429);
  }

  const challenge = await prisma.mfaLoginChallenge.findUnique({
    where: { tokenHash: sha256(challengeToken) },
    include: {
      user: {
        select: {
          id: true, email: true, displayName: true, platformRole: true,
          emailVerifiedAt: true, disabledAt: true
        }
      }
    }
  });
  const now = new Date();
  if (!challenge || challenge.consumedAt || challenge.expiresAt <= now ||
      !challenge.user.emailVerifiedAt || challenge.user.disabledAt) {
    return noStoreJson({ error: "invalid_or_expired_challenge" }, 401);
  }

  const isPlatformPrivileged =
    challenge.user.platformRole === "OWNER" || challenge.user.platformRole === "PLATFORM_ADMIN";
  const privilegedMembership = isPlatformPrivileged ? null : await prisma.membership.findFirst({
    where: { userId: challenge.user.id, role: { in: ["OWNER", "ADMIN"] }, tenant: { status: "ACTIVE" } },
    select: { id: true }
  });
  if (!isPlatformPrivileged && !privilegedMembership) return noStoreJson({ error: "forbidden" }, 403);

  const credential = await prisma.mfaCredential.findUnique({ where: { userId: challenge.user.id } });
  if (!credential) return noStoreJson({ error: "mfa_enrollment_required" }, 409);

  const isEnrollment = credential.enabledAt === null;
  let acceptedStep: number | null = null;
  let recoveryHash: string | null = null;

  if (/^\d{6}$/.test(code)) {
    let secret: string;
    try {
      secret = decryptTotpSecret({
        version: credential.keyVersion,
        iv: credential.secretIv,
        ciphertext: credential.secretCiphertext,
        authTag: credential.secretAuthTag
      });
    } catch {
      return noStoreJson({ error: "mfa_configuration_error" }, 503);
    }
    acceptedStep = verifyTotp({
      secret,
      token: code,
      now: now.getTime(),
      window: 1,
      lastAcceptedStep: Number(credential.lastAcceptedStep)
    });
    if (acceptedStep === null) return noStoreJson({ error: "invalid_mfa_code" }, 401);
  } else if (!isEnrollment && /^[A-F0-9]{16}$/.test(code)) {
    recoveryHash = sha256(code);
  } else {
    return noStoreJson({ error: "invalid_mfa_code" }, 401);
  }

  const recoveryCodes = isEnrollment
    ? Array.from({ length: 10 }, () => randomBytes(8).toString("hex").toUpperCase())
    : [];

  try {
    await prisma.$transaction(async tx => {
      const consumed = await tx.mfaLoginChallenge.updateMany({
        where: {
          id: challenge.id,
          userId: challenge.user.id,
          consumedAt: null,
          expiresAt: { gt: new Date() }
        },
        data: { consumedAt: new Date() }
      });
      if (consumed.count !== 1) throw new Error("MFA_CHALLENGE_ALREADY_USED");

      if (recoveryHash) {
        const recovery = await tx.mfaRecoveryCode.updateMany({
          where: { userId: challenge.user.id, codeHash: recoveryHash, usedAt: null },
          data: { usedAt: new Date() }
        });
        if (recovery.count !== 1) throw new Error("MFA_RECOVERY_CODE_INVALID");
      } else {
        const updated = await tx.mfaCredential.updateMany({
          where: {
            userId: challenge.user.id,
            enabledAt: credential.enabledAt,
            lastAcceptedStep: { lt: BigInt(acceptedStep!) }
          },
          data: {
            lastAcceptedStep: BigInt(acceptedStep!),
            ...(isEnrollment ? { enabledAt: new Date() } : {})
          }
        });
        if (updated.count !== 1) throw new Error("MFA_CODE_REPLAYED");
      }

      if (isEnrollment) {
        await tx.mfaRecoveryCode.createMany({
          data: recoveryCodes.map(value => ({
            userId: challenge.user.id,
            codeHash: sha256(value)
          }))
        });
        await tx.auditEvent.create({
          data: {
            actorUserId: challenge.user.id,
            action: "auth.mfa.enabled",
            resource: "MfaCredential",
            resourceId: credential.id
          }
        });
      } else {
        await tx.auditEvent.create({
          data: {
            actorUserId: challenge.user.id,
            action: recoveryHash ? "auth.mfa.recovery_used" : "auth.login.mfa_verified",
            resource: "User",
            resourceId: challenge.user.id
          }
        });
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "MFA_RECOVERY_CODE_INVALID") return noStoreJson({ error: "invalid_mfa_code" }, 401);
    if (message === "MFA_CODE_REPLAYED") return noStoreJson({ error: "mfa_code_already_used" }, 401);
    return noStoreJson({ error: "invalid_or_expired_challenge" }, 401);
  }

  await issueSession(challenge.user.id, "MFA" as never);
  return noStoreJson({
    authenticated: true,
    user: {
      id: challenge.user.id,
      email: challenge.user.email,
      displayName: challenge.user.displayName,
      platformRole: challenge.user.platformRole
    },
    ...(isEnrollment ? { recoveryCodes } : {})
  });
}
