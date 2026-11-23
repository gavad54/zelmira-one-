import test from "node:test";
import assert from "node:assert/strict";
import {
  claimTask,
  createTaskRecord,
  heartbeatTask
} from "../src/lib/task-engine.mjs";

const NOW = new Date("2026-11-23T10:00:00.000Z");
const DEFINITION = Object.freeze({
  projectKey: "VAYRO",
  handlerKey: "repo.audit",
  title: "Verify task scheduling and lease recovery",
  idempotencyKey: "vayro-task-scheduling-2026-11-23",
  payload: { repo: "gavad54/zelmira-one-" }
});

const claimOptions = (workerId, leaseToken, now = NOW) => ({
  workerId,
  leaseToken,
  now
});

test("scheduled tasks cannot be claimed before availableAt", () => {
  const scheduledAt = new Date(NOW.getTime() + 30_000);
  const task = createTaskRecord({ ...DEFINITION, scheduledAt }, NOW);

  assert.throws(
    () => claimTask(task, claimOptions("worker-a", "12345678-1234-1234")),
    /TASK_NOT_CLAIMABLE/
  );
  assert.equal(
    claimTask(task, claimOptions("worker-a", "12345678-1234-1234", scheduledAt)).status,
    "RUNNING"
  );
});

test("expired deadlines reject claims and expired leases reject heartbeats", () => {
  const expiredDeadlineTask = createTaskRecord({
    ...DEFINITION,
    deadline: new Date(NOW.getTime() - 1_000)
  }, NOW);

  assert.throws(
    () => claimTask(expiredDeadlineTask, claimOptions("worker-a", "12345678-1234-1234")),
    /TASK_DEADLINE_EXPIRED/
  );

  const running = claimTask(
    createTaskRecord(DEFINITION, NOW),
    claimOptions("worker-a", "12345678-1234-1234")
  );
  const afterLeaseExpiry = new Date(running.leaseExpiresAt.getTime() + 1);

  assert.throws(() => heartbeatTask(running, {
    workerId: "worker-a",
    leaseToken: running.leaseToken,
    now: afterLeaseExpiry
  }), /TASK_LEASE_EXPIRED/);
});

test("a worker cannot reclaim a lease after the configured attempt limit", () => {
  const running = claimTask(
    createTaskRecord({ ...DEFINITION, maxAttempts: 1 }, NOW),
    claimOptions("worker-a", "12345678-1234-1234")
  );
  const afterLeaseExpiry = new Date(running.leaseExpiresAt.getTime() + 1);

  assert.throws(() => claimTask(running, {
    workerId: "worker-b",
    leaseToken: "22345678-1234-1234",
    now: afterLeaseExpiry
  }), /TASK_ATTEMPTS_EXHAUSTED/);
});
