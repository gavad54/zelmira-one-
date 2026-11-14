import { createHash } from "node:crypto";

const MFA_ASSURANCE_TTL_MS = 12 * 60 * 60 * 1000;

function hasRecentMfaAssurance(session, now) {
  return session.assurance === "MFA" &&
    session.mfaAuthenticatedAt instanceof Date &&
    session.mfaAuthenticatedAt.getTime() <= now.getTime() &&
    session.mfaAuthenticatedAt.getTime() > now.getTime() - MFA_ASSURANCE_TTL_MS;
}

export async function authorizeOwnerSession({ sessionToken, db, now = new Date() }) {
  if (
    typeof sessionToken !== "string" ||
    !/^[a-f0-9]{64}$/.test(sessionToken) ||
    !db?.session ||
    typeof db.session.findUnique !== "function" ||
    !(now instanceof Date) ||
    Number.isNaN(now.getTime())
  ) return { authorized: false };

  try {
    const tokenHash = createHash("sha256").update(sessionToken, "utf8").digest("hex");
    const session = await db.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            platformRole: true,
            emailVerifiedAt: true,
            disabledAt: true
          }
        }
      }
    });
    if (
      !session ||
      session.revokedAt !== null ||
      !(session.expiresAt instanceof Date) ||
      session.expiresAt.getTime() <= now.getTime() ||
      !hasRecentMfaAssurance(session, now) ||
      !session.user ||
      typeof session.user.id !== "string" ||
      session.user.platformRole !== "OWNER" ||
      !session.user.emailVerifiedAt ||
      session.user.disabledAt !== null
    ) return { authorized: false };

    return { authorized: true, userId: session.user.id };
  } catch {
    return { authorized: false };
  }
}
