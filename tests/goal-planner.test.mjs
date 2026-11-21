import test from "node:test";
import assert from "node:assert/strict";
import { planGoal, selectReadyTasks } from "../src/engine/goal-planner.mjs";

const goal = {
  goalId: "GOAL-VAYRO-001",
  projectKey: "VAYRO",
  title: "Deliver worker recovery",
  priority: 80,
  approvalRequired: false,
  acceptanceCriteria: [
    { id: "verify", title: "Verify worker restart", handlerKey: "report.generate", dependsOn: ["implement"] },
    { id: "implement", title: "Implement restart checkpoint", handlerKey: "report.generate" },
    { id: "document", title: "Document recovery behavior", handlerKey: "report.generate", dependsOn: ["verify"] }
  ]
};

test("planner returns stable topological tasks with traceable idempotency keys", () => {
  const first = planGoal(goal);
  const second = planGoal(goal);
  assert.deepEqual(first, second);
  assert.deepEqual(first.tasks.map(task => task.criterionId), ["implement", "verify", "document"]);
  assert.equal(new Set(first.tasks.map(task => task.idempotencyKey)).size, 3);
  assert.ok(first.tasks.every(task => task.idempotencyKey.startsWith("goal:GOAL-VAYRO-001:")));
});

test("planner rejects unknown dependencies and dependency cycles", () => {
  assert.throws(() => planGoal({
    ...goal,
    acceptanceCriteria: [{ id: "aa", title: "A", handlerKey: "report.generate", dependsOn: ["missing"] }]
  }), /UNKNOWN_DEPENDENCY/);
  assert.throws(() => planGoal({
    ...goal,
    acceptanceCriteria: [
      { id: "aa", title: "A", handlerKey: "report.generate", dependsOn: ["bb"] },
      { id: "bb", title: "B", handlerKey: "report.generate", dependsOn: ["aa"] }
    ]
  }), /DEPENDENCY_CYCLE/);
});

test("ready selection excludes completed tasks and tasks with incomplete dependencies", () => {
  const planned = planGoal(goal).tasks;
  const ready = selectReadyTasks(planned, new Set());
  assert.deepEqual(ready.map(task => task.criterionId), ["implement"]);
  const next = selectReadyTasks(planned, new Set(["implement"]));
  assert.deepEqual(next.map(task => task.criterionId), ["verify"]);
  const afterVerify = selectReadyTasks(planned, new Set(["implement", "verify"]));
  assert.deepEqual(afterVerify.map(task => task.criterionId), ["document"]);
});

test("approval policy is propagated to every generated task", () => {
  const planned = planGoal({ ...goal, approvalRequired: true });
  assert.ok(planned.tasks.every(task => task.approvalRequired === true));
});
