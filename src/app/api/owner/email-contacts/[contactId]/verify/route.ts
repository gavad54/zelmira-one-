import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { authorizeOwnerSession } from "@/lib/owner-session.mjs";
import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/email-provider";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ contactId: string }> };
export async function POST(request: Request, context: Context) {
  const token = (await cookies()).get("vayro_session")?.value;
  const owner = await authorizeOwnerSession({ sessionToken: token, db: prisma });
  if (!owner.authorized) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  const { contactId } = await context.params;
  const contact = await prisma.emailContact.findUnique({ where: { id: contactId } });
  if (!contact || !contact.enabled) return NextResponse.json({ error: "not_found_or_disabled" }, { status: 404 });
  if (contact.verifiedAt) return NextResponse.json({ error: "already_verified" }, { status: 409 });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return NextResponse.json({ error: "email_service_not_configured" }, { status: 503 });
  let verificationUrl: URL;
  try { verificationUrl = new URL("/owner/email-settings", appUrl); }
  catch { return NextResponse.json({ error: "email_service_not_configured" }, { status: 503 }); }
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  verificationUrl.searchParams.set("verify", rawToken);
  try {
    await prisma.emailContactVerificationToken.create({ data: { tokenHash, contactId, expiresAt } });
    await sendTransactionalEmail({
      to: contact.email,
      subject: "تأیید نشانی ایمیل در وایرو",
      text: "برای تأیید این نشانی در وایرو، پیوند زیر را باز کنید. این پیوند تا ۳۰ دقیقه معتبر است: " + verificationUrl.toString(),
      html: '<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:2"><h2>تأیید ایمیل وایرو</h2><p>برای تأیید این نشانی، پیوند زیر را باز کنید. اعتبار آن ۳۰ دقیقه است.</p><p><a href="' + verificationUrl.toString().replace(/&/g, "&amp;").replace(/"/g, "&quot;") + '">تأیید نشانی ایمیل</a></p><p>اگر این درخواست را انجام نداده‌اید، این پیام را نادیده بگیرید.</p></div>'
    });
    return NextResponse.json({ sent: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    await prisma.emailContactVerificationToken.deleteMany({ where: { tokenHash } }).catch(() => undefined);
    return NextResponse.json({ error: "email_service_not_configured_or_delivery_failed" }, { status: 503 });
  }
}
