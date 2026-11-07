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
