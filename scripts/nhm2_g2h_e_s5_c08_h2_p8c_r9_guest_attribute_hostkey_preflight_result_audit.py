#!/usr/bin/env python3
"""Audit the exhausted P8C-R9 indeterminate preflight result."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral"
PREFLIGHT = BASE / "h2-p8c-r9-guest-attribute-hostkey-preflight-v1-20260830"
CAPTURE = BASE / "h2-p8c-r9-guest-attribute-hostkey-capture-v1-20260830"
PROPOSAL = PREFLIGHT / "h2-p8c-r9-guest-attribute-hostkey-preflight-proposal.v1.json"
LEDGER = PREFLIGHT / "h2-p8c-r9-command-ledger.v1.txt"
RESULT = CAPTURE / "h2-p8c-r9-guest-attribute-hostkey-preflight-result.v1.json"
OUTPUT = CAPTURE / "h2-p8c-r9-guest-attribute-hostkey-preflight-result-independent-audit.v1.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


result = json.loads(RESULT.read_text(encoding="utf-8"))
proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
ledger = LEDGER.read_text(encoding="utf-8").splitlines()
cloud = result["cloud_shell_observation"]
scope = result["evidence_scope"]
actions = result["actions"]

checks = {
    "schema_exact": result["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r9_guest_attribute_hostkey_preflight_result.v1",
    "proposal_identity": digest(PROPOSAL) == result["proposal_sha256"] == "186447b240156574d33e57e39f84d1f1a7b15352170d6abd93f168108991a4df",
    "ledger_identity": digest(LEDGER) == proposal["command_ledger"]["sha256"] == "0e5994ae70f4254be4e9d0d6607235965232018ebb089bfb904b91553f246673",
    "classification_exact": result["classification"] == "INDETERMINATE_FAILFAST_TERMINAL_INPUT_DISAPPEARED_BEFORE_RESULT_MARKERS",
    "status_exact": result["status"] == "EXECUTED_ONCE_EXHAUSTED_INDETERMINATE_WITHOUT_TRUST_DECISION",
    "health_passed_once": cloud["connection_marker_exact"] == "R9_CONNECTION_READY" and cloud["health_command_submitted_once"] is True and actions["connection_health_commands"] == 1,
    "inspection_identity": cloud["inspection_command_submitted_once"] is True and cloud["inspection_command_characters"] == len(ledger[1]) == 2058 and cloud["inspection_command_sha256"] == hashlib.sha256(ledger[1].encode()).hexdigest() == "98573fe2f3c18b0c15d63cf16aaa13aae9f982b55ebbe53faafb57a7330ab905",
    "result_markers_absent": cloud["r9_completion_marker_observed"] is False and cloud["r8_fingerprint_match_marker_observed"] is False,
    "terminal_state_exact": cloud["post_submission_terminal_input_count"] == 0 and cloud["terminal_panel_remained_open"] is True,
    "no_trust_inference": scope["guest_attribute_bytes_observed"] is False and scope["known_hosts_identity_observed"] is False and scope["specific_failed_predicate_identified"] is False and scope["rescue_instance_id_authenticated_by_r9_output"] is False and scope["vm_statuses_authenticated_by_r9_output"] is False,
    "browser_scope_explicit": scope["browser_observation_only"] is True and scope["raw_terminal_export_preserved"] is False,
    "exact_command_counts": actions["inspection_commands"] == 1 and actions["additional_terminal_commands"] == 0,
    "read_only_no_science": actions["known_hosts_mutations"] == 0 and actions["resource_mutations"] == 0 and actions["ssh_or_scp_actions"] == 0 and actions["numerical_actions"] == 0 and actions["candidate_evaluations"] == 0,
    "consumed_no_retry": result["failure_policy"]["proposal_consumed"] is True and result["failure_policy"]["retry_authorized"] is False and result["failure_policy"]["retry_performed"] is False,
    "authority_all_false": all(value is False for value in result["authority"].values()),
}

audit = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r9_guest_attribute_hostkey_preflight_result.independent_audit.v1",
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
