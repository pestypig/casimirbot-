#!/usr/bin/env python3
"""Audit the fail-closed P8C-R5 pre-transmission result record."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral"
PREFLIGHT = BASE / "h2-p8c-r5-staged-procedure-retrieval-execution-preflight-v1-20260829"
CAPTURE = BASE / "h2-p8c-r5-staged-procedure-retrieval-execution-capture-v1-20260829"
PROPOSAL = PREFLIGHT / "h2-p8c-r5-staged-procedure-retrieval-execution-proposal.v1.json"
PROPOSAL_AUDIT = PREFLIGHT / "h2-p8c-r5-staged-procedure-retrieval-execution-proposal-independent-audit.v1.json"
RESULT = CAPTURE / "h2-p8c-r5-staged-procedure-retrieval-execution-result.v1.json"
OUTPUT = CAPTURE / "h2-p8c-r5-staged-procedure-retrieval-execution-result-independent-audit.v1.json"

EXPECTED_PROPOSAL_SHA = "a3353a7cb712365268c0a8aa9a59a3834467c4066a32d1858936ca35bb6e6e15"
EXPECTED_COMMAND_SHA = "78eda80c8f9c129c081f07203217e8f53189568ac00243a239d513f1eda7eda4"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
proposal_audit = json.loads(PROPOSAL_AUDIT.read_text(encoding="utf-8"))
result = json.loads(RESULT.read_text(encoding="utf-8"))
execution = result["execution_observation"]
actions = result["actions"]
science = result["scientific_result"]
observation = result["observation_basis"]

checks = {
    "schema_exact": result["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r5_staged_procedure_retrieval_execution_result.v1",
    "proposal_identity": digest(PROPOSAL) == result["proposal_sha256"] == EXPECTED_PROPOSAL_SHA,
    "proposal_audit_pass": proposal_audit["verdict"] == "PASS" and proposal_audit["passed"] == proposal_audit["total"] == 35,
    "classification_exact": result["classification"] == "BLOCKED_CLOUD_SHELL_CONNECTION_LOST_BEFORE_COMMAND_TRANSMISSION",
    "status_exact": result["status"] == "EXECUTED_ONCE_EXHAUSTED_BEFORE_COMMAND_TRANSMISSION",
    "command_identity_bound": execution["authorized_command_characters"] == proposal["cloud_shell_execution"]["command_characters"] == 497 and execution["authorized_command_sha256"] == proposal["cloud_shell_execution"]["command_sha256"] == EXPECTED_COMMAND_SHA,
    "connection_lost_before_transmission": execution["cloud_shell_connection_lost_before_transmission"] is True,
    "zero_terminal_input": execution["terminal_input_characters_observed"] == 0 and execution["blank_commands_entered"] == 0 and execution["duplicate_commands_entered"] == 0,
    "command_never_submitted": execution["command_submitted"] is False and execution["command_invocations"] == 0,
    "attempt_consumed_no_retry": result["failure_policy"]["first_failure_terminal"] is True and result["failure_policy"]["proposal_consumed"] is True and result["failure_policy"]["retry_authorized"] is False and result["failure_policy"]["retry_performed"] is False and result["failure_policy"]["fallback_performed"] is False,
    "zero_cloud_runtime_science_actions": all(value == 0 for value in actions.values()),
    "no_archive_or_result_audit": science["terminal_archive_authenticated_in_cloud_shell"] is False and science["terminal_archive_retrieved_locally"] is False and science["p8c_result_audit_run"] is False,
    "observation_limit_explicit": observation["claim_scope"] == "operator_session_observation_only" and observation["independent_cloud_receipt_available"] is False and observation["raw_terminal_transcript_available"] is False,
    "authority_all_false": all(value is False for value in result["authority"].values()),
}

audit = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r5_staged_procedure_retrieval_execution_result.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "result_sha256": digest(RESULT),
    "evidence_scope": "record_consistency_only_no_independent_cloud_receipt",
    "terminal_command_characters_transmitted": 0,
    "cloud_actions_executed": 0,
    "numerical_actions_executed": 0,
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(audit, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{audit['passed']}/{audit['total']} {audit['verdict']}")
print(digest(RESULT))
print(digest(OUTPUT))
raise SystemExit(0 if audit["verdict"] == "PASS" else 1)
