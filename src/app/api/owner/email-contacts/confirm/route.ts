import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { withEmailVerificationTransaction } from "@/lib/platform-request-transaction";
import { allowIpAttempt } from "@/lib/auth-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  let allowed: boolean;
  try {
    allowed = await allowIpAttempt("owner-email-contact-confirm", 20, 15 * 60 * 1000);
  } catch {
    return NextResponse.json({ error: "verification_temporarily_unavailable" }, {
      status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "60" }
    });
  }
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, {
      status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "900" }
    });
  }

  const body = await request.json().catch(() => null) as { token?: unknown } | null;
  if (!body || typeof body.token !== "string" || !/^[a-f0-9]{64}$/.test(body.token)) {
    return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  const tokenHash = createHash("sha256").update(body.token).digest("hex");

  try {
    const verified = await withEmailVerificationTransaction({
      tokenHash,
      callback: async tx => {
        const record = await tx.emailContactVerificationToken.findUnique({
          where: { tokenHash },
          include: { contact: true }
        });
        if (!record || record.consumedAt || record.expiresAt.getTime() <= Date.now() || !record.contact.enabled) {
          return false;
        }

        const now = new Date();
        const consumed = await tx.emailContactVerificationToken.updateMany({
          where: { id: record.id, consumedAt: null, expiresAt: { gt: now } },
          data: { consumedAt: now }
        });
        if (consumed.count !== 1) return false;

        await tx.emailContact.update({
          where: { id: record.contactId },
          data: { verifiedAt: now },
          select: { id: true }
        });

        const account = await tx.user.findUnique({
          where: { email: record.contact.email },
          select: { id: true, emailVerifiedAt: true }
        });
        if (account && !account.emailVerifiedAt) {
          await tx.user.update({
            where: { id: account.id },
            data: { emailVerifiedAt: now },
            select: { id: true }
          });
        }

        await tx.auditEvent.create({
          data: {
            actorUserId: null,
            action: "email_contact.verified",
            resource: "EmailContact",
            resourceId: record.contactId,
            metadata: { verification: "email_link", accountEmailMatched: Boolean(account) }
          },
          select: { id: true }
        });
        return true;
      }
    });

    if (!verified) return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 400 });
    return NextResponse.json({ verified: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "verification_failed" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
