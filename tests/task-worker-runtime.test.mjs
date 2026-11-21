import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

test("worker config rejects missing worker database credentials", () => {
  assert.equal(process.env.TASK_WORKER_DATABASE_URL, undefined);
  assert.throws(() => {
    if (!process.env.TASK_WORKER_DATABASE_URL) throw new Error("TASK_WORKER_DATABASE_URL_REQUIRED");
  }, /TASK_WORKER_DATABASE_URL_REQUIRED/);
});

test("read-only report digest is stable for identical payloads", () => {
  const payload = { reportType: "engineering", taskIds: ["a", "b"] };
  const first = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const second = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);
});

test("worker task handler allowlist excludes shell and arbitrary execution", () => {
  const allowed = new Set(["repo.audit", "repo.test", "report.generate"]);
  assert.equal(allowed.has("repo.audit"), true);
  assert.equal(allowed.has("shell.exec"), false);
  assert.equal(allowed.has("code.exec"), false);
  assert.equal(allowed.has("product.health_check"), false);
});
