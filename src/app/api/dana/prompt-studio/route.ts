import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentSession, allowAttempt, sha256, noStoreJson } from "@/lib/auth-service";
import { authPrisma, assertAuthRuntimeRole } from "@/lib/auth-prisma";
import { getTenantPrisma } from "@/lib/tenant-prisma";
import { withTenantRequestTransaction } from "@/lib/tenant-request-transaction.mjs";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { buildBusinessPrompt } from "@/lib/prompt-studio.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  tenantId: z.string().min(1).max(128),
  business: z.string().trim().min(2).max(1200),
  goal: z.string().trim().min(2).max(1200),
  audience: z.string().trim().min(2).max(1200),
  tone: z.string().trim().min(2).max(1200),
  context: z.string().max(3000).optional().default(""),
  constraints: z.string().max(3000).optional().default(""),
  outputFormat: z.string().trim().min(2).max(1200)
}).strict();

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  await assertAuthRuntimeRole();
  const session = await currentSession().catch(() => null);
  if (!session) return noStoreJson({ error: "unauthorized" }, 401);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_input" }, 400);

  try {
    const allowed = await allowAttempt(sha256("ai:dana-prompt-studio:" + session.user.id), 30, 60_000);
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
      callback: (_tx, actor) => actor.userId
    });
    if (!access.authorized) return noStoreJson({ error: "tenant_access_denied" }, 403);

    const prompt = buildBusinessPrompt(parsed.data);
    return noStoreJson({
      prompt,
      generatedBy: "VAYRO_PROMPT_TEMPLATE_ENGINE",
      aiProviderUsed: false,
      persisted: false
    });
  } catch {
    return noStoreJson({ error: "prompt_studio_unavailable" }, 503);
  }
}
