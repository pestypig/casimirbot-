#!/usr/bin/env python3
"""Audit the exhausted P8C-R8 read-only transport diagnosis result."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral"
PREFLIGHT = BASE / "h2-p8c-r8-failfast-guard-diagnosis-preflight-v1-20260830"
CAPTURE = BASE / "h2-p8c-r8-failfast-guard-diagnosis-capture-v1-20260830"
PROPOSAL = PREFLIGHT / "h2-p8c-r8-failfast-guard-diagnosis-proposal.v1.json"
LEDGER = PREFLIGHT / "h2-p8c-r8-command-ledger.v1.txt"
RESULT = CAPTURE / "h2-p8c-r8-failfast-guard-diagnosis-result.v1.json"
OUTPUT = CAPTURE / "h2-p8c-r8-failfast-guard-diagnosis-result-independent-audit.v1.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


result = json.loads(RESULT.read_text(encoding="utf-8"))
proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
ledger = LEDGER.read_text(encoding="utf-8").splitlines()
cloud = result["cloud_shell_observation"]
diagnosis = result["diagnosis"]
scope = result["evidence_scope"]
actions = result["actions"]

expected_stage = [
    ("clone.before.tsv", 294, "7059949c5ec90e8a4328f6d1b0ce79907471e8c21f6e5394040f3abf8bd2d335"),
    ("procedure.exit", 4, "ce8bafb38615aeb5d44ebbabe78ec14ac35a5de87bdc5ad5ea82a72656024ce4"),
    ("proposal.sha256", 65, "14377945df7b6a9f55954200120813b07d7a6857c1fac4b53bf2515863097994"),
    ("remote-guard.stderr", 1696, "fef54d29494976ec09c27760927d24e6b36581acd72ea50262a586329a7de893"),
    ("remote-guard.stdout", 0, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"),
    ("rescue-start.stderr", 303, "9f9ed332ef6a82d62a445f5e50a93d81c0977fffe1dd0639f452685a0fdcf402"),
    ("rescue-start.stdout", 0, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"),
    ("rescue-stop.stderr", 342, "cf82db9e65e49cb0a0607a432b16124cdac7c0a85cc7638d4dec895ea739e440"),
    ("rescue-stop.stdout", 0, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"),
    ("rescue.before.json", 4564, "d8f9009e83e4a100304bca26a36bd7d2f1e8598d6dacf6b71517d0520ba3990f"),
    ("snapshot.before.tsv", 45, "81c5722f4f3371093bb24de9c9593145bdb926355eaaaca61001fa8b0da819da"),
]
observed_stage = [(item["name"], item["bytes"], item["sha256"]) for item in cloud["stage_files"]]
required_tokens = {
    "REMOTE HOST IDENTIFICATION HAS CHANGED!",
    "/home/pestypig/.ssh/google_compute_known_hosts:10",
    "compute.3332429239243725178",
    "Host key verification failed.",
    "return code [255]",
}

checks = {
    "schema_exact": result["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r8_failfast_guard_diagnosis_result.v1",
    "proposal_identity": digest(PROPOSAL) == result["proposal_sha256"] == "f4d1558a6219697e06628ff4c728d609a50b1073b22b34a5260cb053a1f8fa22",
    "ledger_identity": digest(LEDGER) == proposal["command_ledger"]["sha256"] == "9129d67bcf78e284c5a16551156ff6c7de7d00c0be18b39081da3c07322e0c6d",
    "classification_exact": result["classification"] == "AUTHENTICATED_R6_TRANSPORT_FAIL_STALE_CLOUD_SHELL_SSH_HOST_KEY_EXIT_255",
    "status_exact": result["status"] == "EXECUTED_ONCE_EXHAUSTED_PASS_AT_READONLY_TRANSPORT_DIAGNOSIS_BOUNDARY",
    "connection_marker_exact": cloud["connection_marker_exact"] == "R8_CONNECTION_READY",
    "inspection_identity_exact": cloud["inspection_command_characters"] == len(ledger[1]) == 1671 and cloud["inspection_command_sha256"] == proposal["command_ledger"]["commands"][1]["sha256"] == "293a0caa5aaac059d7c922b248489ebf1151d2b79a6664d2591e9418d1bbbc39",
    "vms_terminated": cloud["original_vm_status"] == cloud["rescue_vm_status"] == "TERMINATED",
    "procedure_exit_255": cloud["procedure_exit"] == 255,
    "stage_inventory_exact": observed_stage == expected_stage,
    "archive_absent": cloud["archive_state"] == "ABSENT" and scope["archive_identity_authenticated_in_r8"] is False,
    "remote_stdout_empty": diagnosis["remote_guard_stdout_bytes"] == 0 and diagnosis["remote_guard_stdout_sha256"] == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "remote_stderr_identity": diagnosis["remote_guard_stderr_bytes"] == 1696 and diagnosis["remote_guard_stderr_sha256"] == "fef54d29494976ec09c27760927d24e6b36581acd72ea50262a586329a7de893",
    "transport_tokens_exact": set(diagnosis["remote_guard_stderr_tokens"]) == required_tokens,
    "host_identity_exact": diagnosis["host_identity"] == "compute.3332429239243725178" and diagnosis["cloud_shell_known_hosts_line"] == 10,
    "fingerprint_exact": diagnosis["host_key_fingerprint"] == "SHA256:ijX48Sh5o6lAfXmhYGrq+anJLuRA19XsvppsOcL3XFw.",
    "causal_boundary_exact": diagnosis["causal_boundary"] == "IAP_SSH_HOST_KEY_VERIFICATION_BEFORE_REMOTE_GUEST_GUARD" and diagnosis["transport_identity_mismatch_authenticated"] is True and diagnosis["scientific_or_numerical_failure_inferred"] is False,
    "evidence_limits_explicit": scope["browser_observation_only"] is True and scope["raw_terminal_export_preserved"] is False and scope["remote_guard_receipt_contents_read_bounded"] is True and scope["vm_status_authenticated_by_r8_command"] is True and scope["p8c_result_audit_run"] is False,
    "exact_command_counts": actions["connection_health_commands"] == 1 and actions["inspection_commands"] == 1 and actions["additional_terminal_commands"] == 0,
    "read_only_no_science": actions["resource_mutations"] == 0 and actions["numerical_actions"] == 0 and actions["candidate_evaluations"] == 0,
    "consumed_no_retry": result["failure_policy"]["proposal_consumed"] is True and result["failure_policy"]["retry_authorized"] is False and result["failure_policy"]["retry_performed"] is False,
    "authority_all_false": all(value is False for value in result["authority"].values()),
}

audit = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r8_failfast_guard_diagnosis_result.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "result_sha256": digest(RESULT),
    "classification": result["classification"],
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
