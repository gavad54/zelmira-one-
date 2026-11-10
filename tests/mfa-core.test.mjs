import test from "node:test";
import assert from "node:assert/strict";
import {
  createOtpAuthUri,
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  verifyTotp
} from "../src/lib/mfa-core.mjs";

const RFC6238_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
const TEST_KEY = "a".repeat(64);

test("generates a cryptographically random 160-bit Base32 secret", () => {
  const first = generateTotpSecret();
  const second = generateTotpSecret();
  assert.match(first, /^[A-Z2-7]{32}$/);
  assert.notEqual(first, second);
});

test("verifies the RFC 6238 SHA-1 six-digit reference vector", () => {
  assert.equal(
    verifyTotp({ secret: RFC6238_SECRET, token: "287082", now: 59000, window: 0 }),
    1
  );
  assert.equal(
    verifyTotp({ secret: RFC6238_SECRET, token: "287082", now: 59000, window: 0, lastAcceptedStep: 1 }),
    null
  );
});

test("supports bounded clock drift and rejects replayed or out-of-window steps", () => {
  assert.equal(
    verifyTotp({ secret: RFC6238_SECRET, token: "287082", now: 60000, window: 1, lastAcceptedStep: 0 }),
    1
  );
  assert.equal(
    verifyTotp({ secret: RFC6238_SECRET, token: "287082", now: 60000, window: 1, lastAcceptedStep: 1 }),
    null
  );
  assert.equal(
    verifyTotp({ secret: RFC6238_SECRET, token: "287082", now: 120000, window: 1 }),
    null
  );
});

test("rejects malformed codes and invalid verifier options without accepting a token", () => {
  assert.equal(verifyTotp({ secret: RFC6238_SECRET, token: "28708", now: 59000 }), null);
  assert.equal(verifyTotp({ secret: RFC6238_SECRET, token: "000000", now: -1 }), null);
  assert.equal(verifyTotp({ secret: RFC6238_SECRET, token: "000000", now: 59000, window: 3 }), null);
  assert.equal(verifyTotp({ secret: RFC6238_SECRET, token: "000000", now: 59000, lastAcceptedStep: -2 }), null);
  assert.throws(() => verifyTotp({ secret: "invalid-secret", token: "287082", now: 59000 }), /MFA_SECRET_INVALID/);
});

test("encrypts and decrypts the secret using AES-256-GCM", () => {
  const envelope = encryptTotpSecret(RFC6238_SECRET, TEST_KEY);
  assert.equal(envelope.version, 1);
  assert.match(envelope.iv, /^[a-f0-9]{24}$/);
  assert.match(envelope.ciphertext, /^[a-f0-9]{40}$/);
  assert.match(envelope.authTag, /^[a-f0-9]{32}$/);
  assert.notEqual(envelope.ciphertext, RFC6238_SECRET);
  assert.equal(decryptTotpSecret(envelope, TEST_KEY), RFC6238_SECRET);
});

test("rejects tampered encrypted secrets and missing or malformed encryption keys", () => {
  const envelope = encryptTotpSecret(RFC6238_SECRET, TEST_KEY);
  const tampered = { ...envelope, authTag: (envelope.authTag[0] === "0" ? "1" : "0") + envelope.authTag.slice(1) };
  assert.throws(() => decryptTotpSecret(tampered, TEST_KEY), /MFA_SECRET_DECRYPTION_FAILED/);
  assert.throws(() => encryptTotpSecret(RFC6238_SECRET, "short"), /MFA_ENCRYPTION_KEY_NOT_CONFIGURED/);
  assert.throws(() => decryptTotpSecret(envelope, "short"), /MFA_ENCRYPTION_KEY_NOT_CONFIGURED/);
});

test("builds an encoded authenticator-app enrollment URI", () => {
  const uri = createOtpAuthUri({
    secret: RFC6238_SECRET,
    accountName: "owner+test@example.invalid",
    issuer: "VAYRO"
  });
  const parsed = new URL(uri);
  assert.equal(parsed.protocol, "otpauth:");
  assert.equal(parsed.hostname, "totp");
  assert.equal(parsed.searchParams.get("secret"), RFC6238_SECRET);
  assert.equal(parsed.searchParams.get("issuer"), "VAYRO");
  assert.equal(parsed.searchParams.get("algorithm"), "SHA1");
  assert.equal(parsed.searchParams.get("digits"), "6");
  assert.equal(parsed.searchParams.get("period"), "30");
  assert.match(decodeURIComponent(parsed.pathname), /owner\+test@example\.invalid/);
});
