#!/usr/bin/env python3
"""Audit the exhausted PASS P8C-R11 read-only resource inventory result."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-r11-offline-hostkey-resource-preflight-v1-20260830"
PROPOSAL = BASE / "h2-p8c-r11-offline-hostkey-resource-preflight-proposal.v1.json"
LEDGER = BASE / "h2-p8c-r11-command-ledger.v1.txt"
RESULT = BASE / "h2-p8c-r11-offline-hostkey-resource-preflight-result.v1.json"
OUTPUT = BASE / "h2-p8c-r11-offline-hostkey-resource-preflight-result-independent-audit.v1.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


result = json.loads(RESULT.read_text(encoding="utf-8"))
proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
ledger = LEDGER.read_text(encoding="utf-8").splitlines()
cloud = result["cloud_shell_observation"]
resource = result["resource_observation"]
boot = result["boot_disk_observation"]
absence = result["proposed_resource_absence"]
actions = result["actions"]

expected_steps = [
    "ORIGINAL_BEGIN",
    "ORIGINAL_PASS",
    "RESCUE_INSTANCE_BEGIN",
    "RESCUE_INSTANCE_PASS",
    "BOOT_DISK_BEGIN",
    "BOOT_DISK_PASS",
    "PROPOSED_NAMES_BEGIN",
    "PROPOSED_NAMES_PASS",
    "R11_READONLY_COMPLETE",
]

checks = {
    "schema_exact": result["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r11_offline_hostkey_resource_preflight_result.v1",
    "proposal_identity": digest(PROPOSAL) == result["proposal_sha256"] == "7eec8a9406c12c1d430def05e6f5b13c7bd91897b934a1a94920f2a9da85af47",
    "ledger_identity": digest(LEDGER) == proposal["command_ledger"]["sha256"] == "e1acdd23d5c989684a5980420ed4b6a3d069cf11065c2acab2457ba5ad3d80b0",
    "status_pass": result["status"] == "EXECUTED_ONCE_EXHAUSTED_PASS" and result["classification"] == "AUTHENTICATED_READ_ONLY_RESOURCE_INVENTORY_PASS",
    "health_exact": cloud["connection_marker_exact"] == "R11_CONNECTION_READY" and cloud["health_command_characters"] == len(ledger[0]) == 31 and cloud["health_command_sha256"] == hashlib.sha256(ledger[0].encode()).hexdigest(),
    "inspection_exact": cloud["inspection_command_characters"] == len(ledger[1]) == 3895 and cloud["inspection_command_sha256"] == hashlib.sha256(ledger[1].encode()).hexdigest(),
    "terminal_complete": cloud["terminal_marker_exact"] == "R11_READONLY_COMPLETE",
    "ordered_steps_exact": result["ordered_steps"] == expected_steps,
    "project_zone_exact": result["project"] == "dark-stratum-455714-h4" and result["zone"] == "us-central1-a",
    "stopped_statuses_exact": resource["original_status_api_return_code"] == resource["rescue_instance_api_return_code"] == 0 and resource["original_status"] == resource["rescue_status"] == "TERMINATED",
    "rescue_identity_exact": resource["rescue_instance_id"] == "3332429239243725178" and resource["rescue_machine_type"] == "e2-small",
    "disk_topology_exact": resource["rescue_disk_count"] == 2 and resource["boot_attachment_mode"] == "READ_WRITE" and resource["evidence_clone_disk"] == "nhm2-h2-p8c-evidence-clone-20260829" and resource["evidence_clone_mode"] == "READ_ONLY",
    "boot_disk_exact": boot == {"name": "nhm2-h2-p8c-rescue-e2-small-20260829", "size_gb": 10, "source_image": "debian-12-bookworm-v20260817", "status": "READY", "type": "pd-standard", "users_count": 1},
    "proposed_names_absent": all(value == "PASS" for value in absence.values()),
    "exact_command_counts": actions["connection_health_commands"] == actions["inspection_commands"] == 1 and actions["additional_terminal_commands"] == 0,
    "preexecution_surface_not_a_command": actions["unresponsive_preexecution_surfaces"] == 1 and actions["fresh_cloud_shell_terminal_surfaces"] == 1,
    "read_only_no_science": all(actions[key] == 0 for key in ("cloud_resource_mutations", "mount_actions", "ssh_or_scp_actions", "numerical_actions", "candidate_evaluations")),
    "consumed_no_retry": result["failure_policy"]["proposal_consumed"] is True and result["failure_policy"]["retry_authorized"] is False and result["failure_policy"]["retry_performed"] is False,
    "authority_all_false": all(value is False for value in result["authority"].values()),
}

audit = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r11_offline_hostkey_resource_preflight_result.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "result_sha256": digest(RESULT),
    "classification": result["classification"],
    "resource_mutations": 0,
    "numerical_actions_executed": 0,
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(audit, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{audit['passed']}/{audit['total']} {audit['verdict']}")
print(digest(RESULT))
print(digest(OUTPUT))
raise SystemExit(0 if audit["verdict"] == "PASS" else 1)
