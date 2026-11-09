import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, EmailPurpose } from "@prisma/client";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { authorizeOwnerSession } from "@/lib/owner-session.mjs";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
import { withPlatformOwnerTransaction } from "@/lib/platform-request-transaction";
import { allowAttempt, sha256 } from "@/lib/auth-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z.object({
  label: z.string().trim().min(2).max(60).optional(),
  purposes: z.array(z.nativeEnum(EmailPurpose)).min(1).max(5).optional(),
  enabled: z.boolean().optional(),
  isPrimary: z.boolean().optional()
}).strict().refine(value => Object.keys(value).length > 0);

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
function isSerializationConflict(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2034";
}

type Context = { params: Promise<{ contactId: string }> };

export async function PATCH(request: Request, context: Context) {
  const actorId = await ownerId();
  if (!actorId) return unauthorized();
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  if (!await allowAttempt(sha256("owner-email-contact-update:" + actorId), 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "3600" } });
  }
  const { contactId } = await context.params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      callback: async (tx, actor) => {
        const current = await tx.emailContact.findUnique({ where: { id: contactId } });
        if (!current) return { kind: "not_found" as const };
        if (parsed.data.isPrimary === true && (parsed.data.enabled === false || !current.enabled || !current.verifiedAt)) {
          return { kind: "primary_conflict" as const };
        }
        const removesOwnerContact = current.enabled && Boolean(current.verifiedAt) &&
          current.purposes.includes(EmailPurpose.OWNER) &&
          (parsed.data.enabled === false ||
            (parsed.data.purposes !== undefined && !parsed.data.purposes.includes(EmailPurpose.OWNER)));
        if (removesOwnerContact) {
          const remainingOwnerContacts = await tx.emailContact.count({
            where: {
              id: { not: contactId },
              enabled: true,
              verifiedAt: { not: null },
              purposes: { has: EmailPurpose.OWNER }
            }
          });
          if (remainingOwnerContacts === 0) return { kind: "last_owner_contact" as const };
        }
        if (parsed.data.isPrimary === true) {
          await tx.emailContact.updateMany({
            where: { isPrimary: true, id: { not: contactId } },
            data: { isPrimary: false }
          });
        }
        const shouldPromoteReplacement = current.isPrimary && parsed.data.enabled === false;
        const updateData = {
          ...parsed.data,
          ...(parsed.data.purposes ? { purposes: parsed.data.purposes as EmailPurpose[] } : {}),
          ...(shouldPromoteReplacement ? { isPrimary: false } : {})
        };
        const contact = await tx.emailContact.update({
          where: { id: contactId },
          data: updateData,
          select: {
            id: true, email: true, label: true, purposes: true, enabled: true,
            isPrimary: true, verifiedAt: true, updatedAt: true
          }
        });
        if (shouldPromoteReplacement) {
          const replacement = await tx.emailContact.findFirst({
            where: { enabled: true, verifiedAt: { not: null }, id: { not: contactId } },
            orderBy: { createdAt: "asc" },
            select: { id: true }
          });
          if (replacement) await tx.emailContact.update({ where: { id: replacement.id }, data: { isPrimary: true } });
        }
        await tx.auditEvent.create({
          data: {
            actorUserId: actor.userId,
            action: "email_contact.updated",
            resource: "EmailContact",
            resourceId: contactId,
            metadata: { changedFields: Object.keys(parsed.data) }
          },
          select: { id: true }
        });
        return { kind: "updated" as const, contact };
      }
    });
    if (!result.authorized) return unauthorized();
    if (result.value.kind === "not_found") return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (result.value.kind === "primary_conflict") return NextResponse.json({ error: "primary_contact_must_be_enabled_and_verified" }, { status: 409 });
    if (result.value.kind === "last_owner_contact") return NextResponse.json({ error: "last_verified_owner_contact_cannot_be_disabled_or_reassigned" }, { status: 409 });
    return NextResponse.json({ contact: result.value.contact }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (isSerializationConflict(error)) {
      return NextResponse.json({ error: "contact_state_conflict_retry" }, { status: 409, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ error: "contact_update_failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: Context) {
  const actorId = await ownerId();
  if (!actorId) return unauthorized();
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  if (!await allowAttempt(sha256("owner-email-contact-delete:" + actorId), 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "3600" } });
  }
  const { contactId } = await context.params;
  try {
    const result = await withPlatformOwnerTransaction({
      sessionToken: await sessionToken(),
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      callback: async (tx, actor) => {
        const current = await tx.emailContact.findUnique({ where: { id: contactId } });
        if (!current) return { kind: "not_found" as const };
        if (current.enabled && current.verifiedAt && current.purposes.includes(EmailPurpose.OWNER)) {
          const remainingOwnerContacts = await tx.emailContact.count({
            where: {
              id: { not: contactId },
              enabled: true,
              verifiedAt: { not: null },
              purposes: { has: EmailPurpose.OWNER }
            }
          });
          if (remainingOwnerContacts === 0) return { kind: "last_owner_contact" as const };
        }
        await tx.emailContact.delete({ where: { id: contactId } });
        if (current.isPrimary) {
          const replacement = await tx.emailContact.findFirst({
            where: { enabled: true, verifiedAt: { not: null } },
            orderBy: { createdAt: "asc" },
            select: { id: true }
          });
          if (replacement) await tx.emailContact.update({ where: { id: replacement.id }, data: { isPrimary: true } });
        }
        await tx.auditEvent.create({
          data: {
            actorUserId: actor.userId,
            action: "email_contact.deleted",
            resource: "EmailContact",
            resourceId: contactId,
            metadata: { purposes: current.purposes }
          },
          select: { id: true }
        });
        return { kind: "deleted" as const };
      }
    });
    if (!result.authorized) return unauthorized();
    if (result.value.kind === "not_found") return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (result.value.kind === "last_owner_contact") return NextResponse.json({ error: "last_verified_owner_contact_cannot_be_deleted" }, { status: 409 });
    return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (isSerializationConflict(error)) {
      return NextResponse.json({ error: "contact_state_conflict_retry" }, { status: 409, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ error: "contact_delete_failed" }, { status: 500 });
  }
}
