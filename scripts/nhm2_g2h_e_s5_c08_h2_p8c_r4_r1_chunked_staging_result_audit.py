#!/usr/bin/env python3
"""Audit the authenticated P8C-R4-R1 chunked Cloud Shell staging result."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral"
PREFLIGHT = BASE / "h2-p8c-r4-r1-chunked-staging-preflight-v1-20260829"
CAPTURE = BASE / "h2-p8c-r4-r1-chunked-staging-capture-v1-20260829"
PROPOSAL = PREFLIGHT / "h2-p8c-r4-r1-chunked-staging-proposal.v1.json"
MANIFEST = PREFLIGHT / "h2-p8c-r4-r1-chunk-manifest.v1.json"
PROPOSAL_AUDIT = PREFLIGHT / "h2-p8c-r4-r1-chunked-staging-proposal-independent-audit.v1.json"
RESULT = CAPTURE / "h2-p8c-r4-r1-chunked-staging-result.v1.json"
OUTPUT = CAPTURE / "h2-p8c-r4-r1-chunked-staging-result-independent-audit.v1.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
proposal_audit = json.loads(PROPOSAL_AUDIT.read_text(encoding="utf-8"))
result = json.loads(RESULT.read_text(encoding="utf-8"))
cloud = result["cloud_shell"]
execution = result["command_execution"]
actions = result["actions"]
expected_hashes = [entry["sha256"] for entry in proposal_audit["command_ledger"]]

checks = {
    "proposal_identity": digest(PROPOSAL) == result["proposal_sha256"] == "44d655c6824da8a3f96878b59e8129900acdfa8c00c356235569bcc9bf2b6968",
    "manifest_identity": digest(MANIFEST) == result["chunk_manifest_sha256"] == "3477c768f088c2cc71c302a137fb05275cfdadde8ca7169e1388636cdf46570f",
    "proposal_audit_identity": digest(PROPOSAL_AUDIT) == result["proposal_audit_receipt_sha256"] == "23c6b39e841e17d67c979e4ba5ce94cd690f68124b2dc60110d5e3ae0ba96f1c",
    "proposal_audit_pass": proposal_audit["verdict"] == "PASS" and proposal_audit["passed"] == proposal_audit["total"] == 30,
    "classification_exact": result["classification"] == "AUTHENTICATED_CHUNKED_STAGING_PASS",
    "source_identity_exact": result["source_identity"]["bytes"] == manifest["source_bytes"] == 4115 and result["source_identity"]["sha256"] == manifest["source_sha256"] == "a4104d492653e1f90e7be72ee0f14fa3b79dfd3599c6f1092a4a86092c3ed79b",
    "base64_identity_exact": result["source_identity"]["base64_characters"] == manifest["base64_length"] == 5488 and result["source_identity"]["base64_sha256"] == manifest["base64_sha256"] == "8a17a8609a3d9bd43b5e64a7ca03350990183b32eb23167a3a2af9f874bc6bf0",
    "paths_exact": cloud["destination"] == proposal["cloud_shell_paths"]["destination"] and cloud["base64_partial"] == proposal["cloud_shell_paths"]["base64_partial"] and cloud["decoded_temporary"] == proposal["cloud_shell_paths"]["decoded_temporary"],
    "markers_exact": [cloud["initial_absence_marker"], cloud["base64_marker"], cloud["decoded_temporary_marker"], cloud["final_marker"]] == ["R4R1_PATHS_ABSENT", "R4R1_BASE64_PASS", "R4R1_TEMP_PASS", "R4R1_STAGE_PASS"],
    "destination_authenticated_not_executed": cloud["destination_present_and_verified"] is True and cloud["destination_executed_or_sourced"] is False,
    "intermediate_policy_observed": cloud["base64_partial_preserved"] is True and cloud["decoded_temporary_moved_to_destination"] is True,
    "exact_command_count": execution["exact_commands_authorized"] == execution["exact_commands_entered"] == 19,
    "exact_command_ordinals": execution["executed_ordinals"] == list(range(1, 20)),
    "exact_command_hashes": execution["executed_command_sha256"] == expected_hashes and len(expected_hashes) == 19,
    "no_blank_duplicate_or_failure": execution["blank_commands_entered"] == 0 and execution["duplicate_commands_entered"] == 0 and execution["first_failure_observed"] is False,
    "no_retry_or_fallback": execution["retry_performed"] is False and execution["fallback_performed"] is False,
    "write_shape_exact": actions["cloud_shell_chunk_write_commands"] == 15 and actions["cloud_shell_decode_commands"] == 1 and actions["cloud_shell_nonclobbering_moves"] == 1,
    "no_runtime_or_science": all(actions[key] == 0 for key in ("vm_starts_or_restarts", "ssh_attempts", "scp_attempts", "archive_copies_or_downloads", "docker_or_build_actions", "numerical_actions", "candidate_evaluations", "cloud_resource_mutations", "evidence_deletions")),
    "authority_all_false": all(value is False for value in result["authority"].values()),
}

audit = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r4_r1_chunked_staging_result.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "result_sha256": digest(RESULT),
    "commands_authenticated": 19,
    "cloud_shell_file_staged": True,
    "vm_starts_or_restarts": 0,
    "numerical_actions_executed": 0,
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(audit, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{audit['passed']}/{audit['total']} {audit['verdict']}")
print(digest(RESULT))
print(digest(OUTPUT))
raise SystemExit(0 if audit["verdict"] == "PASS" else 1)
