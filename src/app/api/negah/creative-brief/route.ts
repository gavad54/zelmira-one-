import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentSession, allowAttempt, sha256, noStoreJson } from "@/lib/auth-service";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
import { getTenantPrisma } from "@/lib/tenant-prisma";
import { withTenantRequestTransaction } from "@/lib/tenant-request-transaction.mjs";
import { resolveProductAccess } from "@/lib/product-access.mjs";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { buildCreativeBrief } from "@/lib/negah-creative-brief.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  tenantId: z.string().min(1).max(128),
  project: z.string().trim().min(2).max(1000),
  format: z.enum(["instagram-post","instagram-story","youtube-thumbnail","product-photo","ad-banner","logo-concept","brand-kit"]),
  audience: z.string().trim().min(2).max(1000),
  message: z.string().trim().min(2).max(1000),
  style: z.string().trim().min(2).max(1000),
  brandColors: z.string().max(1200).optional().default(""),
  requiredElements: z.string().max(1200).optional().default(""),
  avoid: z.string().max(1200).optional().default("")
}).strict();

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  await assertAuthRuntimeRole();
  const session = await currentSession().catch(() => null);
  if (!session) return noStoreJson({ error: "unauthorized" }, 401);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);

  try {
    const allowed = await allowAttempt(sha256("ai:negah-creative-brief:" + session.user.id), 20, 60_000);
    if (!allowed) return NextResponse.json({ error: "rate_limited" }, {
      status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60" }
    });

    const sessionToken = (await cookies()).get("vayro_session")?.value;
    const access = await withTenantRequestTransaction({
      authDb: authPrisma,
      tenantDb: getTenantPrisma(),
      sessionToken,
      tenantId: parsed.data.tenantId,
      action: "ai_generate",
      callback: async (tx, actor) => {
        const product = await tx.product.findUnique({
          where: { key: "NEGAH" },
          select: { id: true, status: true }
        });
        if (!product) return { licensed: false };
        const license = await tx.license.findUnique({
          where: { tenantId_productId: { tenantId: actor.tenantId, productId: product.id } },
          select: { active: true, startsAt: true, endsAt: true }
        });
        const entitlement = resolveProductAccess(
          license ? { ...license, productStatus: product.status } : null
        );
        return { licensed: entitlement.allowed };
      }
    });
    if (!access.authorized) return noStoreJson({ error: "tenant_access_denied" }, 403);
    if (!access.value.licensed) return noStoreJson({ error: "negah_license_required" }, 403);

    return noStoreJson({
      brief: buildCreativeBrief(parsed.data),
      generatedBy: "VAYRO_NEGAH_BRIEF_ENGINE",
      imageProviderUsed: false,
      assetRendered: false,
      persisted: false
    });
  } catch {
    return noStoreJson({ error: "creative_brief_unavailable" }, 503);
  }
}
