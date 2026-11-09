import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentSession, allowAttempt, sha256, noStoreJson } from "@/lib/auth-service";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { generateImage } from "@/lib/ai-provider.mjs";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
import { getTenantPrisma } from "@/lib/tenant-prisma";
import { withTenantRequestTransaction } from "@/lib/tenant-request-transaction.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  tenantId: z.string().min(1).max(128),
  prompt: z.string().trim().min(3).max(4000),
  size: z.enum(["1024x1024", "1024x1536", "1536x1024"]).optional()
}).strict();

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  await assertAuthRuntimeRole();
  const session = await currentSession().catch(() => null);
  if (!session) return noStoreJson({ error: "unauthorized" }, 401);
  if (!session.user.emailVerifiedAt) return noStoreJson({ error: "email_verification_required" }, 403);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);

  let allowed: boolean;
  try {
    allowed = await allowAttempt(sha256("ai:negah:" + session.user.id), 3, 60000);
  } catch {
    return noStoreJson({ error: "generation_temporarily_unavailable" }, 503);
  }
  if (!allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60" } });

  const sessionToken = (await cookies()).get("vayro_session")?.value;
  try {
    const access = await withTenantRequestTransaction({
      authDb: authPrisma,
      tenantDb: getTenantPrisma(),
      sessionToken,
      tenantId: parsed.data.tenantId,
      action: "ai_generate",
      callback: async (_tx, actor) => actor.userId
    });
    if (!access.authorized) return noStoreJson({ error: "tenant_access_denied" }, 403);
    const generated = await generateImage(parsed.data);
    // Build a plain JSON object so Prisma's InputJsonValue accepts the provider DTO.
    const output = {
      imageUrl: generated.imageUrl,
      model: generated.model,
      revisedPrompt: generated.revisedPrompt
    };
    const stored = await withTenantRequestTransaction({
      authDb: authPrisma,
      tenantDb: getTenantPrisma(),
      sessionToken,
      tenantId: parsed.data.tenantId,
      action: "ai_generate",
      callback: (tx, actor) => tx.aiGeneration.create({
        data: {
          tenantId: actor.tenantId,
          userId: actor.userId,
          kind: "NEGAH_IMAGE",
          prompt: parsed.data.prompt,
          output
        },
        select: { id: true, createdAt: true }
      })
    });
    if (!stored.authorized) return noStoreJson({ error: "tenant_access_denied" }, 403);
    return noStoreJson({
      generationId: stored.value.id,
      createdAt: stored.value.createdAt,
      result: generated,
      billing: "NOT_CONNECTED",
      persisted: true,
      assetPersistence: "PROVIDER_URL_ONLY"
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "AI_PROVIDER_UNAVAILABLE";
    const status = code === "AI_PROVIDER_NOT_CONFIGURED" || code === "AI_IMAGE_MODEL_NOT_CONFIGURED" ? 503 :
      code === "AI_INPUT_INVALID" ? 400 : 502;
    return noStoreJson({ error: status === 503 ? "provider_not_configured" :
      status === 400 ? "invalid_input" : "generation_failed" }, status);
  }
}
