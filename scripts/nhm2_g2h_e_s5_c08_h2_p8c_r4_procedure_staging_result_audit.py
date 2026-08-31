#!/usr/bin/env python3
"""Audit the exhausted P8C-R4 procedure-staging attempt."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-r4-staged-iap-retrieval-preflight-v1-20260829/h2-p8c-r4-staged-iap-retrieval-proposal.v1.json"
RESULT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-r4-staged-iap-retrieval-capture-v1-20260829/h2-p8c-r4-procedure-staging-result.v1.json"
OUTPUT = RESULT.with_name("h2-p8c-r4-procedure-staging-result-independent-audit.v1.json")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
result = json.loads(RESULT.read_text(encoding="utf-8"))
cloud = result["cloud_shell"]
actions = result["actions"]
checks = {
    "proposal_identity": digest(PROPOSAL) == "cfd15b9b8b5d502df4788e89dddbd45ac7948328c41c268f85326533d598a11a" and result["proposal_sha256"] == digest(PROPOSAL),
    "classification_exact": result["classification"] == "BLOCKED_FILE_CHOOSER_BEFORE_FILE_SELECTION",
    "local_identity_exact": result["local_source"]["bytes"] == 4115 and result["local_source"]["sha256"] == "a4104d492653e1f90e7be72ee0f14fa3b79dfd3599c6f1092a4a86092c3ed79b",
    "destination_exact": cloud["destination"] == proposal["procedure_staging"]["cloud_shell_path"],
    "initial_absence_observed": cloud["initial_absence_output"] == "R4_STAGE_ABSENT",
    "single_input_click": cloud["file_input_count"] == 1 and cloud["file_input_click_attempts"] == 1,
    "chooser_failed_before_selection": cloud["file_chooser_opened"] is False and cloud["set_files_reached"] is False,
    "upload_not_authenticated": cloud["upload_authenticated"] is False and cloud["post_upload_identity_check_eligible"] is False,
    "attempt_terminal_no_retry": result["failure_policy"]["first_failure_terminal"] is True and result["failure_policy"]["staging_attempt_consumed"] is True and result["failure_policy"]["retry_performed"] is False,
    "no_runtime_or_science": all(value == 0 for value in actions.values()),
    "authority_all_false": all(value is False for value in result["authority"].values()),
}
audit = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r4_procedure_staging_result.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "result_sha256": digest(RESULT),
    "cloud_actions_executed": 0,
    "numerical_actions_executed": 0,
    "authority_promoted": False
}
OUTPUT.write_text(json.dumps(audit, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{audit['passed']}/{audit['total']} {audit['verdict']}")
print(digest(OUTPUT))
raise SystemExit(0 if audit["verdict"] == "PASS" else 1)
