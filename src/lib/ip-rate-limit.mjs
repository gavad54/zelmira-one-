/**
 * Fail-closed gate for IP-keyed throttling.
 * A missing or untrusted client fingerprint must never be interpreted as permission.
 */
export async function allowIpRateLimit(fingerprint, limit, windowMs, allowAttempt) {
  if (typeof fingerprint !== "string" || fingerprint.length === 0) return false;
  return allowAttempt(fingerprint, limit, windowMs);
}
