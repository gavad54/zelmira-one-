import test from "node:test";
import assert from "node:assert/strict";
import { validateTaskDefinition } from "../src/lib/task-engine.mjs";

test("task definitions reject handlers without an approved worker implementation", () => {
  assert.throws(() => validateTaskDefinition({
    projectKey: "VAYRO",
    handlerKey: "product.health_check",
    title: "Check product health",
    idempotencyKey: "health-check-unsupported",
    payload: {}
  }), { message: "TASK_HANDLER_NOT_ALLOWED" });
});
