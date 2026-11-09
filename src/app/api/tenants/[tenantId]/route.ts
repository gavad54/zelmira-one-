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
  closeTenantInTransaction,
  renameTenantInTransaction
} from "@/lib/tenant-service.mjs";
import { withTenantRequestTransaction } from "@/lib/tenant-request-transaction.mjs";
import { getTenantWorkspace } from "@/lib/tenant-workspace.mjs";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
import { getTenantPrisma } from "@/lib/tenant-prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ tenantId: string }>;
};

const renameInput = z.object({
  name: z.string().trim().min(2).max(100)
}).strict();

export async function GET(_request: Request, context: RouteContext) {
  await assertAuthRuntimeRole();
  const { tenantId } = await context.params;
  const sessionToken = (await cookies()).get("vayro_session")?.value;

  try {
    const result = await getTenantWorkspace({
      sessionToken,
      tenantId,
      authDb: authPrisma,
      tenantDb: getTenantPrisma()
    });
    return noStoreJson(result.body, result.status);
  } catch {
    return noStoreJson({ error: "workspace_unavailable" }, 503);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  await assertAuthRuntimeRole();
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
      db: authPrisma
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

    const result = await withTenantRequestTransaction({
      authDb: authPrisma,
      tenantDb: getTenantPrisma(),
      sessionToken,
      tenantId,
      action: "tenant_manage",
      callback: tx => renameTenantInTransaction({
        tx,
        tenantId,
        actorUserId: authorization.userId,
        name: parsed.data.name
      })
    });
    if (!result.authorized) return noStoreJson({ error: "unauthorized" }, 401);
    if (!result.value) return noStoreJson({ error: "tenant_not_found" }, 404);

    return noStoreJson({ tenant: result.value });
  } catch {
    return noStoreJson({ error: "tenant_update_failed" }, 503);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  await assertAuthRuntimeRole();
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
      db: authPrisma
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

    const result = await withTenantRequestTransaction({
      authDb: authPrisma,
      tenantDb: getTenantPrisma(),
      sessionToken,
      tenantId,
      action: "tenant_delete",
      callback: tx => closeTenantInTransaction({
        tx,
        tenantId,
        actorUserId: authorization.userId
      })
    });
    if (!result.authorized) return noStoreJson({ error: "unauthorized" }, 401);
    if (!result.value) return noStoreJson({ error: "tenant_not_found" }, 404);

    return noStoreJson({ tenant: result.value, closed: true });
  } catch {
    return noStoreJson({ error: "tenant_close_failed" }, 503);
  }
}
