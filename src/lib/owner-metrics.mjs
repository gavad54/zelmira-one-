/**
 * Prisma predicate for a license that is active at the supplied instant.
 * A future-dated license must not be counted as active before startsAt.
 */
export function currentActiveLicenseWhere(now = new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new TypeError("INVALID_LICENSE_EVALUATION_TIME");
  }

  return {
    active: true,
    startsAt: { lte: now },
    OR: [{ endsAt: null }, { endsAt: { gt: now } }]
  };
}
