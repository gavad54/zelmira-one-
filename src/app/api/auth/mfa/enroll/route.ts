import { z } from "zod";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { noStoreJson } from "@/lib/auth-service";
import { beginEnrollment } from "@/lib/mfa-service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  const parsed = z.object({ challengeToken: z.string().regex(/^[a-f0-9]{64}$/) }).strict()
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_request" }, 400);
  try {
    const setup = await beginEnrollment(parsed.data.challengeToken);
    if (!setup) return noStoreJson({ error: "enrollment_unavailable" }, 401);
    return noStoreJson({
      enrollmentRequired: true,
      secret: setup.secret,
      otpauthUrl: setup.otpauthUrl,
      algorithm: "SHA1",
      digits: 6,
      periodSeconds: 30
    }, 200);
  } catch {
    return noStoreJson({ error: "mfa_temporarily_unavailable" }, 503);
  }
}
