import { z } from "zod";
import {
  DUMMY_PASSWORD_HASH,
  isSameOriginRequest,
  verifyPassword
} from "@/lib/auth-core.mjs";
import {
  allowIpAttempt,
  allowAttempt,
  issueSession,
  noStoreJson,
  requestFingerprint
} from "@/lib/auth-service";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
import { createMfaChallenge, isPrivilegedRole } from "@/lib/mfa-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await assertAuthRuntimeRole();
  if (!isSameOriginRequest(request)) {
    return noStoreJson({ error: "invalid_origin" }, 403);
  }

  const parsed = z.object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(128)
  }).strict().safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return noStoreJson({ error: "invalid_credentials" }, 400);
  }

  const email = parsed.data.email.toLowerCase();
  const limits = await Promise.all([
    allowIpAttempt("login-ip", 8, 900000),
    allowAttempt(await requestFingerprint("login-email", email), 8, 900000)
  ]);
  if (limits.some(allowed => !allowed)) {
    return noStoreJson({ error: "try_again_later" }, 429);
  }

  const user = await authPrisma.user.findUnique({ where: { email } });

  // Always perform one approved-cost scrypt verification, including for unknown accounts.
  // The boolean result is never sufficient to authenticate without a real user record.
  const valid = await verifyPassword(
    parsed.data.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH
  );

  if (!user || !valid || user.disabledAt || !user.emailVerifiedAt) {
    return noStoreJson({ error: "invalid_credentials" }, 401);
  }

  const [membership, mfa] = await Promise.all([
    authPrisma.membership.findFirst({
      where: { userId: user.id, role: { in: ["OWNER", "ADMIN"] }, tenant: { status: "ACTIVE" } },
      select: { role: true }
    }),
    authPrisma.userMfa.findUnique({ where: { userId: user.id }, select: { enabledAt: true } })
  ]);
  if (isPrivilegedRole(user.platformRole, membership ? [membership.role] : [])) {
    const purpose = mfa?.enabledAt ? "LOGIN_MFA" : "MFA_ENROLLMENT";
    const challenge = await createMfaChallenge(user.id, purpose);
    await authPrisma.auditEvent.create({
      data: {
        actorUserId: user.id,
        action: purpose === "LOGIN_MFA" ? "auth.mfa.challenge.created" : "auth.mfa.enrollment.required",
        resource: "User",
        resourceId: user.id
      },
    select: { id: true }});
    return noStoreJson({
      authenticated: false,
      mfaRequired: true,
      enrollmentRequired: purpose === "MFA_ENROLLMENT",
      challengeToken: challenge.token,
      expiresAt: challenge.expiresAt.toISOString()
    }, 202);
  }

  await issueSession(user.id, "PASSWORD");
  await authPrisma.auditEvent.create({
    data: {
      actorUserId: user.id,
      action: "auth.login",
      resource: "User",
      resourceId: user.id
    },
  select: { id: true }});

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
