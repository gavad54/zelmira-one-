import test from "node:test";
import assert from "node:assert/strict";
import { serializeTaskResult, serializeTaskResultForDatabase } from "../src/lib/task-json.mjs";
import { safeFailure, normalizeTaskHandlerResult } from "../src/worker/task-worker.mjs";

function captureError(fn, pattern) {
  let captured;
  assert.throws(() => {
    try { fn(); } catch (error) { captured = error; throw error; }
  }, pattern);
  return captured;
}

test("preserves SQL NULL for a null task result while serializing JSON values", () => {
  assert.equal(serializeTaskResultForDatabase(null), null);
  assert.equal(serializeTaskResultForDatabase({ ok: true }), '{"ok":true}');
});

test("serializes JSON values without changing their meaning", () => {
  assert.equal(serializeTaskResult({ ok: true, count: 2, values: [null, "x"] }),
    '{"ok":true,"count":2,"values":[null,"x"]}');
  assert.equal(serializeTaskResult(null), "null");
});

test("rejects values JSON.stringify would silently omit or coerce", () => {
  assert.throws(() => serializeTaskResult(undefined), /TASK_RESULT_NOT_JSON/);
  assert.throws(() => serializeTaskResult({ value: undefined }), /TASK_RESULT_NOT_JSON/);
  assert.throws(() => serializeTaskResult({ value: () => "hidden" }), /TASK_RESULT_NOT_JSON/);
  assert.throws(() => serializeTaskResult({ value: Symbol("hidden") }), /TASK_RESULT_NOT_JSON/);
  assert.throws(() => serializeTaskResult({ value: Number.NaN }), /TASK_RESULT_NOT_JSON/);
  assert.throws(() => serializeTaskResult({ value: Infinity }), /TASK_RESULT_NOT_JSON/);
  assert.throws(() => serializeTaskResult(1n), /TASK_RESULT_NOT_JSON/);
});

test("rejects cycles, non-plain objects, unsafe keys and excessive nesting", () => {
  const cyclic = {}; cyclic.self = cyclic;
  assert.throws(() => serializeTaskResult(cyclic), /TASK_RESULT_NOT_JSON/);
  assert.throws(() => serializeTaskResult(new Date()), /TASK_RESULT_NOT_JSON/);
  assert.throws(() => serializeTaskResult(JSON.parse('{"constructor":true}')), /TASK_RESULT_NOT_JSON/);
  let deep = {}; for (let i = 0; i < 10; i++) deep = { child: deep };
  assert.throws(() => serializeTaskResult(deep), /TASK_RESULT_NOT_JSON/);
});

test("enforces result byte limits and valid configured bounds", () => {
  assert.throws(() => serializeTaskResult("x".repeat(65_536)), /TASK_RESULT_TOO_LARGE/);
  assert.throws(() => serializeTaskResult("ok", 65_537), /TASK_RESULT_LIMIT_INVALID/);
  assert.throws(() => serializeTaskResult("ok", 0), /TASK_RESULT_LIMIT_INVALID/);
});

test("preserves structured serializer error codes for worker failure reporting", () => {
  const invalid = captureError(() => serializeTaskResult({ value: undefined }), /TASK_RESULT_NOT_JSON/);
  const oversized = captureError(() => serializeTaskResult("x".repeat(65_536)), /TASK_RESULT_TOO_LARGE/);
  const invalidLimit = captureError(() => serializeTaskResult("ok", 0), /TASK_RESULT_LIMIT_INVALID/);
  assert.equal(invalid.code, "TASK_RESULT_NOT_JSON");
  assert.equal(oversized.code, "TASK_RESULT_TOO_LARGE");
  assert.equal(invalidLimit.code, "TASK_RESULT_LIMIT_INVALID");
  assert.equal(safeFailure(invalid).code, "TASK_RESULT_NOT_JSON");
  assert.equal(safeFailure(oversized).code, "TASK_RESULT_TOO_LARGE");
});

test("rejects symbol, hidden, accessor and custom array properties without invoking getters", () => {
  const symbolKeyed = { ok: true };
  symbolKeyed[Symbol("hidden")] = "value";
  assert.throws(() => serializeTaskResult(symbolKeyed), /TASK_RESULT_NOT_JSON/);

  let getterInvoked = false;
  const accessor = {};
  Object.defineProperty(accessor, "value", {
    enumerable: true,
    get() { getterInvoked = true; return "unsafe"; }
  });
  assert.throws(() => serializeTaskResult(accessor), /TASK_RESULT_NOT_JSON/);
  assert.equal(getterInvoked, false);

  const hidden = {};
  Object.defineProperty(hidden, "secret", { value: "hidden", enumerable: false });
  assert.throws(() => serializeTaskResult(hidden), /TASK_RESULT_NOT_JSON/);

  const sparse = [];
  sparse.length = 1;
  assert.throws(() => serializeTaskResult(sparse), /TASK_RESULT_NOT_JSON/);

  const extended = [1];
  extended.extra = true;
  assert.throws(() => serializeTaskResult(extended), /TASK_RESULT_NOT_JSON/);

  const symbolArray = [1];
  symbolArray[Symbol("extra")] = true;
  assert.throws(() => serializeTaskResult(symbolArray), /TASK_RESULT_NOT_JSON/);
});

test("bounds traversal of repeated shared references before serialization", () => {
  let amplified = 0;
  for (let depth = 0; depth < 4; depth += 1) amplified = Array(11).fill(amplified);
  assert.ok(Buffer.byteLength(JSON.stringify(amplified), "utf8") < 65_536);
  assert.throws(() => serializeTaskResult(amplified), /TASK_RESULT_NOT_JSON/);
});

test("rejects oversized raw strings before invoking JSON.stringify", () => {
  const originalStringify = JSON.stringify;
  let stringifyCalls = 0;
  JSON.stringify = (...args) => {
    stringifyCalls += 1;
    return originalStringify(...args);
  };
  try {
    for (const value of ["x".repeat(9), { payload: "x".repeat(9) }]) {
      assert.throws(() => serializeTaskResult(value, 8), /TASK_RESULT_TOO_LARGE/);
    }
    assert.equal(stringifyCalls, 0);
  } finally {
    JSON.stringify = originalStringify;
  }
});

test("worker normalizes handler output without executing getters", () => {
  let getterInvoked = false;
  const handlerOutput = {};
  Object.defineProperty(handlerOutput, "repository", {
    enumerable: true,
    get() { getterInvoked = true; return "owner/repo"; }
  });
  assert.throws(() => normalizeTaskHandlerResult(handlerOutput), /TASK_RESULT_NOT_JSON/);
  assert.equal(getterInvoked, false);
});
