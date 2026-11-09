import { Prisma, PlatformRole, EmailPurpose, AuthTokenPurpose } from "@prisma/client";
import { z } from "zod";
import { hashPassword, isSameOriginRequest } from "@/lib/auth-core.mjs";
import {
  actionUrl,
  allowAttempt,
  createActionToken,
  noStoreJson,
  requestFingerprint,
  safeEqualText,
  sendActionEmail
} from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return noStoreJson({ error: "invalid_origin" }, 403);
  }

  const parsed = z.object({
    bootstrapToken: z.string().min(32).max(512),
    email: z.string().trim().email().max(254),
    displayName: z.string().trim().min(2).max(80),
    password: z.string().min(12).max(128)
  }).strict().safeParse(await request.json().catch(() => null));

  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);

  const expected = process.env.VAYRO_OWNER_BOOTSTRAP_TOKEN;
  if (!expected || expected.length < 32 || !safeEqualText(parsed.data.bootstrapToken, expected)) {
    return noStoreJson({ error: "bootstrap_unavailable" }, 403);
  }

  // Only a caller holding the high-entropy one-time bootstrap secret may consume
  // the shared setup budget. Invalid unauthenticated requests cannot lock out
  // the legitimate initial owner. Do not infer client IP from untrusted headers.
  if (!await allowAttempt(
    await requestFingerprint("owner-bootstrap", "initial"),
    5,
    60 * 60 * 1000
  )) {
    return noStoreJson({ error: "try_again_later" }, 429);
  }

  try {
    const email = parsed.data.email.toLowerCase();
    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.$transaction(async tx => {
      const exists = await tx.user.count({
        where: { platformRole: { in: [PlatformRole.OWNER, PlatformRole.PLATFORM_ADMIN] } }
      });
      if (exists > 0) throw new Error("BOOTSTRAP_ALREADY_USED");

      const created = await tx.user.create({
        data: {
          email,
          displayName: parsed.data.displayName,
          passwordHash,
          platformRole: PlatformRole.OWNER
        }
      });

      await tx.emailContact.create({
        data: {
          email,
          label: "ایمیل اولیه مالک",
          purposes: [EmailPurpose.OWNER],
          enabled: true
        }
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: created.id,
          action: "owner.bootstrap_completed",
          resource: "User",
          resourceId: created.id,
          metadata: {
            method: "one_time_deployment_secret",
            emailVerificationRequired: true
          }
        }
      });

      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    // Do not issue an owner session until mailbox ownership is proven.
    // The public resend-verification endpoint remains available if delivery fails.
    try {
      const verificationToken = await createActionToken(
        user.id,
        AuthTokenPurpose.EMAIL_VERIFY,
        24 * 60 * 60 * 1000
      );
      await sendActionEmail(
        email,
        "تأیید ایمیل مالک وایرو",
        actionUrl("/verify-email", verificationToken),
        "برای فعال‌سازی دسترسی مالک، نشانی ایمیل خود را تأیید کنید. اعتبار پیوند ۲۴ ساعت است."
      );
    } catch {
      return noStoreJson({
        created: true,
        authenticated: false,
        verification: "required",
        error: "verification_delivery_unavailable"
      }, 503);
    }

    return noStoreJson({
      created: true,
      authenticated: false,
      verification: "required",
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        platformRole: user.platformRole
      }
    }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "BOOTSTRAP_ALREADY_USED") {
      return noStoreJson({ error: "bootstrap_already_used" }, 409);
    }
    return noStoreJson({ error: "bootstrap_failed" }, 500);
  }
}
