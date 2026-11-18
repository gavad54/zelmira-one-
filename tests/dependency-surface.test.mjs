import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lock = JSON.parse(
  readFileSync(new URL("../package-lock.json", import.meta.url), "utf8")
);

function affectedByKnownPicomatchAdvisory(version) {
  const match = /^(\\d+)\\.(\\d+)\\.(\\d+)(?:[-+].*)?$/.exec(version ?? "");
  if (!match) return true;
  const [major, minor, patch] = match.slice(1).map(Number);
  return major < 4 || (major === 4 && minor === 0 && patch <= 7);
}

test("known affected picomatch versions remain development-only", () => {
  const affected = Object.entries(lock.packages ?? {}).filter(([path, entry]) =>
    /(^|\\/)node_modules\\/picomatch$/.test(path) &&
    affectedByKnownPicomatchAdvisory(entry.version)
  );

  const runtimeInstances = affected
    .filter(([, entry]) => entry.dev !== true)
    .map(([path, entry]) => `${path}@${entry.version} (dev=${entry.dev})`);

  assert.deepEqual(
    runtimeInstances,
    [],
    "Known affected picomatch versions must not enter the production dependency graph"
  );
});
