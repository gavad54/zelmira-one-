import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { EmailPurpose } from "@prisma/client";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { authorizeOwnerSession } from "@/lib/owner-session.mjs";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const updateSchema = z.object({
  label: z.string().trim().min(2).max(60).optional(),
  purposes: z.array(z.nativeEnum(EmailPurpose)).min(1).max(5).optional(),
  enabled: z.boolean().optional(),
  isPrimary: z.boolean().optional()
}).strict().refine(value => Object.keys(value).length > 0);
async function ownerId() {
  const token = (await cookies()).get("vayro_session")?.value;
  const result = await authorizeOwnerSession({ sessionToken: token, db: prisma });
  return result.authorized ? result.userId : null;
}
function unauthorized() { return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } }); }
type Context = { params: Promise<{ contactId: string }> };
export async function PATCH(request: Request, context: Context) {
  const actorId = await ownerId();
  if (!actorId) return unauthorized();
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  const { contactId } = await context.params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const current = await prisma.emailContact.findUnique({ where: { id: contactId } });
  if (!current) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (parsed.data.isPrimary === true && (parsed.data.enabled === false || !current.enabled || !current.verifiedAt)) return NextResponse.json({ error: "primary_contact_must_be_enabled_and_verified" }, { status: 409 });
  const remainsOwnerContact = parsed.data.enabled !== false && !(parsed.data.purposes && !parsed.data.purposes.includes(EmailPurpose.OWNER)) && current.enabled && Boolean(current.verifiedAt) && current.purposes.includes(EmailPurpose.OWNER);
  if (!remainsOwnerContact && current.enabled && current.verifiedAt && current.purposes.includes(EmailPurpose.OWNER)) {
    const count = await prisma.emailContact.count({ where: { id: { not: contactId }, enabled: true, verifiedAt: { not: null }, purposes: { has: EmailPurpose.OWNER } } });
    if (count === 0) return NextResponse.json({ error: "last_verified_owner_contact_cannot_be_disabled_or_reassigned" }, { status: 409 });
  }
  try {
    const updated = await prisma.$transaction(async tx => {
      if (parsed.data.isPrimary === true) await tx.emailContact.updateMany({ where: { isPrimary: true, id: { not: contactId } }, data: { isPrimary: false } });
      const shouldPromoteReplacement = current.isPrimary && parsed.data.enabled === false;
      const updateData = {
        ...parsed.data,
        ...(parsed.data.purposes ? { purposes: parsed.data.purposes as EmailPurpose[] } : {}),
        ...(shouldPromoteReplacement ? { isPrimary: false } : {})
      };
      const contact = await tx.emailContact.update({ where: { id: contactId }, data: updateData, select: { id: true, email: true, label: true, purposes: true, enabled: true, isPrimary: true, verifiedAt: true, updatedAt: true } });
      if (shouldPromoteReplacement) {
        const replacement = await tx.emailContact.findFirst({ where: { enabled: true, verifiedAt: { not: null }, id: { not: contactId } }, orderBy: { createdAt: "asc" }, select: { id: true } });
        if (replacement) await tx.emailContact.update({ where: { id: replacement.id }, data: { isPrimary: true } });
      }
      await tx.auditEvent.create({ data: { actorUserId: actorId, action: "email_contact.updated", resource: "EmailContact", resourceId: contactId, metadata: { changedFields: Object.keys(parsed.data) } } });
      return contact;
    });
    return NextResponse.json({ contact: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "contact_update_failed" }, { status: 500 }); }
}
export async function DELETE(request: Request, context: Context) {
  const actorId = await ownerId();
  if (!actorId) return unauthorized();
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  const { contactId } = await context.params;
  const current = await prisma.emailContact.findUnique({ where: { id: contactId } });
  if (!current) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (current.enabled && current.verifiedAt && current.purposes.includes(EmailPurpose.OWNER)) {
    const count = await prisma.emailContact.count({ where: { id: { not: contactId }, enabled: true, verifiedAt: { not: null }, purposes: { has: EmailPurpose.OWNER } } });
    if (count === 0) return NextResponse.json({ error: "last_verified_owner_contact_cannot_be_deleted" }, { status: 409 });
  }
  try {
    await prisma.$transaction(async tx => {
      await tx.emailContact.delete({ where: { id: contactId } });
      if (current.isPrimary) {
        const replacement = await tx.emailContact.findFirst({ where: { enabled: true, verifiedAt: { not: null } }, orderBy: { createdAt: "asc" }, select: { id: true } });
        if (replacement) await tx.emailContact.update({ where: { id: replacement.id }, data: { isPrimary: true } });
      }
      await tx.auditEvent.create({ data: { actorUserId: actorId, action: "email_contact.deleted", resource: "EmailContact", resourceId: contactId, metadata: { purposes: current.purposes } } });
    });
    return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "contact_delete_failed" }, { status: 500 }); }
}
