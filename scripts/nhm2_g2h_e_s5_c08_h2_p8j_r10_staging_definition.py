#!/usr/bin/env python3
"""Build the exact P8J-R10 Cloud Shell staging ledger."""

from __future__ import annotations

import base64
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8j_r10_cloudshell_rescue_orchestrator_v1.sh"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r10-stopped-disk-rescue-preflight-v1-20260901"
LEDGER = OUT / "h2-p8j-r10-staging-command-ledger.v1.json"
COMMANDS = OUT / "h2-p8j-r10-staging-commands.v1.txt"
DEST = "/home/pestypig/h2-p8j-r10-cloudshell-rescue-orchestrator.v1.sh"
B64_DEST = DEST + ".b64.partial"
TMP_DEST = DEST + ".tmp"
CHUNK_SIZE = 320


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


raw = SOURCE.read_bytes()
encoded = base64.b64encode(raw).decode("ascii")
chunks = [encoded[i:i + CHUNK_SIZE] for i in range(0, len(encoded), CHUNK_SIZE)]
encoded_sha = digest(encoded.encode("ascii"))
source_sha = digest(raw)
commands = [
    "set -euo pipefail; "
    f"D={DEST}; B={B64_DEST}; T={TMP_DEST}; "
    '[[ ! -e "$D" && ! -e "$B" && ! -e "$T" ]]; '
    "printf 'R10_STAGE_READY\\n'"
]
for index, chunk in enumerate(chunks):
    operator = ">" if index == 0 else ">>"
    cumulative = min((index + 1) * CHUNK_SIZE, len(encoded))
    commands.append(
        f"printf '%s' '{chunk}' {operator} \"$B\"; "
        f'[[ "$(stat -c %s "$B")" == {cumulative} ]]; '
        f"printf 'R10_CHUNK_{index + 1:02d}\\n'"
    )
commands.append(
    f'[[ "$(stat -c %s "$B")" == {len(encoded)} && "$(sha256sum "$B" | awk \'{{print $1}}\')" == {encoded_sha} ]]; '
    'base64 -d "$B" >"$T"; '
    f'[[ "$(stat -c %s "$T")" == {len(raw)} && "$(sha256sum "$T" | awk \'{{print $1}}\')" == {source_sha} ]]; '
    'mv -n "$T" "$D"; '
    f'[[ -f "$D" && ! -L "$D" && "$(stat -c %s "$D")" == {len(raw)} && "$(sha256sum "$D" | awk \'{{print $1}}\')" == {source_sha} ]]; '
    "printf 'R10_STAGE_COMPLETE\\n'"
)
commands.append(
    f'[[ -f {DEST} && ! -L {DEST} && "$(stat -c %s {DEST})" == {len(raw)} '
    f'&& "$(sha256sum {DEST} | awk \'{{print $1}}\')" == {source_sha} ]] '
    f'&& bash {DEST}'
)
checks = {
    "source_lf_only": b"\r" not in raw,
    "one_snapshot": raw.count(b"gcloud compute snapshots create") == 1,
    "one_helper_create": raw.count(b"gcloud compute instances create") == 1,
    "one_clone": raw.count(b"gcloud compute disks create") == 1,
    "read_only_attach": b'--mode=ro' in raw,
    "original_never_started": b'instances start' not in raw,
    "one_rescue_execution": raw.count(b'sudo bash /home/pestypig/') == 1,
    "automatic_stop": raw.count(b'gcloud compute instances stop') >= 2,
    "resource_ceiling": b'--max-run-duration=3600s' in raw,
    "chunk_bounds": max(map(len, commands[1:1 + len(chunks)])) < 512,
    "hash_bound_decode": source_sha in commands[-2] and encoded_sha in commands[-2],
    "hash_bound_execute": source_sha in commands[-1],
}
passed = sum(checks.values())
ledger = {
    "schema": "nhm2.g2h_e_s5.c08.h2_p8j_r10.atomic_staging_ledger.v1",
    "candidate_neutral": True,
    "source_bytes": len(raw), "source_sha256": source_sha,
    "base64_characters": len(encoded), "base64_sha256": encoded_sha,
    "chunk_size": CHUNK_SIZE, "chunk_count": len(chunks),
    "destination": DEST, "base64_partial": B64_DEST, "decoded_temporary": TMP_DEST,
    "commands": [{"ordinal": i + 1, "characters": len(c), "sha256": digest(c.encode()), "command": c} for i, c in enumerate(commands)],
    "definition_audit": {"status": "PASS" if passed == len(checks) else "FAIL", "checks_passed": passed, "checks_total": len(checks), "checks": checks},
}
OUT.mkdir(parents=True, exist_ok=True)
LEDGER.write_text(json.dumps(ledger, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")
COMMANDS.write_text("\n".join(commands) + "\n", encoding="utf-8")
print(f"{passed}/{len(checks)} {ledger['definition_audit']['status']}")
print(f"SOURCE_BYTES={len(raw)}")
print(f"SOURCE_SHA256={source_sha}")
print(f"BASE64_CHARACTERS={len(encoded)}")
print(f"BASE64_SHA256={encoded_sha}")
print(f"CHUNKS={len(chunks)}")
print(f"COMMANDS={len(commands)}")
print(f"LEDGER_SHA256={digest(LEDGER.read_bytes())}")
print(f"COMMANDS_SHA256={digest(COMMANDS.read_bytes())}")
raise SystemExit(0 if passed == len(checks) else 1)
