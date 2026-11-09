import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
import { authorizeOwnerSession } from "@/lib/owner-session.mjs";
import { assertPlatformRuntimeRole, platformPrisma } from "@/lib/platform-prisma";

const MFA_FRESH_MS = 12 * 60 * 60 * 1000;

type PlatformTransaction = Prisma.TransactionClient;

export async function withPlatformOwnerTransaction<T>({
  sessionToken,
  callback,
  now = new Date(),
  isolationLevel
}: {
  sessionToken?: string | null;
  callback: (tx: PlatformTransaction, actor: { userId: string }) => Promise<T>;
  now?: Date;
  isolationLevel?: Prisma.TransactionIsolationLevel;
}): Promise<{ authorized: false } | { authorized: true; userId: string; value: T }> {
  if (
    typeof sessionToken !== "string" ||
    !/^[a-f0-9]{64}$/.test(sessionToken) ||
    !(now instanceof Date) ||
    Number.isNaN(now.getTime())
  ) return { authorized: false };

  await assertAuthRuntimeRole();
  const initial = await authorizeOwnerSession({ sessionToken, db: authPrisma, now });
  if (!initial.authorized) return { authorized: false };

  const tokenHash = createHash("sha256").update(sessionToken, "utf8").digest("hex");

  return platformPrisma.$transaction(async tx => {
    await assertPlatformRuntimeRole(tx);
    await tx.$queryRaw`SELECT
      set_config('app.platform_actor_id', ${initial.userId}, true),
      set_config('app.platform_session_token_hash', ${tokenHash}, true),
      set_config('app.email_verification_token_hash', '', true)
    `;

    // RLS limits these reads to this exact OWNER and this exact current MFA session.
    const [user, session] = await Promise.all([
      tx.user.findUnique({
        where: { id: initial.userId },
        select: { id: true, platformRole: true, emailVerifiedAt: true, disabledAt: true }
      }),
      tx.session.findUnique({
        where: { tokenHash },
        select: {
          userId: true, expiresAt: true, revokedAt: true,
          assurance: true, mfaAuthenticatedAt: true
        }
      })
    ]);

    if (
      !user || user.id !== initial.userId || user.platformRole !== "OWNER" ||
      !user.emailVerifiedAt || user.disabledAt ||
      !session || session.userId !== initial.userId || session.revokedAt ||
      session.expiresAt.getTime() <= now.getTime() ||
      session.assurance !== "MFA" ||
      !(session.mfaAuthenticatedAt instanceof Date) ||
      session.mfaAuthenticatedAt.getTime() > now.getTime() ||
      now.getTime() - session.mfaAuthenticatedAt.getTime() > MFA_FRESH_MS
    ) return { authorized: false };

    const value = await callback(tx, { userId: user.id });
    return { authorized: true, userId: user.id, value };
  }, { timeout: 15000, ...(isolationLevel ? { isolationLevel } : {}) });
}

/**
 * Public email confirmation receives a narrowly scoped bearer capability.
 * RLS permits access only to the verification token whose hash is installed
 * in this transaction-local setting; no owner-wide actor context is created.
 */
export async function withEmailVerificationTransaction<T>({
  tokenHash,
  callback
}: {
  tokenHash: string;
  callback: (tx: PlatformTransaction) => Promise<T>;
}): Promise<T> {
  if (!/^[a-f0-9]{64}$/.test(tokenHash)) {
    throw new Error("INVALID_EMAIL_VERIFICATION_CAPABILITY");
  }
  return platformPrisma.$transaction(async tx => {
    await assertPlatformRuntimeRole(tx);
    await tx.$queryRaw`SELECT
      set_config('app.platform_actor_id', '', true),
      set_config('app.platform_session_token_hash', '', true),
      set_config('app.email_verification_token_hash', ${tokenHash}, true)
    `;
    return callback(tx);
  }, { timeout: 10000 });
}
