#!/usr/bin/env python3
"""Audit the fail-closed H2-P7 stopped-disk retrieval execution receipt."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RECEIPT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p7-evidence-retrieval-execution-v1-20260828/h2-p7-evidence-retrieval-execution-partial.v1.json"
OUTPUT = RECEIPT.with_name("h2-p7-evidence-retrieval-execution-partial-independent-audit.v1.json")
EXPECTED_PROPOSAL = "3c581eb9abb9205a520f75f0eb5196a63afd257786a5cc0a7528d6f8e451ee25"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


data = json.loads(RECEIPT.read_text(encoding="utf-8"))
checks = {
    "schema_exact": data.get("schema") == "nhm2.g2h_e_s5.c08_h2_p7_evidence_retrieval_execution_partial.v1",
    "proposal_exact": data.get("proposal_sha256") == EXPECTED_PROPOSAL,
    "authorization_consumed": data.get("authorization_consumed") is True,
    "exactly_one_restart": data.get("restart_attempts") == 1,
    "resource_exact": data.get("resource") == {
        "project": "dark-stratum-455714-h4",
        "name": "nhm2-h2-p7-parent-c4-16-20260827",
        "zone": "us-central1-a",
        "machine_type": "c4-standard-16",
        "boot_disk_gb": 30,
        "boot_disk_type": "hyperdisk-balanced",
    },
    "failure_before_remote_guard": data.get("failure", {}).get("remote_guard_executed") is False,
    "evidence_unread": data.get("failure", {}).get("remote_evidence_directory_read") is False,
    "archive_absent": data.get("failure", {}).get("vm_archive_created") is False,
    "result_unclassified": data.get("failure", {}).get("h2_parent_result_classified") is False,
    "cleanup_stopped_vm": data.get("safety", {}).get("cleanup_stop_executed") is True and data.get("safety", {}).get("final_vm_status") == "TERMINATED",
    "no_second_restart": data.get("safety", {}).get("second_restart_performed") is False,
    "no_scientific_execution": all(data.get("safety", {}).get(key) is False for key in ("docker_command_executed", "parent_service_command_executed", "numerical_executable_invoked")),
    "no_build_or_upload": data.get("safety", {}).get("builds") == 0 and data.get("safety", {}).get("uploads") == 0,
    "no_retry_retune_or_deletion": all(data.get("safety", {}).get(key) is False for key in ("retry_or_retune", "evidence_deletion", "source_mutation")),
    "cloud_partial_retained": data.get("cloud_shell_partial_evidence", {}).get("retained") is True and len(data.get("cloud_shell_partial_evidence", {}).get("files_observed", {})) == 9,
    "authority_all_false": data.get("authority") and all(value is False for value in data["authority"].values()),
}
result = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p7_evidence_retrieval_execution_partial.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "receipt_sha256": sha256(RECEIPT),
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{result['passed']}/{result['total']} {result['verdict']}")
print(sha256(OUTPUT))
raise SystemExit(0 if result["verdict"] == "PASS" else 1)
