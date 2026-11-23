import test from "node:test";
import assert from "node:assert/strict";
import { readJsonBody } from "../src/lib/read-json-body.mjs";

test("reads valid JSON within the configured byte limit", async () => {
  const request = new Request("https://vayro.invalid/api/owner/tasks", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ task: "audit" })
  });
  assert.deepEqual(await readJsonBody(request, 128), { task: "audit" });
});

test("rejects a declared oversized body before parsing", async () => {
  const request = new Request("https://vayro.invalid/api/owner/tasks", {
    method: "POST",
    headers: { "content-type": "application/json", "content-length": "129" },
    body: "{}"
  });
  await assert.rejects(readJsonBody(request, 128), { message: "BODY_TOO_LARGE" });
});

test("rejects an oversized streamed body even without content length", async () => {
  const request = new Request("https://vayro.invalid/api/owner/tasks", {
    method: "POST",
    body: JSON.stringify({ payload: "x".repeat(256) })
  });
  await assert.rejects(readJsonBody(request, 128), { message: "BODY_TOO_LARGE" });
});

test("rejects malformed JSON", async () => {
  const request = new Request("https://vayro.invalid/api/owner/tasks", {
    method: "POST",
    body: "{"
  });
  await assert.rejects(readJsonBody(request, 128), { message: "INVALID_JSON" });
});
