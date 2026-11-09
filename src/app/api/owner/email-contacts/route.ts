import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { EmailPurpose } from "@prisma/client";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { authorizeOwnerSession } from "@/lib/owner-session.mjs";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
import { withPlatformOwnerTransaction } from "@/lib/platform-request-transaction";
import { allowAttempt, sha256 } from "@/lib/auth-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const purposeValues = Object.values(EmailPurpose);
const createSchema = z.object({
  email: z.string().trim().email().max(254),
  label: z.string().trim().min(2).max(60),
  purposes: z.array(z.enum(purposeValues as [string, ...string[]])).min(1).max(5)
}).strict();

async function ownerId() {
  await assertAuthRuntimeRole();
  const token = (await cookies()).get("vayro_session")?.value;
  const result = await authorizeOwnerSession({ sessionToken: token, db: authPrisma });
  return result.authorized ? result.userId : null;
}
async function sessionToken() {
  return (await cookies()).get("vayro_session")?.value;
}
function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      callback: tx => tx.emailContact.findMany({
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        select: {
          id: true, email: true, label: true, purposes: true, enabled: true,
          isPrimary: true, verifiedAt: true, createdAt: true, updatedAt: true
        }
      })
    });
    if (!result.authorized) return unauthorized();
    return NextResponse.json({ contacts: result.value }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "contacts_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  const actorId = await ownerId();
  if (!actorId) return unauthorized();
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  if (!await allowAttempt(sha256("owner-email-contact-create:" + actorId), 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "3600" } });
  }
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });

  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      callback: async (tx, actor) => {
        const contact = await tx.emailContact.create({
          data: {
            email: parsed.data.email.toLowerCase(),
            label: parsed.data.label,
            purposes: parsed.data.purposes as EmailPurpose[]
          },
          select: {
            id: true, email: true, label: true, purposes: true, enabled: true,
            isPrimary: true, verifiedAt: true, createdAt: true
          }
        });
        await tx.auditEvent.create({
          data: {
            actorUserId: actor.userId,
            action: "email_contact.created",
            resource: "EmailContact",
            resourceId: contact.id,
            metadata: { purposes: contact.purposes }
          },
          select: { id: true }
        });
        return contact;
      }
    });
    if (!result.authorized) return unauthorized();
    return NextResponse.json({ contact: result.value, verification: "required" }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "email_already_exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "contact_creation_failed" }, { status: 500 });
  }
}
