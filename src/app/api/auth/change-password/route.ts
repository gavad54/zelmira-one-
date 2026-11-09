import { z } from "zod";
import { isSameOriginRequest, hashPassword, verifyPassword } from "@/lib/auth-core.mjs";
import {
  allowAttempt, allowIpAttempt, clearSessionCookie, currentSession,
  noStoreJson, requestFingerprint
} from "@/lib/auth-service";
import { isRecentMfa } from "@/lib/mfa-service";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";

export const runtime = "nodejs";

const input = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(12).max(128)
    .refine(value => Buffer.byteLength(value, "utf8") <= 1024, "password_too_long")
}).strict();

export async function POST(request: Request) {
  await assertAuthRuntimeRole();
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);

  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.currentPassword === parsed.data.newPassword) {
    return noStoreJson({ error: "invalid_request" }, 400);
  }

  const session = await currentSession();
  if (!session) return noStoreJson({ error: "unauthenticated" }, 401);

  const limits = await Promise.all([
    allowIpAttempt("password-change-ip", 10, 60 * 60 * 1000),
    allowAttempt(await requestFingerprint("password-change-user", session.user.id), 5, 15 * 60 * 1000)
  ]);
  if (limits.some(allowed => !allowed)) return noStoreJson({ error: "try_again_later" }, 429);

  try {
    const user = await authPrisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true, platformRole: true, disabledAt: true }
    });
    if (!user || user.disabledAt || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
      return noStoreJson({ error: "invalid_credentials" }, 401);
    }

    const [privilegedMembership, mfa] = await Promise.all([
      authPrisma.membership.findFirst({
        where: { userId: user.id, role: { in: ["OWNER", "ADMIN"] }, tenant: { status: "ACTIVE" } },
        select: { id: true }
      }),
      authPrisma.userMfa.findUnique({ where: { userId: user.id }, select: { enabledAt: true } })
    ]);
    const privileged = user.platformRole === "OWNER" || user.platformRole === "PLATFORM_ADMIN" || Boolean(privilegedMembership);
    if ((privileged || mfa?.enabledAt) &&
        !isRecentMfa(session.assurance, session.mfaAuthenticatedAt)) {
      return noStoreJson({ error: "mfa_reauthentication_required" }, 403);
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);
    const now = new Date();
    await authPrisma.$transaction(async tx => {
      const activeSession = await tx.session.findFirst({
        where: {
          id: session.sessionId, userId: user.id, revokedAt: null,
          expiresAt: { gt: now }
        },
        select: { id: true }
      });
      if (!activeSession) throw new Error("SESSION_NO_LONGER_ACTIVE");

      const updated = await tx.user.updateMany({
        where: { id: user.id, passwordHash: user.passwordHash, disabledAt: null },
        data: { passwordHash }
      });
      if (updated.count !== 1) throw new Error("PASSWORD_CHANGED_CONCURRENTLY");

      const revoked = await tx.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: now }
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: user.id,
          action: "auth.password.changed",
          resource: "User",
          resourceId: user.id,
          metadata: { revokedSessionCount: revoked.count }
        },
      select: { id: true }});
    });

    await clearSessionCookie();
    return noStoreJson({ changed: true, authenticated: false });
  } catch (error) {
    if (error instanceof Error && error.message === "PASSWORD_CHANGED_CONCURRENTLY") {
      return noStoreJson({ error: "password_changed_concurrently" }, 409);
    }
    if (error instanceof Error && error.message === "SESSION_NO_LONGER_ACTIVE") {
      return noStoreJson({ error: "unauthenticated" }, 401);
    }
    return noStoreJson({ error: "password_change_unavailable" }, 503);
  }
}
