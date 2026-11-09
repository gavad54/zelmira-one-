import { AuthTokenPurpose } from "@prisma/client";
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
import { assertPlatformRuntimeRole, platformPrisma } from "@/lib/platform-prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);

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
    await assertPlatformRuntimeRole();
    const createdRows = await platformPrisma.$queryRaw<Array<{
      id: string;
      email: string;
      displayName: string;
      platformRole: string;
    }>>`
      SELECT * FROM public.vayro_bootstrap_owner(
        ${email},
        ${parsed.data.displayName},
        ${passwordHash}
      )
    `;
    const user = createdRows[0];
    if (!user) throw new Error("BOOTSTRAP_FAILED");

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
    const message = error instanceof Error ? error.message : "";
    if (message.includes("BOOTSTRAP_ALREADY_USED")) {
      return noStoreJson({ error: "bootstrap_already_used" }, 409);
    }
    return noStoreJson({ error: "bootstrap_failed" }, 500);
  }
}
