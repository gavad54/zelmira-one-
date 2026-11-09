import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentSession } from "@/lib/auth-service";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { buildBusinessPrompt } from "@/lib/prompt-studio.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  business: z.string().trim().min(2).max(1200),
  goal: z.string().trim().min(2).max(1200),
  audience: z.string().trim().min(2).max(1200),
  tone: z.string().trim().min(2).max(1200),
  context: z.string().max(3000).optional().default(""),
  constraints: z.string().max(3000).optional().default(""),
  outputFormat: z.string().trim().min(2).max(1200)
}).strict();

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  const session = await currentSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400, headers: { "Cache-Control": "no-store" } });

  const prompt = buildBusinessPrompt(parsed.data);
  return NextResponse.json({
    prompt,
    generatedBy: "VAYRO_PROMPT_TEMPLATE_ENGINE",
    aiProviderUsed: false,
    persisted: false
  }, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
