#!/usr/bin/env python3
"""Audit the exhausted P8C-R10 observable host-key preflight result."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral"
PREFLIGHT = BASE / "h2-p8c-r10-observable-hostkey-preflight-v1-20260830"
CAPTURE = BASE / "h2-p8c-r10-observable-hostkey-capture-v1-20260830"
PROPOSAL = PREFLIGHT / "h2-p8c-r10-observable-hostkey-preflight-proposal.v1.json"
LEDGER = PREFLIGHT / "h2-p8c-r10-command-ledger.v1.txt"
RESULT = CAPTURE / "h2-p8c-r10-observable-hostkey-preflight-result.v1.json"
OUTPUT = CAPTURE / "h2-p8c-r10-observable-hostkey-preflight-result-independent-audit.v1.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


result = json.loads(RESULT.read_text(encoding="utf-8"))
proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
ledger = LEDGER.read_text(encoding="utf-8").splitlines()
cloud = result["cloud_shell_observation"]
guest = result["guest_attributes"]
known = result["known_hosts"]
resource = result["resource_observation"]
actions = result["actions"]

expected_steps = [
    "ORIGINAL_STATUS_BEGIN",
    "ORIGINAL_STATUS_PASS",
    "RESCUE_STATUS_BEGIN",
    "RESCUE_STATUS_PASS",
    "INSTANCE_ID_BEGIN",
    "INSTANCE_ID_PASS",
    "KNOWN_HOSTS_BEGIN",
    "KNOWN_HOSTS_PASS",
    "GUEST_ATTRIBUTES_BEGIN",
]

checks = {
    "schema_exact": result["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r10_observable_hostkey_preflight_result.v1",
    "proposal_identity": digest(PROPOSAL) == result["proposal_sha256"] == "4926fa95508c5542c57fed175fdd7b7b65a22e0e5c3906eb439e2b5ff102851a",
    "ledger_identity": digest(LEDGER) == proposal["command_ledger"]["sha256"] == "f767ace7960c4354da725e5509bd010e7a3afc495bc0d84510e0b06ce420294f",
    "classification_exact": result["classification"] == "AUTHENTICATED_GOOGLE_API_HOSTKEY_GUEST_ATTRIBUTES_ABSENT_404",
    "status_exact": result["status"] == "EXECUTED_ONCE_EXHAUSTED_BLOCKED_TRUST_CHANNEL_ABSENT",
    "health_passed_once": cloud["connection_marker_exact"] == "R10_CONNECTION_READY" and cloud["health_command_submitted_once"] is True and actions["connection_health_commands"] == 1,
    "inspection_identity": cloud["inspection_command_submitted_once"] is True and cloud["inspection_command_characters"] == len(ledger[1]) == 3402 and cloud["inspection_command_sha256"] == hashlib.sha256(ledger[1].encode()).hexdigest() == "98f1a0f2e6567655cef38a130d18d8c9cb64aea3a8d09f1f081d9f7a52fb7091",
    "resource_statuses_exact": resource["original_status_api_return_code"] == resource["rescue_status_api_return_code"] == 0 and resource["original_status"] == resource["rescue_status"] == "TERMINATED",
    "instance_identity_exact": resource["rescue_instance_id_api_return_code"] == 0 and resource["rescue_instance_id"] == "3332429239243725178",
    "known_hosts_identity_exact": known["bytes"] == 1089 and known["sha256"] == "9e31be5751e4d007c27162b446d46f680668f4554b254aaf70b1bd971df6de20" and known["line_10"] == "compute.3332429239243725178 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFgDB2SV10E0FLfgGogbKb7jsDnU2aEFy1M4pR52V/h1",
    "ordered_boundary_exact": result["ordered_steps"] == expected_steps,
    "guest_attribute_404_exact": guest["api_return_code"] == 1 and guest["error_class"] == "HTTPError_404" and guest["error_resource"] == "hostkeys/" and guest["error_resource_type"] == "Guest Attribute",
    "no_trust_decision": guest["hostkey_rows_observed"] == 0 and guest["trust_decision_reached"] is False and cloud["r8_fingerprint_match_marker_observed"] is False and cloud["r10_completion_marker_observed"] is False,
    "observability_repair_worked": cloud["post_failure_terminal_input_active"] is True,
    "fresh_surface_exact": actions["fresh_cloud_shell_terminal_surfaces"] == 1,
    "exact_command_counts": actions["inspection_commands"] == 1 and actions["additional_terminal_commands"] == 0,
    "read_only_no_science": actions["known_hosts_mutations"] == 0 and actions["resource_mutations"] == 0 and actions["ssh_or_scp_actions"] == 0 and actions["numerical_actions"] == 0 and actions["candidate_evaluations"] == 0,
    "consumed_no_retry": result["failure_policy"]["proposal_consumed"] is True and result["failure_policy"]["retry_authorized"] is False and result["failure_policy"]["retry_performed"] is False,
    "authority_all_false": all(value is False for value in result["authority"].values()),
}

audit = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r10_observable_hostkey_preflight_result.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "result_sha256": digest(RESULT),
    "classification": result["classification"],
    "trust_decision_reached": False,
    "known_hosts_mutations": 0,
    "resource_mutations": 0,
    "numerical_actions_executed": 0,
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(audit, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{audit['passed']}/{audit['total']} {audit['verdict']}")
print(digest(RESULT))
print(digest(OUTPUT))
raise SystemExit(0 if audit["verdict"] == "PASS" else 1)
