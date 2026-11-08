import test from "node:test";
import assert from "node:assert/strict";
import { isSameOriginRequest } from "../src/lib/auth-core.mjs";

test("same-origin guard rejects cross-site fetch metadata even with matching Origin", () => {
  const request = new Request("https://vayro.example/api/auth/login", {
    method: "POST",
    headers: {
      origin: "https://vayro.example",
      "sec-fetch-site": "cross-site"
    }
  });
  assert.equal(isSameOriginRequest(request), false);
});

test("same-origin guard accepts same-origin fetch metadata", () => {
  const request = new Request("https://vayro.example/api/auth/login", {
    method: "POST",
    headers: {
      origin: "https://vayro.example",
      "sec-fetch-site": "same-origin"
    }
  });
  assert.equal(isSameOriginRequest(request), true);
});

test("same-origin guard rejects opaque, malformed and scheme/port-mismatched origins", () => {
  const cases = [
    "null",
    "not a url",
    "http://vayro.example",
    "https://vayro.example:444"
  ];
  for (const origin of cases) {
    const request = new Request("https://vayro.example/api/auth/login", {
      method: "POST",
      headers: { origin }
    });
    assert.equal(isSameOriginRequest(request), false, origin);
  }
});
