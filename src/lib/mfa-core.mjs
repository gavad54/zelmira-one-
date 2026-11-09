import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
  createHash
} from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;

export function encodeBase32(input) {
  const bytes = Buffer.from(input);
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

export function decodeBase32(value) {
  if (typeof value !== "string" || value.length < 1 || !/^[A-Z2-7]+$/.test(value)) {
    throw new TypeError("Invalid Base32 secret");
  }
  let bits = 0;
  let accumulator = 0;
  const output = [];
  for (const char of value) {
    accumulator = (accumulator << 5) | BASE32_ALPHABET.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      output.push((accumulator >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

export function generateTotpSecret() {
  return encodeBase32(randomBytes(20));
}

export function totpAt(secret, timestampMs, periodSeconds = TOTP_PERIOD_SECONDS) {
  if (!Number.isSafeInteger(timestampMs) || timestampMs < 0 ||
      !Number.isSafeInteger(periodSeconds) || periodSeconds < 1) {
    throw new TypeError("Invalid TOTP time parameters");
  }
  const counter = BigInt(Math.floor(timestampMs / 1000 / periodSeconds));
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(counter);
  const digest = createHmac("sha1", decodeBase32(secret)).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % (10 ** TOTP_DIGITS)).padStart(TOTP_DIGITS, "0");
}

export function verifyTotp(secret, suppliedCode, timestampMs = Date.now(), window = 1) {
  if (typeof suppliedCode !== "string" || !/^\d{6}$/.test(suppliedCode) ||
      !Number.isSafeInteger(window) || window < 0 || window > 1) return null;
  const supplied = Buffer.from(suppliedCode, "ascii");
  for (let drift = -window; drift <= window; drift += 1) {
    const candidate = Buffer.from(totpAt(secret, timestampMs + drift * TOTP_PERIOD_SECONDS * 1000), "ascii");
    if (timingSafeEqual(candidate, supplied)) {
      return Math.floor(timestampMs / 1000 / TOTP_PERIOD_SECONDS) + drift;
    }
  }
  return null;
}

export function parseMfaEncryptionKey(hex = process.env.VAYRO_MFA_ENCRYPTION_KEY) {
  if (typeof hex !== "string" || !/^[a-fA-F0-9]{64}$/.test(hex)) {
    throw new Error("VAYRO_MFA_ENCRYPTION_KEY must be configured as 32-byte hex");
  }
  return Buffer.from(hex, "hex");
}

export function encryptTotpSecret(secret, key = parseMfaEncryptionKey()) {
  if (!Buffer.isBuffer(key) || key.length !== 32) throw new TypeError("Invalid AES-256 key");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptTotpSecret(envelope, key = parseMfaEncryptionKey()) {
  if (!Buffer.isBuffer(key) || key.length !== 32 || typeof envelope !== "string") {
    throw new TypeError("Invalid encrypted TOTP secret");
  }
  const parts = envelope.split(".");
  if (parts.length !== 3 || parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part))) {
    throw new TypeError("Invalid encrypted TOTP secret");
  }
  const [iv, tag, ciphertext] = parts.map(part => Buffer.from(part, "base64url"));
  if (iv.length !== 12 || tag.length !== 16 || ciphertext.length === 0) {
    throw new TypeError("Invalid encrypted TOTP secret");
  }
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function generateRecoveryCodes(count = 10) {
  if (!Number.isSafeInteger(count) || count < 1 || count > 20) throw new TypeError("Invalid recovery-code count");
  return Array.from({ length: count }, () => randomBytes(16).toString("hex"));
}

export function hashRecoveryCode(code) {
  if (typeof code !== "string" || !/^[a-f0-9]{32}$/.test(code)) throw new TypeError("Invalid recovery code");
  return createHash("sha256").update(code, "utf8").digest("hex");
}
