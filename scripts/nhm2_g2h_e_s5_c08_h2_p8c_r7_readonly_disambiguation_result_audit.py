#!/usr/bin/env python3
"""Audit the exhausted P8C-R7 result and its fail-closed command defect."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral"
PREFLIGHT = BASE / "h2-p8c-r7-readonly-disambiguation-preflight-v1-20260830"
CAPTURE = BASE / "h2-p8c-r7-readonly-disambiguation-capture-v1-20260830"
PROPOSAL = PREFLIGHT / "h2-p8c-r7-readonly-disambiguation-proposal.v1.json"
LEDGER = PREFLIGHT / "h2-p8c-r7-command-ledger.v1.txt"
RESULT = CAPTURE / "h2-p8c-r7-readonly-disambiguation-result.v1.json"
OUTPUT = CAPTURE / "h2-p8c-r7-readonly-disambiguation-result-independent-audit.v1.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


result = json.loads(RESULT.read_text(encoding="utf-8"))
proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
ledger = LEDGER.read_text(encoding="utf-8").splitlines()
inspect = ledger[1]
cloud = result["cloud_shell_observation"]
defect = result["command_defect"]
scope = result["evidence_scope"]
actions = result["actions"]
expected_stage = [
    "clone.before.tsv", "procedure.exit", "proposal.sha256",
    "remote-guard.stderr", "remote-guard.stdout", "rescue-start.stderr",
    "rescue-start.stdout", "rescue-stop.stderr", "rescue-stop.stdout",
    "rescue.before.json", "snapshot.before.tsv",
]

checks = {
    "schema_exact": result["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r7_readonly_disambiguation_result.v1",
    "proposal_identity": digest(PROPOSAL) == result["proposal_sha256"] == "5fbd0adc2946a2bc8cb3b82e5169034e8f46b765c44dee4125ac1285bfa88408",
    "classification_exact": result["classification"] == "FAIL_PROJECT_UNSET_NONTERMINAL_GUARD_PROCEDURE_EXIT_255_ARCHIVE_ABSENT",
    "status_exact": result["status"] == "EXECUTED_ONCE_EXHAUSTED_FAIL_WITH_PARTIAL_READONLY_EVIDENCE",
    "connection_marker_exact": cloud["connection_marker_exact"] == "R7_CONNECTION_READY",
    "inspection_identity_exact": cloud["inspection_command_characters"] == len(inspect) == 1006 and cloud["inspection_command_sha256"] == proposal["command_ledger"]["commands"][1]["sha256"] == "350de3aa7650232eb78b2132008f556536ba0f76d9b470683ee6057c1e68215c",
    "project_unset_twice": cloud["project_unset_errors"] == 2 and cloud["original_vm_status_output"] == cloud["rescue_vm_status_output"] == "",
    "procedure_exit_255": cloud["procedure_exit"] == 255,
    "stage_inventory_exact": cloud["stage_files"] == expected_stage,
    "archive_absent": cloud["archive_state"] == "ABSENT" and scope["archive_identity_authenticated"] is False,
    "prompt_returned": cloud["prompt_returned"] is True,
    "missing_failfast_reproduced": "set -e" not in inspect and "; test \"$OSTAT\" = TERMINATED; test \"$RSTAT\" = TERMINATED;" in inspect,
    "defect_disposition_exact": defect["first_failure_terminal_claim_satisfied"] is False and defect["gcloud_project_binding_absent_after_reprovision"] is True and defect["inspection_command_had_set_e"] is False and defect["semicolon_sequence_continued_after_failed_vm_status_tests"] is True,
    "evidence_limits_explicit": scope["browser_observation_only"] is True and scope["raw_terminal_export_preserved"] is False and scope["vm_status_authenticated_by_r7_command"] is False and scope["remote_guard_receipt_contents_read"] is False,
    "exact_command_counts": actions["connection_health_commands"] == 1 and actions["inspection_commands"] == 1 and actions["additional_terminal_commands"] == 0,
    "read_only_no_science": actions["resource_mutations"] == 0 and actions["numerical_actions"] == 0 and actions["candidate_evaluations"] == 0,
    "consumed_no_retry": result["failure_policy"]["proposal_consumed"] is True and result["failure_policy"]["retry_authorized"] is False and result["failure_policy"]["retry_performed"] is False,
    "authority_all_false": all(value is False for value in result["authority"].values()),
}

audit = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r7_readonly_disambiguation_result.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "result_sha256": digest(RESULT),
    "proposal_audit_false_negative_detected": True,
    "archive_result": "ABSENT",
    "procedure_exit": 255,
    "resource_mutations": 0,
    "numerical_actions_executed": 0,
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(audit, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{audit['passed']}/{audit['total']} {audit['verdict']}")
print(digest(RESULT))
print(digest(OUTPUT))
raise SystemExit(0 if audit["verdict"] == "PASS" else 1)
