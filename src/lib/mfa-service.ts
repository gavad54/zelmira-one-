import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
import { createSessionToken, hashSessionToken } from "@/lib/auth-core.mjs";
import {
  decryptTotpSecret, encryptTotpSecret, generateRecoveryCodes,
  generateTotpSecret, hashRecoveryCode, parseMfaEncryptionKey, verifyTotp
} from "@/lib/mfa-core.mjs";
import { setSessionCookie, sha256 } from "@/lib/auth-service";

const LOGIN_TTL_MS = 5 * 60 * 1000;
const ENROLLMENT_TTL_MS = 10 * 60 * 1000;
const MFA_FRESH_MS = 12 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export type MfaPurpose = "LOGIN_MFA" | "MFA_ENROLLMENT";
export function isPrivilegedRole(platformRole: string, membershipRoles: string[]) {
  return platformRole === "OWNER" || platformRole === "PLATFORM_ADMIN" ||
    membershipRoles.some(role => role === "OWNER" || role === "ADMIN");
}
export function isRecentMfa(assurance: string | null | undefined, authenticatedAt: Date | null | undefined, now = Date.now()) {
  return assurance === "MFA" && authenticatedAt instanceof Date &&
    authenticatedAt.getTime() <= now && now - authenticatedAt.getTime() <= MFA_FRESH_MS;
}

export async function createMfaChallenge(userId: string, purpose: MfaPurpose) {
  await assertAuthRuntimeRole();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + (purpose === "LOGIN_MFA" ? LOGIN_TTL_MS : ENROLLMENT_TTL_MS));
  await authPrisma.authChallenge.create({
    data: { userId, purpose, challengeHash: sha256(token), expiresAt, maxAttempts: MAX_ATTEMPTS }
  });
  return { token, expiresAt };
}

type ChallengeRow = {
  id: string; userId: string; purpose: string; expiresAt: Date;
  consumedAt: Date | null; attempts: number; maxAttempts: number;
};
async function claimChallenge(tx: Prisma.TransactionClient, token: string, purpose: MfaPurpose, now: Date) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const challenge = await tx.authChallenge.findUnique({ where: { challengeHash: sha256(token) } }) as ChallengeRow | null;
  if (!challenge || challenge.purpose !== purpose || challenge.consumedAt ||
      challenge.expiresAt.getTime() <= now.getTime() || challenge.attempts >= challenge.maxAttempts) return null;
  const claimed = await tx.authChallenge.updateMany({
    where: { id: challenge.id, consumedAt: null, expiresAt: { gt: now }, attempts: { lt: challenge.maxAttempts } },
    data: { attempts: { increment: 1 } }
  });
  return claimed.count === 1 ? challenge : null;
}
function verifySecret(envelope: string | null, code: string, now: Date) {
  if (!envelope) return null;
  const secret = decryptTotpSecret(envelope);
  return verifyTotp(secret, code, now.getTime(), 1);
}
async function createMfaSession(tx: Prisma.TransactionClient, userId: string, now: Date, revokeExisting = false) {
  const token = createSessionToken();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (revokeExisting) {
    await tx.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } });
  }
  await tx.session.create({
    data: {
      userId, tokenHash: hashSessionToken(token), expiresAt,
      assurance: "MFA", mfaAuthenticatedAt: now, lastSeenAt: now
    }
  });
  await tx.authChallenge.updateMany({
    where: { userId, consumedAt: null }, data: { consumedAt: now }
  });
  await tx.auditEvent.create({
    data: { actorUserId: userId, action: "auth.mfa.verified", resource: "User", resourceId: userId },
  select: { id: true }});
  return { token, expiresAt };
}
async function finishSession(session: { token: string; expiresAt: Date }) {
  await setSessionCookie(session.token, session.expiresAt);
}

export async function beginEnrollment(challengeToken: string) {
  await assertAuthRuntimeRole();
  const now = new Date();
  const key = parseMfaEncryptionKey();
  const result = await authPrisma.$transaction(async tx => {
    const challenge = await claimChallenge(tx, challengeToken, "MFA_ENROLLMENT", now);
    if (!challenge) return null;
    const existing = await tx.userMfa.findUnique({ where: { userId: challenge.userId } });
    if (existing?.enabledAt || (existing?.pendingSecretCiphertext && existing.pendingExpiresAt && existing.pendingExpiresAt.getTime() > now.getTime())) return null;
    const secret = generateTotpSecret();
    const ciphertext = encryptTotpSecret(secret, key);
    if (existing) {
      const updated = await tx.userMfa.updateMany({
        where: { userId: challenge.userId, enabledAt: null, OR: [{ pendingSecretCiphertext: null }, { pendingExpiresAt: { lte: now } }] },
        data: { pendingSecretCiphertext: ciphertext, pendingExpiresAt: new Date(now.getTime() + ENROLLMENT_TTL_MS) }
      });
      if (updated.count !== 1) return null;
    } else {
      await tx.userMfa.create({ data: { userId: challenge.userId, pendingSecretCiphertext: ciphertext, pendingExpiresAt: new Date(now.getTime() + ENROLLMENT_TTL_MS) } });
    }
    await tx.auditEvent.create({
      data: { actorUserId: challenge.userId, action: "auth.mfa.enrollment.started", resource: "User", resourceId: challenge.userId },
    select: { id: true }});
    const user = await tx.user.findUnique({ where: { id: challenge.userId }, select: { email: true } });
    if (!user) return null;
    return { secret, email: user.email };
  });
  if (!result) return null;
  const label = encodeURIComponent("VAYRO:" + result.email);
  const issuer = encodeURIComponent("VAYRO");
  return {
    secret: result.secret,
    otpauthUrl: `otpauth://totp/${label}?secret=${result.secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`
  };
}

export async function confirmEnrollment(challengeToken: string, code: string) {
  await assertAuthRuntimeRole();
  const now = new Date();
  const recoveryCodes = generateRecoveryCodes(10);
  const outcome = await authPrisma.$transaction(async tx => {
    const challenge = await claimChallenge(tx, challengeToken, "MFA_ENROLLMENT", now);
    if (!challenge) return null;
    const mfa = await tx.userMfa.findUnique({ where: { userId: challenge.userId } });
    if (!mfa?.pendingSecretCiphertext || mfa.enabledAt || !mfa.pendingExpiresAt || mfa.pendingExpiresAt.getTime() <= now.getTime()) return null;
    const step = verifySecret(mfa.pendingSecretCiphertext, code, now);
    if (step === null) {
      await tx.auditEvent.create({
        data: { actorUserId: challenge.userId, action: "auth.mfa.enrollment.failed", resource: "User", resourceId: challenge.userId },
      select: { id: true }});
      return null;
    }
    const activated = await tx.userMfa.updateMany({
      where: { userId: challenge.userId, enabledAt: null, pendingSecretCiphertext: { not: null } },
      data: {
        secretCiphertext: mfa.pendingSecretCiphertext, pendingSecretCiphertext: null, pendingExpiresAt: null,
        enabledAt: now, lastTotpStep: BigInt(step)
      }
    });
    if (activated.count !== 1) return null;
    await tx.mfaRecoveryCode.createMany({
      data: recoveryCodes.map(value => ({ userId: challenge.userId, codeHash: hashRecoveryCode(value) }))
    });
    const consumed = await tx.authChallenge.updateMany({
      where: { id: challenge.id, consumedAt: null }, data: { consumedAt: now }
    });
    if (consumed.count !== 1) throw new Error("MFA_ENROLLMENT_CHALLENGE_RACE");
    const session = await createMfaSession(tx, challenge.userId, now, true);
    await tx.auditEvent.create({
      data: { actorUserId: challenge.userId, action: "auth.mfa.enrollment.completed", resource: "User", resourceId: challenge.userId },
    select: { id: true }});
    return session;
  });
  if (!outcome) return false;
  await finishSession(outcome);
  return { recoveryCodes };
}

export async function verifyLoginChallenge(challengeToken: string, code: string) {
  await assertAuthRuntimeRole();
  const now = new Date();
  const outcome = await authPrisma.$transaction(async tx => {
    const challenge = await claimChallenge(tx, challengeToken, "LOGIN_MFA", now);
    if (!challenge) return null;
    const mfa = await tx.userMfa.findUnique({ where: { userId: challenge.userId } });
    if (!mfa?.enabledAt || !mfa.secretCiphertext) return null;
    let accepted = false;
    const step = verifySecret(mfa.secretCiphertext, code, now);
    if (step !== null) {
      const replayGuard = await tx.userMfa.updateMany({
        where: {
          userId: challenge.userId, enabledAt: { not: null },
          OR: [{ lastTotpStep: null }, { lastTotpStep: { lt: BigInt(step) } }]
        },
        data: { lastTotpStep: BigInt(step) }
      });
      accepted = replayGuard.count === 1;
    } else if (/^[a-f0-9]{32}$/.test(code)) {
      const consumed = await tx.mfaRecoveryCode.updateMany({
        where: { userId: challenge.userId, codeHash: hashRecoveryCode(code), usedAt: null },
        data: { usedAt: now }
      });
      accepted = consumed.count === 1;
    }
    if (!accepted) {
      await tx.auditEvent.create({
        data: { actorUserId: challenge.userId, action: "auth.mfa.login.failed", resource: "User", resourceId: challenge.userId },
      select: { id: true }});
      return null;
    }
    const consumedChallenge = await tx.authChallenge.updateMany({
      where: { id: challenge.id, consumedAt: null }, data: { consumedAt: now }
    });
    if (consumedChallenge.count !== 1) throw new Error("MFA_LOGIN_CHALLENGE_RACE");
    return createMfaSession(tx, challenge.userId, now, false);
  });
  if (!outcome) return false;
  await finishSession(outcome);
  return true;
}

export async function disableMfa(userId: string, code: string) {
  await assertAuthRuntimeRole();
  const now = new Date();
  return authPrisma.$transaction(async tx => {
    const mfa = await tx.userMfa.findUnique({ where: { userId } });
    if (!mfa?.enabledAt || !mfa.secretCiphertext) return false;
    let accepted = false;
    const step = verifySecret(mfa.secretCiphertext, code, now);
    if (step !== null) {
      const guard = await tx.userMfa.updateMany({
        where: {
          userId, enabledAt: { not: null },
          OR: [{ lastTotpStep: null }, { lastTotpStep: { lt: BigInt(step) } }]
        },
        data: { lastTotpStep: BigInt(step) }
      });
      accepted = guard.count === 1;
    } else if (/^[a-f0-9]{32}$/.test(code)) {
      const consumed = await tx.mfaRecoveryCode.updateMany({
        where: { userId, codeHash: hashRecoveryCode(code), usedAt: null },
        data: { usedAt: now }
      });
      accepted = consumed.count === 1;
    }
    if (!accepted) {
      await tx.auditEvent.create({
        data: { actorUserId: userId, action: "auth.mfa.disable.failed", resource: "User", resourceId: userId },
      select: { id: true }});
      return false;
    }
    await tx.userMfa.update({
      where: { userId },
      data: { enabledAt: null, secretCiphertext: null, pendingSecretCiphertext: null, pendingExpiresAt: null, lastTotpStep: null }
    });
    await tx.mfaRecoveryCode.deleteMany({ where: { userId } });
    await tx.authChallenge.updateMany({ where: { userId, consumedAt: null }, data: { consumedAt: now } });
    await tx.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } });
    await tx.auditEvent.create({
      data: { actorUserId: userId, action: "auth.mfa.disabled", resource: "User", resourceId: userId },
    select: { id: true }});
    return true;
  });
}

export async function regenerateRecoveryCodes(userId: string, code: string) {
  await assertAuthRuntimeRole();
  const now = new Date();
  const recoveryCodes = generateRecoveryCodes(10);
  const regenerated = await authPrisma.$transaction(async tx => {
    const mfa = await tx.userMfa.findUnique({ where: { userId } });
    if (!mfa?.enabledAt || !mfa.secretCiphertext) return false;
    let accepted = false;
    const step = verifySecret(mfa.secretCiphertext, code, now);
    if (step !== null) {
      const guard = await tx.userMfa.updateMany({
        where: {
          userId, enabledAt: { not: null },
          OR: [{ lastTotpStep: null }, { lastTotpStep: { lt: BigInt(step) } }]
        },
        data: { lastTotpStep: BigInt(step) }
      });
      accepted = guard.count === 1;
    } else if (/^[a-f0-9]{32}$/.test(code)) {
      const consumed = await tx.mfaRecoveryCode.updateMany({
        where: { userId, codeHash: hashRecoveryCode(code), usedAt: null },
        data: { usedAt: now }
      });
      accepted = consumed.count === 1;
    }
    if (!accepted) {
      await tx.auditEvent.create({
        data: { actorUserId: userId, action: "auth.mfa.recovery_codes.rotation_failed", resource: "User", resourceId: userId },
      select: { id: true }});
      return false;
    }
    await tx.mfaRecoveryCode.deleteMany({ where: { userId } });
    await tx.mfaRecoveryCode.createMany({
      data: recoveryCodes.map(value => ({ userId, codeHash: hashRecoveryCode(value) }))
    });
    await tx.auditEvent.create({
      data: { actorUserId: userId, action: "auth.mfa.recovery_codes.rotated", resource: "User", resourceId: userId },
    select: { id: true }});
    return true;
  });
  return regenerated ? recoveryCodes : false;
}
