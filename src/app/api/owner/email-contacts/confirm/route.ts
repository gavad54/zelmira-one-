import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { token?: unknown } | null;
  if (!body || typeof body.token !== "string" || !/^[a-f0-9]{64}$/.test(body.token)) return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 400 });
  const tokenHash = createHash("sha256").update(body.token).digest("hex");
  try {
    const verified = await prisma.$transaction(async tx => {
      const record = await tx.emailContactVerificationToken.findUnique({ where: { tokenHash }, include: { contact: true } });
      if (!record || record.consumedAt || record.expiresAt.getTime() <= Date.now() || !record.contact.enabled) return false;
      const consumed = await tx.emailContactVerificationToken.updateMany({ where: { id: record.id, consumedAt: null, expiresAt: { gt: new Date() } }, data: { consumedAt: new Date() } });
      if (consumed.count !== 1) return false;
      await tx.emailContact.update({ where: { id: record.contactId }, data: { verifiedAt: new Date() } });
      const account = await tx.user.findUnique({ where: { email: record.contact.email }, select: { id: true, emailVerifiedAt: true } });
      if (account && !account.emailVerifiedAt) {
        await tx.user.update({ where: { id: account.id }, data: { emailVerifiedAt: new Date() } });
      }
      await tx.auditEvent.create({ data: { actorUserId: account?.id, action: "email_contact.verified", resource: "EmailContact", resourceId: record.contactId, metadata: { verification: "email_link", accountEmailMatched: Boolean(account) } } });
      return true;
    });
    if (!verified) return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 400 });
    return NextResponse.json({ verified: true }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "verification_failed" }, { status: 500 }); }
}
