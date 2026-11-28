import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { safeFailure, taskWorkerHandlers } from "../src/worker/task-worker.mjs";

test("report handler emits a bounded deterministic read-only summary", async () => {
  const payload = { reportType: "engineering", taskIds: ["a", "b"] };
  const result = await taskWorkerHandlers["report.generate"]({
    task_id: "task-test", project_key: "VAYRO", title: "Engineering report", payload
  });
  assert.equal(result.taskId, "task-test");
  assert.equal(result.executionMode, "deterministic-read-only");
  assert.equal(result.inputSha256, createHash("sha256").update(JSON.stringify(payload)).digest("hex"));
  assert.equal(result.inputBytes, Buffer.byteLength(JSON.stringify(payload), "utf8"));
});

test("worker registry excludes arbitrary execution and unreviewed health checks", () => {
  assert.equal(typeof taskWorkerHandlers["repo.audit"], "function");
  assert.equal(typeof taskWorkerHandlers["repo.test"], "function");
  assert.equal(typeof taskWorkerHandlers["report.generate"], "function");
  assert.equal(taskWorkerHandlers["product.health_check"], undefined);
  assert.equal(taskWorkerHandlers["shell.exec"], undefined);
  assert.equal(taskWorkerHandlers["code.exec"], undefined);
});

test("worker timeouts and graceful shutdowns are retryable so work is not permanently lost", () => {
  assert.deepEqual(safeFailure(new Error("TASK_HANDLER_TIMEOUT")), {
    code: "TASK_HANDLER_TIMEOUT",
    message: "TASK_HANDLER_TIMEOUT",
    retryable: true
  });
  assert.deepEqual(safeFailure(new Error("WORKER_SHUTTING_DOWN")), {
    code: "WORKER_SHUTTING_DOWN",
    message: "WORKER_SHUTTING_DOWN",
    retryable: true
  });
});

test("transient upstream network failures retain their retryable classification", () => {
  const error = Object.assign(new Error("GitHub API network request failed"), {
    code: "GITHUB_NETWORK_ERROR",
    retryable: true
  });
  assert.equal(safeFailure(error).code, "GITHUB_NETWORK_ERROR");
  assert.equal(safeFailure(error).retryable, true);
});

test("worker failure messages redact credentials embedded in URL query strings", () => {
  const failure = safeFailure(new Error(
    "request failed at https://provider.example/hook?token=abc123&mode=fast&password=p%40ss"
  ));
  assert.equal(failure.message,
    "request failed at https://provider.example/hook?token=[REDACTED]&mode=fast&password=[REDACTED]");
  assert.equal(failure.retryable, false);
});

test("worker failure messages redact authorization headers and inline credentials", () => {
  const failure = safeFailure(new Error(
    "authorization: BasicSecret Bearer abc.def.ghi api_key=supersecret"
  ));
  assert.equal(failure.message,
    "authorization=[REDACTED] Bearer [REDACTED] api_key=[REDACTED]");
});

test("repository audit and CI handlers reject malformed repository references before network access", async () => {
  for (const repo of [null, 123, {}, "", "../secrets", "./repo", "owner/..", "owner/.", "owner/repo/extra", "https://github.com/owner/repo", "owner/repo?redirect=1"]) {
    await assert.rejects(
      taskWorkerHandlers["repo.audit"]({
        task_id: "task-test", project_key: "VAYRO", title: "Audit repository",
        payload: { repo }
      }, { signal: undefined }),
      error => error?.code === "REPOSITORY_REFERENCE_INVALID"
    );
    await assert.rejects(
      taskWorkerHandlers["repo.test"]({
        task_id: "task-test", project_key: "VAYRO", title: "Inspect CI",
        payload: { repo }
      }, { signal: undefined }),
      error => error?.code === "REPOSITORY_REFERENCE_INVALID"
    );
  }
});

test("worker handlers are immutable and expose only the reviewed read-only registry", () => {
  assert.equal(Object.isFrozen(taskWorkerHandlers), true);
  assert.deepEqual(Object.keys(taskWorkerHandlers).sort(), [
    "repo.audit", "repo.test", "report.generate"
  ]);
});

test("worker failure messages redact URL username and password credentials", () => {
  const failure = safeFailure(new Error(
    "upstream failed at https://service-user:supersecret@provider.example/v1/tasks?mode=read"
  ));
  assert.equal(failure.message,
    "upstream failed at https://[REDACTED]@provider.example/v1/tasks?mode=read");
  assert.equal(failure.message.includes("service-user"), false);
  assert.equal(failure.message.includes("supersecret"), false);
});

test("repo.audit performs bounded read-only GitHub metadata and latest-commit requests", async t => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    const value = String(url);
    calls.push({ url: value, init });
    if (value.endsWith("/repos/openai/example")) {
      return new Response(JSON.stringify({
        owner: { login: "openai" }, name: "example", private: false,
        default_branch: "main", archived: false, pushed_at: "2026-11-28T08:00:00Z"
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (value.endsWith("/repos/openai/example/commits?per_page=1")) {
      return new Response(JSON.stringify([{ sha: "a".repeat(40) }]), {
        status: 200, headers: { "content-type": "application/json" }
      });
    }
    throw new Error("UNEXPECTED_GITHUB_REQUEST");
  });

  const result = await taskWorkerHandlers["repo.audit"]({
    task_id: "task-audit", project_key: "VAYRO", title: "Audit repository",
    payload: { repo: "openai/example" }
  }, { signal: new AbortController().signal });

  assert.equal(result.repository, "openai/example");
  assert.equal(result.visibility, "public");
  assert.equal(result.defaultBranch, "main");
  assert.equal(result.latestCommitSha, "a".repeat(40));
  assert.equal(result.source, "GitHub REST read-only API");
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.init.method, "GET");
    assert.equal(call.init.redirect, "error");
    assert.equal(call.init.headers.accept, "application/vnd.github+json");
  }
});

test("repo.test observes at most ten existing workflow runs without triggering CI", async t => {
  let requestCount = 0;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    requestCount += 1;
    assert.equal(String(url), "https://api.github.com/repos/openai/example/actions/runs?per_page=10");
    assert.equal(init.method, "GET");
    assert.equal(init.redirect, "error");
    return new Response(JSON.stringify({
      workflow_runs: Array.from({ length: 12 }, (_, index) => ({
        name: `workflow-${index}`, status: index === 0 ? "completed" : "queued",
        conclusion: index === 0 ? "success" : null, head_sha: `${index}`.repeat(40),
        event: "push", updated_at: "2026-11-28T08:00:00Z"
      }))
    }), { status: 200, headers: { "content-type": "application/json" } });
  });

  const result = await taskWorkerHandlers["repo.test"]({
    task_id: "task-ci", project_key: "VAYRO", title: "Inspect CI",
    payload: { repo: "openai/example" }
  }, { signal: new AbortController().signal });

  assert.equal(requestCount, 1);
  assert.equal(result.mode, "read-only-existing-ci-observation");
  assert.equal(result.runs.length, 10);
  assert.equal(result.runs[0].name, "workflow-0");
  assert.equal(result.runs[0].conclusion, "success");
});

test("repo handlers classify missing repositories as non-retryable and rate limits as retryable", async t => {
  t.mock.method(globalThis, "fetch", async () =>
    new Response(JSON.stringify({ message: "Not Found" }), { status: 404 })
  );
  await assert.rejects(
    taskWorkerHandlers["repo.audit"]({
      task_id: "task-404", project_key: "VAYRO", title: "Audit missing repository",
      payload: { repo: "openai/missing" }
    }, { signal: new AbortController().signal }),
    error => error?.code === "REPOSITORY_NOT_FOUND" && error.retryable === false
  );

  t.mock.restoreAll();
  t.mock.method(globalThis, "fetch", async () =>
    new Response(JSON.stringify({ message: "API rate limit exceeded" }), { status: 429 })
  );
  await assert.rejects(
    taskWorkerHandlers["repo.test"]({
      task_id: "task-429", project_key: "VAYRO", title: "Inspect rate-limited CI",
      payload: { repo: "openai/example" }
    }, { signal: new AbortController().signal }),
    error => error?.code === "GITHUB_API_ERROR" && error.retryable === true
  );
});
