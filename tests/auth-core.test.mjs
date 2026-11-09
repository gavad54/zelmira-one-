import test from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  DUMMY_PASSWORD_HASH,
  createSessionToken,
  hashSessionToken,
  isSameOriginRequest,
  getTrustedClientAddress,
  parseTrustedProxyHops
} from "../src/lib/auth-core.mjs";

test("password hashes are salted, parameterized and verifiable", async () => {
  const first = await hashPassword("a-long-and-unique-password-42");
  const second = await hashPassword("a-long-and-unique-password-42");
  assert.notEqual(first, second);
  assert.ok(first.startsWith("scrypt$32768$8$1$"));
  assert.equal(await verifyPassword("a-long-and-unique-password-42", first), true);
  assert.equal(await verifyPassword("a-different-password-42", first), false);
});

test("password verification rejects malformed hashes without throwing", async () => {
  assert.equal(await verifyPassword("password-long-enough", "not-a-hash"), false);
  assert.equal(await verifyPassword("password-long-enough", ""), false);
});

test("dummy login hash performs the approved scrypt verification and never matches an ordinary password", async () => {
  assert.ok(DUMMY_PASSWORD_HASH.startsWith("scrypt$32768$8$1$"));
  assert.equal(await verifyPassword("a-long-and-unique-password-42", DUMMY_PASSWORD_HASH), false);
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

test("trusted proxy parser accepts only bounded positive decimal hop counts", () => {
  assert.equal(parseTrustedProxyHops("1"), 1);
  assert.equal(parseTrustedProxyHops("32"), 32);
  for (const invalid of [undefined, "", "0", "01", "-1", "1.5", "1e2", "33", "999999999999999999999"]) {
    assert.equal(parseTrustedProxyHops(invalid), null, String(invalid));
  }
});

test("trusted proxy parsing selects the first untrusted hop from the right", () => {
  assert.equal(
    getTrustedClientAddress("198.51.100.77, 203.0.113.25, 10.0.0.2", 1),
    "203.0.113.25"
  );
  assert.equal(
    getTrustedClientAddress("198.51.100.77, 203.0.113.25, 10.0.0.2", 2),
    "198.51.100.77"
  );
  assert.equal(
    getTrustedClientAddress("2001:db8::10, 2001:db8::20", 1),
    "2001:db8::10"
  );
});

test("trusted proxy parsing rejects malformed elements anywhere in the chain", () => {
  for (const chain of [
    "not-an-ip, 10.0.0.2",
    "198.51.100.77, garbage, 10.0.0.2",
    "198.51.100.77,,10.0.0.2",
    "198.51.100.77, 10.0.0.2,",
    "198.51.100.77:1234, 10.0.0.2",
  ]) {
    assert.equal(getTrustedClientAddress(chain, 1), null, chain);
  }
});

test("trusted proxy parsing rejects invalid hop counts and unreasonable chains", () => {
  assert.equal(getTrustedClientAddress("203.0.113.25, 10.0.0.2", 0), null);
  assert.equal(getTrustedClientAddress("203.0.113.25, 10.0.0.2", 1.5), null);
  assert.equal(getTrustedClientAddress("203.0.113.25, 10.0.0.2", Number.NaN), null);
  assert.equal(getTrustedClientAddress("203.0.113.25, 10.0.0.2", 33), null);
  assert.equal(getTrustedClientAddress("203.0.113.25", 1), null);
  assert.equal(getTrustedClientAddress(Array(66).fill("10.0.0.1").join(","), 1), null);
});
