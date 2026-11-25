import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const backup = readFileSync(new URL("../.github/workflows/vayro-db-backup.yml", import.meta.url), "utf8");
const restore = readFileSync(new URL("../.github/workflows/vayro-db-restore-drill.yml", import.meta.url), "utf8");

test("backup workflow uses provider-neutral S3 credentials and configuration", () => {
  for (const name of [
    "VAYRO_S3_ACCESS_KEY_ID",
    "VAYRO_S3_SECRET_ACCESS_KEY",
    "VAYRO_S3_BUCKET",
    "VAYRO_S3_ENDPOINT",
    "VAYRO_S3_REGION",
  ]) assert.ok(backup.includes(name), `backup workflow is missing ${name}`);
  assert.doesNotMatch(backup, /VAYRO_B2_|B2_BUCKET|B2_S3_ENDPOINT|B2_REGION/);
  assert.match(backup, /addressing_style\s*=\s*path/);
  assert.match(backup, /AWS_REQUEST_CHECKSUM_CALCULATION:\s*when_required/);
  assert.match(backup, /AWS_RESPONSE_CHECKSUM_VALIDATION:\s*when_required/);
});

test("backup workflow validates HTTPS endpoint and keeps encrypted upload", () => {
  assert.match(backup, /https:\/\//);
  assert.match(backup, /age --recipient/);
  assert.match(backup, /sha256sum/);
  assert.match(backup, /s3api head-object/);
  assert.match(backup, /github\.ref == 'refs\/heads\/main'/);
});

test("restore workflow uses provider-neutral S3 configuration and verifies target separation", () => {
  for (const name of [
    "VAYRO_S3_ACCESS_KEY_ID",
    "VAYRO_S3_SECRET_ACCESS_KEY",
    "VAYRO_S3_BUCKET",
    "VAYRO_S3_ENDPOINT",
    "VAYRO_S3_REGION",
  ]) assert.ok(restore.includes(name), `restore workflow is missing ${name}`);
  assert.doesNotMatch(restore, /VAYRO_B2_|B2_BUCKET|B2_S3_ENDPOINT|B2_REGION/);
  assert.match(restore, /addressing_style\s*=\s*path/);
  assert.match(restore, /RESTORE_DATABASE_URL/);
  assert.match(restore, /VAYRO_PRODUCTION_DATABASE_HOST/);
  assert.match(restore, /source\.hostname\.lower\(\) == target\.hostname\.lower\(\)/);
  assert.match(restore, /RESTORE_TO_ISOLATED_VAYRO_TEST/);
  assert.match(restore, /sha256sum --check/);
  assert.match(restore, /age --decrypt/);
  assert.match(restore, /pg_restore --exit-on-error/);
});
