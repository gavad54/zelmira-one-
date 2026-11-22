import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { taskWorkerHandlers } from "../src/worker/task-worker.mjs";

test("report handler emits a bounded deterministic read-only summary", async () => {
  const payload = { reportType: "engineering", taskIds: ["a", "b"] };
  const result = await taskWorkerHandlers["report.generate"]({
    task_id: "task-test", project_key: "VAYRO", title: "Engineering report", payload
  });
  assert.equal(result.taskId, "task-test");
  assert.equal(result.executionMode, "deterministic-read-only");
  assert.equal(result.inputSha256, createHash("sha256").update(JSON.stringify(payload)).digest("hex"));
  assert.equal(result.inputBytes, Buffer.byteLength(JSON.stringify(payload), "utf8"));
});

test("worker registry excludes arbitrary execution and unreviewed health checks", () => {
  assert.equal(typeof taskWorkerHandlers["repo.audit"], "function");
  assert.equal(typeof taskWorkerHandlers["repo.test"], "function");
  assert.equal(typeof taskWorkerHandlers["report.generate"], "function");
  assert.equal(taskWorkerHandlers["product.health_check"], undefined);
  assert.equal(taskWorkerHandlers["shell.exec"], undefined);
  assert.equal(taskWorkerHandlers["code.exec"], undefined);
});

test("worker timeouts and graceful shutdowns are retryable so work is not permanently lost", () => {
  assert.deepEqual(safeFailure(new Error("TASK_HANDLER_TIMEOUT")), {
    code: "TASK_HANDLER_TIMEOUT",
    message: "TASK_HANDLER_TIMEOUT",
    retryable: true
  });
  assert.deepEqual(safeFailure(new Error("WORKER_SHUTTING_DOWN")), {
    code: "WORKER_SHUTTING_DOWN",
    message: "WORKER_SHUTTING_DOWN",
    retryable: true
  });
});

test("transient upstream network failures retain their retryable classification", () => {
  const error = Object.assign(new Error("GitHub API network request failed"), {
    code: "GITHUB_NETWORK_ERROR",
    retryable: true
  });
  assert.equal(safeFailure(error).code, "GITHUB_NETWORK_ERROR");
  assert.equal(safeFailure(error).retryable, true);
});
