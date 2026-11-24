import { createHash } from "node:crypto";

const EXECUTABLE_HANDLERS = new Set(["report.generate", "repo.audit", "repo.test"]);
const HANDLER_TASK_TYPES = Object.freeze({
  "report.generate": "REPORTING",
  "repo.audit": "ENGINEERING",
  "repo.test": "ENGINEERING"
});
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,99}$/;
const PROJECT_PATTERN = /^[A-Z][A-Z0-9_-]{1,39}$/;
const MAX_CRITERIA = 200;

function fail(code) {
  throw new Error(code);
}

function requiredText(value, code, max) {
  if (typeof value !== "string" || value.trim().length < 2 || value.length > max) fail(code);
  return value.trim();
}

function validGoalDate(value, code) {
  if (value == null) return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) fail(code);
  return date;
}

function canonicalTaskKey(goalId, version, criterionId) {
  return `goal:${goalId}:v${version}:${criterionId}`;
}

function stableTopologicalSort(criteria, byId) {
  const indegree = new Map(criteria.map(item => [item.id, item.dependsOn.length]));
  const dependents = new Map(criteria.map(item => [item.id, []]));
  for (const item of criteria) {
    for (const dependency of item.dependsOn) dependents.get(dependency).push(item.id);
  }
  const ready = criteria.filter(item => indegree.get(item.id) === 0).map(item => item.id);
  const ordered = [];
  while (ready.length) {
    const id = ready.shift();
    ordered.push(byId.get(id));
    for (const dependent of dependents.get(id)) {
      indegree.set(dependent, indegree.get(dependent) - 1);
      if (indegree.get(dependent) === 0) ready.push(dependent);
    }
  }
  if (ordered.length !== criteria.length) fail("DEPENDENCY_CYCLE");
  return ordered;
}

/**
 * Deterministically decomposes an owner-approved goal into queue-ready task
 * descriptors. It performs no I/O and cannot grant approvals or execute tasks.
 */
export function planGoal(goal) {
  if (!goal || typeof goal !== "object" || Array.isArray(goal)) fail("GOAL_INVALID");
  const goalId = requiredText(goal.goalId, "GOAL_ID_INVALID", 100);
  if (!ID_PATTERN.test(goalId)) fail("GOAL_ID_INVALID");
  const projectKey = requiredText(goal.projectKey, "PROJECT_KEY_INVALID", 40);
  if (!PROJECT_PATTERN.test(projectKey)) fail("PROJECT_KEY_INVALID");
  const title = requiredText(goal.title, "GOAL_TITLE_INVALID", 160);
  const version = goal.version ?? 1;
  if (!Number.isSafeInteger(version) || version < 1 || version > 1_000_000) fail("GOAL_VERSION_INVALID");
  const priority = goal.priority ?? 50;
  if (!Number.isInteger(priority) || priority < 0 || priority > 100) fail("GOAL_PRIORITY_INVALID");
  const approvalRequired = goal.approvalRequired ?? true;
  if (typeof approvalRequired !== "boolean") fail("GOAL_APPROVAL_POLICY_INVALID");
  if (!Array.isArray(goal.acceptanceCriteria) || goal.acceptanceCriteria.length < 1 ||
      goal.acceptanceCriteria.length > MAX_CRITERIA) fail("GOAL_CRITERIA_INVALID");

  const seen = new Set();
  const criteria = goal.acceptanceCriteria.map(item => {
    if (!item || typeof item !== "object" || Array.isArray(item)) fail("GOAL_CRITERION_INVALID");
    const id = requiredText(item.id, "CRITERION_ID_INVALID", 100);
    if (!ID_PATTERN.test(id) || seen.has(id)) fail("CRITERION_ID_DUPLICATE_OR_INVALID");
    seen.add(id);
    const criterionTitle = requiredText(item.title, "CRITERION_TITLE_INVALID", 160);
    const handlerKey = requiredText(item.handlerKey, "HANDLER_KEY_INVALID", 80);
    if (!EXECUTABLE_HANDLERS.has(handlerKey)) fail("HANDLER_NOT_APPROVED");
    const dependsOn = item.dependsOn ?? [];
    if (!Array.isArray(dependsOn) || dependsOn.some(value => typeof value !== "string") ||
        new Set(dependsOn).size !== dependsOn.length || dependsOn.includes(id)) fail("DEPENDENCY_LIST_INVALID");
    return { id, title: criterionTitle, handlerKey, dependsOn: [...dependsOn] };
  });

  const byId = new Map(criteria.map(item => [item.id, item]));
  for (const item of criteria) {
    for (const dependency of item.dependsOn) {
      if (!byId.has(dependency)) fail("UNKNOWN_DEPENDENCY");
    }
  }

  const ordered = stableTopologicalSort(criteria, byId);
  const tasks = ordered.map(item => ({
    projectKey,
    taskType: HANDLER_TASK_TYPES[item.handlerKey],
    handlerKey: item.handlerKey,
    title: item.title,
    priority,
    idempotencyKey: canonicalTaskKey(goalId, version, item.id),
    criterionId: item.id,
    dependsOn: [...item.dependsOn],
    approvalRequired,
    payload: {
      goalId,
      goalVersion: version,
      goalTitle: title,
      criterionId: item.id,
      acceptanceCriterion: item.title,
      dependsOn: [...item.dependsOn]
    }
  }));

  return Object.freeze({
    goalId,
    projectKey,
    version,
    title,
    approvalRequired,
    tasks: Object.freeze(tasks.map(task => Object.freeze(task)))
  });
}

/** Selects unfinished tasks whose declared dependencies are already complete. */
export function selectReadyTasks(tasks, completedTaskIds) {
  if (!Array.isArray(tasks) || !(completedTaskIds instanceof Set)) fail("READY_SELECTION_INPUT_INVALID");
  return tasks.filter(task =>
    task && typeof task.criterionId === "string" &&
    !completedTaskIds.has(task.criterionId) &&
    Array.isArray(task.dependsOn) &&
    task.dependsOn.every(dependency => completedTaskIds.has(dependency))
  );
}
