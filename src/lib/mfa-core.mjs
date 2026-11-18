import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual
} from "node:crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;
const SECRET_BYTES = 20;

function encodeBase32(bytes) {
  let buffer = 0;
  let bitsLeft = 0;
  let output = "";

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;
    while (bitsLeft >= 5) {
      output += BASE32[(buffer >>> (bitsLeft - 5)) & 31];
      bitsLeft -= 5;
    }
    buffer &= (1 << bitsLeft) - 1;
  }

  if (bitsLeft > 0) output += BASE32[(buffer << (5 - bitsLeft)) & 31];
  return output;
}

function decodeBase32(value) {
  if (typeof value !== "string" || value.length < 32 || value.length > 128 || !/^[A-Z2-7]+$/i.test(value)) {
    throw new Error("MFA_SECRET_INVALID");
  }

  let buffer = 0;
  let bitsLeft = 0;
  const output = [];

  for (const character of value.toUpperCase()) {
    buffer = (buffer << 5) | BASE32.indexOf(character);
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      output.push((buffer >>> bitsLeft) & 255);
    }
    buffer &= (1 << bitsLeft) - 1;
  }

  if (buffer !== 0 || output.length !== SECRET_BYTES) throw new Error("MFA_SECRET_INVALID");
  return Buffer.from(output);
}

function getEncryptionKey(value) {
  const configured = value ?? process.env.VAYRO_MFA_ENCRYPTION_KEY;
  if (typeof configured !== "string" || !/^[a-f0-9]{64}$/i.test(configured)) {
    throw new Error("MFA_ENCRYPTION_KEY_NOT_CONFIGURED");
  }
  return Buffer.from(configured, "hex");
}

function totpAtStep(secretBytes, step) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac("sha1", secretBytes).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  const binary =
    ((digest[offset] & 127) << 24) |
    ((digest[offset + 1] & 255) << 16) |
    ((digest[offset + 2] & 255) << 8) |
    (digest[offset + 3] & 255);
  return String(binary % (10 ** TOTP_DIGITS)).padStart(TOTP_DIGITS, "0");
}

/** Generate a 160-bit secret in unpadded Base32 form for RFC 6238 TOTP. */
export function generateTotpSecret() {
  return encodeBase32(randomBytes(SECRET_BYTES));
}

/**
 * Return the matched time-step or null. The caller must persist the returned
 * step atomically and reject any step <= the stored lastAcceptedStep.
 */
export function verifyTotp({
  secret,
  token,
  now = Date.now(),
  window = 1,
  lastAcceptedStep = -1
}) {
  if (typeof token !== "string" || !/^\d{6}$/.test(token)) return null;
  if (!Number.isFinite(now) || now < 0) return null;
  if (!Number.isInteger(window) || window < 0 || window > 2) return null;
  if (!Number.isSafeInteger(lastAcceptedStep) || lastAcceptedStep < -1) return null;

  const secretBytes = decodeBase32(secret);
  const currentStep = Math.floor(now / 1000 / TOTP_PERIOD_SECONDS);
  const supplied = Buffer.from(token, "ascii");

  for (let offset = window; offset >= -window; offset -= 1) {
    const step = currentStep + offset;
    if (step < 0 || step <= lastAcceptedStep) continue;
    const expected = Buffer.from(totpAtStep(secretBytes, step), "ascii");
    if (timingSafeEqual(supplied, expected)) return step;
  }

  return null;
}

/** Encrypt the TOTP secret with AES-256-GCM; the key is a 32-byte hex secret. */
export function encryptTotpSecret(secret, keyMaterial) {
  const secretBytes = decodeBase32(secret);
  const key = getEncryptionKey(keyMaterial);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(secretBytes), cipher.final()]);
  return Object.freeze({
    version: 1,
    iv: iv.toString("hex"),
    ciphertext: ciphertext.toString("hex"),
    authTag: cipher.getAuthTag().toString("hex")
  });
}

/** Decrypt a versioned AES-256-GCM TOTP envelope without exposing crypto errors. */
export function decryptTotpSecret(envelope, keyMaterial) {
  if (
    !envelope ||
    envelope.version !== 1 ||
    typeof envelope.iv !== "string" ||
    !/^[a-f0-9]{24}$/i.test(envelope.iv) ||
    typeof envelope.ciphertext !== "string" ||
    !/^[a-f0-9]{40}$/i.test(envelope.ciphertext) ||
    typeof envelope.authTag !== "string" ||
    !/^[a-f0-9]{32}$/i.test(envelope.authTag)
  ) {
    throw new Error("MFA_ENCRYPTED_SECRET_INVALID");
  }

  const key = getEncryptionKey(keyMaterial);
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(envelope.iv, "hex"));
    decipher.setAuthTag(Buffer.from(envelope.authTag, "hex"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, "hex")),
      decipher.final()
    ]);
    if (plaintext.length !== SECRET_BYTES) throw new Error("invalid secret length");
    return encodeBase32(plaintext);
  } catch {
    throw new Error("MFA_SECRET_DECRYPTION_FAILED");
  }
}

/** Create a standards-compatible authenticator-app enrollment URI. */
export function createOtpAuthUri({ secret, accountName, issuer = "VAYRO" }) {
  decodeBase32(secret);
  if (typeof accountName !== "string" || accountName.trim().length === 0 || accountName.length > 254) {
    throw new Error("MFA_ACCOUNT_NAME_INVALID");
  }
  if (typeof issuer !== "string" || issuer.trim().length === 0 || issuer.length > 64) {
    throw new Error("MFA_ISSUER_INVALID");
  }
  const label = encodeURIComponent(issuer.trim() + ":" + accountName.trim());
  const query = new URLSearchParams({
    secret,
    issuer: issuer.trim(),
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS)
  });
  return "otpauth://totp/" + label + "?" + query.toString();
}
