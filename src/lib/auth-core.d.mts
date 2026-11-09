export const DUMMY_PASSWORD_HASH: string;
export function hashPassword(password: string): Promise<string>;
export function verifyPassword(password: string, encodedHash: string): Promise<boolean>;
export function createSessionToken(): string;
export function hashSessionToken(token: string): string;
export function isSameOriginRequest(request: Request): boolean;

export function parseTrustedProxyHops(value: string | undefined): number | null;
export function getTrustedClientAddress(forwardedFor: string | null, trustedProxyHops: number): string | null;
