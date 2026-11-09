import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentSession } from "@/lib/auth-service";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { buildCreativeBrief } from "@/lib/negah-creative-brief.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
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
  if (!isSameOriginRequest(request)) return NextResponse.json({error:"invalid_origin"},{status:403,headers:{"Cache-Control":"no-store"}});
  const session = await currentSession().catch(() => null);
  if (!session) return NextResponse.json({error:"unauthorized"},{status:401,headers:{"Cache-Control":"no-store"}});
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({error:"invalid_input"},{status:400,headers:{"Cache-Control":"no-store"}});
  return NextResponse.json({
    brief: buildCreativeBrief(parsed.data),
    generatedBy: "VAYRO_NEGAH_BRIEF_ENGINE",
    imageProviderUsed: false,
    assetRendered: false,
    persisted: false
  },{headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}
