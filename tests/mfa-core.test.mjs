import test from "node:test";
import assert from "node:assert/strict";
import {
  decodeBase32,
  encodeBase32,
  generateTotpSecret,
  totpAt,
  verifyTotp,
  parseMfaEncryptionKey,
  encryptTotpSecret,
  decryptTotpSecret,
  generateRecoveryCodes,
  hashRecoveryCode
} from "../src/lib/mfa-core.mjs";

test("Base32 round-trips byte sequences", () => {
  const bytes = Buffer.from("VAYRO MFA", "utf8");
  assert.deepEqual(decodeBase32(encodeBase32(bytes)), bytes);
});

test("TOTP matches RFC 6238 SHA-1 six-digit test vectors", () => {
  const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  assert.equal(totpAt(secret, 59000), "287082");
  assert.equal(totpAt(secret, 1111111109000), "081804");
  assert.equal(totpAt(secret, 1234567890000), "005924");
});

test("TOTP verification accepts only the configured adjacent time window", () => {
  const secret = generateTotpSecret();
  const now = 1700000000000;
  const code = totpAt(secret, now);
  assert.equal(verifyTotp(secret, code, now), Math.floor(now / 30000));
  assert.equal(verifyTotp(secret, "bad-code", now), null);
  assert.equal(verifyTotp(secret, code, now, 2), null);
});

test("TOTP secret encryption uses authenticated AES-256-GCM envelopes", () => {
  const key = Buffer.alloc(32, 7);
  const secret = generateTotpSecret();
  const envelope = encryptTotpSecret(secret, key);
  assert.equal(decryptTotpSecret(envelope, key), secret);
  assert.throws(() => decryptTotpSecret(envelope, Buffer.alloc(32, 8)));
  const [iv, tag, ciphertext] = envelope.split(".");
  const tampered = [iv, tag, (ciphertext.startsWith("A") ? "B" : "A") + ciphertext.slice(1)].join(".");
  assert.throws(() => decryptTotpSecret(tampered, key));
});

test("MFA encryption key configuration fails closed", () => {
  assert.throws(() => parseMfaEncryptionKey("not-a-key"));
  assert.equal(parseMfaEncryptionKey("ab".repeat(32)).length, 32);
});

test("recovery codes are high-entropy unique values and storeable only as digests", () => {
  const codes = generateRecoveryCodes(10);
  assert.equal(codes.length, 10);
  assert.equal(new Set(codes).size, 10);
  for (const code of codes) {
    assert.match(code, /^[a-f0-9]{32}$/);
    assert.match(hashRecoveryCode(code), /^[a-f0-9]{64}$/);
    assert.notEqual(hashRecoveryCode(code), code);
  }
  assert.throws(() => hashRecoveryCode("plaintext"));
});
