import test from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  hashSessionToken,
  isSameOriginRequest
} from "../src/lib/auth-core.mjs";

test("password hashes are salted, parameterized and verifiable", async () => {
  const first = await hashPassword("a-long-and-unique-password-42");
  const second = await hashPassword("a-long-and-unique-password-42");
  assert.notEqual(first, second);
  assert.match(first, /^scrypt\$32768\$8\$1\$/);
  assert.equal(await verifyPassword("a-long-and-unique-password-42", first), true);
  assert.equal(await verifyPassword("a-different-password-42", first), false);
});

test("password verification rejects malformed hashes without throwing", async () => {
  assert.equal(await verifyPassword("password-long-enough", "not-a-hash"), false);
  assert.equal(await verifyPassword("password-long-enough", ""), false);
});

test("session tokens are high entropy and only their digest is stored", () => {
  const first = createSessionToken();
  const second = createSessionToken();
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.notEqual(first, second);
  assert.match(hashSessionToken(first), /^[a-f0-9]{64}$/);
  assert.notEqual(hashSessionToken(first), first);
});

test("mutating auth requests require an exact same-origin Origin header", () => {
  const request = new Request("https://app.example.test/api/auth/login", {
    method: "POST",
    headers: { origin: "https://app.example.test" }
  });
  assert.equal(isSameOriginRequest(request), true);

  const missing = new Request("https://app.example.test/api/auth/login", { method: "POST" });
  assert.equal(isSameOriginRequest(missing), false);

  const foreign = new Request("https://app.example.test/api/auth/login", {
    method: "POST",
    headers: { origin: "https://attacker.example" }
  });
  assert.equal(isSameOriginRequest(foreign), false);
});

test("trusted proxy parsing selects the first untrusted hop from the right", async () => {
  const { getTrustedClientAddress } = await import("../src/lib/auth-core.mjs");

  assert.equal(
    getTrustedClientAddress("198.51.100.77, 203.0.113.25, 10.0.0.2", 1),
    "203.0.113.25"
  );
  assert.equal(
    getTrustedClientAddress("198.51.100.77, 203.0.113.25, 10.0.0.2", 2),
    "198.51.100.77"
  );
});

test("trusted proxy parsing fails closed when the chain or configuration is invalid", async () => {
  const { getTrustedClientAddress } = await import("../src/lib/auth-core.mjs");

  assert.equal(getTrustedClientAddress("203.0.113.25", 1), null);
  assert.equal(getTrustedClientAddress("not-an-ip, 10.0.0.2", 1), null);
  assert.equal(getTrustedClientAddress("203.0.113.25, 10.0.0.2", 0), null);
  assert.equal(getTrustedClientAddress("203.0.113.25, 10.0.0.2", 1.5), null);
  assert.equal(getTrustedClientAddress("203.0.113.25, 10.0.0.2", Number.NaN), null);
});

test("login verification performs the approved scrypt check for unknown accounts without authenticating them", async () => {
  const { verifyLoginPassword } = await import("../src/lib/auth-core.mjs");
  assert.equal(typeof verifyLoginPassword, "function");

  const unknownAccount = await verifyLoginPassword("a-long-and-valid-password", null);
  assert.equal(unknownAccount, false);

  const password = "a-long-and-unique-password-42";
  const passwordHash = await hashPassword(password);
  assert.equal(await verifyLoginPassword(password, passwordHash), true);
  assert.equal(await verifyLoginPassword("a-different-password-42", passwordHash), false);
});
