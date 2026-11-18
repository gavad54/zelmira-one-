import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lock = JSON.parse(
  readFileSync(new URL("../package-lock.json", import.meta.url), "utf8")
);

function affectedByKnownPicomatchAdvisory(version) {
  const parts = String(version ?? "").split(".").map(part => Number.parseInt(part, 10));
  if (parts.length !== 3 || !parts.every(Number.isInteger)) return true;
  const [major, minor, patch] = parts;
  return major < 4 || (major === 4 && minor === 0 && patch <= 7);
}

test("known affected picomatch versions remain development-only", () => {
  const affected = Object.entries(lock.packages ?? {}).filter(([path, entry]) => {
    const isPicomatch = path === "node_modules/picomatch" ||
      path.endsWith("/node_modules/picomatch");
    return isPicomatch && affectedByKnownPicomatchAdvisory(entry.version);
  });

  const runtimeInstances = affected
    .filter(([, entry]) => entry.dev !== true)
    .map(([path, entry]) => path + "@" + entry.version + " (dev=" + entry.dev + ")");

  assert.deepEqual(
    runtimeInstances,
    [],
    "Known affected picomatch versions must not enter the production dependency graph"
  );
});
