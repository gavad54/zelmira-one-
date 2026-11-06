import { randomBytes } from "node:crypto";
import { z } from "zod";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { allowAttempt, currentSession, noStoreJson, requestFingerprint } from "@/lib/auth-service";
import { createTenantWithOwnerAudit, listActiveTenants } from "@/lib/tenant-service.mjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createTenantInput = z.object({
  name: z.string().trim().min(2).max(100)
}).strict();

export async function GET() {
  try {
    const session = await currentSession();
    if (!session) return noStoreJson({ error: "unauthorized" }, 401);
    if (!session.user.emailVerifiedAt) {
      return noStoreJson({ error: "email_verification_required" }, 403);
    }

    const tenants = await listActiveTenants({ db: prisma, userId: session.user.id });
    return noStoreJson({ tenants });
  } catch {
    return noStoreJson({ error: "tenant_list_unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return noStoreJson({ error: "invalid_origin" }, 403);
  }

  try {
    const session = await currentSession();
    if (!session) return noStoreJson({ error: "unauthorized" }, 401);
    if (!session.user.emailVerifiedAt) {
      return noStoreJson({ error: "email_verification_required" }, 403);
    }

    const parsed = createTenantInput.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);

    const allowed = await allowAttempt(
      await requestFingerprint("tenant-create", session.user.id),
      5,
      60 * 60 * 1000
    );
    if (!allowed) return noStoreJson({ error: "try_again_later" }, 429);

    const tenant = await createTenantWithOwnerAudit({
      db: prisma,
      userId: session.user.id,
      name: parsed.data.name,
      slug: "vayro-" + randomBytes(8).toString("hex")
    });

    return noStoreJson({ tenant }, 201);
  } catch {
    return noStoreJson({ error: "tenant_creation_failed" }, 503);
  }
}
