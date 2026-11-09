import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

test("production build can import platform Prisma without its runtime URL, while runtime use fails closed", () => {
  const moduleUrl = pathToFileURL(resolve(process.cwd(), "src/lib/platform-prisma.ts")).href;
  const script = `
    process.env.NODE_ENV = "production";
    delete process.env.PLATFORM_DATABASE_URL;
    const platform = await import(${JSON.stringify(moduleUrl)});
    let failure;
    try {
      await platform.assertPlatformRuntimeRole();
    } catch (error) {
      failure = error;
    }
    if (!failure || failure.message !== "PLATFORM_DATABASE_URL is required in production; refusing the default database role") {
      console.error("Expected runtime access to fail closed when PLATFORM_DATABASE_URL is missing.");
      process.exitCode = 1;
    }
  `;
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "-e", script],
    {
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: "production", PLATFORM_DATABASE_URL: "" },
      encoding: "utf8"
    }
  );
  assert.equal(
    result.status,
    0,
    `platform Prisma build-safe import/runtime fail-closed contract failed.\\nstdout:\\n${result.stdout}\\nstderr:\\n${result.stderr}`
  );
});
