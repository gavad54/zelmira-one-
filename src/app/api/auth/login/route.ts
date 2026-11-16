import { randomBytes } from "node:crypto";
import { z } from "zod";
import { isSameOriginRequest, verifyLoginPassword } from "@/lib/auth-core.mjs";
import {
  allowIpAttempt,
  allowAttempt,
  issueSession,
  noStoreJson,
  requestFingerprint,
  sha256
} from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const MFA_CHALLENGE_TTL_MS = 5 * 60 * 1000;

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

  if (isPlatformPrivileged || privilegedMembership) {
    const credential = await prisma.mfaCredential.findUnique({
      where: { userId: user.id },
      select: { enabledAt: true }
    });
    const challengeToken = randomBytes(32).toString("hex");
    await prisma.mfaLoginChallenge.create({
      data: {
        userId: user.id,
        tokenHash: sha256(challengeToken),
        expiresAt: new Date(Date.now() + MFA_CHALLENGE_TTL_MS)
      }
    });
    await prisma.auditEvent.create({
      data: {
        actorUserId: user.id,
        action: credential?.enabledAt ? "auth.login.mfa_challenge_issued" : "auth.login.mfa_setup_required",
        resource: "User",
        resourceId: user.id
      }
    });
    return noStoreJson({
      authenticated: false,
      mfaRequired: true,
      mfaSetupRequired: !credential?.enabledAt,
      challengeToken
    }, 200);
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
