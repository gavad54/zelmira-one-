import test from "node:test";
import assert from "node:assert/strict";

import { classifyDanaAction } from "../src/lib/dana-governance.mjs";

test("read-only and sandbox preparation actions are automatic", () => {
  for (const action of [
    "portfolio.read",
    "portfolio.report",
    "analytics.read",
    "task.plan",
    "code.review",
    "code.draft",
    "test.run_sandbox",
    "monitor.alert"
  ]) {
    assert.equal(classifyDanaAction(action), "AUTOMATIC", action);
  }
});

test("production, sensitive settings, spending and customer-data changes require approval", () => {
  for (const action of [
    "production.code_change",
    "production.deploy",
    "security.setting_change",
    "spend.commit",
    "customer_data.change",
    "customer_data.delete"
  ]) {
    assert.equal(classifyDanaAction(action), "APPROVAL_REQUIRED", action);
  }
});

test("security bypass, external data leakage and ownership takeover are prohibited", () => {
  for (const action of [
    "security.bypass",
    "data.export_external",
    "ownership.transfer"
  ]) {
    assert.equal(classifyDanaAction(action), "PROHIBITED", action);
  }
});

test("unknown actions fail closed and are never treated as automatic", () => {
  assert.equal(classifyDanaAction("unregistered.action"), "UNKNOWN");
  assert.equal(classifyDanaAction(""), "UNKNOWN");
  assert.equal(classifyDanaAction(null), "UNKNOWN");
});
