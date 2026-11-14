import { z } from "zod";
import { isSameOriginRequest, verifyLoginPassword } from "@/lib/auth-core.mjs";
import {
  allowIpAttempt,
  allowAttempt,
  issueSession,
  noStoreJson,
  requestFingerprint
} from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);

  const parsed = z.object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(128)
  }).strict().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_credentials" }, 400);

  const email = parsed.data.email.toLowerCase();
  const limits = await Promise.all([
    allowIpAttempt("login-ip", 8, 900000),
    allowAttempt(await requestFingerprint("login-email", email), 8, 900000)
  ]);
  if (limits.some(allowed => !allowed)) return noStoreJson({ error: "try_again_later" }, 429);

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await verifyLoginPassword(parsed.data.password, user?.passwordHash);
  if (!user || !valid || user.disabledAt || !user.emailVerifiedAt) {
    return noStoreJson({ error: "invalid_credentials" }, 401);
  }

  const isPlatformPrivileged =
    user.platformRole === "OWNER" || user.platformRole === "PLATFORM_ADMIN";
  const privilegedMembership = isPlatformPrivileged
    ? null
    : await prisma.membership.findFirst({
        where: {
          userId: user.id,
          role: { in: ["OWNER", "ADMIN"] },
          tenant: { status: "ACTIVE" }
        },
        select: { id: true }
      });

  // This branch has no end-to-end MFA challenge flow yet. Never issue a
  // password-only session to a platform owner/admin or active-tenant owner/admin.
  if (isPlatformPrivileged || privilegedMembership) {
    await prisma.auditEvent.create({
      data: {
        actorUserId: user.id,
        action: "auth.login.mfa_required",
        resource: "User",
        resourceId: user.id
      }
    });
    return noStoreJson({ error: "mfa_required" }, 403);
  }

  await issueSession(user.id);
  await prisma.auditEvent.create({
    data: {
      actorUserId: user.id,
      action: "auth.login",
      resource: "User",
      resourceId: user.id
    }
  });

  return noStoreJson({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      platformRole: user.platformRole
    }
  });
}
