import { createHash } from "node:crypto";
const IDLE_TTL_MS = 30 * 60 * 1000;
const ACTIVITY_WRITE_INTERVAL_MS = 5 * 60 * 1000;

export async function authorizeOwnerSession({ sessionToken, db, now = new Date() }) {
  if (typeof sessionToken !== "string" || !/^[a-f0-9]{64}$/.test(sessionToken) || !db?.session || typeof db.session.findUnique !== "function" || typeof db.session.updateMany !== "function" || !(now instanceof Date) || Number.isNaN(now.getTime())) return { authorized: false };
  try {
    const tokenHash = createHash("sha256").update(sessionToken, "utf8").digest("hex");
    const session = await db.session.findUnique({ where: { tokenHash }, include: { user: { select: { id: true, platformRole: true, emailVerifiedAt: true, disabledAt: true } } } });
    if (!session || typeof session.id !== "string" || !(session.createdAt instanceof Date) || !(session.expiresAt instanceof Date) || session.expiresAt.getTime() <= now.getTime() || session.revokedAt || !session.user || typeof session.user.id !== "string" || session.user.platformRole !== "OWNER" || !session.user.emailVerifiedAt || session.user.disabledAt !== null) return { authorized: false };

    const lastActivityAt = session.lastSeenAt instanceof Date ? session.lastSeenAt : session.createdAt;
    if (now.getTime() - lastActivityAt.getTime() > IDLE_TTL_MS) {
      await db.session.updateMany({ where: { id: session.id, revokedAt: null }, data: { revokedAt: now } });
      return { authorized: false };
    }
    if (now.getTime() - lastActivityAt.getTime() >= ACTIVITY_WRITE_INTERVAL_MS) {
      const touched = await db.session.updateMany({
        where: { id: session.id, revokedAt: null, expiresAt: { gt: now } },
        data: { lastSeenAt: now }
      });
      if (touched.count !== 1) return { authorized: false };
    }

    if (session.assurance !== "MFA" || !(session.mfaAuthenticatedAt instanceof Date) || session.mfaAuthenticatedAt.getTime() > now.getTime() || now.getTime() - session.mfaAuthenticatedAt.getTime() > 12 * 60 * 60 * 1000) return { authorized: false };
    return { authorized: true, userId: session.user.id };
  } catch { return { authorized: false }; }
}
