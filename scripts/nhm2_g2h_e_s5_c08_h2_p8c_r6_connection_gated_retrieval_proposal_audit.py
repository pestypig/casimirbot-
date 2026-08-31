#!/usr/bin/env python3
"""Audit the inert P8C-R6 connection-gated retrieval proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral"
PREFLIGHT = BASE / "h2-p8c-r6-connection-gated-retrieval-preflight-v1-20260829"
R5_CAPTURE = BASE / "h2-p8c-r5-staged-procedure-retrieval-execution-capture-v1-20260829"
PROPOSAL = PREFLIGHT / "h2-p8c-r6-connection-gated-retrieval-proposal.v1.json"
R5_RESULT = R5_CAPTURE / "h2-p8c-r5-staged-procedure-retrieval-execution-result.v1.json"
R5_AUDIT = R5_CAPTURE / "h2-p8c-r5-staged-procedure-retrieval-execution-result-independent-audit.v1.json"
OUTPUT = PREFLIGHT / "h2-p8c-r6-connection-gated-retrieval-proposal-independent-audit.v1.json"

EXPECTED_PROPOSAL_SHA = "1b78a6d79761fcc9bea581a95b465fdc0a7e337656ca864e4f3938e863c0d3c6"
EXPECTED_R5_RESULT_SHA = "0a9d11e12dfbdfe6c7af490c3305b0d1d5438f84ce8d3c58fef2e7a905cdc24e"
EXPECTED_R5_AUDIT_SHA = "6137cf13d1c22bab446c4f1b86407385c4bec1adf88ad1cb1392dd5eb1aedee1"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def digest_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


data = json.loads(PROPOSAL.read_text(encoding="utf-8"))
r5 = json.loads(R5_RESULT.read_text(encoding="utf-8"))
r5_audit = json.loads(R5_AUDIT.read_text(encoding="utf-8"))
execution = data["execution"]
commands = execution["commands"]
binding = data["existing_retrieval_binding"]

checks = {
    "schema_and_status_exact": data["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r6_connection_gated_retrieval_proposal.v1" and data["status"] == "FROZEN_INERT_AWAITING_SEPARATE_AUTHORIZATION",
    "proposal_hash_exact": digest(PROPOSAL) == EXPECTED_PROPOSAL_SHA,
    "r5_result_bound": digest(R5_RESULT) == data["predecessors"]["r5_result_sha256"] == EXPECTED_R5_RESULT_SHA and r5["classification"] == "BLOCKED_CLOUD_SHELL_CONNECTION_LOST_BEFORE_COMMAND_TRANSMISSION",
    "r5_audit_bound": digest(R5_AUDIT) == data["predecessors"]["r5_result_audit_sha256"] == EXPECTED_R5_AUDIT_SHA and r5_audit["verdict"] == "PASS" and r5_audit["passed"] == r5_audit["total"] == 14,
    "two_commands_only": execution["exact_commands"] == len(commands) == 2 and [entry["ordinal"] for entry in commands] == [1, 2],
    "health_command_exact": commands[0]["characters"] == len(commands[0]["command"]) == 35 and digest_text(commands[0]["command"]) == commands[0]["sha256"] == "822b4e17d8345537be4d44b0c1e0af92129fbe6518a13e3f8b37b644db2d838b" and commands[0]["expected_stdout"] == "R6_CONNECTION_READY",
    "execution_command_exact": commands[1]["characters"] == len(commands[1]["command"]) == 497 and digest_text(commands[1]["command"]) == commands[1]["sha256"] == "78eda80c8f9c129c081f07203217e8f53189568ac00243a239d513f1eda7eda4",
    "health_gate_before_execution": execution["require_first_marker_before_second_command"] is True and commands[0]["purpose"].startswith("authenticate_interactive") and commands[1]["purpose"].startswith("reauthenticate_and_invoke"),
    "first_failure_terminal_no_retry": execution["first_failure_terminal"] is True and execution["retry_or_fallback_authorized"] is False,
    "staged_procedure_exact": binding["staged_procedure_bytes"] == 4115 and binding["staged_procedure_sha256"] == "a4104d492653e1f90e7be72ee0f14fa3b79dfd3599c6f1092a4a86092c3ed79b" and binding["staged_procedure_path"] in commands[1]["command"],
    "archive_exact": binding["archive_bytes"] == 16443 and binding["archive_sha256"] == "9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d",
    "runtime_cost_bounded": binding["rescue_runtime_ceiling_seconds"] == 1200 and binding["planning_compute_cost_ceiling_usd"] == 0.1,
    "r5_not_retried": data["non_goals"]["retry_r5"] is True and data["purpose"].startswith("connection_gated_first_invocation"),
    "no_science_resource_or_local_capture": all(data["non_goals"][key] is True for key in ("candidate_evaluation", "cloud_action_during_preparation", "download_to_local_workspace", "evidence_or_resource_deletion", "new_or_modified_cloud_resource", "numerical_execution", "p8c_result_audit", "rust_g3_si_metric_lane_work")),
    "authority_all_false": all(value is False for value in data["authority"].values()),
}

audit = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r6_connection_gated_retrieval_proposal.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "proposal_sha256": digest(PROPOSAL),
    "cloud_actions_executed": 0,
    "numerical_actions_executed": 0,
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(audit, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{audit['passed']}/{audit['total']} {audit['verdict']}")
print(digest(OUTPUT))
raise SystemExit(0 if audit["verdict"] == "PASS" else 1)
