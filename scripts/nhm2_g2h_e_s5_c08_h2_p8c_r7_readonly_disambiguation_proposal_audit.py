#!/usr/bin/env python3
"""Audit the inert P8C-R7 read-only disambiguation proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral"
PREFLIGHT = BASE / "h2-p8c-r7-readonly-disambiguation-preflight-v1-20260830"
R6_CAPTURE = BASE / "h2-p8c-r6-connection-gated-retrieval-capture-v1-20260830"
PROPOSAL = PREFLIGHT / "h2-p8c-r7-readonly-disambiguation-proposal.v1.json"
LEDGER = PREFLIGHT / "h2-p8c-r7-command-ledger.v1.txt"
R6_RESULT = R6_CAPTURE / "h2-p8c-r6-connection-gated-retrieval-result.v1.json"
R6_AUDIT = R6_CAPTURE / "h2-p8c-r6-connection-gated-retrieval-result-independent-audit.v1.json"
OUTPUT = PREFLIGHT / "h2-p8c-r7-readonly-disambiguation-proposal-independent-audit.v1.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def digest_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


data = json.loads(PROPOSAL.read_text(encoding="utf-8"))
r6 = json.loads(R6_RESULT.read_text(encoding="utf-8"))
r6_audit = json.loads(R6_AUDIT.read_text(encoding="utf-8"))
ledger = LEDGER.read_text(encoding="utf-8").splitlines()
policy = data["execution_policy"]
non_goals = data["non_goals"]
commands = data["command_ledger"]["commands"]
inspect = ledger[1]

checks = {
    "schema_and_status_exact": data["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r7_readonly_disambiguation_proposal.v1" and data["status"] == "FROZEN_INERT_AWAITING_SEPARATE_AUTHORIZATION",
    "proposal_hash_exact": digest(PROPOSAL) == "5fbd0adc2946a2bc8cb3b82e5169034e8f46b765c44dee4125ac1285bfa88408",
    "r6_result_bound": digest(R6_RESULT) == data["predecessors"]["r6_result_sha256"] == "377b66e29d3b2c7a7debf1e6c4483493b3a65d31de243e72f1a546e058754b6e" and r6["classification"] == "TERMINATED_TO_PROMPT_CLEANUP_STOP_CONFIRMED_RESULT_UNREAD",
    "r6_audit_bound": digest(R6_AUDIT) == data["predecessors"]["r6_result_audit_sha256"] == "372c490da6ab84a1ea16f88b55ab6551e30c7cd0fbacf81840b94e35f3255170" and r6_audit["verdict"] == "PASS" and r6_audit["passed"] == r6_audit["total"] == 16,
    "ledger_identity_exact": digest(LEDGER) == data["command_ledger"]["sha256"] == "9c6fc58b0acf1ac9d46d7b81d04cd4a7e3a6ffa6d516a86b3e9fe2c6a304b9f4" and LEDGER.stat().st_size == data["command_ledger"]["bytes"] == 1043,
    "two_commands_exact": len(ledger) == len(commands) == policy["exact_commands"] == 2 and [entry["ordinal"] for entry in commands] == [1, 2],
    "health_identity_exact": len(ledger[0]) == commands[0]["characters"] == 35 and digest_text(ledger[0]) == commands[0]["sha256"] == "525ffa887cebaeb2856d94e4ba3376290d0f1d35e111fe55d789a9bc4eef260e",
    "inspection_identity_exact": len(inspect) == commands[1]["characters"] == 1006 and digest_text(inspect) == commands[1]["sha256"] == "350de3aa7650232eb78b2132008f556536ba0f76d9b470683ee6057c1e68215c",
    "connection_gate_terminal_no_retry": policy["require_connection_marker_before_inspection"] is True and policy["first_failure_terminal"] is True and policy["retry_or_fallback_authorized"] is False and policy["additional_commands_authorized"] == 0,
    "both_vm_statuses_read_and_required_terminated": inspect.count("gcloud compute instances describe") == 2 and inspect.count('test "$OSTAT" = TERMINATED') == 1 and inspect.count('test "$RSTAT" = TERMINATED') == 1,
    "stage_exit_inventory_read_only": all(token in inspect for token in ('test -d "$STAGE"', 'test -f "$STAGE/procedure.exit"', 'tr -d', 'find "$STAGE" -maxdepth 1 -type f')),
    "archive_presence_identity_read_only": all(token in inspect for token in ('if test -f "$ARCHIVE"', 'stat -c %s', 'sha256sum "$ARCHIVE"', 'archive_state=PRESENT', 'archive_state=ABSENT')),
    "no_mutating_tokens": all(token not in inspect for token in (" instances start ", " instances stop ", " cp ", " mv ", " rm ", " mkdir ", " mount ", "docker", "mini-boson-star")),
    "non_goals_all_locked": all(value is True for value in non_goals.values()),
    "authority_all_false": all(value is False for value in data["authority"].values()),
}

audit = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r7_readonly_disambiguation_proposal.independent_audit.v1",
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
