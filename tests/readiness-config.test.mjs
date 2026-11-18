import test from "node:test";
import assert from "node:assert/strict";
import {
  emailConfiguration,
  mfaConfiguration,
  trustedProxyConfiguration
} from "../src/lib/readiness-config.mjs";

test("MFA readiness requires exactly 32 bytes encoded as 64 hex characters", () => {
  assert.equal(mfaConfiguration({ VAYRO_MFA_ENCRYPTION_KEY: "a".repeat(64) }), "ok");
  assert.equal(mfaConfiguration({ VAYRO_MFA_ENCRYPTION_KEY: "a".repeat(63) }), "not_configured");
  assert.equal(mfaConfiguration({ VAYRO_MFA_ENCRYPTION_KEY: "z".repeat(64) }), "not_configured");
});

test("trusted proxy hop count accepts only integer values from 1 through 10", () => {
  assert.equal(trustedProxyConfiguration({ TRUSTED_PROXY_HOPS: "1" }), "ok");
  assert.equal(trustedProxyConfiguration({ TRUSTED_PROXY_HOPS: "10" }), "ok");
  for (const value of ["", "0", "11", "-1", "1.5", "abc", " 2 "]) {
    assert.equal(trustedProxyConfiguration({ TRUSTED_PROXY_HOPS: value }), "not_configured", value);
  }
});

test("Resend readiness rejects malformed sender addresses and shared test sender", () => {
  assert.equal(emailConfiguration({
    EMAIL_PROVIDER: "resend",
    EMAIL_API_KEY: "re_test_placeholder",
    EMAIL_FROM: "ops@example.com"
  }), "ok");
  for (const from of ["ops @example.com", "ops@example", "test@resend.dev"]) {
    assert.equal(emailConfiguration({
      EMAIL_PROVIDER: "resend",
      EMAIL_API_KEY: "key",
      EMAIL_FROM: from
    }), "not_configured", from);
  }
});

test("Gmail readiness requires credentials and a Gmail sender", () => {
  const env = {
    EMAIL_PROVIDER: "gmail",
    GMAIL_CLIENT_ID: "client",
    GMAIL_CLIENT_SECRET: "secret",
    GMAIL_REFRESH_TOKEN: "refresh",
    GMAIL_SENDER_EMAIL: "ops@gmail.com"
  };
  assert.equal(emailConfiguration(env), "ok");
  assert.equal(emailConfiguration({ ...env, GMAIL_SENDER_EMAIL: "ops@example.com" }), "not_configured");
  assert.equal(emailConfiguration({ ...env, GMAIL_REFRESH_TOKEN: "" }), "not_configured");
});

test("unknown email providers fail closed", () => {
  assert.equal(emailConfiguration({ EMAIL_PROVIDER: "smtp" }), "not_configured");
});
