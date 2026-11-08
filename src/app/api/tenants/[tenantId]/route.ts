import { cookies } from "next/headers";
import { z } from "zod";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import {
  allowAttempt,
  noStoreJson,
  requestFingerprint
} from "@/lib/auth-service";
import { authorizeTenantRequest } from "@/lib/tenant-request-authorization.mjs";
import {
  closeTenantWithOwnerAudit,
  renameTenantWithOwnerAudit
} from "@/lib/tenant-service.mjs";
import { getTenantWorkspace } from "@/lib/tenant-workspace.mjs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ tenantId: string }>;
};

const renameInput = z.object({
  name: z.string().trim().min(2).max(100)
}).strict();

export async function GET(_request: Request, context: RouteContext) {
  const { tenantId } = await context.params;
  const sessionToken = (await cookies()).get("vayro_session")?.value;

  const result = await getTenantWorkspace({
    sessionToken,
    tenantId,
    db: prisma
  });

  return noStoreJson(result.body, result.status);
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return noStoreJson({ error: "invalid_origin" }, 403);
  }

  const parsed = renameInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);

  const { tenantId } = await context.params;
  const sessionToken = (await cookies()).get("vayro_session")?.value;

  try {
    const authorization = await authorizeTenantRequest({
      sessionToken,
      tenantId,
      action: "tenant_manage",
      db: prisma
    });
    if (!authorization.authorized) {
      return noStoreJson({ error: "unauthorized" }, 401);
    }

    const allowed = await allowAttempt(
      await requestFingerprint("tenant-rename", authorization.userId),
      10,
      60 * 60 * 1000
    );
    if (!allowed) return noStoreJson({ error: "try_again_later" }, 429);

    const tenant = await renameTenantWithOwnerAudit({
      db: prisma,
      tenantId,
      actorUserId: authorization.userId,
      name: parsed.data.name
    });
    if (!tenant) return noStoreJson({ error: "tenant_not_found" }, 404);

    return noStoreJson({ tenant });
  } catch {
    return noStoreJson({ error: "tenant_update_failed" }, 503);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return noStoreJson({ error: "invalid_origin" }, 403);
  }

  const { tenantId } = await context.params;
  const sessionToken = (await cookies()).get("vayro_session")?.value;

  try {
    const authorization = await authorizeTenantRequest({
      sessionToken,
      tenantId,
      action: "tenant_delete",
      db: prisma
    });
    if (!authorization.authorized) {
      return noStoreJson({ error: "unauthorized" }, 401);
    }

    const allowed = await allowAttempt(
      await requestFingerprint("tenant-close", authorization.userId),
      3,
      60 * 60 * 1000
    );
    if (!allowed) return noStoreJson({ error: "try_again_later" }, 429);

    const tenant = await closeTenantWithOwnerAudit({
      db: prisma,
      tenantId,
      actorUserId: authorization.userId
    });
    if (!tenant) return noStoreJson({ error: "tenant_not_found" }, 404);

    return noStoreJson({ tenant, closed: true });
  } catch {
    return noStoreJson({ error: "tenant_close_failed" }, 503);
  }
}
