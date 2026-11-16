import { z } from "zod";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { createOtpAuthUri, encryptTotpSecret, generateTotpSecret } from "@/lib/mfa-core.mjs";
import { allowAttempt, noStoreJson, sha256 } from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  const parsed = z.object({ challengeToken: z.string().regex(/^[a-f0-9]{64}$/) }).strict()
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_request" }, 400);

  if (!await allowAttempt(sha256("mfa-enroll:" + parsed.data.challengeToken), 5, CHALLENGE_TTL_MS)) {
    return noStoreJson({ error: "try_again_later" }, 429);
  }

  const challenge = await prisma.mfaLoginChallenge.findUnique({
    where: { tokenHash: sha256(parsed.data.challengeToken) },
    include: { user: { select: { id: true, email: true, emailVerifiedAt: true, disabledAt: true, platformRole: true } } }
  });
  const now = new Date();
  if (!challenge || challenge.consumedAt || challenge.expiresAt <= now ||
      !challenge.user.emailVerifiedAt || challenge.user.disabledAt) {
    return noStoreJson({ error: "invalid_or_expired_challenge" }, 401);
  }

  const isPlatformPrivileged =
    challenge.user.platformRole === "OWNER" || challenge.user.platformRole === "PLATFORM_ADMIN";
  const privilegedMembership = isPlatformPrivileged ? null : await prisma.membership.findFirst({
    where: { userId: challenge.user.id, role: { in: ["OWNER", "ADMIN"] }, tenant: { status: "ACTIVE" } },
    select: { id: true }
  });
  if (!isPlatformPrivileged && !privilegedMembership) {
    return noStoreJson({ error: "forbidden" }, 403);
  }

  const existing = await prisma.mfaCredential.findUnique({ where: { userId: challenge.user.id } });
  if (existing?.enabledAt) return noStoreJson({ error: "mfa_already_enabled" }, 409);

  let encrypted;
  const secret = generateTotpSecret();
  try {
    encrypted = encryptTotpSecret(secret);
  } catch {
    return noStoreJson({ error: "mfa_encryption_not_configured" }, 503);
  }

  await prisma.mfaCredential.upsert({
    where: { userId: challenge.user.id },
    create: {
      userId: challenge.user.id,
      secretCiphertext: encrypted.ciphertext,
      secretIv: encrypted.iv,
      secretAuthTag: encrypted.authTag
    },
    update: {
      secretCiphertext: encrypted.ciphertext,
      secretIv: encrypted.iv,
      secretAuthTag: encrypted.authTag,
      keyVersion: encrypted.version,
      enabledAt: null,
      lastAcceptedStep: -1n
    }
  });

  const otpauthUri = createOtpAuthUri({ secret, accountName: challenge.user.email, issuer: "VAYRO" });
  return noStoreJson({
    enrollmentRequired: true,
    secret,
    otpauthUri,
    expiresInSeconds: Math.floor((challenge.expiresAt.getTime() - now.getTime()) / 1000)
  });
}
