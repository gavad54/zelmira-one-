import test from "node:test";
import assert from "node:assert/strict";
import { assertAgentCanHandle, assertAgentCanReview, evaluateTaskResult, validateAgentDefinition, validateTaskReview } from "../src/engine/agent-registry.mjs";

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


test("review agent must be enabled, scoped and explicitly review-capable", () => {
  const reviewer = {
    key: "independent-reviewer", version: 1, displayName: "Independent Reviewer",
    capabilities: ["TASK_REVIEW"], permissions: ["READ_TASK"], projectKeys: ["VAYRO"], enabled: true
  };
  assert.equal(assertAgentCanReview(reviewer, "VAYRO").key, "independent-reviewer");
  assert.throws(() => assertAgentCanReview(reviewer, "ARIA"), /REVIEW_AGENT_PROJECT_SCOPE_DENIED/);
  assert.throws(() => assertAgentCanReview({ ...reviewer, enabled: false }, "VAYRO"), /REVIEW_AGENT_DISABLED/);
});

test("deterministic reviewer approves only handler-specific evidence contracts", () => {
  const good = evaluateTaskResult(
    { handler_key: "repo.audit" },
    { repository: "gavad54/zelmira-one-", source: "GitHub REST read-only API" }
  );
  assert.equal(good.decision, "APPROVE");
  const bad = evaluateTaskResult({ handler_key: "repo.audit" }, { repository: "bad" });
  assert.equal(bad.decision, "BLOCK");
  assert.ok(bad.evidence.length > 0);
});
