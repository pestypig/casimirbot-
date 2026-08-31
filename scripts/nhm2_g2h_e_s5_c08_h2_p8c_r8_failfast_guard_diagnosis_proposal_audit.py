#!/usr/bin/env python3
"""Audit the inert P8C-R8 fail-fast remote-guard diagnosis proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral"
PREFLIGHT = BASE / "h2-p8c-r8-failfast-guard-diagnosis-preflight-v1-20260830"
R7_CAPTURE = BASE / "h2-p8c-r7-readonly-disambiguation-capture-v1-20260830"
PROPOSAL = PREFLIGHT / "h2-p8c-r8-failfast-guard-diagnosis-proposal.v1.json"
LEDGER = PREFLIGHT / "h2-p8c-r8-command-ledger.v1.txt"
R7_RESULT = R7_CAPTURE / "h2-p8c-r7-readonly-disambiguation-result.v1.json"
R7_AUDIT = R7_CAPTURE / "h2-p8c-r7-readonly-disambiguation-result-independent-audit.v1.json"
OUTPUT = PREFLIGHT / "h2-p8c-r8-failfast-guard-diagnosis-proposal-independent-audit.v1.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def digest_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


data = json.loads(PROPOSAL.read_text(encoding="utf-8"))
r7 = json.loads(R7_RESULT.read_text(encoding="utf-8"))
r7_audit = json.loads(R7_AUDIT.read_text(encoding="utf-8"))
ledger = LEDGER.read_text(encoding="utf-8").splitlines()
inspect = ledger[1]
commands = data["command_ledger"]["commands"]
policy = data["execution_policy"]

checks = {
    "schema_and_status_exact": data["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r8_failfast_guard_diagnosis_proposal.v1" and data["status"] == "FROZEN_INERT_AWAITING_SEPARATE_AUTHORIZATION",
    "proposal_hash_exact": digest(PROPOSAL) == "f4d1558a6219697e06628ff4c728d609a50b1073b22b34a5260cb053a1f8fa22",
    "r7_result_bound": digest(R7_RESULT) == data["predecessors"]["r7_result_sha256"] == "5e8261c9a48457d6e6900956dc63f6bd5dc3a69905fee8da18def08f6df4adbc" and r7["classification"].startswith("FAIL_PROJECT_UNSET"),
    "r7_audit_bound": digest(R7_AUDIT) == data["predecessors"]["r7_result_audit_sha256"] == "631d11039a06ce7953a7497eb27e27a0ae0514c1c7eeac2e74ca568461d62298" and r7_audit["verdict"] == "PASS" and r7_audit["passed"] == r7_audit["total"] == 18,
    "ledger_identity_exact": digest(LEDGER) == data["command_ledger"]["sha256"] == "9129d67bcf78e284c5a16551156ff6c7de7d00c0be18b39081da3c07322e0c6d" and LEDGER.stat().st_size == data["command_ledger"]["bytes"] == 1708,
    "two_commands_exact": len(ledger) == len(commands) == policy["exact_commands"] == 2,
    "health_identity_exact": len(ledger[0]) == commands[0]["characters"] == 35 and digest_text(ledger[0]) == commands[0]["sha256"] == "31993c55d18ae60fc3b5ff0a07b4052001aeb7a30f118c2f988c20fd8c37373a",
    "inspection_identity_exact": len(inspect) == commands[1]["characters"] == 1671 and digest_text(inspect) == commands[1]["sha256"] == "293a0caa5aaac059d7c922b248489ebf1151d2b79a6664d2591e9418d1bbbc39",
    "failfast_exact": inspect.startswith("set -euo pipefail;") and policy["first_failure_terminal"] is True and policy["retry_or_fallback_authorized"] is False,
    "project_bound_both_reads": inspect.count('--project "$PROJECT"') == 2 and "PROJECT=dark-stratum-455714-h4" in inspect,
    "both_vms_required_terminated": inspect.count('test "$OSTAT" = TERMINATED') == 1 and inspect.count('test "$RSTAT" = TERMINATED') == 1,
    "bounded_exact_stage_inventory": "FILES='clone.before.tsv procedure.exit proposal.sha256 remote-guard.stderr remote-guard.stdout rescue-start.stderr rescue-start.stdout rescue-stop.stderr rescue-stop.stdout rescue.before.json snapshot.before.tsv'" in inspect and 'test "$BYTES" -le 65536' in inspect,
    "remote_guard_receipts_bounded": inspect.count("sed -n '1,120p'") == 2 and "remote_guard_stdout_begin" in inspect and "remote_guard_stderr_begin" in inspect,
    "no_mutating_tokens": all(token not in inspect for token in (" instances start ", " instances stop ", " cp ", " mv ", " rm ", " mkdir ", " mount ", "docker", "mini-boson-star")),
    "non_goals_and_authority_locked": all(data["non_goals"].values()) and all(value is False for value in data["authority"].values()),
}

audit = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r8_failfast_guard_diagnosis_proposal.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "proposal_sha256": digest(PROPOSAL),
    "cloud_actions_executed": 0,
    "resource_mutations": 0,
    "numerical_actions_executed": 0,
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(audit, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{audit['passed']}/{audit['total']} {audit['verdict']}")
print(digest(OUTPUT))
raise SystemExit(0 if audit["verdict"] == "PASS" else 1)
