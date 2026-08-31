#!/usr/bin/env python3
"""Audit the inert P8C-R4-R1 short-chunk Cloud Shell staging proposal."""

from __future__ import annotations

import base64
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-r4-r1-chunked-staging-preflight-v1-20260829"
MANIFEST = BASE / "h2-p8c-r4-r1-chunk-manifest.v1.json"
PROPOSAL = BASE / "h2-p8c-r4-r1-chunked-staging-proposal.v1.json"
OUTPUT = BASE / "h2-p8c-r4-r1-chunked-staging-proposal-independent-audit.v1.json"
SOURCE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-r4-staged-iap-retrieval-preflight-v1-20260829/h2-p8c-r4-staged-iap-retrieval-cloudshell.v1.sh"
EXPECTED_MANIFEST_SHA = "3477c768f088c2cc71c302a137fb05275cfdadde8ca7169e1388636cdf46570f"
EXPECTED_PROPOSAL_SHA = "44d655c6824da8a3f96878b59e8129900acdfa8c00c356235569bcc9bf2b6968"
EXPECTED_SOURCE_SHA = "a4104d492653e1f90e7be72ee0f14fa3b79dfd3599c6f1092a4a86092c3ed79b"
EXPECTED_B64_SHA = "8a17a8609a3d9bd43b5e64a7ca03350990183b32eb23167a3a2af9f874bc6bf0"


def digest_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def digest(path: Path) -> str:
    return digest_bytes(path.read_bytes())


manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
chunks = manifest["chunks"]
joined = "".join(chunk["data"] for chunk in chunks)
decoded = base64.b64decode(joined, validate=True)
paths = proposal["cloud_shell_paths"]
dest = paths["destination"]
b64_path = paths["base64_partial"]
tmp = paths["decoded_temporary"]

commands = [
    f"test ! -e '{dest}' && test ! -e '{b64_path}' && test ! -e '{tmp}' && printf 'R4R1_PATHS_ABSENT\\n'"
]
for index, chunk in enumerate(chunks):
    redirect = ">" if index == 0 else ">>"
    commands.append(f"printf '%s' '{chunk['data']}' {redirect} '{b64_path}'")
commands.extend(
    [
        f"test \"$(stat -c %s '{b64_path}')\" = '5488' && test \"$(sha256sum '{b64_path}' | awk '{{print $1}}')\" = '{EXPECTED_B64_SHA}' && printf 'R4R1_BASE64_PASS\\n'",
        f"test ! -e '{tmp}' && base64 --decode '{b64_path}' > '{tmp}' && test \"$(stat -c %s '{tmp}')\" = '4115' && test \"$(sha256sum '{tmp}' | awk '{{print $1}}')\" = '{EXPECTED_SOURCE_SHA}' && printf 'R4R1_TEMP_PASS\\n'",
        f"test ! -e '{dest}' && mv -n '{tmp}' '{dest}' && test \"$(stat -c %s '{dest}')\" = '4115' && test \"$(sha256sum '{dest}' | awk '{{print $1}}')\" = '{EXPECTED_SOURCE_SHA}' && printf 'R4R1_STAGE_PASS\\n'",
    ]
)

checks = {
    "proposal_schema": proposal["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r4_r1_chunked_staging_proposal.v1",
    "proposal_inert": proposal["status"] == "FROZEN_INERT_AWAITING_SEPARATE_AUTHORIZATION",
    "proposal_hash_exact": digest(PROPOSAL) == EXPECTED_PROPOSAL_SHA,
    "manifest_hash_exact": digest(MANIFEST) == EXPECTED_MANIFEST_SHA and proposal["chunk_manifest"]["sha256"] == EXPECTED_MANIFEST_SHA,
    "source_hash_exact": digest(SOURCE) == EXPECTED_SOURCE_SHA and SOURCE.stat().st_size == 4115,
    "predecessor_result_bound": proposal["predecessors"]["r4_staging_result_sha256"] == "65f5321fdb6c0b53eb1311ad8f3575c93328f720a80cbfa86b143b35e991f281",
    "predecessor_audit_bound": proposal["predecessors"]["r4_result_audit_receipt_sha256"] == "eec24a3f53adaa1a9c66ce86a3a210a8f845ff520fa342dfaf21bd259a54b136",
    "chunk_count_exact": manifest["chunk_count"] == len(chunks) == proposal["chunk_manifest"]["chunk_count"] == 15,
    "chunk_ordinals_exact": [chunk["ordinal"] for chunk in chunks] == list(range(1, 16)),
    "chunk_lengths_exact": all(chunk["length"] == len(chunk["data"]) for chunk in chunks),
    "chunk_lengths_bounded": max(chunk["length"] for chunk in chunks) <= 384,
    "chunk_hashes_exact": all(digest_bytes(chunk["data"].encode("ascii")) == chunk["sha256"] for chunk in chunks),
    "base64_length_exact": len(joined) == manifest["base64_length"] == proposal["source_identity"]["base64_characters"] == 5488,
    "base64_hash_exact": digest_bytes(joined.encode("ascii")) == manifest["base64_sha256"] == EXPECTED_B64_SHA,
    "decoded_bytes_exact": len(decoded) == manifest["source_bytes"] == proposal["source_identity"]["bytes"] == 4115,
    "decoded_hash_exact": digest_bytes(decoded) == manifest["source_sha256"] == EXPECTED_SOURCE_SHA,
    "decoded_matches_source": decoded == SOURCE.read_bytes(),
    "three_paths_distinct": len({dest, b64_path, tmp}) == 3,
    "initial_all_absent_required": paths["required_initial_state"] == "ALL_THREE_ABSENT",
    "intermediates_preserved_no_delete": paths["intermediate_files_preserved_on_failure"] is True and paths["deletion_authorized"] is False,
    "command_count_exact": len(commands) == proposal["terminal_protocol"]["exact_command_count"] == 19,
    "command_length_bounded": max(map(len, commands)) <= proposal["terminal_protocol"]["maximum_command_characters"] == 640,
    "first_chunk_exclusive_then_append": " > " in commands[1] and all(" >> " in command for command in commands[2:16]),
    "final_move_nonclobbering": "mv -n" in commands[18] and commands[18].startswith(f"test ! -e '{dest}'"),
    "no_destination_execution": all(f"bash '{dest}'" not in command and f"source '{dest}'" not in command for command in commands),
    "no_resource_or_runtime_commands": all(all(token not in command for token in ("gcloud", "docker", "ssh ", "scp ", "chmod", "rm ")) for command in commands),
    "execution_boundary_zero": all(value == 0 for key, value in proposal["execution_boundary"].items() if key != "cloud_shell_file_writes") and proposal["execution_boundary"]["cloud_shell_file_writes"] == 3,
    "first_failure_no_retry": proposal["failure_policy"]["first_failure_terminal"] is True and proposal["failure_policy"]["retry"] is False and proposal["failure_policy"]["fallback"] is False,
    "forbidden_runtime_science": proposal["forbidden_actions"]["execute_or_source_destination"] is True and proposal["forbidden_actions"]["start_or_restart_any_vm"] is True and proposal["forbidden_actions"]["frozen_candidate_evaluation"] is True,
    "authority_all_false": all(value is False for value in proposal["authority"].values()),
}

command_ledger = [
    {"ordinal": index + 1, "characters": len(command), "sha256": digest_bytes(command.encode("utf-8"))}
    for index, command in enumerate(commands)
]
result = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r4_r1_chunked_staging_proposal.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "proposal_sha256": digest(PROPOSAL),
    "chunk_manifest_sha256": digest(MANIFEST),
    "maximum_command_characters_observed": max(map(len, commands)),
    "command_ledger": command_ledger,
    "cloud_actions_executed": 0,
    "numerical_actions_executed": 0,
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{result['passed']}/{result['total']} {result['verdict']}")
print(f"max_command_characters={result['maximum_command_characters_observed']}")
print(digest(OUTPUT))
raise SystemExit(0 if result["verdict"] == "PASS" else 1)
