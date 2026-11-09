import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { clearSessionCookie, currentSession, noStoreJson } from "@/lib/auth-service";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await assertAuthRuntimeRole();
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  const session = await currentSession();
  if (!session) return noStoreJson({ error: "unauthenticated" }, 401);

  const now = new Date();
  const result = await authPrisma.session.updateMany({
    where: { userId: session.user.id, revokedAt: null },
    data: { revokedAt: now }
  });

  await authPrisma.auditEvent.create({
    data: {
      actorUserId: session.user.id,
      action: "auth.session.all_revoked",
      resource: "User",
      resourceId: session.user.id,
      metadata: { revokedCount: result.count }
    },
  select: { id: true }});

  await clearSessionCookie();
  return noStoreJson({ revoked: true, revokedCount: result.count, authenticated: false });
}
