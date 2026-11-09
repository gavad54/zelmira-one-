export function allowIpRateLimit(
  fingerprint: string | null | undefined,
  limit: number,
  windowMs: number,
  allowAttempt: (fingerprint: string, limit: number, windowMs: number) => Promise<boolean>
): Promise<boolean>;
