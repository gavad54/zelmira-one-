const PRODUCT_STATES = new Set(["ACTIVE", "MAINTENANCE", "PLANNED", "RETIRED"]);

export function resolveProductAccess(license, now = new Date()) {
  if (!license || typeof license !== "object") return { allowed: false, reason: "no_license" };
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) return { allowed: false, reason: "invalid_clock" };
  if (!PRODUCT_STATES.has(license.productStatus)) return { allowed: false, reason: "product_unavailable" };
  if (license.productStatus !== "ACTIVE") return { allowed: false, reason: "product_unavailable" };
  if (license.active !== true) return { allowed: false, reason: "license_inactive" };
  const startsAt = license.startsAt instanceof Date ? license.startsAt : new Date(license.startsAt);
  const endsAt = license.endsAt == null ? null : (license.endsAt instanceof Date ? license.endsAt : new Date(license.endsAt));
  if (Number.isNaN(startsAt.getTime()) || (endsAt && Number.isNaN(endsAt.getTime()))) {
    return { allowed: false, reason: "invalid_license" };
  }
  if (startsAt.getTime() > now.getTime()) return { allowed: false, reason: "not_started" };
  if (endsAt && endsAt.getTime() <= now.getTime()) return { allowed: false, reason: "expired" };
  return { allowed: true, reason: "active" };
}
