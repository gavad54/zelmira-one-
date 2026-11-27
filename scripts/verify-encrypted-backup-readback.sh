#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -ne 4 ]]; then
  echo "usage: verify-encrypted-backup-readback.sh LOCAL_DUMP REMOTE_DUMP LOCAL_CHECKSUM REMOTE_CHECKSUM" >&2
  exit 64
fi

local_dump="$1"
remote_dump="$2"
local_checksum="$3"
remote_checksum="$4"

for path in "$local_dump" "$remote_dump" "$local_checksum" "$remote_checksum"; do
  if [[ ! -s "$path" ]]; then
    echo "BACKUP_READBACK_FILE_MISSING_OR_EMPTY" >&2
    exit 1
  fi
done

if ! cmp --silent -- "$local_checksum" "$remote_checksum"; then
  echo "BACKUP_READBACK_CHECKSUM_SIDECAR_MISMATCH" >&2
  exit 1
fi

local_sha="$(sha256sum -- "$local_dump" | awk '{print $1}')"
remote_sha="$(sha256sum -- "$remote_dump" | awk '{print $1}')"
expected_sha="$(awk 'NR == 1 {print $1}' "$local_checksum")"

if [[ ! "$expected_sha" =~ ^[[:xdigit:]]{64}$ ]]; then
  echo "BACKUP_READBACK_CHECKSUM_FORMAT_INVALID" >&2
  exit 1
fi

if [[ "$local_sha" != "$expected_sha" || "$remote_sha" != "$expected_sha" ]]; then
  echo "BACKUP_READBACK_SHA256_MISMATCH" >&2
  exit 1
fi

printf '%s\n' "ENCRYPTED_BACKUP_READBACK_SHA256_PASS"
