#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
verifier="$repo_root/scripts/verify-encrypted-backup-readback.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

local_dump="$tmp/vayro.dump.age"
remote_dump="$tmp/readback.dump.age"
local_checksum="$tmp/vayro.dump.age.sha256"
remote_checksum="$tmp/readback.dump.age.sha256"

printf '%s\n' 'synthetic encrypted-backup fixture' > "$local_dump"
cp -- "$local_dump" "$remote_dump"
(cd "$tmp" && sha256sum vayro.dump.age > "$local_checksum")
cp -- "$local_checksum" "$remote_checksum"

bash "$verifier" "$local_dump" "$remote_dump" "$local_checksum" "$remote_checksum"

printf '%s\n' 'tampered read-back bytes' >> "$remote_dump"
if bash "$verifier" "$local_dump" "$remote_dump" "$local_checksum" "$remote_checksum" >/dev/null 2>&1; then
  echo "TEST_FAILED: tampered remote bytes were accepted" >&2
  exit 1
fi

cp -- "$local_dump" "$remote_dump"
printf '%064d  vayro.dump.age\n' 0 > "$remote_checksum"
if bash "$verifier" "$local_dump" "$remote_dump" "$local_checksum" "$remote_checksum" >/dev/null 2>&1; then
  echo "TEST_FAILED: tampered checksum sidecar was accepted" >&2
  exit 1
fi

printf '%s\n' "BACKUP_READBACK_VERIFIER_TESTS_PASS"
