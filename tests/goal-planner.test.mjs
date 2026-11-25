import test from "node:test";
import assert from "node:assert/strict";
import { planGoal, selectReadyTasks } from "../src/engine/goal-planner.mjs";
import { validateTaskDefinition } from "../src/lib/task-engine.mjs";

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

test("planner emits task types accepted by the task-engine handler contract", () => {
  const planned = planGoal({
    ...goal,
    acceptanceCriteria: [
      { id: "report", title: "Generate audit report", handlerKey: "report.generate" },
      { id: "audit", title: "Audit repository", handlerKey: "repo.audit", repo: "gavad54/zelmira-one-" },
      { id: "tests", title: "Observe CI results", handlerKey: "repo.test", repo: "gavad54/zelmira-one-" }
    ]
  });
  assert.deepEqual(
    planned.tasks.map(task => [task.handlerKey, task.taskType]),
    [["report.generate", "REPORTING"], ["repo.audit", "ENGINEERING"], ["repo.test", "ENGINEERING"]]
  );
  for (const task of planned.tasks) {
    assert.equal(validateTaskDefinition(task).taskType, task.taskType);
  }
});

test("planner rejects unknown dependencies and dependency cycles", () => {
  assert.throws(() => planGoal({
    ...goal,
    acceptanceCriteria: [{ id: "aa", title: "Task AA", handlerKey: "report.generate", dependsOn: ["missing"] }]
  }), /UNKNOWN_DEPENDENCY/);
  assert.throws(() => planGoal({
    ...goal,
    acceptanceCriteria: [
      { id: "aa", title: "Task A", handlerKey: "report.generate", dependsOn: ["bb"] },
      { id: "bb", title: "Task B", handlerKey: "report.generate", dependsOn: ["aa"] }
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

test("planner preserves bounded scheduledAt and deadline for the durable due-task queue", () => {
  const scheduledAt = "2026-11-25T09:00:00.000Z";
  const deadline = "2026-11-26T09:00:00.000Z";
  const planned = planGoal({ ...goal, scheduledAt, deadline });
  assert.equal(planned.tasks[0].scheduledAt.toISOString(), scheduledAt);
  assert.equal(planned.tasks[0].deadline.toISOString(), deadline);
  assert.throws(() => planGoal({ ...goal, scheduledAt: deadline, deadline: scheduledAt }), /GOAL_DEADLINE_BEFORE_SCHEDULE/);
  assert.throws(() => planGoal({ ...goal, scheduledAt: "not-a-date" }), /GOAL_SCHEDULE_INVALID/);
});

test("repository audit and CI features require a validated repository target", () => {
  assert.throws(() => planGoal({
    ...goal,
    acceptanceCriteria: [{ id: "audit", title: "Audit repository", handlerKey: "repo.audit" }]
  }), /TASK_REPOSITORY_INVALID/);
  assert.throws(() => planGoal({
    ...goal,
    acceptanceCriteria: [{ id: "audit", title: "Audit repository", handlerKey: "repo.audit", repo: "../secrets" }]
  }), /TASK_REPOSITORY_INVALID/);
  const planned = planGoal({
    ...goal,
    acceptanceCriteria: [{ id: "audit", title: "Audit repository", handlerKey: "repo.audit", repo: "gavad54/zelmira-one-" }]
  });
  assert.equal(planned.tasks[0].payload.repo, "gavad54/zelmira-one-");
});
