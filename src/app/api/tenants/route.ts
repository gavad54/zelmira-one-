import { cookies } from "next/headers";
import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { allowAttempt, currentSession, noStoreJson, requestFingerprint } from "@/lib/auth-service";
import { createTenantInTransaction, listActiveTenants } from "@/lib/tenant-service.mjs";
import { withAuthenticatedUserTransaction } from "@/lib/tenant-request-transaction.mjs";
import { getTenantPrisma } from "@/lib/tenant-prisma";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createTenantInput = z.object({
  name: z.string().trim().min(2).max(100)
}).strict();

export async function GET() {
  await assertAuthRuntimeRole();
  try {
    const session = await currentSession();
    if (!session) return noStoreJson({ error: "unauthorized" }, 401);
    if (!session.user.emailVerifiedAt) {
      return noStoreJson({ error: "email_verification_required" }, 403);
    }
    const sessionToken = (await cookies()).get("vayro_session")?.value;
    const result = await withAuthenticatedUserTransaction({
      authDb: authPrisma,
      tenantDb: getTenantPrisma(),
      sessionToken,
      callback: (tx, actor) => listActiveTenants({ db: tx, userId: actor.userId })
    });
    if (!result.authorized) return noStoreJson({ error: "unauthorized" }, 401);
    return noStoreJson({ tenants: result.value });
  } catch {
    return noStoreJson({ error: "tenant_list_unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  await assertAuthRuntimeRole();
  if (!isSameOriginRequest(request)) {
    return noStoreJson({ error: "invalid_origin" }, 403);
  }

  try {
    const session = await currentSession();
    if (!session) return noStoreJson({ error: "unauthorized" }, 401);
    if (!session.user.emailVerifiedAt) {
      return noStoreJson({ error: "email_verification_required" }, 403);
    }
    const sessionToken = (await cookies()).get("vayro_session")?.value;

    const parsed = createTenantInput.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);

    const allowed = await allowAttempt(
      await requestFingerprint("tenant-create", session.user.id),
      5,
      60 * 60 * 1000
    );
    if (!allowed) return noStoreJson({ error: "try_again_later" }, 429);

    const tenantId = randomUUID();
    const result = await withAuthenticatedUserTransaction({
      authDb: authPrisma,
      tenantDb: getTenantPrisma(),
      sessionToken,
      tenantId,
      callback: (tx, actor) => createTenantInTransaction({
        tx,
        userId: actor.userId,
        tenantId,
        name: parsed.data.name,
        slug: "vayro-" + randomBytes(8).toString("hex")
      })
    });
    if (!result.authorized) return noStoreJson({ error: "unauthorized" }, 401);

    return noStoreJson({ tenant: result.value }, 201);
  } catch {
    return noStoreJson({ error: "tenant_creation_failed" }, 503);
  }
}
