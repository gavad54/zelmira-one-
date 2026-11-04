import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { EmailPurpose } from "@prisma/client";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { authorizeOwnerSession } from "@/lib/owner-session.mjs";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const purposeValues = Object.values(EmailPurpose);
const createSchema = z.object({
  email: z.string().trim().email().max(254),
  label: z.string().trim().min(2).max(60),
  purposes: z.array(z.enum(purposeValues as [string, ...string[]])).min(1).max(5)
}).strict();
async function ownerId() {
  const token = (await cookies()).get("vayro_session")?.value;
  const result = await authorizeOwnerSession({ sessionToken: token, db: prisma });
  return result.authorized ? result.userId : null;
}
function unauthorized() { return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } }); }
export async function GET() {
  if (!(await ownerId())) return unauthorized();
  const contacts = await prisma.emailContact.findMany({
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: { id: true, email: true, label: true, purposes: true, enabled: true, isPrimary: true, verifiedAt: true, createdAt: true, updatedAt: true }
  });
  return NextResponse.json({ contacts }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  const actorId = await ownerId();
  if (!actorId) return unauthorized();
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  try {
    const contact = await prisma.$transaction(async (tx) => {
      const created = await tx.emailContact.create({
        data: { email: parsed.data.email.toLowerCase(), label: parsed.data.label, purposes: parsed.data.purposes as EmailPurpose[] },
        select: { id: true, email: true, label: true, purposes: true, enabled: true, isPrimary: true, verifiedAt: true, createdAt: true }
      });
      await tx.auditEvent.create({ data: { actorUserId: actorId, action: "email_contact.created", resource: "EmailContact", resourceId: created.id, metadata: { purposes: created.purposes } } });
      return created;
    });
    return NextResponse.json({ contact, verification: "required" }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") return NextResponse.json({ error: "email_already_exists" }, { status: 409 });
    return NextResponse.json({ error: "contact_creation_failed" }, { status: 500 });
  }
}
