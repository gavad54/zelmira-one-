const HANDLER_CAPABILITIES = Object.freeze({
  "report.generate": "REPORT_GENERATION",
  "repo.audit": "REPOSITORY_AUDIT",
  "repo.test": "CI_OBSERVATION"
});
const CAPABILITIES = new Set([...Object.values(HANDLER_CAPABILITIES), "TASK_REVIEW"]);
const PERMISSIONS = new Set(["READ_TASK", "READ_REPOSITORY", "WRITE_TASK_RESULT", "REQUEST_OWNER_APPROVAL"]);
const KEY = /^[a-z][a-z0-9._-]{1,63}$/;

function fail(code) { throw new Error(code); }

export function validateAgentDefinition(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) fail("AGENT_DEFINITION_INVALID");
  if (typeof input.key !== "string" || !KEY.test(input.key)) fail("AGENT_KEY_INVALID");
  if (!Number.isSafeInteger(input.version) || input.version < 1) fail("AGENT_VERSION_INVALID");
  if (typeof input.displayName !== "string" || input.displayName.trim().length < 2 || input.displayName.length > 100) fail("AGENT_NAME_INVALID");
  if (!Array.isArray(input.capabilities) || input.capabilities.length < 1 || input.capabilities.some(x => !CAPABILITIES.has(x)) || new Set(input.capabilities).size !== input.capabilities.length) fail("AGENT_CAPABILITIES_INVALID");
  const permissions = input.permissions ?? ["READ_TASK"];
  if (!Array.isArray(permissions) || permissions.some(x => !PERMISSIONS.has(x)) || new Set(permissions).size !== permissions.length) fail("AGENT_PERMISSIONS_INVALID");
  const projectKeys = input.projectKeys ?? [];
  if (!Array.isArray(projectKeys) || projectKeys.some(x => typeof x !== "string" || !/^[A-Z][A-Z0-9_-]{1,39}$/.test(x))) fail("AGENT_PROJECT_SCOPE_INVALID");
  return Object.freeze({
    key: input.key, version: input.version, displayName: input.displayName.trim(),
    capabilities: Object.freeze([...input.capabilities]), permissions: Object.freeze([...permissions]),
    projectKeys: Object.freeze([...projectKeys]), enabled: input.enabled === true
  });
}

export function assertAgentCanHandle(agentInput, task) {
  const agent = validateAgentDefinition(agentInput);
  if (!agent.enabled) fail("AGENT_DISABLED");
  const required = HANDLER_CAPABILITIES[task?.handlerKey];
  if (!required || !agent.capabilities.includes(required)) fail("AGENT_CAPABILITY_MISMATCH");
  if (agent.projectKeys.length && !agent.projectKeys.includes(task.projectKey)) fail("AGENT_PROJECT_SCOPE_DENIED");
  if (!agent.permissions.includes("READ_TASK")) fail("AGENT_READ_TASK_DENIED");
  return agent;
}

/** Independent review is a separate decision record; it never self-approves the executor's work. */
export function validateTaskReview(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) fail("TASK_REVIEW_INVALID");
  if (typeof input.taskId !== "string" || input.taskId.length < 2 || input.taskId.length > 100) fail("TASK_REVIEW_TASK_INVALID");
  if (typeof input.executorAgentKey !== "string" || !KEY.test(input.executorAgentKey)) fail("TASK_REVIEW_EXECUTOR_INVALID");
  if (typeof input.reviewerAgentKey !== "string" || !KEY.test(input.reviewerAgentKey) || input.reviewerAgentKey === input.executorAgentKey) fail("TASK_REVIEW_NOT_INDEPENDENT");
  if (!["APPROVE", "REQUEST_CHANGES", "BLOCK"].includes(input.decision)) fail("TASK_REVIEW_DECISION_INVALID");
  if (!Array.isArray(input.evidence) || input.evidence.length > 50 || input.evidence.some(x => typeof x !== "string" || x.length > 500)) fail("TASK_REVIEW_EVIDENCE_INVALID");
  if (input.decision === "APPROVE" && input.evidence.length === 0) fail("TASK_REVIEW_APPROVAL_REQUIRES_EVIDENCE");
  return Object.freeze({
    taskId: input.taskId, executorAgentKey: input.executorAgentKey, reviewerAgentKey: input.reviewerAgentKey,
    decision: input.decision, evidence: Object.freeze([...input.evidence])
  });
}


export function assertAgentCanReview(agentInput, projectKey) {
  const agent = validateAgentDefinition(agentInput);
  if (!agent.enabled) fail("REVIEW_AGENT_DISABLED");
  if (!agent.capabilities.includes("TASK_REVIEW")) fail("REVIEW_AGENT_CAPABILITY_REQUIRED");
  if (!agent.permissions.includes("READ_TASK")) fail("REVIEW_AGENT_READ_TASK_DENIED");
  if (agent.projectKeys.length && !agent.projectKeys.includes(projectKey)) fail("REVIEW_AGENT_PROJECT_SCOPE_DENIED");
  return agent;
}

/** Deterministic evidence gate. This is a policy reviewer, not a generative AI claim. */
export function evaluateTaskResult(task, result) {
  if (!task || typeof task.handler_key !== "string" || !result || typeof result !== "object" || Array.isArray(result)) {
    return Object.freeze({ decision: "BLOCK", evidence: Object.freeze(["Result is missing or is not a structured object."]) });
  }
  const evidence = [];
  if (task.handler_key === "report.generate") {
    if (!/^[a-f0-9]{64}$/.test(result.inputSha256 ?? "")) evidence.push("Report input digest is missing or malformed.");
    if (!Number.isSafeInteger(result.inputBytes) || result.inputBytes < 0) evidence.push("Report input byte count is invalid.");
    if (result.executionMode !== "deterministic-read-only") evidence.push("Report execution mode is not read-only.");
  } else if (task.handler_key === "repo.audit") {
    if (typeof result.repository !== "string" || result.repository !== task.payload?.repo) evidence.push("Repository identity does not match the requested repository.");
    if (!["public", "private"].includes(result.visibility)) evidence.push("Repository visibility is missing.");
    if (typeof result.archived !== "boolean") evidence.push("Repository archive state is missing.");
    if (result.defaultBranch !== null && typeof result.defaultBranch !== "string") evidence.push("Repository default branch is malformed.");
    if (result.latestCommitSha !== null && !/^[a-f0-9]{40}$/i.test(result.latestCommitSha ?? "")) evidence.push("Latest commit SHA is malformed.");
    if (result.source !== "GitHub REST read-only API") evidence.push("Repository audit source is not verified as read-only.");
  } else if (task.handler_key === "repo.test") {
    if (result.repository !== task.payload?.repo || result.mode !== "read-only-existing-ci-observation" || !Array.isArray(result.runs) || result.runs.length > 10) {
      evidence.push("CI observation evidence is incomplete.");
    } else if (result.runs.some(run => !run || typeof run.name !== "string" || typeof run.status !== "string" || (run.headSha !== null && !/^[a-f0-9]{40}$/i.test(run.headSha ?? "")))) {
      evidence.push("One or more CI run records are malformed.");
    }
  } else {
    evidence.push("No reviewer policy exists for this handler.");
  }
  if (evidence.length) return Object.freeze({ decision: "BLOCK", evidence: Object.freeze(evidence) });
  return Object.freeze({
    decision: "APPROVE",
    evidence: Object.freeze([
      "Handler-specific output contract passed.",
      "Read-only execution boundary is declared.",
      `Validated handler: ${task.handler_key}.`
    ])
  });
}
