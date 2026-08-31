#!/usr/bin/env python3
"""Audit the bounded P8C-R6 browser-observed result record."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral"
PREFLIGHT = BASE / "h2-p8c-r6-connection-gated-retrieval-preflight-v1-20260829"
CAPTURE = BASE / "h2-p8c-r6-connection-gated-retrieval-capture-v1-20260830"
PROPOSAL = PREFLIGHT / "h2-p8c-r6-connection-gated-retrieval-proposal.v1.json"
PROPOSAL_AUDIT = PREFLIGHT / "h2-p8c-r6-connection-gated-retrieval-proposal-independent-audit.v1.json"
RESULT = CAPTURE / "h2-p8c-r6-connection-gated-retrieval-result.v1.json"
OUTPUT = CAPTURE / "h2-p8c-r6-connection-gated-retrieval-result-independent-audit.v1.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
proposal_audit = json.loads(PROPOSAL_AUDIT.read_text(encoding="utf-8"))
result = json.loads(RESULT.read_text(encoding="utf-8"))
cloud = result["cloud_shell_observation"]
scope = result["evidence_scope"]
vms = result["vm_console_observation"]
actions = result["actions"]

checks = {
    "schema_exact": result["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r6_connection_gated_retrieval_result.v1",
    "proposal_identity": digest(PROPOSAL) == result["proposal_sha256"] == "1b78a6d79761fcc9bea581a95b465fdc0a7e337656ca864e4f3938e863c0d3c6",
    "proposal_audit_pass": proposal_audit["verdict"] == "PASS" and proposal_audit["passed"] == proposal_audit["total"] == 15,
    "classification_exact": result["classification"] == "TERMINATED_TO_PROMPT_CLEANUP_STOP_CONFIRMED_RESULT_UNREAD",
    "status_exact": result["status"] == "EXECUTED_ONCE_EXHAUSTED_RESULT_UNREAD",
    "health_marker_exact": cloud["connection_marker_exact"] == proposal["execution"]["commands"][0]["expected_stdout"] == "R6_CONNECTION_READY",
    "health_command_identity": cloud["health_command_characters"] == 35 and cloud["health_command_sha256"] == "822b4e17d8345537be4d44b0c1e0af92129fbe6518a13e3f8b37b644db2d838b",
    "execution_command_identity": cloud["execution_command_characters"] == 497 and cloud["execution_command_sha256"] == "78eda80c8f9c129c081f07203217e8f53189568ac00243a239d513f1eda7eda4",
    "prompt_returned_exit_unread": cloud["prompt_returned"] is True and cloud["procedure_exit_code_visible"] is None,
    "both_vms_stopped_after": vms["observed_after_prompt_return"] is True and vms["original_vm_status"] == vms["rescue_vm_status"] == "STOPPED",
    "archive_and_stage_unread": scope["archive_identity_authenticated"] is False and scope["cloud_shell_stage_read"] is False and scope["p8c_result_audit_authorized"] is False,
    "observation_limit_explicit": scope["operator_browser_observation"] is True and scope["raw_terminal_export_preserved"] is False,
    "exact_command_counts": actions["connection_health_commands"] == 1 and actions["staged_procedure_invocations"] == 1 and actions["additional_terminal_commands"] == 0,
    "no_scientific_actions": actions["numerical_actions"] == 0 and actions["candidate_evaluations"] == 0,
    "consumed_no_retry": result["failure_policy"]["proposal_consumed"] is True and result["failure_policy"]["retry_authorized"] is False and result["failure_policy"]["retry_performed"] is False,
    "authority_all_false": all(value is False for value in result["authority"].values()),
}

audit = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r6_connection_gated_retrieval_result.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "result_sha256": digest(RESULT),
    "evidence_scope": "record_consistency_and_browser_observation_only",
    "archive_result_authenticated": False,
    "numerical_actions_executed": 0,
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(audit, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{audit['passed']}/{audit['total']} {audit['verdict']}")
print(digest(RESULT))
print(digest(OUTPUT))
raise SystemExit(0 if audit["verdict"] == "PASS" else 1)
