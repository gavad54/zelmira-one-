import test from "node:test";
import assert from "node:assert/strict";
import { assertAgentCanHandle, validateAgentDefinition, validateTaskReview } from "../src/engine/agent-registry.mjs";

const agent = {
  key: "repo-auditor", version: 1, displayName: "Repository Auditor",
  capabilities: ["REPOSITORY_AUDIT"], permissions: ["READ_TASK", "READ_REPOSITORY"],
  projectKeys: ["VAYRO"], enabled: true
};

test("agent definitions are allowlisted and project-scoped", () => {
  assert.equal(validateAgentDefinition(agent).enabled, true);
  assert.equal(assertAgentCanHandle(agent, { handlerKey: "repo.audit", projectKey: "VAYRO" }).key, "repo-auditor");
  assert.throws(() => assertAgentCanHandle(agent, { handlerKey: "repo.test", projectKey: "VAYRO" }), /AGENT_CAPABILITY_MISMATCH/);
  assert.throws(() => assertAgentCanHandle(agent, { handlerKey: "repo.audit", projectKey: "ARIA" }), /AGENT_PROJECT_SCOPE_DENIED/);
  assert.throws(() => validateAgentDefinition({ ...agent, permissions: ["SHELL_EXEC"] }), /AGENT_PERMISSIONS_INVALID/);
});

test("disabled agents and agents without task read permission cannot execute", () => {
  assert.throws(() => assertAgentCanHandle({ ...agent, enabled: false }, { handlerKey: "repo.audit", projectKey: "VAYRO" }), /AGENT_DISABLED/);
  assert.throws(() => assertAgentCanHandle({ ...agent, permissions: ["READ_REPOSITORY"] }, { handlerKey: "repo.audit", projectKey: "VAYRO" }), /AGENT_READ_TASK_DENIED/);
});

test("review requires an independent reviewer and evidence-backed approval", () => {
  assert.throws(() => validateTaskReview({ taskId: "t1", executorAgentKey: "repo-auditor", reviewerAgentKey: "repo-auditor", decision: "APPROVE", evidence: ["test"] }), /TASK_REVIEW_NOT_INDEPENDENT/);
  assert.throws(() => validateTaskReview({ taskId: "t1", executorAgentKey: "repo-auditor", reviewerAgentKey: "security-reviewer", decision: "APPROVE", evidence: [] }), /TASK_REVIEW_APPROVAL_REQUIRES_EVIDENCE/);
  const review = validateTaskReview({ taskId: "t1", executorAgentKey: "repo-auditor", reviewerAgentKey: "security-reviewer", decision: "REQUEST_CHANGES", evidence: ["missing authorization test"] });
  assert.equal(review.decision, "REQUEST_CHANGES");
});
