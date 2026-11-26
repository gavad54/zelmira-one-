import test from "node:test";
import assert from "node:assert/strict";
import { redactErrorMessage } from "../src/lib/redact-error-message.mjs";

test("redacts URL credentials without removing harmless query parameters", () => {
  assert.equal(
    redactErrorMessage("request failed at https://provider.example/hook?token=abc123&mode=fast&password=p%40ss"),
    "request failed at https://provider.example/hook?token=[REDACTED]&mode=fast&password=[REDACTED]"
  );
});

test("redacts authorization values and bearer tokens", () => {
  assert.equal(
    redactErrorMessage("authorization: BasicSecret Bearer abc.def.ghi api_key=supersecret"),
    "authorization=[REDACTED] Bearer [REDACTED] api_key=[REDACTED]"
  );
});

test("bounds persisted error messages", () => {
  assert.equal(redactErrorMessage("x".repeat(700)).length, 500);
});
