import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));

test("the transitive Effect dependency is pinned to a patched release", () => {
  assert.equal(manifest.overrides.effect, "3.22.2");
  const effect = lock.packages["node_modules/effect"];
  assert.equal(effect.version, "3.22.2");
  assert.equal(effect.resolved, "https://registry.npmjs.org/effect/-/effect-3.22.2.tgz");
  assert.match(effect.integrity, /^sha512-/);
  const allEffectPackages = Object.entries(lock.packages)
    .filter(([path]) => path === "node_modules/effect" || path.endsWith("/node_modules/effect"));
  assert.ok(allEffectPackages.length >= 1);
  assert.ok(allEffectPackages.every(([, pkg]) => {
    const [major, minor, patch] = pkg.version.split(".").map(Number);
    return major > 3 || (major === 3 && (minor > 22 || (minor === 22 && patch >= 1)));
  }));
});
