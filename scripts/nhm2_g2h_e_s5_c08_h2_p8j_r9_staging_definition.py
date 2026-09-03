#!/usr/bin/env python3
"""Build and audit the candidate-neutral P8J-R9 atomic staging ledger."""

from __future__ import annotations

import base64
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8j_r9_cloudshell_orchestrator_v1.sh"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r9-atomic-transport-preflight-v1-20260831"
LEDGER = OUT / "h2-p8j-r9-staging-command-ledger.v1.json"
COMMANDS = OUT / "h2-p8j-r9-staging-commands.v1.txt"
DEST = "/home/pestypig/h2-p8j-r9-cloudshell-orchestrator.v1.sh"
B64_DEST = DEST + ".b64.partial"
TMP_DEST = DEST + ".tmp"
CHUNK_SIZE = 320


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


raw = SOURCE.read_bytes()
encoded = base64.b64encode(raw).decode("ascii")
chunks = [encoded[i : i + CHUNK_SIZE] for i in range(0, len(encoded), CHUNK_SIZE)]
encoded_sha = digest(encoded.encode("ascii"))
source_sha = digest(raw)

commands: list[str] = []
commands.append(
    "set -euo pipefail; "
    f"D={DEST}; B={B64_DEST}; T={TMP_DEST}; "
    '[[ ! -e "$D" && ! -e "$B" && ! -e "$T" ]]; '
    "printf 'R9_STAGE_READY\\n'"
)
for index, chunk in enumerate(chunks):
    operator = ">" if index == 0 else ">>"
    cumulative = min((index + 1) * CHUNK_SIZE, len(encoded))
    commands.append(
        f"printf '%s' '{chunk}' {operator} \"$B\"; "
        f'[[ "$(stat -c %s "$B")" == {cumulative} ]]; '
        f"printf 'R9_CHUNK_{index + 1:02d}\\n'"
    )
commands.append(
    f'[[ "$(stat -c %s "$B")" == {len(encoded)} && "$(sha256sum "$B" | awk \'{{print $1}}\')" == {encoded_sha} ]]; '
    'base64 -d "$B" >"$T"; '
    f'[[ "$(stat -c %s "$T")" == {len(raw)} && "$(sha256sum "$T" | awk \'{{print $1}}\')" == {source_sha} ]]; '
    'mv -n "$T" "$D"; '
    f'[[ -f "$D" && ! -L "$D" && "$(stat -c %s "$D")" == {len(raw)} && "$(sha256sum "$D" | awk \'{{print $1}}\')" == {source_sha} ]]; '
    "printf 'R9_STAGE_COMPLETE\\n'"
)
commands.append(
    f'[[ -f {DEST} && ! -L {DEST} && "$(stat -c %s {DEST})" == {len(raw)} '
    f'&& "$(sha256sum {DEST} | awk \'{{print $1}}\')" == {source_sha} ]] '
    f'&& bash {DEST}'
)

ledger = {
    "schema": "nhm2.g2h_e_s5.c08.h2_p8j_r9.atomic_staging_ledger.v1",
    "candidate_neutral": True,
    "source": str(SOURCE.relative_to(ROOT)).replace("\\", "/"),
    "source_bytes": len(raw),
    "source_sha256": source_sha,
    "base64_characters": len(encoded),
    "base64_sha256": encoded_sha,
    "chunk_size": CHUNK_SIZE,
    "chunk_count": len(chunks),
    "destination": DEST,
    "base64_partial": B64_DEST,
    "decoded_temporary": TMP_DEST,
    "commands": [
        {"ordinal": i + 1, "characters": len(command), "sha256": digest(command.encode()), "command": command}
        for i, command in enumerate(commands)
    ],
}

checks = {
    "source_nonempty": len(raw) > 0,
    "source_lf_only": b"\r" not in raw,
    "one_bulk_request": raw.count(b"gcloud compute instances bulk create") == 1,
    "exact_r9_vm": raw.count(b"nhm2-h2-p8j-r9-c2d-32-20260831") >= 2,
    "exact_machine": b"--machine-type=c2d-standard-32" in raw,
    "exact_storage": b"--boot-disk-size=30GB" in raw and b"--boot-disk-type=pd-standard" in raw,
    "exact_region": b"REGION=us-east1" in raw,
    "three_allowed_zones": b"us-east1-b=allow,us-east1-c=allow,us-east1-d=allow" in raw,
    "one_vm_bounds": b"--count=1" in raw and b"--min-count=1" in raw,
    "exact_image": b"debian-12-bookworm-v20260817" in raw,
    "archive_identities": all(value.encode() in raw for value in ("236492800", "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978", "225792", "3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7")),
    "controller_identity": b"4b8f5722c885980bb0fbac3602ecf36436a66ff1141e4776168f3bbef86276e6" in raw,
    "manifest_16": b'"$(wc -l <"$MANIFEST")" == 17' in raw,
    "offline_controller_preserved": b"h2_p8j_cloud_run_v1.sh" in raw,
    "docker_install_only": b"apt-get install -y docker.io" in raw,
    "automatic_stop_on_failure": b"gcloud compute instances stop" in raw,
    "provider_stop_backstop": b"--max-run-duration=25h" in raw and b"--instance-termination-action=STOP" in raw,
    "one_scp": raw.count(b"gcloud compute scp") == 1,
    "one_ssh": raw.count(b"gcloud compute ssh") == 1,
    "first_command_absence_guard": all(path in commands[0] for path in (DEST, B64_DEST, TMP_DEST)),
    "exclusive_first_chunk": '> "$B";' in commands[1] and '>> "$B";' not in commands[1],
    "append_remaining_chunks": all('>> "$B";' in command for command in commands[2 : 1 + len(chunks)]),
    "observable_chunk_markers": all(f"R9_CHUNK_{index + 1:02d}" in command for index, command in enumerate(commands[1 : 1 + len(chunks)])),
    "bounded_chunk_commands": max(map(len, commands[1 : 1 + len(chunks)])) < 512,
    "decode_hash_bound": source_sha in commands[-2] and encoded_sha in commands[-2],
    "execution_hash_bound": source_sha in commands[-1],
    "execution_once": commands[-1].count(f"bash {DEST}") == 1,
}
passed = sum(checks.values())
total = len(checks)
ledger["definition_audit"] = {
    "status": "PASS" if passed == total else "FAIL",
    "checks_passed": passed,
    "checks_total": total,
    "checks": checks,
}

OUT.mkdir(parents=True, exist_ok=True)
LEDGER.write_text(json.dumps(ledger, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")
COMMANDS.write_text("\n".join(commands) + "\n", encoding="utf-8")
print(f"{passed}/{total} {ledger['definition_audit']['status']}")
print(f"SOURCE_BYTES={len(raw)}")
print(f"SOURCE_SHA256={source_sha}")
print(f"BASE64_CHARACTERS={len(encoded)}")
print(f"BASE64_SHA256={encoded_sha}")
print(f"CHUNKS={len(chunks)}")
print(f"COMMANDS={len(commands)}")
print(f"LEDGER_SHA256={digest(LEDGER.read_bytes())}")
print(f"COMMANDS_SHA256={digest(COMMANDS.read_bytes())}")
raise SystemExit(0 if passed == total else 1)
