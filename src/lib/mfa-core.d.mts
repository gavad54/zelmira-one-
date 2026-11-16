export interface EncryptedTotpSecret {
  readonly version: number;
  readonly iv: string;
  readonly ciphertext: string;
  readonly authTag: string;
}

export interface VerifyTotpOptions {
  secret: string;
  token: string;
  now?: number;
  window?: number;
  lastAcceptedStep?: number;
}

export function generateTotpSecret(): string;
export function verifyTotp(options: VerifyTotpOptions): number | null;
export function encryptTotpSecret(secret: string, keyMaterial?: string): EncryptedTotpSecret;
export function decryptTotpSecret(envelope: EncryptedTotpSecret, keyMaterial?: string): string;
export function createOtpAuthUri(options: {
  secret: string;
  accountName: string;
  issuer?: string;
}): string;
