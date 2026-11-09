import { z } from "zod";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { clearSessionCookie, currentSession, noStoreJson } from "@/lib/auth-service";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await assertAuthRuntimeRole();
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  const session = await currentSession();
  if (!session) return noStoreJson({ error: "unauthenticated" }, 401);

  const parsed = z.object({ sessionId: z.string().min(1).max(128) }).strict()
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_request" }, 400);

  const target = await authPrisma.session.findFirst({
    where: { id: parsed.data.sessionId, userId: session.user.id, revokedAt: null },
    select: { id: true }
  });
  if (!target) return noStoreJson({ error: "session_not_found" }, 404);

  const revoked = await authPrisma.session.updateMany({
    where: { id: target.id, userId: session.user.id, revokedAt: null },
    data: { revokedAt: new Date() }
  });
  if (revoked.count !== 1) return noStoreJson({ error: "session_not_found" }, 404);

  await authPrisma.auditEvent.create({
    data: {
      actorUserId: session.user.id,
      action: "auth.session.revoked",
      resource: "Session",
      resourceId: target.id
    },
  select: { id: true }});

  const currentRevoked = target.id === session.sessionId;
  if (currentRevoked) await clearSessionCookie();
  return noStoreJson({ revoked: true, currentSessionRevoked: currentRevoked });
}
