import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { Prisma, AuthTokenPurpose, SessionAssurance } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSessionToken, getTrustedClientAddress, hashSessionToken } from "@/lib/auth-core.mjs";

export const SESSION_COOKIE = "vayro_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const MFA_ASSURANCE_TTL_MS = 12 * 60 * 60 * 1000;

function hasRecentMfaAssurance(
  assurance: SessionAssurance,
  mfaAuthenticatedAt: Date | null,
  now: Date
): boolean {
  return assurance === SessionAssurance.MFA &&
    mfaAuthenticatedAt instanceof Date &&
    mfaAuthenticatedAt.getTime() <= now.getTime() &&
    mfaAuthenticatedAt.getTime() > now.getTime() - MFA_ASSURANCE_TTL_MS;
}
export function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
export function randomActionToken(): string {
  return randomBytes(32).toString("hex");
}
export function safeEqualText(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8"), right = Buffer.from(b, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}
export function requestFingerprint(scope: string, identity: "all"): Promise<string | null>;
export function requestFingerprint(scope: string, identity: string): Promise<string>;
export async function requestFingerprint(scope: string, identity: string): Promise<string | null> {
  const normalizedIdentity = identity.toLowerCase();
  if (normalizedIdentity !== "all") return sha256(scope + ":identity:" + normalizedIdentity);
  const configuredHops = process.env.TRUSTED_PROXY_HOPS;
  if (!configuredHops || !/^\d+$/.test(configuredHops)) return null;
  const h = await headers();
  const clientAddress = getTrustedClientAddress(h.get("x-forwarded-for"), Number(configuredHops));
  return clientAddress ? sha256(scope + ":ip:" + clientAddress) : null;
}
/** Persistent DB-backed limiter; each identity gets a fixed window. */
export async function allowAttempt(keyHash: string, limit: number, windowMs: number): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);
  const result = await prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
    INSERT INTO "AuthRateLimit" ("keyHash", "windowStartedAt", "count", "expiresAt")
    VALUES (${keyHash}, ${now}, 1, ${new Date(now.getTime() + windowMs * 2)})
    ON CONFLICT ("keyHash") DO UPDATE SET
      "count" = CASE WHEN "AuthRateLimit"."windowStartedAt" <= ${windowStart} THEN 1 ELSE "AuthRateLimit"."count" + 1 END,
      "windowStartedAt" = CASE WHEN "AuthRateLimit"."windowStartedAt" <= ${windowStart} THEN ${now} ELSE "AuthRateLimit"."windowStartedAt" END,
      "expiresAt" = ${new Date(now.getTime() + windowMs * 2)}
    RETURNING "count"
  `);
  return (result[0]?.count ?? limit + 1) <= limit;
}

/** Skip IP-only throttling until the actual trusted proxy chain is configured. */
export async function allowIpAttempt(scope: string, limit: number, windowMs: number): Promise<boolean> {
  const keyHash = await requestFingerprint(scope, "all");
  return keyHash ? allowAttempt(keyHash, limit, windowMs) : true;
}
export async function createActionToken(userId: string, purpose: AuthTokenPurpose, ttlMs: number) {
  const token = randomActionToken();
  await prisma.authActionToken.create({
    data: { tokenHash: sha256(token), userId, purpose, expiresAt: new Date(Date.now() + ttlMs) }
  });
  return token;
}
export async function sendActionEmail(to: string, subject: string, url: string, description: string) {
  const { sendTransactionalEmail } = await import("@/lib/email-provider");
  const safeUrl = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  await sendTransactionalEmail({
    to, subject,
    text: description + "\n\n" + url + "\n\nاعتبار پیوند محدود است. اگر این درخواست را انجام نداده‌اید، پیام را نادیده بگیرید.",
    html: '<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:2"><h2>' + subject + '</h2><p>' + description + '</p><p><a href="' + safeUrl + '">ادامه در وایرو</a></p><p>اگر این درخواست را انجام نداده‌اید، پیام را نادیده بگیرید.</p></div>'
  });
}
export async function issueSession(
  userId: string,
  assurance: SessionAssurance = SessionAssurance.PASSWORD
) {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const mfaAuthenticatedAt = assurance === SessionAssurance.MFA ? new Date() : null;
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
      assurance,
      mfaAuthenticatedAt
    }
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", expires: expiresAt
  });
}
export async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, "", {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", expires: new Date(0)
  });
}
export async function currentSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const now = new Date();
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          platformRole: true,
          emailVerifiedAt: true,
          disabledAt: true,
          memberships: {
            where: {
              role: { in: ["OWNER", "ADMIN"] },
              tenant: { status: "ACTIVE" }
            },
            select: { id: true }
          }
        }
      }
    }
  });
  if (
    !session ||
    session.revokedAt !== null ||
    session.expiresAt.getTime() <= now.getTime() ||
    !session.user.emailVerifiedAt ||
    session.user.disabledAt
  ) return null;

  const requiresMfa =
    session.user.platformRole === "OWNER" ||
    session.user.platformRole === "PLATFORM_ADMIN" ||
    session.user.memberships.length > 0;
  if (requiresMfa && !hasRecentMfaAssurance(session.assurance, session.mfaAuthenticatedAt, now)) {
    return null;
  }

  return {
    sessionId: session.id,
    user: {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      platformRole: session.user.platformRole,
      emailVerifiedAt: session.user.emailVerifiedAt,
      disabledAt: session.user.disabledAt
    }
  };
}
export function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" } });
}
export function actionUrl(path: string, token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) throw new Error("NEXT_PUBLIC_APP_URL is missing");
  const url = new URL(path, base);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("Production action links must use HTTPS");
  url.hash = "token=" + token;
  return url.toString();
}
