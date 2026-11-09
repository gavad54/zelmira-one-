import { z } from "zod";
import { isSameOriginRequest } from "@/lib/auth-core.mjs";
import { currentSession, noStoreJson, allowAttempt, sha256 } from "@/lib/auth-service";
import { isRecentMfa, regenerateRecoveryCodes } from "@/lib/mfa-service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  const session = await currentSession();
  if (!session || !isRecentMfa(session.assurance, session.mfaAuthenticatedAt)) {
    return noStoreJson({ error: "fresh_mfa_session_required" }, 403);
  }
  const allowed = await allowAttempt(sha256("mfa-recovery-rotate:" + session.user.id), 5, 15 * 60 * 1000);
  if (!allowed) return noStoreJson({ error: "try_again_later" }, 429);
  const parsed = z.object({ code: z.string().regex(/^(?:\d{6}|[a-f0-9]{32})$/) }).strict()
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: "invalid_request" }, 400);
  try {
    const codes = await regenerateRecoveryCodes(session.user.id, parsed.data.code);
    if (!codes) return noStoreJson({ error: "invalid_factor" }, 401);
    return noStoreJson({
      recoveryCodes: codes,
      recoveryCodesNotice: "کدهای قبلی باطل شدند. این کدها فقط همین یک‌بار نمایش داده می‌شوند."
    });
  } catch {
    return noStoreJson({ error: "mfa_temporarily_unavailable" }, 503);
  }
}
