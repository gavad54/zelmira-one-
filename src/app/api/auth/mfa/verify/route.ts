import { z } from "zod";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { noStoreJson } from "@/lib/auth-service";
import { verifyLoginChallenge } from "@/lib/mfa-service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  const parsed = z.object({
    challengeToken: z.string().regex(/^[a-f0-9]{64}$/),
    code: z.string().regex(/^(?:\d{6}|[a-f0-9]{32})$/)
  }).strict().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_request" }, 400);
  try {
    const verified = await verifyLoginChallenge(parsed.data.challengeToken, parsed.data.code);
    if (!verified) return noStoreJson({ error: "invalid_or_expired_challenge" }, 401);
    return noStoreJson({ authenticated: true, mfaVerified: true });
  } catch {
    return noStoreJson({ error: "mfa_temporarily_unavailable" }, 503);
  }
}
