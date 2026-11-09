import { currentSession, noStoreJson } from "@/lib/auth-service";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await assertAuthRuntimeRole();
  const session = await currentSession();
  if (!session) return noStoreJson({ error: "unauthenticated" }, 401);

  const now = new Date();
  const idleCutoff = new Date(now.getTime() - 30 * 60 * 1000);
  const expiredIdle = await authPrisma.session.updateMany({
    where: {
      userId: session.user.id,
      revokedAt: null,
      expiresAt: { gt: now },
      OR: [
        { lastSeenAt: { lt: idleCutoff } },
        { lastSeenAt: null, createdAt: { lt: idleCutoff } }
      ]
    },
    data: { revokedAt: now }
  });
  if (expiredIdle.count > 0) {
    await authPrisma.auditEvent.create({
      data: {
        actorUserId: session.user.id,
        action: "auth.session.idle_expired",
        resource: "User",
        resourceId: session.user.id,
        metadata: { revokedCount: expiredIdle.count }
      },
      select: { id: true }
    });
  }

  const sessions = await authPrisma.session.findMany({
    where: {
      userId: session.user.id,
      revokedAt: null,
      expiresAt: { gt: now }
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      lastSeenAt: true,
      expiresAt: true,
      assurance: true,
      mfaAuthenticatedAt: true
    }
  });

  return noStoreJson({
    sessions: sessions.map(item => ({
      id: item.id,
      createdAt: item.createdAt.toISOString(),
      lastSeenAt: (item.lastSeenAt ?? item.createdAt).toISOString(),
      expiresAt: item.expiresAt.toISOString(),
      assurance: item.assurance,
      mfaAuthenticatedAt: item.mfaAuthenticatedAt?.toISOString() ?? null,
      current: item.id === session.sessionId
    }))
  });
}
