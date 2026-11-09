import { isIP } from "node:net";
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const SCRYPT_N = 32768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const MAX_PASSWORD_BYTES = 1024;
const SESSION_TOKEN_BYTES = 32;

// Fixed, non-secret hash used only to equalize the scrypt work for unknown accounts.
// The corresponding plaintext is not a user credential and is never accepted as an account.
export const DUMMY_PASSWORD_HASH =
  "scrypt$32768$8$1$00112233445566778899aabbccddeeff$c5cb515c28b24f440f7c9fca611f8e48ae2c88209ce84f735d8190d330e38fa9a2c6cbcd377b372607b9dded9f7cb42d43b6b53307e1a84d1037db476fc39fe3";

function validPassword(password) {
  return typeof password === "string" &&
    password.length >= 12 &&
    Buffer.byteLength(password, "utf8") <= MAX_PASSWORD_BYTES;
}

/**
 * Hash a password using Node.js scrypt with a fresh random salt.
 * The encoded format stores parameters so future migrations can be explicit.
 */
export async function hashPassword(password) {
  if (!validPassword(password)) {
    throw new TypeError("Password must be at least 12 characters and at most 1024 UTF-8 bytes");
  }

  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 64 * 1024 * 1024
  });

  return [
    "scrypt",
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString("hex"),
    Buffer.from(derived).toString("hex")
  ].join("$");
}

/**
 * Verify only hashes produced with the currently approved parameter set.
 * Malformed or unsupported hashes fail closed without throwing.
 */
export async function verifyPassword(password, encodedHash) {
  if (!validPassword(password) || typeof encodedHash !== "string") return false;

  const parts = encodedHash.split("$");
  if (parts.length !== 6) return false;

  const [algorithm, nText, rText, pText, saltHex, keyHex] = parts;
  if (
    algorithm !== "scrypt" ||
    nText !== String(SCRYPT_N) ||
    rText !== String(SCRYPT_R) ||
    pText !== String(SCRYPT_P) ||
    !/^[a-f0-9]{32}$/.test(saltHex) ||
    !/^[a-f0-9]{128}$/.test(keyHex)
  ) {
    return false;
  }

  try {
    const expected = Buffer.from(keyHex, "hex");
    const actual = Buffer.from(await scrypt(
      password,
      Buffer.from(saltHex, "hex"),
      KEY_LENGTH,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 64 * 1024 * 1024 }
    ));
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Generate a 256-bit opaque bearer token. Store only hashSessionToken(token). */
export function createSessionToken() {
  return randomBytes(SESSION_TOKEN_BYTES).toString("hex");
}

/** SHA-256 digest for lookup of a high-entropy, randomly generated session token. */
export function hashSessionToken(token) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
    throw new TypeError("Invalid session token");
  }
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Require an exact Origin match for state-changing browser requests.
 * Missing, malformed, opaque and cross-origin values are rejected.
 */
export function isSameOriginRequest(request) {
  if (!request || typeof request.url !== "string" || !request.headers) return false;

  const originHeader = request.headers.get("origin");
  if (!originHeader) return false;

  try {
    const requestOrigin = new URL(request.url).origin;
    const suppliedOrigin = new URL(originHeader).origin;
    if (suppliedOrigin === "null" || suppliedOrigin !== requestOrigin) return false;

    const fetchSite = request.headers.get("sec-fetch-site");
    if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Parse an explicitly configured trusted-proxy hop count.
 * Bound the value to prevent overflow and accidental acceptance of nonsensical topology.
 */
export function parseTrustedProxyHops(value) {
  if (typeof value !== "string" || !/^[1-9][0-9]*$/.test(value)) return null;
  const hops = Number(value);
  return Number.isSafeInteger(hops) && hops <= 32 ? hops : null;
}

/**
 * Resolve the first untrusted address from the right side of a proxy chain.
 * Every forwarded element is validated; malformed or empty entries fail closed.
 */
export function getTrustedClientAddress(forwardedFor, trustedProxyHops) {
  if (
    typeof forwardedFor !== "string" ||
    !Number.isSafeInteger(trustedProxyHops) ||
    trustedProxyHops < 1 ||
    trustedProxyHops > 32
  ) return null;

  const chain = forwardedFor.split(",").map(value => value.trim());
  if (chain.length < trustedProxyHops + 1 || chain.length > 64) return null;
  if (chain.some(address => address.length === 0 || isIP(address) === 0)) return null;

  return chain[chain.length - trustedProxyHops - 1] ?? null;
}
