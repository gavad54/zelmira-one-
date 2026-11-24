import test from "node:test";
import assert from "node:assert/strict";
import {
  approveTask, cancelTask, claimTask, completeTask, createTaskRecord,
  failTask, heartbeatTask, validateTaskDefinition
} from "./task-engine.mjs";

const NOW = new Date("2026-11-21T10:00:00.000Z");
const DEFINITION = Object.freeze({
  projectKey: "VAYRO", handlerKey: "repo.audit", title: "Audit VAYRO repository",
  idempotencyKey: "vayro-audit-2026-11-21", payload: { repo: "gavad54/zelmira-one-" }
});
const claim = task => claimTask(task, { workerId: "worker-a", leaseToken: "12345678-1234-1234", now: NOW });

test("validates task definitions and rejects unapproved execution handlers", () => {
  assert.equal(validateTaskDefinition(DEFINITION).handlerKey, "repo.audit");
  assert.equal(validateTaskDefinition(DEFINITION).taskType, "ENGINEERING");
  assert.throws(() => validateTaskDefinition({ ...DEFINITION, taskType: "OPERATIONS" }), /TASK_TYPE_HANDLER_MISMATCH/);
  assert.throws(() => validateTaskDefinition({ ...DEFINITION, handlerKey: "shell.exec" }), /TASK_HANDLER_NOT_ALLOWED/);
  assert.throws(() => validateTaskDefinition({ ...DEFINITION, priority: 101 }), /TASK_PRIORITY_INVALID/);
  assert.throws(() => validateTaskDefinition({ ...DEFINITION, maxAttempts: 0 }), /TASK_MAX_ATTEMPTS_INVALID/);
});

test("rejects unsafe, oversized and non-JSON payloads", () => {
  const unsafe = JSON.parse('{"__proto__":{"polluted":true}}');
  assert.throws(() => validateTaskDefinition({ ...DEFINITION, payload: unsafe }), /TASK_PAYLOAD_UNSAFE_KEY/);
  assert.throws(() => validateTaskDefinition({ ...DEFINITION, payload: { amount: Number.NaN } }), /TASK_PAYLOAD_NOT_JSON/);
  assert.throws(() => validateTaskDefinition({ ...DEFINITION, payload: { data: "x".repeat(66_000) } }), /TASK_PAYLOAD_TOO_LARGE/);
});

test("approval-required tasks cannot be claimed until approved", () => {
  const waiting = createTaskRecord({ ...DEFINITION, approvalRequired: true }, NOW);
  assert.equal(waiting.status, "WAITING_FOR_OWNER");
  assert.throws(() => claim(waiting), /TASK_NOT_CLAIMABLE/);
  const approved = approveTask(waiting, NOW);
  assert.equal(approved.status, "QUEUED");
  assert.equal(claim(approved).status, "RUNNING");
});

test("claims a due task with a bounded lease and increments the attempt", () => {
  const queued = createTaskRecord(DEFINITION, NOW);
  const running = claim(queued);
  assert.equal(running.status, "RUNNING");
  assert.equal(running.attemptCount, 1);
  assert.equal(running.leaseOwner, "worker-a");
  assert.equal(running.leaseExpiresAt.getTime(), NOW.getTime() + 60_000);
  assert.throws(() => claimTask(queued, { workerId: "x", leaseToken: "bad", now: NOW }), /TASK_WORKER_ID_INVALID/);
});

test("heartbeat and completion require the current unexpired lease", () => {
  const running = claim(createTaskRecord(DEFINITION, NOW));
  const renewed = heartbeatTask(running, { workerId: "worker-a", leaseToken: running.leaseToken, now: new Date(NOW.getTime() + 10_000) });
  assert.equal(renewed.leaseExpiresAt.getTime(), NOW.getTime() + 70_000);
  const done = completeTask(renewed, { workerId: "worker-a", leaseToken: running.leaseToken, result: { checked: true }, now: new Date(NOW.getTime() + 20_000) });
  assert.equal(done.status, "SUCCEEDED");
  assert.equal(done.leaseToken, null);
  assert.throws(() => completeTask(running, { workerId: "other-worker", leaseToken: running.leaseToken, result: {}, now: NOW }), /TASK_LEASE_MISMATCH/);
});

test("retry uses bounded exponential backoff and stops at max attempts", () => {
  const first = claim(createTaskRecord({ ...DEFINITION, maxAttempts: 2 }, NOW));
  const retry = failTask(first, { workerId: "worker-a", leaseToken: first.leaseToken, errorCode: "TEMPORARY_ERROR", errorMessage: "Temporary failure", now: NOW });
  assert.equal(retry.status, "RETRYING");
  assert.equal(retry.availableAt.getTime(), NOW.getTime() + 5_000);
  const second = claimTask(retry, { workerId: "worker-b", leaseToken: "22345678-1234-1234", now: retry.availableAt });
  const failed = failTask(second, { workerId: "worker-b", leaseToken: second.leaseToken, errorCode: "PERMANENT_ERROR", errorMessage: "Stopped", retryable: false, now: retry.availableAt });
  assert.equal(failed.status, "DEAD_LETTER");
});

test("expired leases can be reclaimed and stale workers cannot complete", () => {
  const first = claim(createTaskRecord(DEFINITION, NOW));
  const later = new Date(NOW.getTime() + 61_000);
  const reclaimed = claimTask(first, { workerId: "worker-b", leaseToken: "22345678-1234-1234", now: later });
  assert.equal(reclaimed.attemptCount, 2);
  assert.throws(() => completeTask(first, { workerId: "worker-a", leaseToken: first.leaseToken, now: later, result: {} }), /TASK_LEASE_EXPIRED/);
});

test("cancellation is terminal and cannot be repeated", () => {
  const cancelled = cancelTask(createTaskRecord(DEFINITION, NOW), NOW);
  assert.equal(cancelled.status, "CANCELLED");
  assert.throws(() => cancelTask(cancelled, NOW), /TASK_ALREADY_TERMINAL/);
});
