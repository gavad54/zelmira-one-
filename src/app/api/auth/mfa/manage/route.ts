import { randomBytes } from "node:crypto";
import { z } from "zod";
import { isSameOriginRequest, verifyLoginPassword } from "@/lib/auth-core.mjs";
import { decryptTotpSecret, verifyTotp } from "@/lib/mfa-core.mjs";
import {
  allowAttempt,
  clearSessionCookie,
  currentSession,
  noStoreJson,
  sha256
} from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await currentSession();
  if (!session) return noStoreJson({ error: "unauthorized" }, 401);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      platformRole: true,
      memberships: {
        where: { role: { in: ["OWNER", "ADMIN"] }, tenant: { status: "ACTIVE" } },
        select: { id: true }
      },
      mfaCredential: { select: { enabledAt: true, pendingExpiresAt: true } },
      mfaRecoveryCodes: { where: { usedAt: null }, select: { id: true } }
    }
  });
  if (!user) return noStoreJson({ error: "unauthorized" }, 401);
  const mfaRequired =
    user.platformRole === "OWNER" ||
    user.platformRole === "PLATFORM_ADMIN" ||
    user.memberships.length > 0;
  return noStoreJson({
    enabled: Boolean(user.mfaCredential?.enabledAt),
    required: mfaRequired,
    unusedRecoveryCodes: user.mfaRecoveryCodes.length
  });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);

  const parsed = z.object({
    action: z.enum(["regenerate_recovery_codes", "disable"]),
    code: z.string().regex(/^\d{6}$/),
    password: z.string().min(1).max(128).optional()
  }).strict().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_request" }, 400);

  const session = await currentSession();
  if (!session) return noStoreJson({ error: "unauthorized" }, 401);

  if (!await allowAttempt(sha256("mfa-manage:" + session.sessionId), 5, 15 * 60 * 1000)) {
    return noStoreJson({ error: "try_again_later" }, 429);
  }

  const record = await prisma.session.findFirst({
    where: { id: session.sessionId, userId: session.user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          passwordHash: true,
          platformRole: true,
          memberships: {
            where: { role: { in: ["OWNER", "ADMIN"] }, tenant: { status: "ACTIVE" } },
            select: { id: true }
          },
          mfaCredential: true
        }
      }
    }
  });
  const credential = record?.user.mfaCredential;
  if (!record || !credential?.enabledAt) return noStoreJson({ error: "mfa_not_enabled" }, 409);

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

  const now = new Date();
  const acceptedStep = verifyTotp({
    secret,
    token: parsed.data.code,
    now: now.getTime(),
    window: 1,
    lastAcceptedStep: Number(credential.lastAcceptedStep)
  });
  if (acceptedStep === null) return noStoreJson({ error: "invalid_mfa_code" }, 401);

  const isPrivileged =
    record.user.platformRole === "OWNER" ||
    record.user.platformRole === "PLATFORM_ADMIN" ||
    record.user.memberships.length > 0;

  if (parsed.data.action === "disable") {
    // Privileged accounts must never remove their mandatory second factor.
    if (isPrivileged) return noStoreJson({ error: "mfa_required_for_privileged_account" }, 409);
    if (!parsed.data.password ||
        !await verifyLoginPassword(parsed.data.password, record.user.passwordHash)) {
      return noStoreJson({ error: "invalid_credentials" }, 401);
    }

    try {
      await prisma.$transaction(async tx => {
        const currentUser = await tx.user.findUnique({
          where: { id: record.user.id },
          select: {
            platformRole: true,
            memberships: {
              where: { role: { in: ["OWNER", "ADMIN"] }, tenant: { status: "ACTIVE" } },
              select: { id: true }
            }
          }
        });
        if (!currentUser ||
            currentUser.platformRole === "OWNER" ||
            currentUser.platformRole === "PLATFORM_ADMIN" ||
            currentUser.memberships.length > 0) {
          throw new Error("MFA_REQUIRED_FOR_PRIVILEGED_ACCOUNT");
        }
        const consumed = await tx.mfaCredential.updateMany({
          where: { id: credential.id, enabledAt: credential.enabledAt, lastAcceptedStep: { lt: BigInt(acceptedStep) } },
          data: { lastAcceptedStep: BigInt(acceptedStep) }
        });
        if (consumed.count !== 1) throw new Error("MFA_CODE_REPLAYED");
        await tx.mfaRecoveryCode.deleteMany({ where: { userId: record.user.id } });
        await tx.mfaCredential.delete({ where: { id: credential.id } });
        await tx.session.updateMany({
          where: { userId: record.user.id, revokedAt: null },
          data: { revokedAt: new Date() }
        });
        await tx.auditEvent.create({
          data: {
            actorUserId: record.user.id,
            action: "auth.mfa.disabled",
            resource: "MfaCredential",
            resourceId: credential.id
          }
        });
      });
    } catch (error) {
      if (error instanceof Error && error.message === "MFA_CODE_REPLAYED") {
        return noStoreJson({ error: "mfa_code_already_used" }, 401);
      }
      if (error instanceof Error && error.message === "MFA_REQUIRED_FOR_PRIVILEGED_ACCOUNT") {
        return noStoreJson({ error: "mfa_required_for_privileged_account" }, 409);
      }
      return noStoreJson({ error: "mfa_management_failed" }, 409);
    }
    await clearSessionCookie();
    return noStoreJson({ disabled: true, authenticated: false });
  }

  const recoveryCodes = Array.from({ length: 10 }, () => randomBytes(8).toString("hex").toUpperCase());
  try {
    await prisma.$transaction(async tx => {
      const consumed = await tx.mfaCredential.updateMany({
        where: { id: credential.id, enabledAt: credential.enabledAt, lastAcceptedStep: { lt: BigInt(acceptedStep) } },
        data: { lastAcceptedStep: BigInt(acceptedStep) }
      });
      if (consumed.count !== 1) throw new Error("MFA_CODE_REPLAYED");
      await tx.mfaRecoveryCode.deleteMany({ where: { userId: record.user.id } });
      await tx.mfaRecoveryCode.createMany({
        data: recoveryCodes.map(code => ({ userId: record.user.id, codeHash: sha256(code) }))
      });
      await tx.session.updateMany({
        where: { userId: record.user.id, id: { not: record.id }, revokedAt: null },
        data: { revokedAt: new Date() }
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: record.user.id,
          action: "auth.mfa.recovery_codes_regenerated",
          resource: "MfaCredential",
          resourceId: credential.id,
          metadata: { count: recoveryCodes.length }
        }
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "MFA_CODE_REPLAYED") {
      return noStoreJson({ error: "mfa_code_already_used" }, 401);
    }
    return noStoreJson({ error: "mfa_management_failed" }, 409);
  }

  return noStoreJson({ regenerated: true, recoveryCodes });
}
