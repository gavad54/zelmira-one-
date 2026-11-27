import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const backup = readFileSync(new URL("../.github/workflows/vayro-db-backup.yml", import.meta.url), "utf8");
const restore = readFileSync(new URL("../.github/workflows/vayro-db-restore-drill.yml", import.meta.url), "utf8");

test("backup workflow uses a dedicated write credential and private R2 configuration", () => {
  for (const name of [
    "VAYRO_R2_BACKUP_ACCESS_KEY_ID",
    "VAYRO_R2_BACKUP_SECRET_ACCESS_KEY",
    "VAYRO_R2_BUCKET",
    "VAYRO_R2_S3_ENDPOINT",
    "VAYRO_R2_REGION",
  ]) assert.ok(backup.includes(name), `backup workflow is missing ${name}`);
  assert.doesNotMatch(backup, /VAYRO_B2_|B2_BUCKET|B2_S3_ENDPOINT|B2_REGION/);
  assert.match(backup, /addressing_style\\s*=\\s*path/);
  assert.match(backup, /AWS_REQUEST_CHECKSUM_CALCULATION:\\s*when_required/);
  assert.match(backup, /AWS_RESPONSE_CHECKSUM_VALIDATION:\\s*when_required/);
});

test("backup workflow validates HTTPS endpoint and verifies downloaded encrypted objects", () => {
  assert.match(backup, /https:\\/\\//);
  assert.match(backup, /age --recipient/);
  assert.match(backup, /sha256sum/);
  assert.match(backup, /s3api head-object/);
  assert.match(backup, /readback-vayro\\.dump\\.age/);
  assert.match(backup, /verify-encrypted-backup-readback\\.sh/);
  assert.match(backup, /github\\.ref == 'refs\\/heads\\/main'/);
});

test("restore workflow uses a separate read-only R2 credential", () => {
  for (const name of [
    "VAYRO_R2_RESTORE_READONLY_ACCESS_KEY_ID",
    "VAYRO_R2_RESTORE_READONLY_SECRET_ACCESS_KEY",
    "VAYRO_R2_BUCKET",
    "VAYRO_R2_S3_ENDPOINT",
    "VAYRO_R2_REGION",
  ]) assert.ok(restore.includes(name), `restore workflow is missing ${name}`);
  assert.doesNotMatch(restore, /VAYRO_R2_BACKUP_ACCESS_KEY_ID|VAYRO_R2_BACKUP_SECRET_ACCESS_KEY/);
  assert.doesNotMatch(restore, /VAYRO_B2_|B2_BUCKET|B2_S3_ENDPOINT|B2_REGION/);
  assert.match(restore, /addressing_style\\s*=\\s*path/);
  assert.match(restore, /RESTORE_DATABASE_URL/);
  assert.match(restore, /VAYRO_PRODUCTION_DATABASE_HOST/);
  assert.match(restore, /production_host == target\\.hostname\\.lower\\(\\)/);
  assert.match(restore, /RESTORE_TO_ISOLATED_VAYRO_TEST/);
  assert.match(restore, /sha256sum --check/);
  assert.match(restore, /age --decrypt/);
  assert.match(restore, /pg_restore --exit-on-error/);
});

test("restore workflow rejects the production database name as well as its host", () => {
  assert.match(restore, /VAYRO_PRODUCTION_DATABASE_NAME/);
  assert.match(restore, /production_database\\s*==\\s*target\\.path\\.lstrip\\(["']\\/["']\\)/);
});

test("restore workflow validates restored data and security posture", () => {
  assert.match(restore, /row_count|row-count/i);
  assert.match(restore, /pg_extension/);
  assert.match(restore, /relrowsecurity/);
  assert.match(restore, /relforcerowsecurity/);
  assert.match(restore, /pg_policies/);
});
